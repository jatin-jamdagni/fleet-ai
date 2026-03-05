import Elysia, { t } from "elysia";
import { apiKeyAuth } from "../../middleware/apikey.middleware";
import { logApiKeyUsage } from "./apikeys.service";
import { prisma } from "../../db/prisma";
import { ok as okRes } from "../../lib/response";

// Helper — log usage after each response
async function withUsageLog(
  keyId:    string,
  endpoint: string,
  method:   string,
  fn:       () => Promise<any>,
  set:      any
) {
  let status = 200;
  try {
    const result = await fn();
    return result;
  } catch (err: any) {
    status = err.statusCode ?? 500;
    set.status = status;
    return {
      success: false,
      error: { code: err.code ?? "ERROR", message: err.message, statusCode: status },
    };
  } finally {
    logApiKeyUsage(keyId, endpoint, method, status).catch(() => {});
  }
}

export const publicApiRoutes = new Elysia({ prefix: "/public/v1" })
  .use(apiKeyAuth)

  // GET /public/v1/trips — read trips
  .get("/trips", async ({ apiKeyAuth: auth, query, set }) => {
    return withUsageLog(auth.keyId, "/trips", "GET", async () => {
      if (!auth.scopes.includes("trips:read")) {
        set.status = 403;
        return {
          success: false,
          error: { code: "INSUFFICIENT_SCOPE", message: "Requires trips:read scope" },
        };
      }

      const trips = await prisma.trip.findMany({
        where: {
          tenantId: auth.tenantId,
          status:   (query.status as any) ?? undefined,
        },
        take:    Number(query.limit ?? 50),
        skip:    Number(query.offset ?? 0),
        orderBy: { startTime: "desc" },
        include: {
          vehicle: { select: { licensePlate: true, make: true, model: true } },
        },
      });

      return okRes(trips);
    }, set);
  }, {
    query: t.Object({
      status: t.Optional(t.String()),
      limit:  t.Optional(t.String()),
      offset: t.Optional(t.String()),
    }),
    detail: { tags: ["Public API"], summary: "List trips (API key auth)" },
  })

  // GET /public/v1/vehicles
  .get("/vehicles", async ({ apiKeyAuth: auth, set }) => {
    return withUsageLog(auth.keyId, "/vehicles", "GET", async () => {
      if (!auth.scopes.includes("vehicles:read")) {
        set.status = 403;
        return {
          success: false,
          error: { code: "INSUFFICIENT_SCOPE", message: "Requires vehicles:read scope" },
        };
      }

      const vehicles = await prisma.vehicle.findMany({
        where:   { tenantId: auth.tenantId, deletedAt: null },
        orderBy: { licensePlate: "asc" },
        select: {
          id:           true,
          licensePlate: true,
          make:         true,
          model:        true,
          year:         true,
          status:       true,
          odometerKm:   true,
        },
      });

      return okRes(vehicles);
    }, set);
  }, {
    detail: { tags: ["Public API"], summary: "List vehicles (API key auth)" },
  })

  // GET /public/v1/invoices
  .get("/invoices", async ({ apiKeyAuth: auth, query, set }) => {
    return withUsageLog(auth.keyId, "/invoices", "GET", async () => {
      if (!auth.scopes.includes("invoices:read")) {
        set.status = 403;
        return {
          success: false,
          error: { code: "INSUFFICIENT_SCOPE", message: "Requires invoices:read scope" },
        };
      }

      const from = query.from ? new Date(query.from) : undefined;
      const to   = query.to   ? new Date(query.to)   : undefined;

      const invoices = await prisma.invoice.findMany({
        where: {
          tenantId:    auth.tenantId,
          status:      (query.status as any) ?? undefined,
          generatedAt: from || to ? { gte: from, lte: to } : undefined,
        },
        take:    Number(query.limit ?? 50),
        skip:    Number(query.offset ?? 0),
        orderBy: { generatedAt: "desc" },
        include: {
          trip: {
            include: {
              vehicle: { select: { licensePlate: true } },
            },
          },
        },
      });

      return okRes(invoices);
    }, set);
  }, {
    query: t.Object({
      status: t.Optional(t.String()),
      from:   t.Optional(t.String()),
      to:     t.Optional(t.String()),
      limit:  t.Optional(t.String()),
      offset: t.Optional(t.String()),
    }),
    detail: { tags: ["Public API"], summary: "List invoices (API key auth)" },
  })

  // GET /public/v1/analytics
  .get("/analytics", async ({ apiKeyAuth: auth, set }) => {
    return withUsageLog(auth.keyId, "/analytics", "GET", async () => {
      if (!auth.scopes.includes("analytics:read")) {
        set.status = 403;
        return {
          success: false,
          error: { code: "INSUFFICIENT_SCOPE", message: "Requires analytics:read scope" },
        };
      }

      const from = new Date();
      from.setDate(from.getDate() - 30);

      const [tripCount, totalRevenue, vehicleCount] = await Promise.all([
        prisma.trip.count({
          where: { tenantId: auth.tenantId, startTime: { gte: from } },
        }),
        prisma.invoice.aggregate({
          where: {
            tenantId:    auth.tenantId,
            status:      "PAID",
            generatedAt: { gte: from },
          },
          _sum: { totalAmount: true },
        }),
        prisma.vehicle.count({
          where: { tenantId: auth.tenantId, deletedAt: null },
        }),
      ]);

      return okRes({
        period:         "last_30_days",
        tripCount,
        totalRevenue:   Number(totalRevenue._sum.totalAmount ?? 0).toFixed(2),
        vehicleCount,
      });
    }, set);
  }, {
    detail: { tags: ["Public API"], summary: "Analytics summary (API key auth)" },
  });
