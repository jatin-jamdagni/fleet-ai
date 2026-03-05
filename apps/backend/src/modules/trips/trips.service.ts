import { prisma } from "../../db/prisma";
import { Errors, AppError } from "../../lib/errors";
import { paginate } from "../../lib/response";
import { injectTenantContext } from "../../middleware/auth.middleware";
import { fleetStore } from "../websocket/ws.store";
import { broadcastToManagers } from "../websocket/ws.broadcast";
import { flushTripPings } from "../websocket/ws.batch";
import type { UserContext } from "../../types/context";
import { Role } from "@fleet/shared";
import { generateInvoice } from "../billing/billing.service";
import { onTripEnded, onTripStarted } from "../gps/gps.batch";
import { tripsEndedTotal, tripsStartedTotal } from "../../lib/metrics";
import { notifyManagers, createNotification } from "../notifications/notifications.service";
import { sendTripSummaryEmail } from "../email/email.service";
import { computeDriverScore } from "../safety/safety.scoring";
import { logHosDriving } from "../safety/safety.hos";
import { updateOdometer } from "../maintenance/maintenance.service";
import { dispatchWebhook } from "../webhooks/webhook.service";
import { geocodeTrip } from "../integrations/geocode.service";


// ─── Start Trip ───────────────────────────────────────────────────────────────

export async function startTrip(user: UserContext, vehicleId: string) {
    return injectTenantContext(user, async () => {

        // Only drivers can start trips
        if (user.role !== Role.DRIVER) {
            throw Errors.FORBIDDEN;
        }

        // Verify vehicle belongs to tenant and is assigned to this driver
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                id: vehicleId,
                tenantId: user.tenantId,
                assignedDriverId: user.userId,
                deletedAt: null,
            },
        });

        if (!vehicle) {
            throw new AppError(
                "VEHICLE_NOT_ASSIGNED",
                "This vehicle is not assigned to you or does not exist",
                403
            );
        }

        // Driver must not have another active trip
        const existingTrip = await prisma.trip.findFirst({
            where: {
                driverId: user.userId,
                status: { in: ["ACTIVE", "PENDING"] },
            },
        });

        if (existingTrip) {
            throw new AppError(
                "DRIVER_IN_TRIP",
                "You already have an active trip. End it before starting a new one.",
                409
            );
        }

        // Vehicle must be ACTIVE — not already IN_TRIP
        if (vehicle.status === "IN_TRIP") {
            throw new AppError(
                "VEHICLE_IN_TRIP",
                "This vehicle already has an active trip",
                409
            );
        }

        if (vehicle.status === "INACTIVE") {
            throw new AppError(
                "VEHICLE_INACTIVE",
                "This vehicle is inactive. Contact your Fleet Manager.",
                409
            );
        }

        // Create trip + update vehicle status atomically
        const [trip] = await prisma.$transaction([
            prisma.trip.create({
                data: {
                    tenantId: user.tenantId,
                    vehicleId: vehicle.id,
                    driverId: user.userId,
                    status: "ACTIVE",
                    startTime: new Date(),
                },
                include: {
                    vehicle: { select: { licensePlate: true, make: true, model: true } },
                    driver: { select: { name: true, email: true } },
                },
            }),
            prisma.vehicle.update({
                where: { id: vehicle.id },
                data: { status: "IN_TRIP" },
            }),
        ]);

        dispatchWebhook(trip.tenantId, "trip.started", {
            tripId: trip.id,
            vehicleId: trip.vehicleId,
            driverId: trip.driverId,
            startTime: trip.startTime,
        }).catch(() => { });


        onTripStarted();
        tripsStartedTotal.inc();

        return trip;
    });
}

// ─── End Trip ─────────────────────────────────────────────────────────────────

