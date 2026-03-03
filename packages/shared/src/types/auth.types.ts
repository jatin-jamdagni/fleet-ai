export const Role = {
  SUPER_ADMIN: "SUPER_ADMIN",
  FLEET_MANAGER: "FLEET_MANAGER",
  DRIVER: "DRIVER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const Plan = {
  STARTER: "STARTER",
  PROFESSIONAL: "PROFESSIONAL",
  ENTERPRISE: "ENTERPRISE",
} as const;

export type Plan = (typeof Plan)[keyof typeof Plan];

export interface JwtPayload {
  userId: string;
  tenantId: string;
  role: Role;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  tenantName: string;
  tenantSlug: string;
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    tenantId: string;
    tenantName: string;
  };
  tokens: AuthTokens;
}
