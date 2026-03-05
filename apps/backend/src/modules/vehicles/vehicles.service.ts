import { prisma } from "../../db/prisma";
import { Errors } from "../../lib/errors";
import { paginate } from "../../lib/response";
import { injectTenantContext } from "../../middleware/auth.middleware";
import type { UserContext } from "../../types/context";
import type { VehicleStatus } from "@fleet/shared";
import { Role } from "@fleet/shared";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateVehicleInput {
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  costPerKm: number;
}

export interface UpdateVehicleInput {
  licensePlate?: string;
  make?: string;
  model?: string;
  year?: number;
  costPerKm?: number;
  status?: "ACTIVE" | "INACTIVE";
}

export interface ListVehiclesInput {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: VehicleStatus;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function vehicleSelect() {
  return {
    id: true,
    tenantId: true,
    licensePlate: true,
    make: true,
    model: true,
    year: true,
    costPerKm: true,
    status: true,
    hasManual: true,
    assignedDriverId: true,
    assignedDriver: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    createdAt: true,
    updatedAt: true,
  };
}

// ─── List Vehicles ────────────────────────────────────────────────────────────

export async function listVehicles(user: UserContext, input: ListVehiclesInput) {
  return injectTenantContext(user, async () => {
    const page     = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, input.pageSize ?? 20);
    const skip     = (page - 1) * pageSize;

    const where: any = {
      tenantId:  user.tenantId,
      deletedAt: null,
    };

    if (input.status) {
      where.status = input.status;
    }

    if (input.search) {
      where.OR = [
        { licensePlate: { contains: input.search, mode: "insensitive" } },
        { make:         { contains: input.search, mode: "insensitive" } },
        { model:        { contains: input.search, mode: "insensitive" } },
      ];
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        select: vehicleSelect(),
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.vehicle.count({ where }),
    ]);

    return paginate(vehicles, total, page, pageSize);
  });
}

// ─── Driver Assigned Vehicle ─────────────────────────────────────────────────

export async function getMyAssignedVehicle(user: UserContext) {
  return injectTenantContext(user, async () => {
    return prisma.vehicle.findFirst({
      where: {
        tenantId: user.tenantId,
        assignedDriverId: user.userId,
        deletedAt: null,
      },
      select: vehicleSelect(),
    });
  });
}

// ─── Get Single Vehicle ───────────────────────────────────────────────────────

export async function getVehicle(user: UserContext, vehicleId: string) {
  return injectTenantContext(user, async () => {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id:        vehicleId,
        tenantId:  user.tenantId,
        deletedAt: null,
      },
      select: {
        ...vehicleSelect(),
        trips: {
          where:   { status: { in: ["ACTIVE", "PENDING"] } },
          select:  { id: true, status: true, startTime: true },
          take:    1,
          orderBy: { startTime: "desc" },
        },
        _count: {
          select: { trips: true, manualChunks: true },
        },
      },
    });

    if (!vehicle) throw Errors.NOT_FOUND("Vehicle");
    return vehicle;
  });
}

// ─── Create Vehicle ───────────────────────────────────────────────────────────

export async function createVehicle(user: UserContext, input: CreateVehicleInput) {
  return injectTenantContext(user, async () => {
    // Check license plate uniqueness within tenant
    const existing = await prisma.vehicle.findFirst({
      where: {
        licensePlate: { equals: input.licensePlate, mode: "insensitive" },
        tenantId:     user.tenantId,
        deletedAt:    null,
      },
    });

    if (existing) {
      throw Errors.VALIDATION(`License plate "${input.licensePlate}" already exists in your fleet`);
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        tenantId:     user.tenantId,
        licensePlate: input.licensePlate.toUpperCase(),
        make:         input.make,
        model:        input.model,
        year:         input.year,
        costPerKm:    input.costPerKm,
      },
      select: vehicleSelect(),
    });

    return vehicle;
  });
}

// ─── Update Vehicle ───────────────────────────────────────────────────────────

