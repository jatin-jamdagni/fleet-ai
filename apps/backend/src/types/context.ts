import type { JwtPayload, Role } from "@fleet/shared";

export interface UserContext {
  userId: string;
  tenantId: string;
  role: Role;
  email: string;
}

// Elysia store shape — injected by auth middleware
export interface AuthStore {
  user: UserContext;
}