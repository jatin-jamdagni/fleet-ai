import { fleetStore } from "./ws.store";
import type { ManagerWsMessage } from "@fleet/shared";

// ─── Send to all managers of a tenant ────────────────────────────────────────

export function broadcastToManagers(
  tenantId: string,
  message: ManagerWsMessage
) {
  const managers = fleetStore.getManagersByTenant(tenantId);
  const payload  = JSON.stringify(message);
  let   sent     = 0;

  for (const manager of managers) {
    try {
      manager.ws.send(payload);
      sent++;
    } catch (err) {
      // Connection dropped — clean up
      console.warn(`[WS] Failed to send to manager ${manager.userId}:`, err);
      fleetStore.removeManager(manager.userId);
    }
  }

  return sent;
}

// ─── Send to a specific driver ────────────────────────────────────────────────

export function sendToDriver(userId: string, message: object) {
  const driver = fleetStore.getDriver(userId);
  if (!driver) return false;

  try {
    driver.ws.send(JSON.stringify(message));
    return true;
  } catch {
    fleetStore.removeDriver(userId);
    return false;
  }
}

// ─── Broadcast current fleet snapshot to a new manager on connect ─────────────

export function sendFleetSnapshot(tenantId: string, ws: any) {
  const vehicles = fleetStore.getAllVehicleStates(tenantId);

  if (vehicles.length === 0) return;

  // Send each active vehicle as a VEHICLE_UPDATE so the map populates instantly
  for (const v of vehicles) {
    const msg: ManagerWsMessage = {
      type:    "VEHICLE_UPDATE",
      payload: {
        vehicleId:    v.vehicleId,
        lat:          v.lat,
        lng:          v.lng,
        speed:        v.speed,
        heading:      v.heading,
        driverName:   v.driverName,
        licensePlate: v.licensePlate,
        timestamp:    v.lastPingAt.toISOString(),
      },
    };
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      // ignore — connection may have dropped before snapshot completes
    }
  }

  console.log(
    `[WS] Sent fleet snapshot: ${vehicles.length} vehicles to new manager`
  );
}