export async function endTrip(
    user: UserContext,
    tripId: string,
    forced: boolean = false
) {
    return injectTenantContext(user, async () => {

        // Build where clause based on role
        const where: any = {
            id: tripId,
            tenantId: user.tenantId,
            status: { in: ["ACTIVE", "PENDING"] },
        };

        // Driver can only end their own trip
        if (user.role === Role.DRIVER && !forced) {
            where.driverId = user.userId;
        }

        const trip = await prisma.trip.findFirst({
            where,
            include: {
                vehicle: { select: { id: true, licensePlate: true } },
                driver: { select: { id: true, name: true } },
            },
        });

        if (!trip) {
            throw new AppError("TRIP_NOT_FOUND", "Active trip not found", 404);
        }

        // Flush any pending GPS pings to DB first
        const pingsFlushed = await flushTripPings(tripId);

        // Calculate distance using PostGIS
        let distanceKm = 0;
        try {
            const result = await prisma.$queryRaw<{ distance_km: number }[]>`
        SELECT
          COALESCE(
            ST_Length(
              ST_MakeLine(
                ARRAY(
                  SELECT ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geometry
                  FROM gps_pings
                  WHERE "tripId" = ${tripId}
                  ORDER BY timestamp ASC
                )
              )::geography
            ) / 1000.0,
            0
          ) as distance_km
      `;
            distanceKm = Number(result[0]?.distance_km ?? 0);
        } catch (err) {
            console.error("[EndTrip] Distance calculation failed:", err);
            // Continue — don't block trip ending because of a calculation error
        }

        const endTime = new Date();
        const newStatus = forced ? "FORCE_ENDED" : "COMPLETED";

        // Update trip + reset vehicle status atomically
        const [updatedTrip] = await prisma.$transaction([
            prisma.trip.update({
                where: { id: tripId },
                data: {
                    status: newStatus,
                    endTime,
                    distanceKm: distanceKm,
                },
                include: {
                    vehicle: { select: { id: true, licensePlate: true, costPerKm: true } },
                    driver: { select: { id: true, name: true } },
                },
            }),
            prisma.vehicle.update({
                where: { id: trip.vehicleId },
                data: { status: "ACTIVE" },
            }),
        ]);

        onTripEnded();
        tripsEndedTotal.inc({ reason: forced ? "force_ended" : "completed" });

        // Remove from live store
        fleetStore.removeVehicleState(trip.vehicleId);

        // Notify managers
        broadcastToManagers(user.tenantId, {
            type: "TRIP_ENDED",
            payload: {
                tripId: tripId,
                vehicleId: trip.vehicleId,
                driverName: trip.driver.name,
                licensePlate: trip.vehicle.licensePlate,
                timestamp: endTime.toISOString(),
            },
        });

        console.log(
            `[Trip] Ended: ${tripId} | Distance: ${distanceKm.toFixed(3)}km | Pings flushed: ${pingsFlushed}`
        );

        // ── Auto-generate invoice asynchronously ──────────────────────────────────
        // let billing run in background so trip end is instant
        generateInvoice(tripId).catch((err) => {
            console.error("[Trip] Invoice generation failed:", err);
        });

        const addresses = await geocodeTrip(trip.id).catch(() => ({
            startAddress: null, endAddress: null,
        }));

        const durationMin = Math.round(
            (endTime.getTime() - trip.startTime.getTime()) / 60_000
        );

        const invoice = await prisma.invoice.findUnique({
            where: { tripId: trip.id },
            select: { id: true, totalAmount: true },
        }).catch(() => null);

        dispatchWebhook(trip.tenantId, "trip.ended", {
            tripId: trip.id,
            vehicleId: trip.vehicleId,
            driverId: trip.driverId,
            distanceKm: Number(distanceKm).toFixed(3),
            durationMin,
            startTime: trip.startTime,
            endTime,
            startAddress: addresses.startAddress,
            endAddress: addresses.endAddress,
            invoiceId: invoice?.id,
            invoiceAmount: invoice ? Number(invoice.totalAmount).toFixed(2) : null,
        }).catch(() => { });

        const drivingMin = durationMin;

        // Fire all safety computations concurrently (non-blocking)
        Promise.all([
            updateOdometer(trip.vehicleId, Number(distanceKm)),
            logHosDriving(trip.tenantId, trip.driverId!, trip.id, drivingMin),
            computeDriverScore(trip.tenantId, trip.driverId!),
        ]).catch((err) =>
            console.error("[Safety] Post-trip processing failed:", err)
        );


        await notifyManagers({
            tenantId: trip.tenantId,
            type: "TRIP_ENDED",
            title: "Trip Completed",
            body: `${updatedTrip.vehicle.licensePlate} · ${Number(distanceKm).toFixed(2)} km`,
            data: { tripId: trip.id, vehicleId: trip.vehicleId },
        });

        // Email summary to managers
        const managers = await prisma.user.findMany({
            where: { tenantId: trip.tenantId, role: { in: ["FLEET_MANAGER"] }, deletedAt: null },
            select: { email: true, name: true },
        });
        for (const mgr of managers) {
            await sendTripSummaryEmail({
                to: mgr.email,
                managerName: mgr.name,
                licensePlate: updatedTrip.vehicle.licensePlate,
                driverName: updatedTrip.driver?.name ?? "Unknown",
                distanceKm: Number(distanceKm).toFixed(2),
                durationMin: Math.round((endTime.getTime() - trip.startTime.getTime()) / 60_000),
                startTime: trip.startTime,
                endTime,
                totalAmount: "—",
            }).catch(() => { });
        }
        return { ...updatedTrip, pingsFlushed };


    });
}

