export enum VehicleStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  IN_TRIP = "IN_TRIP",
}

export interface Vehicle {
  id: string;
  tenantId: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  costPerKm: number;
  speedLimitKmh?: number | null;
  status: VehicleStatus;
  assignedDriverId: string | null;
  hasManual: boolean;
  createdAt: string;
  deletedAt: string | null;
}

export interface CreateVehicleRequest {
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  costPerKm: number;
  speedLimitKmh?: number;
}

export interface UpdateVehicleRequest {
  licensePlate?: string;
  make?: string;
  model?: string;
  year?: number;
  costPerKm?: number;
  status?: VehicleStatus;
  speedLimitKmh?: number;
}

export interface AssignDriverRequest {
  driverId: string | null;
}
