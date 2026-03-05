import Elysia, { t } from "elysia";
import { requireRole } from "../../middleware/auth.middleware";
import * as FuelService from "./fuel.service";
import { ok as okRes }  from "../../lib/response";
import { AppError }     from "../../lib/errors";
import { Role }         from "@fleet/shared";

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

export const fuelRoutes = new Elysia({ prefix: "/fuel" })
  .use(requireRole(Role.FLEET_MANAGER, Role.SUPER_ADMIN))

  // GET /fuel — fleet summary
  .get("/", async ({ user, query, set }) => {
    try {
      return okRes(
        await FuelService.getFleetFuelSummary(user, Number(query.days ?? 30))
      );
    } catch (e) { return handleError(e, set); }
  }, {
    query: t.Object({ days: t.Optional(t.String()) }),
    detail: {
      tags:     ["Fuel"],
      summary:  "Fleet fuel cost summary",
      security: [{ bearerAuth: [] }],
    },
  })

  // GET /fuel/logs
  .get("/logs", async ({ user, query, set }) => {
    try {
      return okRes(
        await FuelService.listFuelLogs(user, query.vehicleId, query.from, query.to)
      );
    } catch (e) { return handleError(e, set); }
  }, {
    query: t.Object({
      vehicleId: t.Optional(t.String()),
      from:      t.Optional(t.String()),
      to:        t.Optional(t.String()),
    }),
    detail: {
      tags:     ["Fuel"],
      summary:  "List fuel fill-up logs",
      security: [{ bearerAuth: [] }],
    },
  })

  // POST /fuel/logs
  .post("/logs", async ({ user, body, set }) => {
    try {
      return okRes(await FuelService.logFuel(user, body as any));
    } catch (e) { return handleError(e, set); }
  }, {
    body: t.Object({
      vehicleId:  t.String(),
      litres:     t.Number({ minimum: 0.1 }),
      pricePerL:  t.Number({ minimum: 0 }),
      odometerKm: t.Number({ minimum: 0 }),
      fuelType:   t.Optional(t.String()),
      station:    t.Optional(t.String()),
      notes:      t.Optional(t.String()),
    }),
    detail: {
      tags:     ["Fuel"],
      summary:  "Log a fuel fill-up",
      security: [{ bearerAuth: [] }],
    },
  })

  // GET /fuel/efficiency/:vehicleId
  .get("/efficiency/:vehicleId", async ({ user, params, set }) => {
    try {
      return okRes(await FuelService.getFuelEfficiency(user, params.vehicleId));
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ vehicleId: t.String() }),
    detail: {
      tags:     ["Fuel"],
      summary:  "Fuel efficiency for a vehicle (L/100km)",
      security: [{ bearerAuth: [] }],
    },
  });