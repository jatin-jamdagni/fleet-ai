import { prisma } from "../../db/prisma";
import { AppError } from "../../lib/errors";
import { injectTenantContext } from "../../middleware/auth.middleware";
import type { UserContext } from "../../types/context";
import { notifyManagers } from "../notifications/notifications.service";
import { dispatchWebhook } from "../webhooks/webhook.service";


// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeoPolygon {
    type: "Polygon";
    coordinates: number[][][];
}

// ─── Create geofence ──────────────────────────────────────────────────────────

export async function createGeofence(
    user: UserContext,
    body: {
        name: string;
        description?: string;
        color?: string;
        polygon: GeoPolygon;
        alertOnEnter?: boolean;
        alertOnExit?: boolean;
    }
) {
    return injectTenantContext(user, async () => {
        // Validate polygon is closed (first = last point)
        const coords = body.polygon.coordinates[0];
        if (!coords || coords.length < 4) {
            throw new AppError(
                "INVALID_POLYGON",
                "Polygon must have at least 3 points",
                422
            );
        }

        const first = coords[0]!;
        const last = coords[coords.length - 1]!;
        if (first[0] !== last[0] || first[1] !== last[1]) {
            throw new AppError(
                "INVALID_POLYGON",
                "Polygon must be closed (first = last point)",
                422
            );
        }

        const wkt = polygonToWKT(body.polygon);

        const geofence = await prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO geofences
        (id, tenant_id, name, description, color, polygon, alert_on_enter, alert_on_exit)
      VALUES (
        gen_random_uuid(),
        ${user.tenantId},
        ${body.name},
        ${body.description ?? null},
        ${body.color ?? "#f59e0b"},
        ST_GeomFromText(${wkt}, 4326),
        ${body.alertOnEnter ?? true},
        ${body.alertOnExit ?? true}
      )
      RETURNING id
    `;

        const id = geofence[0]?.id;

        return prisma.$queryRaw<any[]>`
      SELECT
        id, tenant_id, name, description, color,
        alert_on_enter, alert_on_exit, active,
        ST_AsGeoJSON(polygon)::json AS polygon,
        created_at
      FROM geofences
      WHERE id = ${id}
    `.then((rows) => rows[0]);
    });
}

// ─── List geofences ───────────────────────────────────────────────────────────

export async function listGeofences(user: UserContext) {
    return injectTenantContext(user, async () => {
        const rows = await prisma.$queryRaw<any[]>`
      SELECT
        id, name, description, color,
        alert_on_enter, alert_on_exit, active,
        ST_AsGeoJSON(polygon)::json AS polygon,
        created_at
      FROM geofences
      WHERE tenant_id  = ${user.tenantId}
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;

        return rows.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            color: r.color,
            alertOnEnter: r.alert_on_enter,
            alertOnExit: r.alert_on_exit,
            active: r.active,
            polygon: r.polygon,
            createdAt: r.created_at,
        }));
    });
}

// ─── Delete geofence ──────────────────────────────────────────────────────────

export async function deleteGeofence(user: UserContext, id: string) {
    return injectTenantContext(user, async () => {
        const rows = await prisma.$queryRaw<any[]>`
      UPDATE geofences
      SET deleted_at = NOW()
      WHERE id = ${id} AND tenant_id = ${user.tenantId} AND deleted_at IS NULL
      RETURNING id
    `;
        if (rows.length === 0) throw new AppError("NOT_FOUND", "Geofence not found", 404);
        return { deleted: true };
    });
}

// ─── Check GPS ping against all active geofences ─────────────────────────────

