import { prisma } from "../../db/prisma";
import { injectTenantContext } from "../../middleware/auth.middleware";
import type { UserContext } from "../../types/context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultRange(from?: string, to?: string) {
  const end   = to   ? new Date(to)   : new Date();
  const start = from ? new Date(from) : new Date(Date.now() - 30 * 86_400_000);
  return { start, end };
}

// ─── Overview KPIs ────────────────────────────────────────────────────────────

export async function getOverview(user: UserContext) {
  return injectTenantContext(user, async () => {
    const now         = new Date();
    const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevStart   = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd     = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalTrips,
      tripsThisMonth,
      tripsPrevMonth,
      totalDistanceRaw,
      distanceThisMonth,
      distancePrevMonth,
      revenueThisMonth,
      revenuePrevMonth,
      totalRevenue,
      avgTripDistance,
      activeVehicles,
      totalDrivers,
    ] = await Promise.all([
      prisma.trip.count({
        where: { tenantId: user.tenantId, status: { in: ["COMPLETED", "FORCE_ENDED"] } },
      }),
      prisma.trip.count({
        where: {
          tenantId: user.tenantId,
          status:   { in: ["COMPLETED", "FORCE_ENDED"] },
          endTime:  { gte: monthStart },
        },
      }),
      prisma.trip.count({
        where: {
          tenantId: user.tenantId,
          status:   { in: ["COMPLETED", "FORCE_ENDED"] },
          endTime:  { gte: prevStart, lte: prevEnd },
        },
      }),
      // Total distance all-time
      prisma.trip.aggregate({
        where: { tenantId: user.tenantId, status: { in: ["COMPLETED", "FORCE_ENDED"] } },
        _sum:  { distanceKm: true },
      }),
      prisma.trip.aggregate({
        where: {
          tenantId: user.tenantId,
          status:   { in: ["COMPLETED", "FORCE_ENDED"] },
          endTime:  { gte: monthStart },
        },
        _sum: { distanceKm: true },
      }),
      prisma.trip.aggregate({
        where: {
          tenantId: user.tenantId,
          status:   { in: ["COMPLETED", "FORCE_ENDED"] },
          endTime:  { gte: prevStart, lte: prevEnd },
        },
        _sum: { distanceKm: true },
      }),
      // Revenue this month (PAID invoices)
      prisma.invoice.aggregate({
        where: {
          tenantId:    user.tenantId,
          status:      "PAID",
          generatedAt: { gte: monthStart },
        },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: {
          tenantId:    user.tenantId,
          status:      "PAID",
          generatedAt: { gte: prevStart, lte: prevEnd },
        },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { tenantId: user.tenantId, status: "PAID" },
        _sum:  { totalAmount: true },
      }),
      prisma.trip.aggregate({
        where: { tenantId: user.tenantId, status: { in: ["COMPLETED", "FORCE_ENDED"] } },
        _avg:  { distanceKm: true },
      }),
      prisma.vehicle.count({
        where: { tenantId: user.tenantId, status: { not: "INACTIVE" }, deletedAt: null },
      }),
      prisma.user.count({
        where: { tenantId: user.tenantId, role: "DRIVER", deletedAt: null },
      }),
    ]);

    // Month-over-month deltas
    const tripDelta    = tripsPrevMonth > 0
      ? ((tripsThisMonth - tripsPrevMonth) / tripsPrevMonth * 100).toFixed(1)
      : null;

    const distThisM    = Number(distanceThisMonth._sum.distanceKm ?? 0);
    const distPrevM    = Number(distancePrevMonth._sum.distanceKm ?? 0);
    const distDelta    = distPrevM > 0
      ? ((distThisM - distPrevM) / distPrevM * 100).toFixed(1)
      : null;

    const revThisM     = Number(revenueThisMonth._sum.totalAmount ?? 0);
    const revPrevM     = Number(revenuePrevMonth._sum.totalAmount ?? 0);
    const revDelta     = revPrevM > 0
      ? ((revThisM - revPrevM) / revPrevM * 100).toFixed(1)
      : null;

    return {
      totalTrips,
      tripsThisMonth,
      tripDelta:       tripDelta     ? Number(tripDelta)   : null,
      totalDistanceKm: Number(totalDistanceRaw._sum.distanceKm ?? 0),
      distanceThisMonth: distThisM,
      distanceDelta:   distDelta     ? Number(distDelta)   : null,
      revenueThisMonth: revThisM,
      revenueDelta:    revDelta      ? Number(revDelta)    : null,
      totalRevenue:    Number(totalRevenue._sum.totalAmount ?? 0),
      avgTripDistanceKm: Number((avgTripDistance._avg.distanceKm ?? 0)).toFixed(2),
      activeVehicles,
      totalDrivers,
    };
  });
}

// ─── Revenue Over Time ────────────────────────────────────────────────────────

