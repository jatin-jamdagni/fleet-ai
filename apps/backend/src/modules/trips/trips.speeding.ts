import { prisma } from "../../db/prisma";
import { notifyManagers } from "../notifications/notifications.service";
import { dispatchWebhook } from "../webhooks/webhook.service";

const SPEEDING_COOLDOWN_MS = 60_000; // Only alert once per minute per vehicle

// Track last alert time per vehicle
const lastAlertAt = new Map<string, number>();

export async function checkSpeeding(opts: {
    tenantId: string;
    tripId: string;
    vehicleId: string;
    driverId: string | null;
    speedKmh: number;
    lat: number;
    lng: number;
}): Promise<void> {
    const vehicle = await prisma.vehicle.findUnique({
        where: { id: opts.vehicleId },
        select: { speedLimitKmh: true, licensePlate: true },
    });

    if (!vehicle?.speedLimitKmh) return; // No limit set
    if (opts.speedKmh <= vehicle.speedLimitKmh) return; // Within limit

    // Enforce cooldown per vehicle
    const lastAlert = lastAlertAt.get(opts.vehicleId) ?? 0;
    if (Date.now() - lastAlert < SPEEDING_COOLDOWN_MS) return;

    lastAlertAt.set(opts.vehicleId, Date.now());

    // Log speeding event
    await prisma.speedingEvent.create({
        data: {
            tenantId: opts.tenantId,
            tripId: opts.tripId,
            vehicleId: opts.vehicleId,
            driverId: opts.driverId ?? undefined,
            speedKmh: opts.speedKmh,
            limitKmh: vehicle.speedLimitKmh,
            lat: opts.lat,
            lng: opts.lng,
        },
    });

    // Notify managers
    await notifyManagers({
        tenantId: opts.tenantId,
        type: "SYSTEM",
        title: "Speeding Alert",
        body: `${vehicle.licensePlate} — ${opts.speedKmh.toFixed(0)} km/h (limit: ${vehicle.speedLimitKmh} km/h)`,
        data: {
            vehicleId: opts.vehicleId,
            tripId: opts.tripId,
            speedKmh: opts.speedKmh,
            limitKmh: vehicle.speedLimitKmh,
            lat: opts.lat,
            lng: opts.lng,
        },
    }).catch(() => { });

    console.log(
        `[Speeding] ${vehicle.licensePlate} — ${opts.speedKmh.toFixed(0)} km/h ` +
        `(limit: ${vehicle.speedLimitKmh} km/h)`
    );

    dispatchWebhook(opts.tenantId, "speeding.detected", {
        vehicleId: opts.vehicleId,
        tripId: opts.tripId,
        driverId: opts.driverId,
        speedKmh: opts.speedKmh.toFixed(1),
        limitKmh: vehicle.speedLimitKmh,
        lat: opts.lat,
        lng: opts.lng,
        occurredAt: new Date().toISOString(),
    }).catch(() => { });
}

// ─── Get speeding events for a trip ──────────────────────────────────────────

export async function getTripSpeedingEvents(
    tenantId: string,
    tripId: string
) {
    return prisma.speedingEvent.findMany({
        where: { tenantId, tripId },
        orderBy: { occurredAt: "asc" },
    });
}