import Elysia from "elysia";
import { authenticateApiKey, logApiKeyUsage } from "../modules/apikeys/apikeys.service";
import { AppError } from "../lib/errors";

type ApiKeyAuthInfo = {
    tenantId: string;
    scopes: string[];
    keyId: string;
};

export const apiKeyAuth = new Elysia()
    .derive({ as: "global" }, async ({ request, set }) => {
        const authHeader = request.headers.get("Authorization") ?? "";
        const rawKey = authHeader.startsWith("Bearer flk_")
            ? authHeader.slice(7)
            : request.headers.get("X-API-Key") ?? "";

        if (!rawKey.startsWith("flk_")) {
            set.status = 401;
            throw new AppError("INVALID_API_KEY", "Missing or invalid API key", 401);
        }

        const result = await authenticateApiKey(rawKey);

        if (!result) {
            set.status = 401;
            throw new AppError("INVALID_API_KEY", "API key invalid, expired, or revoked", 401);
        }

        const apiKeyAuthInfo: ApiKeyAuthInfo = {
            tenantId: result.tenantId,
            scopes: result.scopes,
            keyId: result.keyId,
        };

        return { apiKeyAuth: apiKeyAuthInfo };
    });

// ─── Scope guard ─────────────────────────────────────────────────────────────

export function requireScope(scope: string) {
    return new Elysia()
        .derive(({ apiKeyAuth, set }: any) => {
            if (!apiKeyAuth) {
                set.status = 401;
                throw new AppError("NO_API_KEY", "API key required", 401);
            }
            if (!apiKeyAuth.scopes.includes(scope)) {
                set.status = 403;
                throw new AppError(

                    "INSUFFICIENT_SCOPE",
                    `This key requires the '${scope}' scope`, 403
                );
            }
            return {};
        });
}
