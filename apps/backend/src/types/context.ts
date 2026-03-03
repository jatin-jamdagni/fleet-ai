import type { Role } from "@fleet/shared";

// Shape of the derived `user` object available in every protected route
export interface UserContext {
  userId: string;
  tenantId: string;
  role: Role;
  email: string;
}

// Elysia derive return type for auth middleware
export interface AuthDerived {
  user: UserContext;
}

// Query pagination params (reused across all list endpoints)
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

// Standard paginated query with optional search
export interface ListQuery extends PaginationQuery {
  search?: string;
}

// Resolve pagination with safe defaults
export function resolvePagination(query: PaginationQuery): {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
} {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}