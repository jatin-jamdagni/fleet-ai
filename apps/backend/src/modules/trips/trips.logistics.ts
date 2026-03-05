import { prisma } from "../../db/prisma";
import { AppError } from "../../lib/errors";
import { injectTenantContext } from "../../middleware/auth.middleware";
import type { UserContext } from "../../types/context";

// ─── Create / update trip manifest ───────────────────────────────────────────

export async function upsertManifest(
    user: UserContext,
    tripId: string,
    body: {
        cargoDescription?: string;
        cargoType?: string;
        weightKg?: number;
        volumeM3?: number;
        pallets?: number;
        temperatureMin?: number;
        temperatureMax?: number;
        bolNumber?: string;
        poNumber?: string;
        waybillNumber?: string;
        sealNumber?: string;
        receiverName?: string;
        receiverPhone?: string;
        receiverAddress?: string;
        deliveryNotes?: string;
        customsDeclaration?: string;
        hsCode?: string;
        originCountry?: string;
        destinationCountry?: string;
    }
) {
    return injectTenantContext(user, async () => {
        const trip = await prisma.trip.findFirst({
            where: { id: tripId, tenantId: user.tenantId },
        });
        if (!trip) throw new AppError("NOT_FOUND", "Trip not found", 404);

        return prisma.tripManifest.upsert({
            where: { tripId },
            create: { tenantId: user.tenantId, tripId, ...body },
            update: { ...body, updatedAt: new Date() },
        });
    });
}

// ─── Get manifest for a trip ─────────────────────────────────────────────────

export async function getManifest(user: UserContext, tripId: string) {
    return injectTenantContext(user, async () => {
        return prisma.tripManifest.findUnique({ where: { tripId } });
    });
}

// ─── Record proof of delivery ─────────────────────────────────────────────────

export async function recordPOD(
    user: UserContext,
    tripId: string,
    body: {
        podSignedBy: string;
        podImageUrl?: string;
    }
) {
    return injectTenantContext(user, async () => {
        return prisma.tripManifest.upsert({
            where: { tripId },
            create: {
                tenantId: user.tenantId,
                tripId,
                podSignedBy: body.podSignedBy,
                podSignedAt: new Date(),
                podImageUrl: body.podImageUrl,
            },
            update: {
                podSignedBy: body.podSignedBy,
                podSignedAt: new Date(),
                podImageUrl: body.podImageUrl,
            },
        });
    });
}

// ─── Waypoints ────────────────────────────────────────────────────────────────

export async function setWaypoints(
    user: UserContext,
    tripId: string,
    waypoints: Array<{
        sequence: number;
        label: string;
        address?: string;
        lat?: number;
        lng?: number;
        notes?: string;
    }>
) {
    return injectTenantContext(user, async () => {
        const trip = await prisma.trip.findFirst({
            where: { id: tripId, tenantId: user.tenantId },
        });
        if (!trip) throw new AppError("NOT_FOUND", "Trip not found", 404);

        // Replace all waypoints atomically
        await prisma.tripWaypoint.deleteMany({ where: { tripId } });
        const created = await prisma.tripWaypoint.createMany({
            data: waypoints.map((w) => ({
                tenantId: user.tenantId,
                tripId,
                ...w,
            })),
        });

        return prisma.tripWaypoint.findMany({
            where: { tripId },
            orderBy: { sequence: "asc" },
        });
    });
}

export async function updateWaypointStatus(
    user: UserContext,
    tripId: string,
    waypointId: string,
    status: "ARRIVED" | "COMPLETED" | "SKIPPED",
) {
    return injectTenantContext(user, async () => {
        const wp = await prisma.tripWaypoint.findFirst({
            where: { id: waypointId, tripId, tenantId: user.tenantId },
        });
        if (!wp) throw new AppError("NOT_FOUND", "Waypoint not found", 404);

        return prisma.tripWaypoint.update({
            where: { id: waypointId },
            data: {
                status,
                arrivedAt: status === "ARRIVED" ? new Date() : undefined,
                departedAt: status === "COMPLETED" ? new Date() : undefined,
            },
        });
    });
}

export async function getWaypoints(user: UserContext, tripId: string) {
    return injectTenantContext(user, async () => {
        return prisma.tripWaypoint.findMany({
            where: { tripId, tenantId: user.tenantId },
            orderBy: { sequence: "asc" },
        });
    });
}