export enum TripStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  FORCE_ENDED = "FORCE_ENDED",
}

export interface Trip {
  id: string;
  tenantId: string;
  vehicleId: string;
  driverId: string;
  status: TripStatus;
  startTime: string;
  endTime: string | null;
  distanceKm: number | null;
  createdAt: string;
}

export interface StartTripRequest {
  vehicleId: string;
}

export interface TripWithRelations extends Trip {
  vehicle: {
    licensePlate: string;
    make: string;
    model: string;
  };
  driver: {
    name: string;
    email: string;
  };
}