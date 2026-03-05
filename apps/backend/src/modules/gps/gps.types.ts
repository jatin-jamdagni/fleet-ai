import type { GpsPingPayload } from "@fleet/shared";
import type { LiveVehicleState } from "../websocket/ws.store";

export type GpsPing = GpsPingPayload;

export interface LivePosition {
  vehicleId: string;
  tripId: string;
  driverId: string;
  driverName: string;
  licensePlate: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
}

export interface TripRoutePoint {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
}

export interface TripRouteGeoJson {
  type: "Feature";
  geometry: {
    type: "LineString";
    coordinates: number[][];
  };
  properties: {
    tripId: string;
    pingCount: number;
    startTime: string | null;
    endTime: string | null;
  };
}

export function toLivePosition(state: LiveVehicleState): LivePosition {
  return {
    vehicleId: state.vehicleId,
    tripId: state.tripId,
    driverId: state.driverId,
    driverName: state.driverName,
    licensePlate: state.licensePlate,
    lat: state.lat,
    lng: state.lng,
    speed: state.speed,
    heading: state.heading,
    timestamp: state.lastPingAt.toISOString(),
  };
}
