 
// ─── Score weights ────────────────────────────────────────────────────────────
//
// Speed component    (40 pts): penalised by speeding events
// HOS component      (30 pts): penalised when daily limit approached/exceeded
// Consistency        (30 pts): penalised by low avg speed variance, idle trips
//
// Total score: 0–100. Higher = safer driver.

import { prisma } from "../../db/prisma";

interface ScoreInput {
  totalTrips:      number;
  totalDistanceKm: number;
  avgSpeedKmh:     number;
  maxSpeedKmh:     number;
  speedingEvents:  number;
  hoursOnRoad:     number;
  hosLimitHours:   number;
}

export function calculateScore(input: ScoreInput): {
  score:     number;
  breakdown: Record<string, number>;
} {
  // ── Speed component (40 pts) ─────────────────────────────────────────────
  let speedScore = 40;

  // Deduct 4 pts per speeding event (up to 40)
  speedScore -= Math.min(40, input.speedingEvents * 4);

  // Deduct if max speed extremely high (> 150 km/h)
  if (input.maxSpeedKmh > 150) speedScore -= 10;
  else if (input.maxSpeedKmh > 120) speedScore -= 5;

  speedScore = Math.max(0, speedScore);

  // ── HOS component (30 pts) ───────────────────────────────────────────────
  let hosScore = 30;

  const hosPct = input.hosLimitHours > 0
    ? input.hoursOnRoad / input.hosLimitHours
    : 0;

  if (hosPct >= 1.0)      hosScore -= 30; // Over limit
  else if (hosPct >= 0.9) hosScore -= 15; // 90–100% of limit
  else if (hosPct >= 0.8) hosScore -= 5;  // 80–90% of limit

  hosScore = Math.max(0, hosScore);

  // ── Consistency component (30 pts) ───────────────────────────────────────
  let consistencyScore = 30;

  // Deduct if very few trips (< 3) — not enough data to rate
  if (input.totalTrips < 3)      consistencyScore -= 10;

  // Deduct if avg trip is suspiciously short (< 5 km)
  const avgDist = input.totalTrips > 0
    ? input.totalDistanceKm / input.totalTrips
    : 0;
  if (avgDist < 5 && input.totalTrips > 2) consistencyScore -= 5;

  consistencyScore = Math.max(0, consistencyScore);

  const score = Math.round(speedScore + hosScore + consistencyScore);

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown: {
      speed:       speedScore,
      hos:         hosScore,
      consistency: consistencyScore,
    },
  };
}

// ─── Compute + upsert daily score for a driver ────────────────────────────────

export async function computeDriverScore(
  tenantId: string,
  driverId: string,
  date:     Date = new Date()
): Promise<void> {
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Fetch trips for this driver today
  const trips = await prisma.trip.findMany({
    where: {
      tenantId,
      driverId,
      status:   { in: ["COMPLETED", "FORCE_ENDED"] },
      endTime:  { gte: today, lt: tomorrow },
    },
    select: {
      id:            true,
      distanceKm:    true,
      startTime:     true,
      endTime:       true,
      speedingEvents: {
        select: { id: true },
      },
    },
  });

  if (trips.length === 0) return;

  // Aggregate
  let totalDistanceKm = 0;
  let totalDrivingMin = 0;
  let speedingCount   = 0;

  for (const t of trips) {
    totalDistanceKm += Number(t.distanceKm ?? 0);
    speedingCount   += t.speedingEvents.length;

    if (t.endTime) {
      totalDrivingMin += Math.round(
        (t.endTime.getTime() - t.startTime.getTime()) / 60_000
      );
    }
  }

  const hoursOnRoad    = totalDrivingMin / 60;
  const hosLimitHours  = 10; // 10-hour daily driving limit

  // Fetch avg / max speed from GPS pings
  const speedAgg = await prisma.$queryRaw<Array<{
    avg_speed: number;
    max_speed: number;
  }>>`
    SELECT
      COALESCE(AVG(speed_kmh), 0)::float AS avg_speed,
      COALESCE(MAX(speed_kmh), 0)::float AS max_speed
    FROM gps_pings
    WHERE tenant_id = ${tenantId}
      AND driver_id = ${driverId}
      AND recorded_at >= ${today}
      AND recorded_at <  ${tomorrow}
      AND speed_kmh   IS NOT NULL
  `;

  const avgSpeedKmh = Number(speedAgg[0]?.avg_speed ?? 0);
  const maxSpeedKmh = Number(speedAgg[0]?.max_speed ?? 0);

  const { score, breakdown } = calculateScore({
    totalTrips:      trips.length,
    totalDistanceKm,
    avgSpeedKmh,
    maxSpeedKmh,
    speedingEvents:  speedingCount,
    hoursOnRoad,
    hosLimitHours,
  });

  // Upsert score
  await prisma.driverScore.upsert({
    where: {
      tenantId_driverId_date: {
        tenantId,
        driverId,
        date: today,
      },
    },
    create: {
      tenantId,
      driverId,
      date:            today,
      totalTrips:      trips.length,
      totalDistanceKm,
      avgSpeedKmh,
      maxSpeedKmh,
      speedingEvents:  speedingCount,
      hoursOnRoad,
      score,
      scoreBreakdown:  breakdown,
    },
    update: {
      totalTrips:      trips.length,
      totalDistanceKm,
      avgSpeedKmh,
      maxSpeedKmh,
      speedingEvents:  speedingCount,
      hoursOnRoad,
      score,
      scoreBreakdown:  breakdown,
    },
  });
}

