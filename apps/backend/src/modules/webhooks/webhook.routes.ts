import Elysia, { t } from "elysia";
import { requireRole } from "../../middleware/auth.middleware";
import * as WebhookService from "./webhook.service";
import { ok as okRes }     from "../../lib/response";
import { AppError }        from "../../lib/errors";
import { Role }            from "@fleet/shared";

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

export const webhookRoutes = new Elysia({ prefix: "/webhooks" })
  .use(requireRole(Role.FLEET_MANAGER, Role.SUPER_ADMIN))

  // GET /webhooks
  .get("/", async ({ user, set }) => {
    try {
      return okRes(await WebhookService.listEndpoints(user));
    } catch (e) { return handleError(e, set); }
  }, {
    detail: {
      tags:     ["Webhooks"],
      summary:  "List webhook endpoints",
      security: [{ bearerAuth: [] }],
    },
  })

  // POST /webhooks
  .post("/", async ({ user, body, set }) => {
    try {
      return okRes(await WebhookService.createEndpoint(user, body as any));
    } catch (e) { return handleError(e, set); }
  }, {
    body: t.Object({
      name:   t.String({ minLength: 1 }),
      url:    t.String(),
      events: t.Array(t.String()),
    }),
    detail: {
      tags:     ["Webhooks"],
      summary:  "Create webhook endpoint (secret returned once)",
      security: [{ bearerAuth: [] }],
    },
  })

  // POST /webhooks/:id/test
  .post("/:id/test", async ({ user, params, set }) => {
    try {
      return okRes(await WebhookService.testEndpoint(user, params.id));
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ id: t.String() }),
    detail: {
      tags:     ["Webhooks"],
      summary:  "Send a test ping to a webhook endpoint",
      security: [{ bearerAuth: [] }],
    },
  })

  // GET /webhooks/:id/deliveries
  .get("/:id/deliveries", async ({ user, params, query, set }) => {
    try {
      return okRes(
        await WebhookService.getDeliveries(user, params.id, Number(query.limit ?? 50))
      );
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ id: t.String() }),
    query:  t.Object({ limit: t.Optional(t.String()) }),
    detail: {
      tags:     ["Webhooks"],
      summary:  "List webhook delivery attempts",
      security: [{ bearerAuth: [] }],
    },
  })

  // PATCH /webhooks/:id
  .patch("/:id", async ({ user, params, body, set }) => {
    try {
      return okRes(
        await WebhookService.toggleEndpoint(user, params.id, body.active)
      );
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ id: t.String() }),
    body:   t.Object({ active: t.Boolean() }),
    detail: {
      tags:     ["Webhooks"],
      summary:  "Enable or disable a webhook endpoint",
      security: [{ bearerAuth: [] }],
    },
  })

  // DELETE /webhooks/:id
  .delete("/:id", async ({ user, params, set }) => {
    try {
      return okRes(await WebhookService.deleteEndpoint(user, params.id));
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ id: t.String() }),
    detail: {
      tags:     ["Webhooks"],
      summary:  "Delete a webhook endpoint",
      security: [{ bearerAuth: [] }],
    },
  })

  // GET /webhooks/events — list supported event types
  .get("/events", async () => {
    return okRes(WebhookService.WEBHOOK_EVENTS);
  }, {
    detail: {
      tags:    ["Webhooks"],
      summary: "List all supported webhook event types",
    },
  });