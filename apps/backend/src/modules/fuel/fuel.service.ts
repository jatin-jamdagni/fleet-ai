import { prisma } from "../../db/prisma";
import { AppError } from "../../lib/errors";
import { injectTenantContext } from "../../middleware/auth.middleware";
import type { UserContext } from "../../types/context";

// ─── Log a fuel fill ─────────────────────────────────────────────────────────

export async function logFuel(
  user: UserContext,
  body: {
    vehicleId:  string;
    litres:     number;
    pricePerL:  number;
    odometerKm: number;
    fuelType?:  string;
    station?:   string;
    notes?:     string;
  }
) {
  return injectTenantContext(user, async () => {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: body.vehicleId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!vehicle) throw new AppError( "NOT_FOUND", "Vehicle not found",404);

    const totalCost = body.litres * body.pricePerL;

    const log = await prisma.fuelLog.create({
      data: {
        tenantId:   user.tenantId,
        vehicleId:  body.vehicleId,
        litres:     body.litres,
        pricePerL:  body.pricePerL,
        totalCost,
        odometerKm: body.odometerKm,
        fuelType:   body.fuelType ?? "diesel",
        station:    body.station,
        notes:      body.notes,
        loggedById: user.userId,
      },
      include: {
        vehicle: { select: { licensePlate: true, make: true, model: true } },
      },
    });

    // Update vehicle odometer
    await prisma.vehicle.update({
      where: { id: body.vehicleId },
      data:  { odometerKm: body.odometerKm },
    });

    return log;
  });
}

// ─── List fuel logs ───────────────────────────────────────────────────────────

export async function listFuelLogs(
  user:      UserContext,
  vehicleId?: string,
  from?:     string,
  to?:       string
) {
  return injectTenantContext(user, async () => {
    const where: any = { tenantId: user.tenantId };
    if (vehicleId) where.vehicleId = vehicleId;
    if (from || to) where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to)   where.createdAt.lte = new Date(to);

    return prisma.fuelLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take:    200,
      include: {
        vehicle: { select: { licensePlate: true, make: true, model: true } },
      },
    });
  });
}

// ─── Fuel efficiency report ───────────────────────────────────────────────────

export async function getFuelEfficiency(
  user:      UserContext,
  vehicleId: string
) {
  return injectTenantContext(user, async () => {
    const logs = await prisma.fuelLog.findMany({
      where:   { tenantId: user.tenantId, vehicleId },
      orderBy: { odometerKm: "asc" },
    });

    if (logs.length < 2) {
      return { logs, efficiency: null, message: "Need at least 2 fill-ups for efficiency" };
    }

    // Calculate L/100km between consecutive fill-ups
    const segments: Array<{
      from:       number;
      to:         number;
      distanceKm: number;
      litres:     number;
      lPer100km:  number;
      cost:       number;
    }> = [];

    for (let i = 1; i < logs.length; i++) {
      const prev = logs[i - 1];
      const curr = logs[i];
      if (!prev || !curr) continue;

      const dist = curr.odometerKm - prev.odometerKm;

      if (dist <= 0) continue;

      segments.push({
        from:       Number(prev.odometerKm),
        to:         Number(curr.odometerKm),
        distanceKm: dist,
        litres:     Number(curr.litres),
        lPer100km:  (Number(curr.litres) / dist) * 100,
        cost:       Number(curr.totalCost),
      });
    }

    const avgEfficiency = segments.length
      ? segments.reduce((a, b) => a + b.lPer100km, 0) / segments.length
      : null;

    const totalSpend    = logs.reduce((a, b) => a + Number(b.totalCost), 0);
    const totalLitres   = logs.reduce((a, b) => a + Number(b.litres),    0);
    const totalDistance = segments.reduce((a, b) => a + b.distanceKm,    0);

    return {
      logs,
      efficiency: {
        avgLPer100km:   avgEfficiency?.toFixed(2) ?? null,
        totalLitres:    totalLitres.toFixed(1),
        totalSpend:     totalSpend.toFixed(2),
        totalDistanceKm: totalDistance.toFixed(1),
        costPerKm:      totalDistance > 0
          ? (totalSpend / totalDistance).toFixed(3)
          : null,
        segments,
      },
    };
  });
}

// ─── Fleet fuel summary ───────────────────────────────────────────────────────

export async function getFleetFuelSummary(
  user: UserContext,
  days: number = 30
) {
  return injectTenantContext(user, async () => {
    const from = new Date();
    from.setDate(from.getDate() - days);

    const summary = await prisma.$queryRaw<Array<{
      vehicle_id:    string;
      license_plate: string;
      make:          string;
      model:         string;
      total_litres:  number;
      total_cost:    number;
      fill_count:    number;
      last_fill:     Date;
    }>>`
      SELECT
        v.id              AS vehicle_id,
        v.license_plate,
        v.make,
        v.model,
        COALESCE(SUM(f.litres), 0)::float       AS total_litres,
        COALESCE(SUM(f.total_cost), 0)::float   AS total_cost,
        COUNT(f.id)::int                         AS fill_count,
        MAX(f.created_at)                        AS last_fill
      FROM vehicles v
      LEFT JOIN fuel_logs f
        ON  f.vehicle_id  = v.id
        AND f.tenant_id   = ${user.tenantId}
        AND f.created_at >= ${from}
      WHERE v.tenant_id  = ${user.tenantId}
        AND v.deleted_at IS NULL
      GROUP BY v.id, v.license_plate, v.make, v.model
      ORDER BY total_cost DESC
    `;

    const totalFleetCost   = summary.reduce((a, r) => a + Number(r.total_cost),   0);
    const totalFleetLitres = summary.reduce((a, r) => a + Number(r.total_litres), 0);

    return {
      period:            `last ${days} days`,
      totalCost:         totalFleetCost.toFixed(2),
      totalLitres:       totalFleetLitres.toFixed(1),
      vehicles:          summary.map((r) => ({
        vehicleId:    r.vehicle_id,
        licensePlate: r.license_plate,
        make:         r.make,
        model:        r.model,
        totalLitres:  Number(r.total_litres).toFixed(1),
        totalCost:    Number(r.total_cost).toFixed(2),
        fillCount:    Number(r.fill_count),
        lastFill:     r.last_fill,
        pctOfFleet:   totalFleetCost > 0
          ? ((Number(r.total_cost) / totalFleetCost) * 100).toFixed(1)
          : "0",
      })),
    };
  });
}
