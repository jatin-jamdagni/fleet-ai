export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  FLEET_MANAGER = "FLEET_MANAGER",
  DRIVER = "DRIVER",
}

export enum Plan {
  STARTER = "STARTER",
  PROFESSIONAL = "PROFESSIONAL",
  ENTERPRISE = "ENTERPRISE",
}

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