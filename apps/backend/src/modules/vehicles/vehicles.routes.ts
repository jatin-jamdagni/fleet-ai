import Elysia from "elysia";
import { authMiddleware, requireRole } from "../../middleware/auth.middleware";
import * as VehicleService from "./vehicles.service";
import { AppError } from "../../lib/errors";
import { ok as okRes } from "../../lib/response";
import {
  CreateVehicleBody,
  UpdateVehicleBody,
  AssignDriverBody,
  VehicleListQuery,
  VehicleIdParam,
} from "./vehicles.schema";
import { Role } from "@fleet/shared";

// ─── Error handler helper ─────────────────────────────────────────────────────

function handleError(e: unknown, set: any) {
  if (e instanceof AppError) {
    set.status = e.statusCode;
    return {
      success: false,
      error: { code: e.code, message: e.message, statusCode: e.statusCode },
    };
  }
  console.error("[VehicleRoute]", e);
  set.status = 500;
  return {
    success: false,
    error: { code: "INTERNAL", message: "Something went wrong", statusCode: 500 },
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export const vehicleRoutes = new Elysia({ prefix: "/vehicles" })
  .use(requireRole(Role.FLEET_MANAGER, Role.SUPER_ADMIN))

  // ── GET /vehicles ───────────────────────────────────────────────────────────
  .get(
    "/",
    async ({ user, query, set }) => {
      try {
        return await VehicleService.listVehicles(user, {
          page:     query.page,
          pageSize: query.pageSize,
          search:   query.search,
          status:   query.status as any,
        });
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      query: VehicleListQuery,
      detail: {
        tags:    ["Vehicles"],
        summary: "List all vehicles in the tenant fleet",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ── GET /vehicles/stats ─────────────────────────────────────────────────────
  .get(
    "/stats",
    async ({ user, set }) => {
      try {
        const stats = await VehicleService.getFleetStats(user);
        return okRes(stats);
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      detail: {
        tags:    ["Vehicles"],
        summary: "Get fleet summary stats",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ── GET /vehicles/:id ───────────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ user, params, set }) => {
      try {
        const vehicle = await VehicleService.getVehicle(user, params.id);
        return okRes(vehicle);
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      params: VehicleIdParam,
      detail: {
        tags:    ["Vehicles"],
        summary: "Get vehicle detail by ID",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ── POST /vehicles ──────────────────────────────────────────────────────────
  .post(
    "/",
    async ({ user, body, set }) => {
      try {
        const vehicle = await VehicleService.createVehicle(user, body);
        set.status = 201;
        return okRes(vehicle);
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      body: CreateVehicleBody,
      detail: {
        tags:    ["Vehicles"],
        summary: "Add a new vehicle to the fleet",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ── PATCH /vehicles/:id ─────────────────────────────────────────────────────
  .patch(
    "/:id",
    async ({ user, params, body, set }) => {
      try {
        const vehicle = await VehicleService.updateVehicle(user, params.id, body);
        return okRes(vehicle);
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      params: VehicleIdParam,
      body:   UpdateVehicleBody,
      detail: {
        tags:    ["Vehicles"],
        summary: "Update vehicle details",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ── DELETE /vehicles/:id ────────────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ user, params, set }) => {
      try {
        const result = await VehicleService.deleteVehicle(user, params.id);
        return okRes(result);
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      params: VehicleIdParam,
      detail: {
        tags:    ["Vehicles"],
        summary: "Soft-delete a vehicle (preserves trip history)",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ── POST /vehicles/:id/assign ───────────────────────────────────────────────
  .post(
    "/:id/assign",
    async ({ user, params, body, set }) => {
      try {
        const vehicle = await VehicleService.assignDriver(
          user,
          params.id,
          body.driverId
        );
        return okRes(vehicle);
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      params: VehicleIdParam,
      body:   AssignDriverBody,
      detail: {
        tags:    ["Vehicles"],
        summary: "Assign or unassign a driver to a vehicle",
        security: [{ bearerAuth: [] }],
      },
    }
  );