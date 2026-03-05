import Elysia, { t } from "elysia";
import { Role } from "@fleet/shared";
import { authMiddleware } from "../../middleware/auth.middleware";
import { prisma } from "../../db/prisma";
import { ok as okRes } from "../../lib/response";
import { AppError } from "../../lib/errors";
import {
  fleetStore,
  getLivePositionForVehicle,
  getLivePositionsForTenant,
} from "./gps.store";
import type { TripRouteGeoJson, TripRoutePoint } from "./gps.types";

function handleError(e: unknown, set: { status?: number | string }) {
  if (e instanceof AppError) {
    set.status = e.statusCode;
    return {
      success: false,
      error: { code: e.code, message: e.message, statusCode: e.statusCode },
    };
  }

  console.error("[GPSRoute]", e);
  set.status = 500;
  return {
    success: false,
    error: { code: "INTERNAL", message: "Something went wrong", statusCode: 500 },
  };
}

function canReadTenantLiveData(role: Role) {
  return role === Role.FLEET_MANAGER || role === Role.SUPER_ADMIN;
}

export const gpsRoutes = new Elysia({ prefix: "/gps" })
  .use(authMiddleware)

  .get(
    "/live",
    ({ user, set }) => {
      try {
        if (!canReadTenantLiveData(user.role)) {
          throw new AppError("FORBIDDEN", "You do not have permission to view live fleet data", 403);
        }
        return okRes(getLivePositionsForTenant(user.tenantId));
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      detail: {
        tags: ["GPS"],
        summary: "Get live positions for active vehicles in tenant",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  .get(
    "/live/:vehicleId",
    ({ user, params, set }) => {
      try {
        if (!canReadTenantLiveData(user.role)) {
          throw new AppError("FORBIDDEN", "You do not have permission to view live fleet data", 403);
        }
        const position = getLivePositionForVehicle(user.tenantId, params.vehicleId);
        if (!position) {
          throw new AppError("NOT_FOUND", "No live position for this vehicle", 404);
        }
        return okRes(position);
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      params: t.Object({ vehicleId: t.String() }),
      detail: {
        tags: ["GPS"],
        summary: "Get live position for a specific vehicle",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  .get(
    "/trips/:tripId/route",
    async ({ user, params, set }) => {
      try {
        const trip = await prisma.trip.findFirst({
          where: {
            id: params.tripId,
            tenantId: user.tenantId,
          },
          select: {
            id: true,
            driverId: true,
          },
        });

        if (!trip) {
          throw new AppError("TRIP_NOT_FOUND", "Trip not found", 404);
        }

        if (user.role === Role.DRIVER && trip.driverId !== user.userId) {
          throw new AppError("FORBIDDEN", "You do not have permission to access this trip route", 403);
        }

        const points = await prisma.gpsPing.findMany({
          where: { tripId: params.tripId },
          orderBy: { timestamp: "asc" },
          select: {
            lat: true,
            lng: true,
            speed: true,
            heading: true,
            timestamp: true,
          },
        });

        const pings: TripRoutePoint[] = points.map((p) => ({
          lat: p.lat,
          lng: p.lng,
          speed: p.speed,
          heading: p.heading,
          timestamp: p.timestamp.toISOString(),
        }));

        const geojson: TripRouteGeoJson = {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: pings.map((p) => [p.lng, p.lat]),
          },
          properties: {
            tripId: params.tripId,
            pingCount: pings.length,
            startTime: pings[0]?.timestamp ?? null,
            endTime: pings[pings.length - 1]?.timestamp ?? null,
          },
        };

        return okRes({ pings, geojson });
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      params: t.Object({ tripId: t.String() }),
      detail: {
        tags: ["GPS"],
        summary: "Get ordered route pings and GeoJSON for a trip",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  .get(
    "/stats",
    ({ user, set }) => {
      try {
        if (!canReadTenantLiveData(user.role)) {
          throw new AppError("FORBIDDEN", "You do not have permission to view GPS stats", 403);
        }
        const tenantLiveCount = fleetStore.getAllVehicleStates(user.tenantId).length;
        return okRes({
          ...fleetStore.getStats(),
          tenantLiveVehicles: tenantLiveCount,
        });
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      detail: {
        tags: ["GPS"],
        summary: "Get websocket/live GPS stats",
        security: [{ bearerAuth: [] }],
      },
    }
  );
