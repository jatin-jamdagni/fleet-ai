import { prisma } from "../../db/prisma";
import { AppError } from "../../lib/errors";
import { injectTenantContext } from "../../middleware/auth.middleware";
import type { UserContext } from "../../types/context";

export async function getTripRoute(user: UserContext, tripId: string) {
  return injectTenantContext(user, async () => {
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, tenantId: user.tenantId },
      include: {
        vehicle: {
          select: { licensePlate: true, make: true, model: true },
        },
      },
    });

    if (!trip) throw new AppError("NOT_FOUND", "Trip not found", 404);

    // Pull ordered GPS pings via raw SQL for PostGIS precision
    const pings = await prisma.$queryRaw<Array<{
      id:          string;
      lat:         number;
      lng:         number;
      speed_kmh:   number | null;
      heading:     number | null;
      recorded_at: Date;
    }>>`
      SELECT
        id,
        ST_Y(location::geometry) AS lat,
        ST_X(location::geometry) AS lng,
        speed_kmh,
        heading,
        recorded_at
      FROM gps_pings
      WHERE trip_id  = ${tripId}
        AND tenant_id = ${user.tenantId}
      ORDER BY recorded_at ASC
    `;

    if (pings.length === 0) {
      return {
        trip: {
          id:           trip.id,
          status:       trip.status,
          startTime:    trip.startTime,
          endTime:      trip.endTime,
          distanceKm:   trip.distanceKm,
          vehicle:      trip.vehicle,
        },
        route:     [],
        geojson:   null,
        stats:     null,
      };
    }

    // Build GeoJSON LineString
    const coordinates = pings.map((p) => [
      Number(p.lng),
      Number(p.lat),
    ]);

    const geojson = {
      type: "Feature",
      properties: {
        tripId:    trip.id,
        vehicleId: trip.vehicleId,
      },
      geometry: {
        type:        "LineString",
        coordinates,
      },
    };

    // Route stats
    const speeds = pings
      .map((p) => Number(p.speed_kmh))
      .filter((s) => s > 0);

    const stats = {
      pingCount:    pings.length,
      maxSpeedKmh:  speeds.length ? Math.max(...speeds).toFixed(1) : null,
      avgSpeedKmh:  speeds.length
        ? (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1)
        : null,
      durationMin:  trip.endTime
        ? Math.round(
            (trip.endTime.getTime() - trip.startTime.getTime()) / 60_000
          )
        : null,
      distanceKm:   trip.distanceKm
        ? Number(trip.distanceKm).toFixed(3)
        : null,
      startPoint:   {
        lat: Number(pings[0]?.lat),
        lng: Number(pings[0]?.lng),
      },
      endPoint:     {
        lat: Number(pings[pings.length - 1]?.lat),
        lng: Number(pings[pings.length - 1]?.lng),
      },
    };

    return {
      trip: {
        id:         trip.id,
        status:     trip.status,
        startTime:  trip.startTime,
        endTime:    trip.endTime,
        distanceKm: trip.distanceKm,
        vehicle:    trip.vehicle,
      },
      route: pings.map((p) => ({
        lat:        Number(p.lat),
        lng:        Number(p.lng),
        speedKmh:   p.speed_kmh !== null ? Number(p.speed_kmh) : null,
        heading:    p.heading   !== null ? Number(p.heading)   : null,
        recordedAt: p.recorded_at,
      })),
      geojson,
      stats,
    };
  });
}