export async function getRevenueSeries(
  user:   UserContext,
  from?:  string,
  to?:    string,
  period: "day" | "week" | "month" = "day"
) {
  return injectTenantContext(user, async () => {
    const { start, end } = defaultRange(from, to);

    const trunc = period === "month" ? "month"
                : period === "week"  ? "week"
                : "day";

    const rows = await prisma.$queryRaw<Array<{
      period:  Date;
      revenue: number;
      count:   number;
    }>>`
      SELECT
        DATE_TRUNC(${trunc}, "generatedAt") AS period,
        COALESCE(SUM("totalAmount"), 0)::float AS revenue,
        COUNT(*)::int                          AS count
      FROM invoices
      WHERE
        "tenantId"    = ${user.tenantId}
        AND status    = 'PAID'
        AND "generatedAt" >= ${start}
        AND "generatedAt" <= ${end}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    return rows.map((r) => ({
      period:  r.period.toISOString().slice(0, 10),
      revenue: Number(r.revenue),
      count:   Number(r.count),
    }));
  });
}

// ─── Distance Over Time ───────────────────────────────────────────────────────

export async function getDistanceSeries(
  user:   UserContext,
  from?:  string,
  to?:    string,
  period: "day" | "week" | "month" = "day"
) {
  return injectTenantContext(user, async () => {
    const { start, end } = defaultRange(from, to);

    const trunc = period === "month" ? "month"
                : period === "week"  ? "week"
                : "day";

    const rows = await prisma.$queryRaw<Array<{
      period:      Date;
      distance_km: number;
      trips:       number;
    }>>`
      SELECT
        DATE_TRUNC(${trunc}, "endTime")          AS period,
        COALESCE(SUM("distanceKm"), 0)::float    AS distance_km,
        COUNT(*)::int                           AS trips
      FROM trips
      WHERE
        "tenantId"  = ${user.tenantId}
        AND status  IN ('COMPLETED', 'FORCE_ENDED')
        AND "endTime" >= ${start}
        AND "endTime" <= ${end}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    return rows.map((r) => ({
      period:     r.period.toISOString().slice(0, 10),
      distanceKm: Number(r.distance_km),
      trips:      Number(r.trips),
    }));
  });
}

// ─── Driver Leaderboard ───────────────────────────────────────────────────────

export async function getDriverLeaderboard(
  user: UserContext,
  from?: string,
  to?:   string
) {
  return injectTenantContext(user, async () => {
    const { start, end } = defaultRange(from, to);

    const rows = await prisma.$queryRaw<Array<{
      driver_id:   string;
      driver_name: string;
      driver_email:string;
      trips:       number;
      distance_km: number;
      revenue:     number;
      avg_distance:number;
    }>>`
      SELECT
        u.id                                           AS driver_id,
        u.name                                         AS driver_name,
        u.email                                        AS driver_email,
        COUNT(DISTINCT t.id)::int                      AS trips,
        COALESCE(SUM(t."distanceKm"), 0)::float        AS distance_km,
        COALESCE(SUM(i."totalAmount"), 0)::float       AS revenue,
        COALESCE(AVG(t."distanceKm"), 0)::float        AS avg_distance
      FROM users u
      LEFT JOIN trips t
        ON  t."driverId" = u.id
        AND t."tenantId" = ${user.tenantId}
        AND t.status     IN ('COMPLETED', 'FORCE_ENDED')
        AND t."endTime"  >= ${start}
        AND t."endTime"  <= ${end}
      LEFT JOIN invoices i
        ON  i."tripId" = t.id
        AND i.status   = 'PAID'
      WHERE
        u."tenantId" = ${user.tenantId}
        AND u.role   = 'DRIVER'
        AND u."deletedAt" IS NULL
      GROUP BY u.id, u.name, u.email
      ORDER BY distance_km DESC
      LIMIT 20
    `;

    return rows.map((r, idx) => ({
      rank:       idx + 1,
      driverId:   r.driver_id,
      driverName: r.driver_name,
      email:      r.driver_email,
      trips:      Number(r.trips),
      distanceKm: Number(r.distance_km).toFixed(2),
      revenue:    Number(r.revenue).toFixed(2),
      avgDistance:Number(r.avg_distance).toFixed(2),
    }));
  });
}

// ─── Vehicle Utilization ──────────────────────────────────────────────────────

