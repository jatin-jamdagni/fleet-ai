export enum InvoiceStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  VOID = "VOID",
}

export interface Invoice {
  id: string;
  tenantId: string;
  tripId: string;
  vehicleId: string;
  driverId: string;
  distanceKm: number;
  costPerKm: number;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  generatedAt: string;
  paidAt: string | null;
}

export interface UpdateInvoiceStatusRequest {
  status: InvoiceStatus.PAID | InvoiceStatus.VOID;
}