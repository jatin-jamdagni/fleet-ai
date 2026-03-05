import type {
  VehicleUpdatePayload,
  GpsPingPayload,
  ManagerWsMessage,
} from "@fleet/shared";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LiveVehicleState {
  vehicleId:    string;
  tenantId:     string;
  tripId:       string;
  driverId:     string;
  driverName:   string;
  licensePlate: string;
  lat:          number;
  lng:          number;
  speed:        number;
  heading:      number;
  lastPingAt:   Date;
  pingCount:    number;
}

export interface ConnectedDriver {
  ws:           any; // WebSocket instance
  userId:       string;
  tenantId:     string;
  vehicleId:    string;
  tripId:       string;
  driverName:   string;
  licensePlate: string;
  connectedAt:  Date;
  lastPingAt:   Date;
}

export interface ConnectedManager {
  ws:          any; // WebSocket instance
  userId:      string;
  tenantId:    string;
  connectedAt: Date;
  lastPongAt:  Date;
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────

class FleetStore {
  // vehicleId → latest state
  private vehicles = new Map<string, LiveVehicleState>();

  // userId → driver connection
  private drivers = new Map<string, ConnectedDriver>();

  // userId → manager connection
  private managers = new Map<string, ConnectedManager>();

  // tripId → pending GPS pings (batched before DB write)
  private pendingPings = new Map<string, GpsPingPayload[]>();

  // ── Vehicle State ───────────────────────────────────────────────────────────

  setVehicleState(state: LiveVehicleState) {
    this.vehicles.set(state.vehicleId, state);
  }

  getVehicleState(vehicleId: string): LiveVehicleState | undefined {
    return this.vehicles.get(vehicleId);
  }

  removeVehicleState(vehicleId: string) {
    this.vehicles.delete(vehicleId);
  }

  getAllVehicleStates(tenantId: string): LiveVehicleState[] {
    return Array.from(this.vehicles.values()).filter(
      (v) => v.tenantId === tenantId
    );
  }

  // ── Driver Connections ──────────────────────────────────────────────────────

  addDriver(driver: ConnectedDriver) {
    this.drivers.set(driver.userId, driver);
    console.log(
      `[WS] Driver connected: ${driver.driverName} | Vehicle: ${driver.licensePlate} | Tenant: ${driver.tenantId}`
    );
  }

  removeDriver(userId: string): ConnectedDriver | undefined {
    const driver = this.drivers.get(userId);
    this.drivers.delete(userId);
    return driver;
  }

  getDriver(userId: string): ConnectedDriver | undefined {
    return this.drivers.get(userId);
  }

  getDriverByVehicle(vehicleId: string): ConnectedDriver | undefined {
    return Array.from(this.drivers.values()).find(
      (d) => d.vehicleId === vehicleId
    );
  }

  getActiveDriverCount(tenantId: string): number {
    return Array.from(this.drivers.values()).filter(
      (d) => d.tenantId === tenantId
    ).length;
  }

  // ── Manager Connections ─────────────────────────────────────────────────────

  addManager(manager: ConnectedManager) {
    this.managers.set(manager.userId, manager);
    console.log(
      `[WS] Manager connected: ${manager.userId} | Tenant: ${manager.tenantId}`
    );
  }

  removeManager(userId: string) {
    this.managers.delete(userId);
  }

  getManager(userId: string): ConnectedManager | undefined {
    return this.managers.get(userId);
  }

  getManagersByTenant(tenantId: string): ConnectedManager[] {
    return Array.from(this.managers.values()).filter(
      (m) => m.tenantId === tenantId
    );
  }

  sendToUser(userId: string, message: object): boolean {
    const manager = this.managers.get(userId);
    if (manager?.ws?.readyState === 1) {
      manager.ws.send(JSON.stringify(message));
      return true;
    }

    const driver = this.drivers.get(userId);
    if (driver?.ws?.readyState === 1) {
      driver.ws.send(JSON.stringify(message));
      return true;
    }

    return false;
  }

  // ── Pending GPS Pings (batch buffer) ────────────────────────────────────────

  addPing(tripId: string, ping: GpsPingPayload) {
    const existing = this.pendingPings.get(tripId) ?? [];
    existing.push(ping);
    this.pendingPings.set(tripId, existing);
  }

  flushPings(tripId: string): GpsPingPayload[] {
    const pings = this.pendingPings.get(tripId) ?? [];
    this.pendingPings.delete(tripId);
    return pings;
  }

  flushAllPings(): Map<string, GpsPingPayload[]> {
    const all = new Map(this.pendingPings);
    this.pendingPings.clear();
    return all;
  }

  getPendingPingCount(tripId: string): number {
    return (this.pendingPings.get(tripId) ?? []).length;
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  getStats() {
    return {
      connectedDrivers:  this.drivers.size,
      connectedManagers: this.managers.size,
      activeVehicles:    this.vehicles.size,
      pendingPingTrips:  this.pendingPings.size,
    };
  }
}

// Singleton — shared across all WebSocket connections
export const fleetStore = new FleetStore();
