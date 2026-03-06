import Elysia from "elysia";
import { requireRole } from "../../middleware/auth.middleware";
import * as TripService from "./trips.service";
import { AppError } from "../../lib/errors";
import { ok as okRes } from "../../lib/response";
import {
  StartTripBody,
  TripIdParam,
  TripListQuery,
} from "./trips.schema";
import { Role } from "@fleet/shared";

function handleError(e: unknown, set: any) {
  if (e instanceof AppError) {
    set.status = e.statusCode;
    return {
      success: false,
      error: { code: e.code, message: e.message, statusCode: e.statusCode },
    };
  }
  console.error("[TripRoute]", e);
  set.status = 500;
  return {
    success: false,
    error: { code: "INTERNAL", message: "Something went wrong", statusCode: 500 },
  };
}

// ─── Driver trip routes ───────────────────────────────────────────────────────

export const tripDriverRoutes = new Elysia({ prefix: "/trips" })
  .use(requireRole(Role.DRIVER))

  .post(
    "/start",
    async ({ user, body, set }) => {
      try {
        const trip = await TripService.startTrip(user, body.vehicleId);
        set.status = 201;
        return okRes(trip);
      } catch (e) { return handleError(e, set); }
    },
    {
      body:   StartTripBody,
      detail: { tags: ["Trips"], summary: "Start a new trip (Driver only)", security: [{ bearerAuth: [] }] },
    }
  )

  .post(
    "/:id/end",
    async ({ user, params, set }) => {
      try {
        const trip = await TripService.endTrip(user, params.id);
        return okRes(trip);
      } catch (e) { return handleError(e, set); }
    },
    {
      params: TripIdParam,
      detail: { tags: ["Trips"], summary: "End active trip (Driver only)", security: [{ bearerAuth: [] }] },
    }
  )

  .get(
    "/",
    async ({ user, query, set }) => {
      try {
        return await TripService.listTrips(user, query);
      } catch (e) { return handleError(e, set); }
    },
    {
      query:  TripListQuery,
      detail: { tags: ["Trips"], summary: "List driver's own trips", security: [{ bearerAuth: [] }] },
    }
  )

  .get(
    "/:id",
    async ({ user, params, set }) => {
      try {
        const trip = await TripService.getTrip(user, params.id);
        return okRes(trip);
      } catch (e) { return handleError(e, set); }
    },
    {
      params: TripIdParam,
      detail: { tags: ["Trips"], summary: "Get driver's own trip detail", security: [{ bearerAuth: [] }] },
    }
  );

// ─── Manager trip routes ──────────────────────────────────────────────────────

export const tripManagerRoutes = new Elysia({ prefix: "/trips" })
  .use(requireRole(Role.FLEET_MANAGER, Role.SUPER_ADMIN))

  .get(
    "/active",
    async ({ user, set }) => {
      try {
        const data = await TripService.getActiveTrips(user);
        return okRes(data);
      } catch (e) { return handleError(e, set); }
    },
    {
      detail: { tags: ["Trips"], summary: "Get all active trips + live vehicle states", security: [{ bearerAuth: [] }] },
    }
  )

  .get(
    "/all",
    async ({ user, query, set }) => {
      try {
        return await TripService.listTrips(user, query);
      } catch (e) { return handleError(e, set); }
    },
    {
      query:  TripListQuery,
      detail: { tags: ["Trips"], summary: "List all tenant trips with filters", security: [{ bearerAuth: [] }] },
    }
  )

  .get(
    "/:id",
    async ({ user, params, set }) => {
      try {
        const trip = await TripService.getTrip(user, params.id);
        return okRes(trip);
      } catch (e) { return handleError(e, set); }
    },
    {
      params: TripIdParam,
      detail: { tags: ["Trips"], summary: "Get trip detail with GPS pings", security: [{ bearerAuth: [] }] },
    }
  )

  .post(
    "/:id/force-end",
    async ({ user, params, set }) => {
      try {
        const trip = await TripService.endTrip(user, params.id, true);
        return okRes(trip);
      } catch (e) { return handleError(e, set); }
    },
    {
      params: TripIdParam,
      detail: { tags: ["Trips"], summary: "Force-end any active trip (Fleet Manager)", security: [{ bearerAuth: [] }] },
    }
  );
