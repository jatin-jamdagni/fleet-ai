import { prisma } from "../../db/prisma";
import { fleetStore } from "./ws.store";
import { broadcastToManagers } from "./ws.broadcast";
import { isValidCoordinate } from "@fleet/shared";
import type { GpsPingPayload, ManagerWsMessage } from "@fleet/shared";

// ─── Process a single GPS ping from a driver ──────────────────────────────────

export async function processGpsPing(
  ping: GpsPingPayload,
  driverUserId: string
): Promise<{ ok: boolean; error?: string }> {

  // ── Validate coordinates ────────────────────────────────────────────────────
  if (!isValidCoordinate(ping.lat, ping.lng)) {
    return { ok: false, error: "Invalid coordinates" };
  }

  if (ping.speed < 0 || ping.speed > 300) {
    return { ok: false, error: "Invalid speed" };
  }

  // ── Get driver connection info ──────────────────────────────────────────────
  const driver = fleetStore.getDriver(driverUserId);
  if (!driver) {
    return { ok: false, error: "Driver not registered in store" };
  }

  // ── Verify trip still active ────────────────────────────────────────────────
  if (driver.tripId !== ping.tripId) {
    return { ok: false, error: "Trip ID mismatch" };
  }

  // ── Update in-memory vehicle state ──────────────────────────────────────────
  const existing = fleetStore.getVehicleState(driver.vehicleId);

  fleetStore.setVehicleState({
    vehicleId:    driver.vehicleId,
    tenantId:     driver.tenantId,
    tripId:       driver.tripId,
    driverId:     driver.userId,
    driverName:   driver.driverName,
    licensePlate: driver.licensePlate,
    lat:          ping.lat,
    lng:          ping.lng,
    speed:        ping.speed,
    heading:      ping.heading,
    lastPingAt:   new Date(ping.timestamp),
    pingCount:    (existing?.pingCount ?? 0) + 1,
  });

  // Update driver last ping time
  driver.lastPingAt = new Date();

  // ── Buffer ping for batch DB write ──────────────────────────────────────────
  fleetStore.addPing(ping.tripId, ping);

  // ── Broadcast to all Fleet Managers of this tenant ──────────────────────────
  const update: ManagerWsMessage = {
    type:    "VEHICLE_UPDATE",
    payload: {
      vehicleId:    driver.vehicleId,
      lat:          ping.lat,
      lng:          ping.lng,
      speed:        ping.speed,
      heading:      ping.heading,
      driverName:   driver.driverName,
      licensePlate: driver.licensePlate,
      timestamp:    ping.timestamp,
    },
  };

  const managerCount = broadcastToManagers(driver.tenantId, update);

  return { ok: true };
}

// ─── Register driver into store on trip start ─────────────────────────────────

export async function registerDriverConnection(
  ws: any,
  userId: string,
  tenantId: string,
  tripId: string
): Promise<{ ok: boolean; error?: string }> {

  // Load trip + vehicle + driver info from DB
  const trip = await prisma.trip.findFirst({
    where: {
      id:       tripId,
      driverId: userId,
      tenantId,
      status:   { in: ["ACTIVE", "PENDING"] },
    },
    include: {
      vehicle: {
        select: { id: true, licensePlate: true, make: true, model: true },
      },
      driver: {
        select: { id: true, name: true },
      },
    },
  });

  if (!trip) {
    return { ok: false, error: "Trip not found or not active" };
  }

  fleetStore.addDriver({
    ws,
    userId,
    tenantId,
    vehicleId:    trip.vehicleId,
    tripId:       trip.id,
    driverName:   trip.driver.name,
    licensePlate: trip.vehicle.licensePlate,
    connectedAt:  new Date(),
    lastPingAt:   new Date(),
  });

  return { ok: true };
}