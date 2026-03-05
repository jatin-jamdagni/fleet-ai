import Elysia, { t } from "elysia";
import { requireRole } from "../../middleware/auth.middleware";
import * as IntService      from "./integration.service";
import * as AccountingService from "./accounting.service";
import { ok as okRes }      from "../../lib/response";
import { AppError }         from "../../lib/errors";
import { Role }             from "@fleet/shared";

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

export const integrationRoutes = new Elysia({ prefix: "/integrations" })
  .use(requireRole(Role.FLEET_MANAGER, Role.SUPER_ADMIN))

  // GET /integrations
  .get("/", async ({ user, set }) => {
    try {
      return okRes(await IntService.listIntegrations(user));
    } catch (e) { return handleError(e, set); }
  }, {
    detail: {
      tags:     ["Integrations"],
      summary:  "List all integration statuses",
      security: [{ bearerAuth: [] }],
    },
  })

  // PUT /integrations/:provider
  .put("/:provider", async ({ user, params, body, set }) => {
    try {
      return okRes(
        await IntService.saveIntegration(
          user,
          params.provider as any,
          (body as any).config,
          (body as any).enabled ?? true
        )
      );
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ provider: t.String() }),
    body:   t.Object({
      config:  t.Record(t.String(), t.Any()),
      enabled: t.Optional(t.Boolean()),
    }),
    detail: {
      tags:     ["Integrations"],
      summary:  "Save integration configuration",
      security: [{ bearerAuth: [] }],
    },
  })

  // DELETE /integrations/:provider
  .delete("/:provider", async ({ user, params, set }) => {
    try {
      return okRes(
        await IntService.removeIntegration(user, params.provider as any)
      );
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ provider: t.String() }),
    detail: {
      tags:     ["Integrations"],
      summary:  "Remove integration",
      security: [{ bearerAuth: [] }],
    },
  })

  // GET /integrations/export/quickbooks
  .get("/export/quickbooks", async ({ user, query, set }) => {
    try {
      const csv = await AccountingService.exportQuickBooksCSV(
        user, query.from, query.to
      );
      set.headers["Content-Type"]        = "text/csv";
      set.headers["Content-Disposition"] =
        `attachment; filename="fleet-quickbooks-${Date.now()}.csv"`;
      return csv;
    } catch (e) { return handleError(e, set); }
  }, {
    query: t.Object({
      from: t.Optional(t.String()),
      to:   t.Optional(t.String()),
    }),
    detail: {
      tags:     ["Integrations"],
      summary:  "Export invoices in QuickBooks CSV format",
      security: [{ bearerAuth: [] }],
    },
  })

  // GET /integrations/export/xero
  .get("/export/xero", async ({ user, query, set }) => {
    try {
      const csv = await AccountingService.exportXeroCSV(
        user, query.from, query.to
      );
      set.headers["Content-Type"]        = "text/csv";
      set.headers["Content-Disposition"] =
        `attachment; filename="fleet-xero-${Date.now()}.csv"`;
      return csv;
    } catch (e) { return handleError(e, set); }
  }, {
    query: t.Object({
      from: t.Optional(t.String()),
      to:   t.Optional(t.String()),
    }),
    detail: {
      tags:     ["Integrations"],
      summary:  "Export invoices in Xero CSV format",
      security: [{ bearerAuth: [] }],
    },
  })

  // GET /integrations/export/fuel
  .get("/export/fuel", async ({ user, query, set }) => {
    try {
      const csv = await AccountingService.exportFuelExpensesCSV(
        user, query.from, query.to
      );
      set.headers["Content-Type"]        = "text/csv";
      set.headers["Content-Disposition"] =
        `attachment; filename="fleet-fuel-expenses-${Date.now()}.csv"`;
      return csv;
    } catch (e) { return handleError(e, set); }
  }, {
    query: t.Object({
      from: t.Optional(t.String()),
      to:   t.Optional(t.String()),
    }),
    detail: {
      tags:     ["Integrations"],
      summary:  "Export fuel expenses as CSV",
      security: [{ bearerAuth: [] }],
    },
  });