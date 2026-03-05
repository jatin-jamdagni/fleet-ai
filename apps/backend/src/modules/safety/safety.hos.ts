import { prisma } from "../../db/prisma";
import { notifyManagers, createNotification } from "../notifications/notifications.service";

export const HOS_DAILY_LIMIT_MIN   = 600;  // 10 hours
export const HOS_WARNING_THRESHOLD = 0.85; // alert at 85%

// ─── Log driving time from trip end ──────────────────────────────────────────

export async function logHosDriving(
  tenantId: string,
  driverId: string,
  tripId:   string,
  drivingMin: number,
  date:     Date = new Date()
): Promise<void> {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  // Upsert daily HOS log
  await prisma.$executeRaw`
    INSERT INTO hos_logs (id, tenant_id, driver_id, trip_id, date, driving_min, on_duty_min)
    VALUES (gen_random_uuid(), ${tenantId}, ${driverId}, ${tripId}, ${day}, ${drivingMin}, ${drivingMin})
    ON CONFLICT (tenant_id, driver_id, date)
    DO UPDATE SET
      driving_min = hos_logs.driving_min + ${drivingMin},
      on_duty_min = hos_logs.on_duty_min + ${drivingMin},
      updated_at  = NOW()
  `;

  // Check if approaching or over limit
  const log = await prisma.hosLog.findUnique({
    where: {
      tenantId_driverId_date: { tenantId, driverId, date: day },
    },
  });

  if (!log) return;

  const totalMin = log.drivingMin;
  const pct      = totalMin / HOS_DAILY_LIMIT_MIN;

  if (pct >= 1.0 && totalMin - drivingMin < HOS_DAILY_LIMIT_MIN) {
    // Just hit the limit this trip
    await Promise.all([
      createNotification({
        tenantId,
        userId: driverId,
        type:   "SYSTEM",
        title:  "HOS Daily Limit Reached",
        body:   `You have reached the 10-hour daily driving limit. Please rest.`,
        data:   { drivingMin: totalMin, limitMin: HOS_DAILY_LIMIT_MIN },
      }),
      notifyManagers({
        tenantId,
        type:   "SYSTEM",
        title:  "HOS Limit Reached",
        body:   `Driver has reached the 10-hour daily driving limit.`,
        data:   { driverId, drivingMin: totalMin },
      }),
    ]).catch(() => {});

  } else if (pct >= HOS_WARNING_THRESHOLD &&
    totalMin - drivingMin < HOS_DAILY_LIMIT_MIN * HOS_WARNING_THRESHOLD) {
    // Just crossed warning threshold
    const remaining = Math.round((HOS_DAILY_LIMIT_MIN - totalMin));

    await Promise.all([
      createNotification({
        tenantId,
        userId: driverId,
        type:   "SYSTEM",
        title:  "HOS Warning",
        body:   `${remaining} minutes of driving remaining today.`,
        data:   { drivingMin: totalMin, remaining },
      }),
      notifyManagers({
        tenantId,
        type:   "SYSTEM",
        title:  "HOS Warning",
        body:   `Driver approaching daily limit — ${remaining} min remaining.`,
        data:   { driverId, drivingMin: totalMin, remaining },
      }),
    ]).catch(() => {});
  }
}

// ─── Get HOS summary for driver ──────────────────────────────────────────────

export async function getHosSummary(
  tenantId: string,
  driverId: string,
  days:     number = 7
) {
  const from = new Date();
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);

  const logs = await prisma.hosLog.findMany({
    where: {
      tenantId,
      driverId,
      date: { gte: from },
    },
    orderBy: { date: "asc" },
  });

  // Today's log
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const todayLog = logs.find((l) =>
    l.date.getTime() === today.getTime()
  );

  const todayMin     = todayLog?.drivingMin ?? 0;
  const todayPct     = Math.round((todayMin / HOS_DAILY_LIMIT_MIN) * 100);
  const remaining    = Math.max(0, HOS_DAILY_LIMIT_MIN - todayMin);

  return {
    today: {
      drivingMin:  todayMin,
      drivingHours: (todayMin / 60).toFixed(1),
      limitMin:     HOS_DAILY_LIMIT_MIN,
      limitHours:   (HOS_DAILY_LIMIT_MIN / 60).toFixed(0),
      remainingMin: remaining,
      remainingHours: (remaining / 60).toFixed(1),
      pct:          todayPct,
      status:
        todayPct >= 100 ? "OVER_LIMIT" :
        todayPct >= 85  ? "WARNING"    : "OK",
    },
    weekly: logs.map((l) => ({
      date:        l.date,
      drivingMin:  l.drivingMin,
      drivingHours: (l.drivingMin / 60).toFixed(1),
      pct:         Math.round((l.drivingMin / HOS_DAILY_LIMIT_MIN) * 100),
    })),
    totalWeeklyHours: (
      logs.reduce((a, b) => a + b.drivingMin, 0) / 60
    ).toFixed(1),
  };
}

// ─── Get HOS for all drivers (manager view) ───────────────────────────────────

export async function getAllDriversHos(tenantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const drivers = await prisma.user.findMany({
    where: { tenantId, role: "DRIVER", deletedAt: null },
    select: {
      id:    true,
      name:  true,
      email: true,
      hosLogs: {
        where:   { tenantId, date: today },
        select:  { drivingMin: true },
      },
    },
  });

  return drivers.map((d) => {
    const todayMin = d.hosLogs[0]?.drivingMin ?? 0;
    const pct      = Math.round((todayMin / HOS_DAILY_LIMIT_MIN) * 100);
    return {
      driverId:     d.id,
      driverName:   d.name,
      email:        d.email,
      todayMin,
      todayHours:   (todayMin / 60).toFixed(1),
      limitHours:   (HOS_DAILY_LIMIT_MIN / 60).toFixed(0),
      pct,
      status:
        pct >= 100 ? "OVER_LIMIT" :
        pct >= 85  ? "WARNING"    : "OK",
    };
  });
}