export async function updateVehicle(
  user: UserContext,
  vehicleId: string,
  input: UpdateVehicleInput
) {
  return injectTenantContext(user, async () => {
    // Verify ownership
    const existing = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw Errors.NOT_FOUND("Vehicle");

    // Can't manually set IN_TRIP — that's system-managed
    if ((input as any).status === "IN_TRIP") {
      throw Errors.VALIDATION("Cannot manually set status to IN_TRIP");
    }

    // Can't update a vehicle that's currently on a trip
    if (existing.status === "IN_TRIP") {
      throw Errors.VALIDATION("Cannot update a vehicle that is currently on an active trip");
    }

    // Check new license plate uniqueness
    if (input.licensePlate && input.licensePlate !== existing.licensePlate) {
      const duplicate = await prisma.vehicle.findFirst({
        where: {
          licensePlate: { equals: input.licensePlate, mode: "insensitive" },
          tenantId:     user.tenantId,
          deletedAt:    null,
          id:           { not: vehicleId },
        },
      });
      if (duplicate) {
        throw Errors.VALIDATION(`License plate "${input.licensePlate}" already exists`);
      }
    }

    const updated = await prisma.vehicle.update({
      where:  { id: vehicleId },
      data:   {
        ...input,
        licensePlate: input.licensePlate?.toUpperCase(),
        updatedAt:    new Date(),
      },
      select: vehicleSelect(),
    });

    return updated;
  });
}

// ─── Delete Vehicle (Soft) ────────────────────────────────────────────────────

export async function deleteVehicle(user: UserContext, vehicleId: string) {
  return injectTenantContext(user, async () => {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!vehicle) throw Errors.NOT_FOUND("Vehicle");

    if (vehicle.status === "IN_TRIP") {
      throw Errors.VALIDATION("Cannot delete a vehicle with an active trip. End the trip first.");
    }

    // Soft delete — preserve all historical trips + invoices
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        deletedAt:       new Date(),
        status:          "INACTIVE",
        assignedDriverId: null,
      },
    });

    return { deleted: true, vehicleId };
  });
}

// ─── Assign / Unassign Driver ─────────────────────────────────────────────────

export async function assignDriver(
  user: UserContext,
  vehicleId: string,
  driverId: string | null
) {
  return injectTenantContext(user, async () => {
    // Verify vehicle exists and belongs to tenant
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!vehicle) throw Errors.NOT_FOUND("Vehicle");

    if (vehicle.status === "IN_TRIP") {
      throw Errors.VALIDATION("Cannot reassign driver while vehicle is on an active trip");
    }

    // Unassign
    if (driverId === null) {
      const updated = await prisma.vehicle.update({
        where:  { id: vehicleId },
        data:   { assignedDriverId: null },
        select: vehicleSelect(),
      });
      return updated;
    }

    // Verify driver exists, belongs to this tenant, and has DRIVER role
    const driver = await prisma.user.findFirst({
      where: {
        id:        driverId,
        tenantId:  user.tenantId,
        role:      Role.DRIVER,
        deletedAt: null,
      },
    });
    if (!driver) throw Errors.NOT_FOUND("Driver");

    // Check driver isn't already assigned to another vehicle
    const alreadyAssigned = await prisma.vehicle.findFirst({
      where: {
        assignedDriverId: driverId,
        tenantId:         user.tenantId,
        deletedAt:        null,
        id:               { not: vehicleId },
      },
    });
    if (alreadyAssigned) {
      throw Errors.VALIDATION(
        `Driver "${driver.name}" is already assigned to vehicle ${alreadyAssigned.licensePlate}`
      );
    }

    const updated = await prisma.vehicle.update({
      where:  { id: vehicleId },
      data:   { assignedDriverId: driverId },
      select: vehicleSelect(),
    });

    return updated;
  });
}

// ─── Get Vehicle Stats (for analytics later) ──────────────────────────────────

export async function getFleetStats(user: UserContext) {
  return injectTenantContext(user, async () => {
    const [total, active, inTrip, inactive] = await Promise.all([
      prisma.vehicle.count({
        where: { tenantId: user.tenantId, deletedAt: null },
      }),
      prisma.vehicle.count({
        where: { tenantId: user.tenantId, deletedAt: null, status: "ACTIVE" },
      }),
      prisma.vehicle.count({
        where: { tenantId: user.tenantId, deletedAt: null, status: "IN_TRIP" },
      }),
      prisma.vehicle.count({
        where: { tenantId: user.tenantId, deletedAt: null, status: "INACTIVE" },
      }),
    ]);

    return { total, active, inTrip, inactive };
  });
}
