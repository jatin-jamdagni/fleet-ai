import { prisma } from "../../db/prisma";
import { AppError } from "../../lib/errors";
import { injectTenantContext } from "../../middleware/auth.middleware";
import type { UserContext } from "../../types/context";
import crypto from "crypto";

// ─── All supported webhook event types ────────────────────────────────────────

export const WEBHOOK_EVENTS = [
    "trip.started",
    "trip.ended",
    "trip.force_ended",
    "invoice.generated",
    "invoice.paid",
    "vehicle.created",
    "driver.invited",
    "geofence.entered",
    "geofence.exited",
    "speeding.detected",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

// ─── Create endpoint ──────────────────────────────────────────────────────────

export async function createEndpoint(
    user: UserContext,
    body: {
        name: string;
        url: string;
        events: string[];
    }
) {
    return injectTenantContext(user, async () => {
        // Validate URL
        try {
            const u = new URL(body.url);
            if (!["http:", "https:"].includes(u.protocol)) {
                throw new Error("URL must use http or https");
            }
        } catch {
            throw new AppError("INVALID_URL", "Webhook URL must be a valid http/https URL", 422);
        }

        // Validate events
        const invalid = body.events.filter(
            (e) => !(WEBHOOK_EVENTS as readonly string[]).includes(e)
        );
        if (invalid.length > 0) {
            throw new AppError("INVALID_EVENTS", `Unknown events: ${invalid.join(", ")}`, 422);
        }

        // Max 20 endpoints per tenant
        const count = await prisma.webhookEndpoint.count({
            where: { tenantId: user.tenantId, active: true },
        });
        if (count >= 20) {
            throw new AppError(
                "ENDPOINT_LIMIT",
                "Maximum 20 active webhook endpoints per organisation", 429
            );
        }

        const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

        const endpoint = await prisma.webhookEndpoint.create({
            data: {
                tenantId: user.tenantId,
                name: body.name,
                url: body.url,
                secret,
                events: body.events,
                createdById: user.userId,
            },
        });

        return { ...endpoint, secret };  // Return secret once on creation
    });
}

// ─── List endpoints ───────────────────────────────────────────────────────────

export async function listEndpoints(user: UserContext) {
    return injectTenantContext(user, async () => {
        const endpoints = await prisma.webhookEndpoint.findMany({
            where: { tenantId: user.tenantId, active: true },
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { deliveries: true } },
                deliveries: {
                    orderBy: { deliveredAt: "desc" },
                    take: 1,
                    select: { status: true, deliveredAt: true },
                },
            },
        });

        return endpoints.map((e) => ({
            id: e.id,
            name: e.name,
            url: e.url,
            events: e.events,
            active: e.active,
            createdAt: e.createdAt,
            totalDeliveries: e._count.deliveries,
            lastDelivery: e.deliveries[0] ?? null,
        }));
    });
}

// ─── Toggle endpoint active state ────────────────────────────────────────────

export async function toggleEndpoint(
    user: UserContext,
    id: string,
    active: boolean
) {
    return injectTenantContext(user, async () => {
        const ep = await prisma.webhookEndpoint.findFirst({
            where: { id, tenantId: user.tenantId },
        });

        if (!ep) throw new AppError("NOT_FOUND", "Endpoint not found", 404);

        return prisma.webhookEndpoint.update({
            where: { id },
            data: { active },
        });
    });
}

// ─── Delete endpoint ──────────────────────────────────────────────────────────

export async function deleteEndpoint(user: UserContext, id: string) {
    return injectTenantContext(user, async () => {
        const ep = await prisma.webhookEndpoint.findFirst({
            where: { id, tenantId: user.tenantId },
        });
        if (!ep) throw new AppError("NOT_FOUND", "Endpoint not found", 404);

        await prisma.webhookEndpoint.delete({ where: { id } });
        return { deleted: true };
    });
}

// ─── Get delivery history ─────────────────────────────────────────────────────

export async function getDeliveries(
    user: UserContext,
    endpointId: string,
    limit: number = 50
) {
    return injectTenantContext(user, async () => {
        const ep = await prisma.webhookEndpoint.findFirst({
            where: { id: endpointId, tenantId: user.tenantId },
        });
        if (!ep) throw new AppError("NOT_FOUND", "Endpoint not found", 404);

        return prisma.webhookDelivery.findMany({
            where: { endpointId },
            orderBy: { deliveredAt: "desc" },
            take: limit,
            select: {
                id: true,
                event: true,
                status: true,
                durationMs: true,
                attempt: true,
                deliveredAt: true,
                responseBody: true,
            },
        });
    });
}

