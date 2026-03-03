import type { ApiResponse, ApiError, PaginationMeta } from "@fleet/shared";

export function ok<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

export function err(
  code: string,
  message: string,
  statusCode: number = 400
): ApiError {
  return {
    success: false,
    error: { code, message, statusCode },
  };
}

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}