import Elysia, { t } from "elysia";
import { requireRole } from "../../middleware/auth.middleware";
import * as ApiKeyService from "./apikeys.service";
import { ok as okRes }   from "../../lib/response";
import { AppError }      from "../../lib/errors";
import { Role }          from "@fleet/shared";

function handleError(e: unknown, set: any) {
  if (e instanceof AppError) {
    set.status = e.statusCode;
    return {
      success: false,
      error: { code: e.code, message: e.message, statusCode: e.statusCode },
    };
  }
  set.status = 500;
  return {
    success: false,
    error: { code: "INTERNAL", message: "Something went wrong", statusCode: 500 },
  };
}

export const apiKeyRoutes = new Elysia({ prefix: "/api-keys" })
  .use(requireRole(Role.FLEET_MANAGER, Role.SUPER_ADMIN))

  .get("/", async ({ user, set }) => {
    try {
      return okRes(await ApiKeyService.listApiKeys(user));
    } catch (e) { return handleError(e, set); }
  }, {
    detail: {
      tags:     ["API Keys"],
      summary:  "List all API keys",
      security: [{ bearerAuth: [] }],
    },
  })

  .post("/", async ({ user, body, set }) => {
    try {
      return okRes(await ApiKeyService.createApiKey(user, body as any));
    } catch (e) { return handleError(e, set); }
  }, {
    body: t.Object({
      name:      t.String({ minLength: 1 }),
      scopes:    t.Array(t.String()),
      expiresIn: t.Optional(t.Number()),
    }),
    detail: {
      tags:     ["API Keys"],
      summary:  "Generate a new API key (shown once)",
      security: [{ bearerAuth: [] }],
    },
  })

  .get("/:id/usage", async ({ user, params, set }) => {
    try {
      return okRes(await ApiKeyService.getApiKeyUsage(user, params.id));
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ id: t.String() }),
    detail: {
      tags:     ["API Keys"],
      summary:  "Get usage stats for an API key",
      security: [{ bearerAuth: [] }],
    },
  })

  .delete("/:id", async ({ user, params, set }) => {
    try {
      return okRes(await ApiKeyService.revokeApiKey(user, params.id));
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ id: t.String() }),
    detail: {
      tags:     ["API Keys"],
      summary:  "Revoke an API key",
      security: [{ bearerAuth: [] }],
    },
  });