export async function checkGeofences(
    tenantId: string,
    tripId: string,
    vehicleId: string,
    driverId: string | null,
    lat: number,
    lng: number
): Promise<void> {
    // Find geofences this point is inside
    const inside = await prisma.$queryRaw<Array<{
        id: string;
        name: string;
        alert_on_enter: boolean;
        alert_on_exit: boolean;
    }>>`
    SELECT id, name, alert_on_enter, alert_on_exit
    FROM geofences
    WHERE tenant_id  = ${tenantId}
      AND active     = true
      AND deleted_at IS NULL
      AND ST_Contains(
        polygon::geometry,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      )
  `;

    // Check the last event per geofence for this trip to detect ENTER/EXIT transitions
    for (const fence of inside) {
        const lastEvent = await prisma.geofenceEvent.findFirst({
            where: { geofenceId: fence.id, tripId },
            orderBy: { occurredAt: "desc" },
        });

        const wasInside = lastEvent?.eventType === "ENTER";

        if (!wasInside && fence.alert_on_enter) {
            // ENTER event
            await prisma.geofenceEvent.create({
                data: {
                    tenantId,
                    geofenceId: fence.id,
                    tripId,
                    vehicleId,
                    driverId: driverId ?? undefined,
                    eventType: "ENTER",
                    lat,
                    lng,
                },
            });

            dispatchWebhook(tenantId, "geofence.entered", {
                geofenceId: fence.id,
                geofenceName: fence.name,
                vehicleId,
                tripId,
                lat,
                lng,
                occurredAt: new Date().toISOString(),
            }).catch(() => { });

            await notifyManagers({
                tenantId,
                type: "SYSTEM",
                title: "Geofence Entered",
                body: `Vehicle entered zone: ${fence.name}`,
                data: { geofenceId: fence.id, geofenceName: fence.name, tripId, lat, lng },
            }).catch(() => { });
        }
    }

    // Check for EXIT — geofences we were inside but aren't now
    const insideIds = new Set(inside.map((f) => f.id));

    const lastEvents = await prisma.geofenceEvent.findMany({
        where: {
            tripId,
            tenantId,
        },
        orderBy: { occurredAt: "desc" },
        distinct: ["geofenceId"],
    });

    for (const entry of lastEvents) {
        if (entry.eventType !== "ENTER") continue;
        if (insideIds.has(entry.geofenceId)) continue;

        // Check fence still active
        const fence = await prisma.geofence.findFirst({
            where: {
                id: entry.geofenceId,
                tenantId,
                active: true,
                deletedAt: null,
            },
            select: { name: true, alertOnExit: true },
        });

        if (!fence?.alertOnExit) continue;

        // EXIT event
        await prisma.geofenceEvent.create({
            data: {
                tenantId,
                geofenceId: entry.geofenceId,
                tripId,
                vehicleId,
                driverId: driverId ?? undefined,
                eventType: "EXIT",
                lat,
                lng,
            },
        });

        dispatchWebhook(tenantId, "geofence.exited", {
            geofenceId: entry.geofenceId,
            vehicleId,
            tripId,
            lat,
            lng,
            occurredAt: new Date().toISOString(),
        }).catch(() => { });

        await notifyManagers({
            tenantId,
            type: "SYSTEM",
            title: "Geofence Exited",
            body: `Vehicle exited zone: ${fence.name}`,
            data: {
                geofenceId: entry.geofenceId,
                geofenceName: fence.name,
                tripId,
                lat,
                lng,
            },
        }).catch(() => { });
    }
}

// ─── List geofence events ─────────────────────────────────────────────────────

export async function listGeofenceEvents(
    user: UserContext,
    tripId?: string,
    limit: number = 50
) {
    return injectTenantContext(user, async () => {
        const where: any = { tenantId: user.tenantId };
        if (tripId) where.tripId = tripId;

        return prisma.geofenceEvent.findMany({
            where,
            orderBy: { occurredAt: "desc" },
            take: limit,
            include: {
                geofence: { select: { name: true, color: true } },
                vehicle: { select: { licensePlate: true } },
            },
        });
    });
}

// ─── WKT helper ───────────────────────────────────────────────────────────────

function polygonToWKT(polygon: GeoPolygon): string {
    const ring = polygon.coordinates[0]!
        .map((c) => `${c[0]} ${c[1]}`)
        .join(", ");
    return `POLYGON((${ring}))`;
}
