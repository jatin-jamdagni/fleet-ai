import { create } from "zustand";

export interface ActiveTrip {
  id:           string;
  vehicleId:    string;
  licensePlate: string;
  make:         string;
  model:        string;
  startTime:    string;
  distanceKm:   number;
  pingCount:    number;
  lastLat:      number | null;
  lastLng:      number | null;
  speed:        number;
}

interface TripState {
  activeTrip:    ActiveTrip | null;
  isTracking:    boolean;
  setActiveTrip: (t: ActiveTrip | null) => void;
  updatePing:    (lat: number, lng: number, speed: number) => void;
  setTracking:   (v: boolean) => void;
  incrementPing: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  activeTrip:  null,
  isTracking:  false,

  setActiveTrip: (activeTrip) => set({ activeTrip }),

  updatePing: (lat, lng, speed) =>
    set((s) => ({
      activeTrip: s.activeTrip
        ? { ...s.activeTrip, lastLat: lat, lastLng: lng, speed }
        : null,
    })),

  setTracking:   (isTracking) => set({ isTracking }),

  incrementPing: () =>
    set((s) => ({
      activeTrip: s.activeTrip
        ? { ...s.activeTrip, pingCount: s.activeTrip.pingCount + 1 }
        : null,
    })),
}));