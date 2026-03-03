// Types
export * from "./types/auth.types";
export * from "./types/vehicle.types";
export * from "./types/trip.types";
export * from "./types/invoice.types";
export * from "./types/websocket.types";
export * from "./types/ai.types";

// Utils
export * from "./utils/validators";
export * from "./utils/constants";

// Shared API envelope
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;