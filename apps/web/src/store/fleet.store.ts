import { create } from "zustand";

export interface LiveVehicle {
  vehicleId:    string;
  lat:          number;
  lng:          number;
  speed:        number;
  heading:      number;
  driverName:   string;
  licensePlate: string;
  timestamp:    string;
}

interface FleetState {
  vehicles:      Map<string, LiveVehicle>;
  wsConnected:   boolean;
  lastUpdate:    Date | null;
  setVehicle:    (v: LiveVehicle) => void;
  removeVehicle: (vehicleId: string) => void;
  setConnected:  (v: boolean) => void;
  clearVehicles: () => void;
}

export const useFleetStore = create<FleetState>((set) => ({
  vehicles:    new Map(),
  wsConnected: false,
  lastUpdate:  null,

  setVehicle: (v) =>
    set((s) => {
      const next = new Map(s.vehicles);
      next.set(v.vehicleId, v);
      return { vehicles: next, lastUpdate: new Date() };
    }),

  removeVehicle: (vehicleId) =>
    set((s) => {
      const next = new Map(s.vehicles);
      next.delete(vehicleId);
      return { vehicles: next };
    }),

  setConnected:  (wsConnected)  => set({ wsConnected }),
  clearVehicles: ()             => set({ vehicles: new Map() }),
}));