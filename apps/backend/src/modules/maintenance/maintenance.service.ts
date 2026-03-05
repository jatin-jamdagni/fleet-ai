import { prisma } from "../../db/prisma";
import { AppError } from "../../lib/errors";
import { injectTenantContext } from "../../middleware/auth.middleware";
import type { UserContext } from "../../types/context";
import { notifyManagers } from "../notifications/notifications.service";

// ─── Log a maintenance record ─────────────────────────────────────────────────

export async function logMaintenance(
  user: UserContext,
  body: {
    vehicleId:      string;
    type:           string;
    description?:   string;
    odometer:       number;
    cost?:          number;
    performedAt:    string;
    nextDueKm?:     number;
    nextDueDateAt?: string;
    notes?:         string;
  }
) {
  return injectTenantContext(user, async () => {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: body.vehicleId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!vehicle) throw new AppError("NOT_FOUND", "Vehicle not found", 404)


    const record = await prisma.maintenanceRecord.create({
      data: {
        tenantId:      user.tenantId,
        vehicleId:     body.vehicleId,
        type:          body.type,
        description:   body.description,
        odometer:      body.odometer,
        cost:          body.cost,
        performedAt:   new Date(body.performedAt),
        nextDueKm:     body.nextDueKm,
        nextDueDateAt: body.nextDueDateAt ? new Date(body.nextDueDateAt) : null,
        notes:         body.notes,
        createdById:   user.userId,
      },
      include: {
        vehicle: { select: { licensePlate: true, make: true, model: true } },
      },
    });

    // Update vehicle odometer + next maintenance due
    await prisma.vehicle.update({
      where: { id: body.vehicleId },
      data: {
        odometerKm:       body.odometer,
        maintenanceDueKm: body.nextDueKm ?? null,
      },
    });

    return record;
  });
}

// ─── Get maintenance history for a vehicle ────────────────────────────────────

export async function getMaintenanceHistory(
  user:      UserContext,
  vehicleId: string
) {
  return injectTenantContext(user, async () => {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId: user.tenantId, deletedAt: null },
      select: {
        id:               true,
        licensePlate:     true,
        make:             true,
        model:            true,
        odometerKm:       true,
        maintenanceDueKm: true,
      },
    });
    if (!vehicle) throw new AppError("NOT_FOUND", "Vehicle not found", 404);

    const records = await prisma.maintenanceRecord.findMany({
      where:   { vehicleId, tenantId: user.tenantId },
      orderBy: { performedAt: "desc" },
      include: {
        createdBy: { select: { name: true } },
      },
    });

    // Calculate if maintenance is due
    const lastRecord    = records[0];
    const overdueBySvc  = vehicle.maintenanceDueKm !== null
      ? Number(vehicle.odometerKm) >= Number(vehicle.maintenanceDueKm)
      : false;

    return {
      vehicle,
      records,
      maintenanceStatus: {
        odometerKm:       Number(vehicle.odometerKm).toFixed(0),
        nextDueKm:        vehicle.maintenanceDueKm
          ? Number(vehicle.maintenanceDueKm).toFixed(0)
          : null,
        isDue:            overdueBySvc,
        kmUntilService:   vehicle.maintenanceDueKm
          ? Math.max(0,
              Number(vehicle.maintenanceDueKm) - Number(vehicle.odometerKm)
            ).toFixed(0)
          : null,
        lastServiceAt:    lastRecord?.performedAt ?? null,
        lastServiceType:  lastRecord?.type        ?? null,
      },
    };
  });
}

// ─── Get all vehicles with maintenance status ─────────────────────────────────

export async function getFleetMaintenanceStatus(user: UserContext) {
  return injectTenantContext(user, async () => {
    const vehicles = await prisma.vehicle.findMany({
      where:   { tenantId: user.tenantId, deletedAt: null },
      include: {
        maintenanceRecords: {
          orderBy: { performedAt: "desc" },
          take:    1,
          select:  { type: true, performedAt: true, odometer: true },
        },
      },
      orderBy: { licensePlate: "asc" },
    });

    return vehicles.map((v) => {
      const last     = v.maintenanceRecords[0];
      const odometer = Number(v.odometerKm);
      const dueKm    = v.maintenanceDueKm ? Number(v.maintenanceDueKm) : null;
      const isDue    = dueKm !== null && odometer >= dueKm;
      const kmLeft   = dueKm !== null ? Math.max(0, dueKm - odometer) : null;

      return {
        vehicleId:        v.id,
        licensePlate:     v.licensePlate,
        make:             v.make,
        model:            v.model,
        odometerKm:       odometer.toFixed(0),
        maintenanceDueKm: dueKm?.toFixed(0) ?? null,
        kmUntilService:   kmLeft?.toFixed(0) ?? null,
        isDue,
        urgency:
          isDue              ? "OVERDUE" :
          kmLeft !== null && kmLeft < 500 ? "SOON"    : "OK",
        lastServiceType:  last?.type        ?? null,
        lastServiceAt:    last?.performedAt ?? null,
      };
    });
  });
}

// ─── Update odometer when trip ends ──────────────────────────────────────────

export async function updateOdometer(
  vehicleId:  string,
  distanceKm: number
): Promise<void> {
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      odometerKm: {
        increment: distanceKm,
      },
    },
  });

  // Check if maintenance now due
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: {
      tenantId:         true,
      licensePlate:     true,
      odometerKm:       true,
      maintenanceDueKm: true,
      maintenanceEveryKm: true,
    },
  });

  if (!vehicle?.maintenanceDueKm) return;

  const odometer = Number(vehicle.odometerKm);
  const dueKm    = Number(vehicle.maintenanceDueKm);
  const kmLeft   = dueKm - odometer;

  // Alert at 500 km warning
  if (kmLeft <= 500 && kmLeft > 0) {
    await notifyManagers({
      tenantId: vehicle.tenantId,
      type:     "SYSTEM",
      title:    "Maintenance Due Soon",
      body:     `${vehicle.licensePlate} — ${kmLeft.toFixed(0)} km until service`,
      data:     { vehicleId, odometer, dueKm, kmLeft },
    }).catch(() => {});
  }

  // Alert when overdue
  if (odometer >= dueKm) {
    await notifyManagers({
      tenantId: vehicle.tenantId,
      type:     "SYSTEM",
      title:    "Maintenance Overdue",
      body:     `${vehicle.licensePlate} — Service overdue by ${(odometer - dueKm).toFixed(0)} km`,
      data:     { vehicleId, odometer, dueKm },
    }).catch(() => {});
  }
}