// ─── Get driver score summary ─────────────────────────────────────────────────

export async function getDriverScoreSummary(
  tenantId: string,
  driverId: string,
  days:     number = 30
) {
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);

  const scores = await prisma.driverScore.findMany({
    where: {
      tenantId,
      driverId,
      date: { gte: from },
    },
    orderBy: { date: "asc" },
  });

  if (scores.length === 0) {
    return {
      currentScore:     null,
      avgScore:         null,
      trend:            null,
      scores:           [],
      totalTrips:       0,
      totalDistanceKm:  0,
      totalSpeedingEvents: 0,
      totalHoursOnRoad: 0,
    };
  }

  const latest    = scores[scores.length - 1];
  const avgScore  = Math.round(
    scores.reduce((a, b) => a + b.score, 0) / scores.length
  );

  // Trend: compare last 7 days avg vs prior 7 days avg
  const last7     = scores.slice(-7);
  const prior7    = scores.slice(-14, -7);
  const last7Avg  = last7.length
    ? last7.reduce((a, b) => a + b.score, 0) / last7.length
    : 0;
  const prior7Avg = prior7.length
    ? prior7.reduce((a, b) => a + b.score, 0) / prior7.length
    : null;

  const trend = prior7Avg !== null
    ? Number((last7Avg - prior7Avg).toFixed(1))
    : null;

  return {
    currentScore:       Math.round(latest?.score ?? 0),
    avgScore,
    trend,
    scores:             scores.map((s) => ({
      date:            s.date,
      score:           Math.round(s.score),
      trips:           s.totalTrips,
      distanceKm:      Number(s.totalDistanceKm).toFixed(1),
      speedingEvents:  s.speedingEvents,
      hoursOnRoad:     Number(s.hoursOnRoad).toFixed(1),
      breakdown:       s.scoreBreakdown,
    })),
    totalTrips:          scores.reduce((a, b) => a + b.totalTrips, 0),
    totalDistanceKm:     scores.reduce((a, b) => a + Number(b.totalDistanceKm), 0).toFixed(1),
    totalSpeedingEvents: scores.reduce((a, b) => a + b.speedingEvents, 0),
    totalHoursOnRoad:    scores.reduce((a, b) => a + Number(b.hoursOnRoad), 0).toFixed(1),
  };
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export async function getDriverLeaderboard(
  tenantId: string,
  days:     number = 30
) {
  const from = new Date();
  from.setDate(from.getDate() - days);

  const rows = await prisma.$queryRaw<Array<{
    driver_id:       string;
    driver_name:     string;
    driver_email:    string;
    avg_score:       number;
    total_trips:     number;
    total_distance:  number;
    total_speeding:  number;
    total_hours:     number;
  }>>`
    SELECT
      u.id                                       AS driver_id,
      u.name                                     AS driver_name,
      u.email                                    AS driver_email,
      COALESCE(AVG(ds.score), 0)::float          AS avg_score,
      COALESCE(SUM(ds.total_trips), 0)::int      AS total_trips,
      COALESCE(SUM(ds.total_distance_km), 0)::float AS total_distance,
      COALESCE(SUM(ds.speeding_events), 0)::int  AS total_speeding,
      COALESCE(SUM(ds.hours_on_road), 0)::float  AS total_hours
    FROM users u
    LEFT JOIN driver_scores ds
      ON  ds.driver_id  = u.id
      AND ds.tenant_id  = ${tenantId}
      AND ds.date      >= ${from}
    WHERE
      u.tenant_id  = ${tenantId}
      AND u.role   = 'DRIVER'
      AND u.deleted_at IS NULL
    GROUP BY u.id, u.name, u.email
    ORDER BY avg_score DESC
  `;

  return rows.map((r, i) => ({
    rank:           i + 1,
    driverId:       r.driver_id,
    driverName:     r.driver_name,
    email:          r.driver_email,
    avgScore:       Math.round(Number(r.avg_score)),
    totalTrips:     Number(r.total_trips),
    totalDistance:  Number(r.total_distance).toFixed(1),
    totalSpeeding:  Number(r.total_speeding),
    totalHours:     Number(r.total_hours).toFixed(1),
    grade:          scoreGrade(Number(r.avg_score)),
  }));
}

function scoreGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}