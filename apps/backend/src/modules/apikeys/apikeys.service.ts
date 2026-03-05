import { prisma } from "../../db/prisma";
import { AppError } from "../../lib/errors";
import { injectTenantContext } from "../../middleware/auth.middleware";
import type { UserContext } from "../../types/context";
import { getPlanLimits } from "../saas/saas.plans";
import { hash, compare } from "../../lib/crypto";
import { randomBytes } from "node:crypto";

export const ALL_SCOPES = [
    "trips:read",
    "trips:write",
    "vehicles:read",
    "vehicles:write",
    "invoices:read",
    "analytics:read",
] as const;

export type Scope = (typeof ALL_SCOPES)[number];

// ─── Generate API key ─────────────────────────────────────────────────────────

export async function createApiKey(
    user: UserContext,
    body: {
        name: string;
        scopes: Scope[];
        expiresIn?: number;  // days; null = never
    }
) {
    return injectTenantContext(user, async () => {
        // Check plan allows API access
        const tenant = await prisma.tenant.findUniqueOrThrow({
            where: { id: user.tenantId },
        });
        const limits = getPlanLimits((tenant as any).plan ?? "TRIAL");
        if (!limits.apiAccess) {
            throw new AppError(

                "PLAN_LIMIT_REACHED",
                "API access requires PRO or ENTERPRISE plan", 402
            );
        }

        // Max 10 active keys per tenant
        const activeCount = await prisma.apiKey.count({
            where: { tenantId: user.tenantId, revokedAt: null },
        });
        if (activeCount >= 10) {
            throw new AppError(

                "KEY_LIMIT_REACHED",
                "Maximum 10 API keys per organisation. Revoke an existing key first.", 429
            );
        }

        // Validate scopes
        const invalidScopes = body.scopes.filter(
            (s) => !(ALL_SCOPES as readonly string[]).includes(s)
        );
        if (invalidScopes.length > 0) {
            throw new AppError( "INVALID_SCOPES", `Invalid scopes: ${invalidScopes.join(", ")}`,422);
        }

        // Generate key: flk_<random 32 bytes base64url>
        const rawKey = `flk_${randomBytes(32).toString("base64url")}`;
        const keyPrefix = rawKey.slice(0, 8);
        const keyHash = await hash(rawKey);

        const expiresAt = body.expiresIn
            ? new Date(Date.now() + body.expiresIn * 86_400_000)
            : null;

        const apiKey = await prisma.apiKey.create({
            data: {
                tenantId: user.tenantId,
                name: body.name,
                keyHash,
                keyPrefix,
                scopes: body.scopes,
                expiresAt,
                createdById: user.userId,
            },
        });

        // Return the raw key ONCE — never stored in plain text
        return {
            id: apiKey.id,
            name: apiKey.name,
            keyPrefix: apiKey.keyPrefix,
            scopes: apiKey.scopes,
            expiresAt: apiKey.expiresAt,
            createdAt: apiKey.createdAt,
            // Full key only returned on creation
            key: rawKey,
            warning: "Copy this key now. It will not be shown again.",
        };
    });
}

// ─── List API keys ────────────────────────────────────────────────────────────

export async function listApiKeys(user: UserContext) {
    return injectTenantContext(user, async () => {
        const keys = await prisma.apiKey.findMany({
            where: { tenantId: user.tenantId, revokedAt: null },
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { usageLogs: true } },
            },
        });

        return keys.map((k) => ({
            id: k.id,
            name: k.name,
            keyPrefix: k.keyPrefix,
            scopes: k.scopes,
            lastUsedAt: k.lastUsedAt,
            expiresAt: k.expiresAt,
            createdAt: k.createdAt,
            totalCalls: k._count.usageLogs,
            isExpired: k.expiresAt ? new Date() > k.expiresAt : false,
        }));
    });
}

// ─── Revoke API key ───────────────────────────────────────────────────────────

export async function revokeApiKey(user: UserContext, id: string) {
    return injectTenantContext(user, async () => {
        const key = await prisma.apiKey.findFirst({
            where: { id, tenantId: user.tenantId, revokedAt: null },
        });
        if (!key) throw new AppError( "NOT_FOUND", "API key not found", 404);

        await prisma.apiKey.update({
            where: { id },
            data: { revokedAt: new Date() },
        });

        return { revoked: true, id };
    });
}

// ─── Authenticate incoming API key request ────────────────────────────────────

export async function authenticateApiKey(rawKey: string): Promise<{
    tenantId: string;
    scopes: string[];
    keyId: string;
} | null> {
    if (!rawKey.startsWith("flk_")) return null;

    const prefix = rawKey.slice(0, 8);

    // Find candidates by prefix (fast index lookup)
    const candidates = await prisma.apiKey.findMany({
        where: {
            keyPrefix: prefix,
            revokedAt: null,
        },
    });

    for (const candidate of candidates) {
        // Check expiry
        if (candidate.expiresAt && new Date() > candidate.expiresAt) continue;

        // Verify hash
        const valid = await compare(rawKey, candidate.keyHash);
        if (!valid) continue;

        // Update last used
        await prisma.apiKey.update({
            where: { id: candidate.id },
            data: { lastUsedAt: new Date() },
        });

        return {
            tenantId: candidate.tenantId,
            scopes: candidate.scopes,
            keyId: candidate.id,
        };
    }

    return null;
}

// ─── Log API key usage ────────────────────────────────────────────────────────

export async function logApiKeyUsage(
    keyId: string,
    endpoint: string,
    method: string,
    status: number
): Promise<void> {
    await prisma.apiKeyUsage.create({
        data: { apiKeyId: keyId, endpoint, method, status },
    }).catch(() => { }); // non-critical
}

// ─── Get usage stats for a key ────────────────────────────────────────────────

export async function getApiKeyUsage(user: UserContext, id: string) {
    return injectTenantContext(user, async () => {
        const key = await prisma.apiKey.findFirst({
            where: { id, tenantId: user.tenantId },
        });
        if (!key) throw new AppError( "NOT_FOUND", "API key not found", 404);

        const from = new Date();
        from.setDate(from.getDate() - 30);

        const logs = await prisma.apiKeyUsage.groupBy({
            by: ["endpoint", "method"],
            where: { apiKeyId: id, createdAt: { gte: from } },
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 20,
        });

        const total = await prisma.apiKeyUsage.count({
            where: { apiKeyId: id, createdAt: { gte: from } },
        });

        const errors = await prisma.apiKeyUsage.count({
            where: { apiKeyId: id, status: { gte: 400 }, createdAt: { gte: from } },
        });

        return {
            keyId: id,
            keyName: key.name,
            period: "last 30 days",
            totalCalls: total,
            errorRate: total > 0 ? ((errors / total) * 100).toFixed(1) : "0",
            topEndpoints: logs.map((l) => ({
                endpoint: l.endpoint,
                method: l.method,
                calls: l._count.id,
            })),
        };
    });
}
