import { fleetStore } from "../websocket/ws.store";
import { toLivePosition, type LivePosition } from "./gps.types";

export function getLivePositionsForTenant(tenantId: string): LivePosition[] {
  return fleetStore.getAllVehicleStates(tenantId).map(toLivePosition);
}

export function getLivePositionForVehicle(
  tenantId: string,
  vehicleId: string
): LivePosition | null {
  const state = fleetStore.getVehicleState(vehicleId);
  if (!state || state.tenantId !== tenantId) return null;
  return toLivePosition(state);
}

export { fleetStore };
