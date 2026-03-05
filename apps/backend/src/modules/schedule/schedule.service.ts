import { prisma } from "../../db/prisma";
import { AppError } from "../../lib/errors";
import { injectTenantContext } from "../../middleware/auth.middleware";
import type { UserContext } from "../../types/context";
import { createNotification } from "../notifications/notifications.service";

// ─── Create scheduled trip ────────────────────────────────────────────────────

export async function createSchedule(
  user: UserContext,
  body: {
    vehicleId:   string;
    driverId:    string;
    title:       string;
    notes?:      string;
    scheduledAt: string;
  }
) {
  if (user.role === "DRIVER") {
    throw new AppError("FORBIDDEN", "Drivers cannot create schedules", 403);
  }

  return injectTenantContext(user, async () => {
    const scheduledAt = new Date(body.scheduledAt);

    if (scheduledAt < new Date()) {
      throw new AppError("PAST_DATE", "Scheduled time must be in the future", 422);
    }

    // Verify vehicle + driver belong to tenant
    const [vehicle, driver] = await Promise.all([
      prisma.vehicle.findFirst({
        where: { id: body.vehicleId, tenantId: user.tenantId, deletedAt: null },
        select: { id: true, licensePlate: true },
      }),
      prisma.user.findFirst({
        where: { id: body.driverId, tenantId: user.tenantId, role: "DRIVER", deletedAt: null },
        select: { id: true, name: true },
      }),
    ]);

    if (!vehicle) throw new AppError("NOT_FOUND", "Vehicle not found", 404);
    if (!driver)  throw new AppError("NOT_FOUND", "Driver not found", 404);

    const schedule = await prisma.scheduledTrip.create({
      data: {
        tenantId:    user.tenantId,
        vehicleId:   body.vehicleId,
        driverId:    body.driverId,
        title:       body.title,
        notes:       body.notes,
        scheduledAt,
        createdById: user.userId,
      },
      include: {
        vehicle: { select: { licensePlate: true, make: true, model: true } },
        driver:  { select: { name: true, email: true } },
      },
    });

    // Notify driver
    await createNotification({
      tenantId: user.tenantId,
      userId:   body.driverId,
      type:     "VEHICLE_ASSIGNED",
      title:    "Trip Scheduled",
      body:     `${body.title} — ${vehicle.licensePlate} at ${scheduledAt.toLocaleString()}`,
      data:     { scheduleId: schedule.id, scheduledAt: scheduledAt.toISOString() },
    }).catch(() => {});

    return schedule;
  });
}

// ─── List schedules ───────────────────────────────────────────────────────────

export async function listSchedules(
  user:   UserContext,
  from?:  string,
  to?:    string,
  status?: string
) {
  return injectTenantContext(user, async () => {
    const where: any = { tenantId: user.tenantId };

    if (status)         where.status = status;
    if (from || to)     where.scheduledAt = {};
    if (from)           where.scheduledAt.gte = new Date(from);
    if (to)             where.scheduledAt.lte = new Date(to);

    // Drivers only see their own schedules
    if (user.role === "DRIVER") where.driverId = user.userId;

    return prisma.scheduledTrip.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      include: {
        vehicle: { select: { licensePlate: true, make: true, model: true } },
        driver:  { select: { name: true, email: true } },
      },
    });
  });
}

// ─── Update schedule status ───────────────────────────────────────────────────

export async function updateScheduleStatus(
  user:   UserContext,
  id:     string,
  status: string
) {
  if (user.role === "DRIVER") {
    throw new AppError("FORBIDDEN", "Drivers cannot update schedules", 403);
  }

  return injectTenantContext(user, async () => {
    const schedule = await prisma.scheduledTrip.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!schedule) throw new AppError("NOT_FOUND", "Schedule not found", 404);

    return prisma.scheduledTrip.update({
      where: { id },
      data:  { status: status as any },
    });
  });
}

// ─── Delete schedule ──────────────────────────────────────────────────────────

export async function deleteSchedule(user: UserContext, id: string) {
  if (user.role === "DRIVER") {
    throw new AppError("FORBIDDEN", "Drivers cannot delete schedules", 403);
  }

  return injectTenantContext(user, async () => {
    const schedule = await prisma.scheduledTrip.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!schedule) throw new AppError("NOT_FOUND", "Schedule not found", 404);

    await prisma.scheduledTrip.delete({ where: { id } });
    return { deleted: true };
  });
}

// ─── Reminder cron job (runs every minute) ────────────────────────────────────

export async function sendScheduleReminders(): Promise<void> {
  const now     = new Date();
  const in30min = new Date(now.getTime() + 30 * 60_000);
  const in31min = new Date(now.getTime() + 31 * 60_000);

  // Find schedules due in ~30 minutes that haven't been notified yet
  const upcoming = await prisma.scheduledTrip.findMany({
    where: {
      status:          "PENDING",
      scheduledAt:     { gte: in30min, lte: in31min },
      reminderSentAt:  null,
    },
    include: {
      vehicle: { select: { licensePlate: true } },
      driver:  { select: { name: true } },
    },
  });

  for (const s of upcoming) {
    await createNotification({
      tenantId: s.tenantId,
      userId:   s.driverId,
      type:     "SYSTEM",
      title:    "Trip Starting Soon",
      body:     `${s.title} starts in 30 minutes — ${s.vehicle.licensePlate}`,
      data:     { scheduleId: s.id },
    }).catch(() => {});

    await prisma.scheduledTrip.update({
      where: { id: s.id },
      data:  {
        reminderSentAt: new Date(),
        status:         "NOTIFIED",
      },
    });

    console.log(`[Scheduler] Reminder sent for schedule ${s.id} — ${s.driver.name}`);
  }
}
