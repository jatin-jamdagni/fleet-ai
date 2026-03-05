import Elysia from "elysia";
import { requireRole } from "../../middleware/auth.middleware";
import * as AnalyticsService from "./analytics.service";
import { AppError } from "../../lib/errors";
import { ok as okRes } from "../../lib/response";
import { AnalyticsQuery } from "./analytics.schema";
import { Role } from "@fleet/shared";

function handleError(e: unknown, set: any) {
  if (e instanceof AppError) {
    set.status = e.statusCode;
    return {
      success: false,
      error: { code: e.code, message: e.message, statusCode: e.statusCode },
    };
  }
  console.error("[AnalyticsRoute]", e);
  set.status = 500;
  return {
    success: false,
    error: { code: "INTERNAL", message: "Something went wrong", statusCode: 500 },
  };
}

export const analyticsRoutes = new Elysia({ prefix: "/analytics" })
  .use(requireRole(Role.FLEET_MANAGER, Role.SUPER_ADMIN))

  // GET /analytics/overview
  .get(
    "/overview",
    async ({ user, set }) => {
      try {
        return okRes(await AnalyticsService.getOverview(user));
      } catch (e) { return handleError(e, set); }
    },
    {
      detail: {
        tags:     ["Analytics"],
        summary:  "Overall KPIs with month-over-month deltas",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // GET /analytics/revenue
  .get(
    "/revenue",
    async ({ user, query, set }) => {
      try {
        const data = await AnalyticsService.getRevenueSeries(
          user,
          query.from,
          query.to,
          (query.period as any) ?? "day"
        );
        return okRes(data);
      } catch (e) { return handleError(e, set); }
    },
    {
      query: AnalyticsQuery,
      detail: {
        tags:     ["Analytics"],
        summary:  "Revenue time series (daily / weekly / monthly)",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // GET /analytics/distance
  .get(
    "/distance",
    async ({ user, query, set }) => {
      try {
        const data = await AnalyticsService.getDistanceSeries(
          user,
          query.from,
          query.to,
          (query.period as any) ?? "day"
        );
        return okRes(data);
      } catch (e) { return handleError(e, set); }
    },
    {
      query: AnalyticsQuery,
      detail: {
        tags:     ["Analytics"],
        summary:  "Distance time series",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // GET /analytics/drivers
  .get(
    "/drivers",
    async ({ user, query, set }) => {
      try {
        return okRes(
          await AnalyticsService.getDriverLeaderboard(user, query.from, query.to)
        );
      } catch (e) { return handleError(e, set); }
    },
    {
      query: AnalyticsQuery,
      detail: {
        tags:     ["Analytics"],
        summary:  "Driver leaderboard — trips, distance, revenue",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // GET /analytics/vehicles
  .get(
    "/vehicles",
    async ({ user, query, set }) => {
      try {
        return okRes(
          await AnalyticsService.getVehicleUtilization(user, query.from, query.to)
        );
      } catch (e) { return handleError(e, set); }
    },
    {
      query: AnalyticsQuery,
      detail: {
        tags:     ["Analytics"],
        summary:  "Vehicle utilization — trips, distance, efficiency",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // GET /analytics/hours
  .get(
    "/hours",
    async ({ user, query, set }) => {
      try {
        return okRes(
          await AnalyticsService.getTripHourDistribution(user, query.from, query.to)
        );
      } catch (e) { return handleError(e, set); }
    },
    {
      query: AnalyticsQuery,
      detail: {
        tags:     ["Analytics"],
        summary:  "Trip start-time distribution by hour of day",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // GET /analytics/export/trips.csv
  .get(
    "/export/trips.csv",
    async ({ user, query, set }) => {
      try {
        const csv = await AnalyticsService.exportTripsCSV(
          user,
          query.from,
          query.to
        );

        set.headers["Content-Type"]        = "text/csv; charset=utf-8";
        set.headers["Content-Disposition"] = `attachment; filename="fleet-trips-${
          new Date().toISOString().slice(0, 10)
        }.csv"`;

        return csv;
      } catch (e) { return handleError(e, set); }
    },
    {
      query: AnalyticsQuery,
      detail: {
        tags:     ["Analytics"],
        summary:  "Export trips as CSV",
        security: [{ bearerAuth: [] }],
      },
    }
  );