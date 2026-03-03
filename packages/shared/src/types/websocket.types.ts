// ─── Driver → Backend ───────────────────────────────────────────────────────
export type DriverWsMessage =
  | { type: "GPS_PING"; payload: GpsPingPayload }
  | { type: "PING" };

export interface GpsPingPayload {
  tripId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
}

// ─── Backend → Fleet Manager ─────────────────────────────────────────────────
export type ManagerWsMessage =
  | { type: "VEHICLE_UPDATE"; payload: VehicleUpdatePayload }
  | { type: "TRIP_STARTED"; payload: TripEventPayload }
  | { type: "TRIP_ENDED"; payload: TripEventPayload }
  | { type: "INVOICE_GENERATED"; payload: InvoiceEventPayload }
  | { type: "SAFETY_ALERT"; payload: SafetyAlertPayload }
  | { type: "PONG" };

export interface VehicleUpdatePayload {
  vehicleId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  driverName: string;
  licensePlate: string;
  timestamp: string;
}

export interface TripEventPayload {
  tripId: string;
  vehicleId: string;
  driverName: string;
  licensePlate: string;
  timestamp: string;
}

export interface InvoiceEventPayload {
  invoiceId: string;
  tripId: string;
  totalAmount: number;
  distanceKm: number;
  currency: string;
}

export interface SafetyAlertPayload {
  tripId: string;
  vehicleId: string;
  driverName: string;
  lat: number;
  lng: number;
  transcriptSnippet: string;
  timestamp: string;
}