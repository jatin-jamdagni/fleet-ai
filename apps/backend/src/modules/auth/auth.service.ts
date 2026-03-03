import { prisma } from "../../db/prisma";
import { Errors, AppError } from "../../lib/errors";
import { Role, Plan, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } from "@fleet/shared";
import type { LoginResponse } from "@fleet/shared";

// ─── Types ───────────────────────────────────────────────────────────────────

type JwtClaimValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JwtClaimValue[]
  | { [key: string]: JwtClaimValue };

type JwtSignPayload = {
  [key: string]: JwtClaimValue;
  nbf?: string | number;
  exp?: string | number;
  iat?: boolean;
  iss?: string;
  sub?: string;
  aud?: string | string[];
  jti?: string;
};

interface JwtSigner {
  sign: (payload: JwtSignPayload) => Promise<string>;
  verify: (token?: string) => Promise<Record<string, unknown> | false>;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─── Token Helpers ───────────────────────────────────────────────────────────

export async function signTokenPair(
  payload: { userId: string; tenantId: string; role: Role; email: string },
  accessJwt: JwtSigner,
  refreshJwt: JwtSigner
): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    accessJwt.sign({ ...payload, type: "access" }),
    refreshJwt.sign({ ...payload, type: "refresh" }),
  ]);

  // Store hashed refresh token
  const tokenHash = await Bun.password.hash(refreshToken, {
    algorithm: "bcrypt",
    cost: 10,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: {
      userId: payload.userId,
      tokenHash,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

// ─── Register ────────────────────────────────────────────────────────────────

export async function register(
  input: {
    tenantName: string;
    tenantSlug: string;
    name: string;
    email: string;
    password: string;
  },
  accessJwt: JwtSigner,
  refreshJwt: JwtSigner
): Promise<LoginResponse> {
  // Check slug availability
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: input.tenantSlug },
  });
  if (existingTenant) throw Errors.TENANT_SLUG_TAKEN;

  // Check email availability
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existingUser) throw Errors.EMAIL_TAKEN;

  // Hash password
  const passwordHash = await Bun.password.hash(input.password, {
    algorithm: "bcrypt",
    cost: 12,
  });

  // Create tenant + fleet manager atomically
  const [tenant, user] = await prisma.$transaction(async (tx) => {
    const newTenant = await tx.tenant.create({
      data: {
        name: input.tenantName,
        slug: input.tenantSlug,
        plan: Plan.STARTER,
      },
    });

    const newUser = await tx.user.create({
      data: {
        tenantId: newTenant.id,
        email: input.email,
        passwordHash,
        name: input.name,
        role: Role.FLEET_MANAGER,
      },
    });

    return [newTenant, newUser];
  });

  const tokens = await signTokenPair(
    { userId: user.id, tenantId: tenant.id, role: user.role, email: user.email },
    accessJwt,
    refreshJwt
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: tenant.id,
      tenantName: tenant.name,
    },
    tokens,
  };
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function login(
  input: { email: string; password: string },
  accessJwt: JwtSigner,
  refreshJwt: JwtSigner
): Promise<LoginResponse> {
  // Find user (include tenant)
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { tenant: true },
  });

  // Always verify password even if user not found (prevent timing attacks)
  const dummyHash = "$2b$12$dummy.hash.to.prevent.timing.attacks.padding";
  const passwordValid = user
    ? await Bun.password.verify(input.password, user.passwordHash)
    : await Bun.password.verify(input.password, dummyHash).catch(() => false);

  if (!user || !passwordValid || user.deletedAt) {
    throw Errors.INVALID_CREDENTIALS;
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = await signTokenPair(
    { userId: user.id, tenantId: user.tenantId, role: user.role, email: user.email },
    accessJwt,
    refreshJwt
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
    },
    tokens,
  };
}

// ─── Refresh Token ───────────────────────────────────────────────────────────

export async function refreshTokens(
  rawRefreshToken: string,
  accessJwt: JwtSigner,
  refreshJwt: JwtSigner
): Promise<{ accessToken: string; refreshToken: string }> {
  // Verify JWT signature
  const payload = await refreshJwt.verify(rawRefreshToken);
  if (!payload || payload.type !== "refresh") {
    throw Errors.TOKEN_INVALID;
  }

  const userId = payload.userId as string;

  // Find all valid refresh tokens for user and check against hash
  const storedTokens = await prisma.refreshToken.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  let matchedToken = null;
  for (const stored of storedTokens) {
    const matches = await Bun.password.verify(rawRefreshToken, stored.tokenHash);
    if (matches) {
      matchedToken = stored;
      break;
    }
  }

  if (!matchedToken) throw Errors.TOKEN_INVALID;

  // Revoke old token (rotation)
  await prisma.refreshToken.update({
    where: { id: matchedToken.id },
    data: { revokedAt: new Date() },
  });

  // Get fresh user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tenant: true },
  });

  if (!user || user.deletedAt) throw Errors.UNAUTHORIZED;

  return signTokenPair(
    { userId: user.id, tenantId: user.tenantId, role: user.role, email: user.email },
    accessJwt,
    refreshJwt
  );
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logout(userId: string): Promise<void> {
  // Revoke ALL refresh tokens for this user
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ─── Get Me ──────────────────────────────────────────────────────────────────

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tenant: true },
    omit: { passwordHash: true },
  });

  if (!user || user.deletedAt) throw Errors.USER_NOT_FOUND;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    tenantName: user.tenant.name,
    tenantPlan: user.tenant.plan,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}