// ─── DISPATCH — fire webhooks for an event ────────────────────────────────────

export async function dispatchWebhook(
    tenantId: string,
    event: WebhookEvent,
    payload: Record<string, any>
): Promise<void> {
    const endpoints = await prisma.webhookEndpoint.findMany({
        where: {
            tenantId,
            active: true,
            events: { has: event },
        },
    });

    if (endpoints.length === 0) return;

    const body = JSON.stringify({
        id: crypto.randomUUID(),
        event,
        createdAt: new Date().toISOString(),
        data: payload,
    });

    await Promise.all(
        endpoints.map((ep) => deliverWebhook(ep, event, body))
    );
}

// ─── Single delivery with retry ───────────────────────────────────────────────

async function deliverWebhook(
    endpoint: { id: string; url: string; secret: string },
    event: string,
    body: string,
    attempt: number = 1
): Promise<void> {
    const signature = signPayload(body, endpoint.secret);
    const start = Date.now();
    let status = 0;
    let responseBody: string | null = null;

    try {
        const res = await fetch(endpoint.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Fleet-Event": event,
                "X-Fleet-Signature": signature,
                "X-Fleet-Timestamp": String(Math.floor(Date.now() / 1000)),
                "User-Agent": "FleetAI-Webhooks/1.0",
            },
            body,
            signal: AbortSignal.timeout(10_000), // 10s timeout
        });

        status = res.status;
        responseBody = (await res.text()).slice(0, 1000); // cap at 1KB

    } catch (err: any) {
        status = 0;
        responseBody = err.message;

        // Retry up to 3 times with exponential backoff
        if (attempt < 3) {
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
            await new Promise((r) => setTimeout(r, delay));
            return deliverWebhook(endpoint, event, body, attempt + 1);
        }
    } finally {
        const durationMs = Date.now() - start;

        // Log delivery
        await prisma.webhookDelivery.create({
            data: {
                endpointId: endpoint.id,
                event,
                payload: JSON.parse(body),
                status,
                responseBody,
                durationMs,
                attempt,
            },
        }).catch(() => { }); // non-critical
    }
}

// ─── HMAC-SHA256 signing ──────────────────────────────────────────────────────

function signPayload(body: string, secret: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const toSign = `${timestamp}.${body}`;
    const hmac = crypto.createHmac("sha256", secret)
        .update(toSign)
        .digest("hex");
    return `t=${timestamp},v1=${hmac}`;
}

// ─── Signature verification helper (for consumers) ───────────────────────────

export function verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string,
    toleranceSec: number = 300
): boolean {
    const parts = Object.fromEntries(
        signature.split(",").map((p) => p.split("=") as [string, string])
    );
    const timestamp = Number(parts.t);
    const v1 = parts.v1;

    if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSec) return false;

    const toSign = `${timestamp}.${body}`;
    const expected = crypto.createHmac("sha256", secret)
        .update(toSign)
        .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(v1!, "hex"),
        Buffer.from(expected, "hex")
    );
}

// ─── Test endpoint (send a ping event) ───────────────────────────────────────

export async function testEndpoint(user: UserContext, id: string) {
    return injectTenantContext(user, async () => {
        const ep = await prisma.webhookEndpoint.findFirst({
            where: { id, tenantId: user.tenantId },
        });
        if (!ep) throw new AppError("NOT_FOUND", "Endpoint not found", 404);

        const body = JSON.stringify({
            id: crypto.randomUUID(),
            event: "ping",
            createdAt: new Date().toISOString(),
            data: { message: "Fleet AI webhook test ping" },
        });

        const signature = signPayload(body, ep.secret);
        const start = Date.now();
        let status = 0;
        let responseBody = "";

        try {
            const res = await fetch(ep.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Fleet-Event": "ping",
                    "X-Fleet-Signature": signature,
                    "User-Agent": "FleetAI-Webhooks/1.0",
                },
                body,
                signal: AbortSignal.timeout(10_000),
            });
            status = res.status;
            responseBody = await res.text();
        } catch (err: any) {
            status = 0;
            responseBody = err.message;
        }

        return {
            status,
            durationMs: Date.now() - start,
            responseBody: responseBody.slice(0, 500),
            success: status >= 200 && status < 300,
        };
    });
}