export async function getVehicleUtilization(
  user: UserContext,
  from?: string,
  to?:   string
) {
  return injectTenantContext(user, async () => {
    const { start, end } = defaultRange(from, to);

    const rows = await prisma.$queryRaw<Array<{
      vehicle_id:    string;
      license_plate: string;
      make:          string;
      model:         string;
      year:          number;
      trips:         number;
      distance_km:   number;
      revenue:       number;
      cost_per_km:   number;
      active_days:   number;
    }>>`
      SELECT
        v.id                                           AS vehicle_id,
        v."licensePlate"                               AS license_plate,
        v.make,
        v.model,
        v.year,
        COUNT(DISTINCT t.id)::int                      AS trips,
        COALESCE(SUM(t."distanceKm"), 0)::float        AS distance_km,
        COALESCE(SUM(i."totalAmount"), 0)::float       AS revenue,
        v."costPerKm"::float                           AS cost_per_km,
        COUNT(DISTINCT DATE(t."startTime"))::int       AS active_days
      FROM vehicles v
      LEFT JOIN trips t
        ON  t."vehicleId" = v.id
        AND t."tenantId"  = ${user.tenantId}
        AND t.status      IN ('COMPLETED', 'FORCE_ENDED')
        AND t."endTime"   >= ${start}
        AND t."endTime"   <= ${end}
      LEFT JOIN invoices i
        ON  i."tripId" = t.id
        AND i.status   = 'PAID'
      WHERE
        v."tenantId" = ${user.tenantId}
        AND v."deletedAt" IS NULL
      GROUP BY v.id, v."licensePlate", v.make, v.model, v.year, v."costPerKm"
      ORDER BY distance_km DESC
    `;

    return rows.map((r) => ({
      vehicleId:    r.vehicle_id,
      licensePlate: r.license_plate,
      make:         r.make,
      model:        r.model,
      year:         r.year,
      trips:        Number(r.trips),
      distanceKm:   Number(r.distance_km).toFixed(2),
      revenue:      Number(r.revenue).toFixed(2),
      costPerKm:    Number(r.cost_per_km).toFixed(2),
      activeDays:   Number(r.active_days),
      // Utilization score: revenue / (costPerKm * distanceKm) — efficiency
      efficiency:   Number(r.distance_km) > 0
        ? (Number(r.revenue) / (Number(r.cost_per_km) * Number(r.distance_km)) * 100).toFixed(1)
        : "0.0",
    }));
  });
}

// ─── Hourly Distribution ──────────────────────────────────────────────────────

export async function getTripHourDistribution(
  user: UserContext,
  from?: string,
  to?:   string
) {
  return injectTenantContext(user, async () => {
    const { start, end } = defaultRange(from, to);

    const rows = await prisma.$queryRaw<Array<{
      hour:  number;
      trips: number;
    }>>`
      SELECT
        EXTRACT(HOUR FROM "startTime")::int AS hour,
        COUNT(*)::int                      AS trips
      FROM trips
      WHERE
        "tenantId"  = ${user.tenantId}
        AND status  IN ('COMPLETED', 'FORCE_ENDED')
        AND "startTime" >= ${start}
        AND "startTime" <= ${end}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    // Fill all 24 hours
    const map = new Map(rows.map((r) => [Number(r.hour), Number(r.trips)]));
    return Array.from({ length: 24 }, (_, h) => ({
      hour:  h,
      label: `${h.toString().padStart(2, "0")}:00`,
      trips: map.get(h) ?? 0,
    }));
  });
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

export async function exportTripsCSV(
  user: UserContext,
  from?: string,
  to?:   string
): Promise<string> {
  return injectTenantContext(user, async () => {
    const { start, end } = defaultRange(from, to);

    const trips = await prisma.trip.findMany({
      where: {
        tenantId:  user.tenantId,
        status:    { in: ["COMPLETED", "FORCE_ENDED"] },
        endTime:   { gte: start, lte: end },
      },
      include: {
        vehicle: { select: { licensePlate: true, make: true, model: true } },
        invoice: { select: { totalAmount: true, status: true, currency: true } },
      },
      orderBy: { startTime: "desc" },
    });

    const header = [
      "Trip ID",
      "License Plate",
      "Vehicle",
      "Start Time",
      "End Time",
      "Duration (min)",
      "Distance (km)",
      "Status",
      "Invoice Amount",
      "Invoice Status",
      "Currency",
    ].join(",");

    const rows = trips.map((t) => {
      const durationMin = t.endTime
        ? Math.round(
            (t.endTime.getTime() - t.startTime.getTime()) / 60_000
          )
        : "";

      return [
        t.id.slice(-8).toUpperCase(),
        t.vehicle.licensePlate,
        `${t.vehicle.make} ${t.vehicle.model}`,
        t.startTime.toISOString(),
        t.endTime?.toISOString() ?? "",
        durationMin,
        t.distanceKm ? Number(t.distanceKm).toFixed(3) : "",
        t.status,
        t.invoice ? Number(t.invoice.totalAmount).toFixed(2) : "",
        t.invoice?.status ?? "",
        t.invoice?.currency ?? "",
      ]
        .map((v) => `"${v}"`)
        .join(",");
    });

    return [header, ...rows].join("\n");
  });
}
