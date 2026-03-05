import { prisma } from "../../db/prisma";
import { AppError } from "../../lib/errors";
import { injectTenantContext } from "../../middleware/auth.middleware";
import type { UserContext } from "../../types/context";
import crypto from "crypto";

// ─── Create share link ────────────────────────────────────────────────────────

export async function createShareLink(
    user: UserContext,
    body: {
        tripId: string;
        label?: string;
        expiresIn?: number;  // hours
    }
) {
    return injectTenantContext(user, async () => {
        const trip = await prisma.trip.findFirst({
            where: { id: body.tripId, tenantId: user.tenantId },
            select: { id: true, status: true },
        });
        if (!trip) throw new AppError("NOT_FOUND", "Trip not found", 404);

        const token = crypto.randomBytes(24).toString("base64url");
        const expiresAt = body.expiresIn
            ? new Date(Date.now() + body.expiresIn * 3_600_000)
            : null;

        const link = await prisma.shareLink.create({
            data: {
                tenantId: user.tenantId,
                tripId: body.tripId,
                token,
                label: body.label,
                expiresAt,
                createdById: user.userId,
            },
        });

        const base = process.env.FRONTEND_URL ?? "http://localhost:5173";
        const shareUrl = `${base}/share/${token}`;

        return { ...link, shareUrl };
    });
}

// ─── List share links for tenant ─────────────────────────────────────────────

export async function listShareLinks(user: UserContext) {
    return injectTenantContext(user, async () => {
        const links = await prisma.shareLink.findMany({
            where: { tenantId: user.tenantId },
            orderBy: { createdAt: "desc" },
            include: {
                trip: {
                    select: {
                        id: true,
                        status: true,
                        startTime: true,
                        distanceKm: true,
                        vehicle: { select: { licensePlate: true } },
                    },
                },
            },
        });

        const base = process.env.FRONTEND_URL ?? "http://localhost:5173";
        return links.map((l) => ({
            ...l,
            shareUrl: `${base}/share/${l.token}`,
            isExpired: l.expiresAt ? new Date() > l.expiresAt : false,
        }));
    });
}

// ─── Delete share link ────────────────────────────────────────────────────────

export async function deleteShareLink(user: UserContext, id: string) {
    return injectTenantContext(user, async () => {
        const link = await prisma.shareLink.findFirst({
            where: { id, tenantId: user.tenantId },
        });
        if (!link) throw new AppError("NOT_FOUND", "Share link not found", 404);

        await prisma.shareLink.delete({ where: { id } });
        return { deleted: true };
    });
}

// ─── Resolve public share link (no auth) ─────────────────────────────────────

export async function resolveShareLink(token: string) {
    const link = await prisma.shareLink.findUnique({
        where: { token },
        include: {
            trip: {
                include: {
                    vehicle: {
                        select: {
                            licensePlate: true,
                            make: true,
                            model: true,
                        },
                    },
                },
            },
        },
    });

    if (!link) throw new AppError("NOT_FOUND", "Share link not found", 404);

    if (link.expiresAt && new Date() > link.expiresAt) {
        throw new AppError("LINK_EXPIRED", "This share link has expired", 410);
    }

    // Increment view count
    await prisma.shareLink.update({
        where: { id: link.id },
        data: { viewCount: { increment: 1 } },
    });

    // Get GPS pings for live / replay
    const pings = await prisma.$queryRaw<Array<{
        lat: number;
        lng: number;
        speed_kmh: number | null;
        recorded_at: Date;
    }>>`
    SELECT
      ST_Y(location::geometry) AS lat,
      ST_X(location::geometry) AS lng,
      speed_kmh,
      recorded_at
    FROM gps_pings
    WHERE trip_id   = ${link.tripId}
      AND tenant_id = ${link.tenantId}
    ORDER BY recorded_at ASC
  `;

    const branding = await getPublicBranding(link.tenantId);

    return {
        trip: {
            id: link.trip.id,
            status: link.trip.status,
            startTime: link.trip.startTime,
            endTime: (link.trip as any).endTime,
            distanceKm: (link.trip as any).distanceKm,
            vehicle: {
                licensePlate: link.trip.vehicle.licensePlate,
                make: link.trip.vehicle.make,
                model: link.trip.vehicle.model,
            },
        },
        route: pings.map((p) => ({
            lat: Number(p.lat),
            lng: Number(p.lng),
            speedKmh: p.speed_kmh ? Number(p.speed_kmh) : null,
            recordedAt: p.recorded_at,
        })),
        branding,
        viewCount: link.viewCount,
        expiresAt: link.expiresAt,
        label: link.label,
    };
}

// Re-export for resolver
import { getPublicBranding } from "./settings.service";