// ─── List Trips ───────────────────────────────────────────────────────────────

export async function listTrips(
    user: UserContext,
    input: {
        page?: number;
        pageSize?: number;
        vehicleId?: string;
        driverId?: string;
        status?: string;
        from?: string;
        to?: string;
    }
) {
    return injectTenantContext(user, async () => {
        const page = Math.max(1, input.page ?? 1);
        const pageSize = Math.min(100, input.pageSize ?? 20);
        const skip = (page - 1) * pageSize;

        const where: any = {
            tenantId: user.tenantId,
        };

        // Drivers only see their own trips
        if (user.role === Role.DRIVER) {
            where.driverId = user.userId;
        }

        if (input.vehicleId) where.vehicleId = input.vehicleId;
        if (input.driverId && user.role !== Role.DRIVER) where.driverId = input.driverId;
        if (input.status) where.status = input.status;

        if (input.from || input.to) {
            where.startTime = {};
            if (input.from) where.startTime.gte = new Date(input.from);
            if (input.to) where.startTime.lte = new Date(input.to);
        }

        const [trips, total] = await Promise.all([
            prisma.trip.findMany({
                where,
                orderBy: { startTime: "desc" },
                skip,
                take: pageSize,
                include: {
                    vehicle: { select: { licensePlate: true, make: true, model: true } },
                    driver: { select: { name: true, email: true } },
                    invoice: { select: { id: true, totalAmount: true, status: true } },
                },
            }),
            prisma.trip.count({ where }),
        ]);

        return paginate(trips, total, page, pageSize);
    });
}

// ─── Get Single Trip ──────────────────────────────────────────────────────────

export async function getTrip(user: UserContext, tripId: string) {
    return injectTenantContext(user, async () => {
        const where: any = {
            id: tripId,
            tenantId: user.tenantId,
        };

        if (user.role === Role.DRIVER) {
            where.driverId = user.userId;
        }

        const trip = await prisma.trip.findFirst({
            where,
            include: {
                vehicle: { select: { licensePlate: true, make: true, model: true, costPerKm: true } },
                driver: { select: { name: true, email: true } },
                invoice: true,
                gpsPings: {
                    select: { lat: true, lng: true, speed: true, timestamp: true },
                    orderBy: { timestamp: "asc" },
                },
                _count: { select: { gpsPings: true } },
            },
        });

        if (!trip) throw Errors.NOT_FOUND("Trip");
        return trip;
    });
}

// ─── Get Active Trips (live map) ──────────────────────────────────────────────

export async function getActiveTrips(user: UserContext) {
    return injectTenantContext(user, async () => {
        const liveVehicles = fleetStore.getAllVehicleStates(user.tenantId);

        return {
            activeTrips: liveVehicles.length,
            vehicles: liveVehicles,
            wsStats: fleetStore.getStats(),
        };
    });
}
