import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { prisma } from "../../../db/prisma";

// ─── Test helpers ─────────────────────────────────────────────────────────────

const BASE = "http://localhost:3000/api/v1";
let requestSeq = 0;

function nextTestIp() {
  requestSeq += 1;
  return `test-ip-${Date.now()}-${requestSeq}`;
}

async function parseBody(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function post(path: string, body: unknown, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": nextTestIp(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await parseBody(res) };
}

async function get(path: string, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "x-forwarded-for": nextTestIp(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return { status: res.status, body: await parseBody(res) };
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

const TEST_SLUG = "test-auth-tenant";
const TEST_EMAIL = "test.auth@fleet.test";
const LEGACY_ISOLATION_SLUG = "tenant-b-isolation";
const LEGACY_ISOLATION_EMAIL = "manager@tenant-b.fleet";

async function cleanup() {
  const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (user) {
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  await prisma.tenant.deleteMany({ where: { slug: TEST_SLUG } });

  const legacyUser = await prisma.user.findUnique({
    where: { email: LEGACY_ISOLATION_EMAIL },
  });
  if (legacyUser) {
    await prisma.refreshToken.deleteMany({ where: { userId: legacyUser.id } });
    await prisma.user.delete({ where: { id: legacyUser.id } });
  }
  await prisma.tenant.deleteMany({ where: { slug: LEGACY_ISOLATION_SLUG } });
}

beforeAll(cleanup);
afterAll(cleanup);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Auth — Register", () => {
  it("should register a new tenant and fleet manager", async () => {
    const { status, body } = await post("/auth/register", {
      tenantName: "Test Auth Tenant",
      tenantSlug: TEST_SLUG,
      name: "Test Manager",
      email: TEST_EMAIL,
      password: "TestPass123!",
    });

    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe(TEST_EMAIL);
    expect(body.data.user.role).toBe("FLEET_MANAGER");
    expect(body.data.tokens.accessToken).toBeTruthy();
    expect(body.data.tokens.refreshToken).toBeTruthy();
    // Password must NOT be in response
    expect(body.data.user.passwordHash).toBeUndefined();
  });

  it("should reject duplicate tenant slug", async () => {
    const { status, body } = await post("/auth/register", {
      tenantName: "Duplicate Slug Test",
      tenantSlug: TEST_SLUG,
      name: "Another User",
      email: "another@fleet.test",
      password: "TestPass123!",
    });

    expect(status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("TENANT_SLUG_TAKEN");
  });

  it("should reject duplicate email", async () => {
    const { status, body } = await post("/auth/register", {
      tenantName: "New Tenant",
      tenantSlug: "new-unique-slug-xyz",
      name: "Duplicate Email User",
      email: TEST_EMAIL,
      password: "TestPass123!",
    });

    expect(status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("EMAIL_TAKEN");
  });

  it("should reject short password", async () => {
    const { status, body } = await post("/auth/register", {
      tenantName: "Weak Password Tenant",
      tenantSlug: "weak-pwd-tenant",
      name: "User",
      email: "weak@fleet.test",
      password: "short",
    });

    expect(status).toBe(422);
  });

  it("should reject invalid slug characters", async () => {
    const { status, body } = await post("/auth/register", {
      tenantName: "Bad Slug",
      tenantSlug: "BAD SLUG!!",
      name: "User",
      email: "badslug@fleet.test",
      password: "TestPass123!",
    });

    expect(status).toBe(422);
  });
});

describe("Auth — Login", () => {
  let accessToken: string;
  let refreshToken: string;

  it("should login with correct credentials", async () => {
    const { status, body } = await post("/auth/login", {
      email: TEST_EMAIL,
      password: "TestPass123!",
    });

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.tokens.accessToken).toBeTruthy();
    expect(body.data.tokens.refreshToken).toBeTruthy();

    accessToken = body.data.tokens.accessToken;
    refreshToken = body.data.tokens.refreshToken;
  });

  it("should reject wrong password", async () => {
    const { status, body } = await post("/auth/login", {
      email: TEST_EMAIL,
      password: "WrongPassword!",
    });

    expect(status).toBe(401);
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("should reject unknown email", async () => {
    const { status, body } = await post("/auth/login", {
      email: "nobody@nowhere.fleet",
      password: "TestPass123!",
    });

    expect(status).toBe(401);
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });

  describe("Auth — /me", () => {
    it("should return current user with valid token", async () => {
      const { status, body } = await get("/auth/me", accessToken);

      expect(status).toBe(200);
      expect(body.data.email).toBe(TEST_EMAIL);
      expect(body.data.role).toBe("FLEET_MANAGER");
      expect(body.data.passwordHash).toBeUndefined();
    });

    it("should return 401 with no token", async () => {
      const { status, body } = await get("/auth/me");
      expect(status).toBe(401);
    });

    it("should return 401 with fake token", async () => {
      const { status } = await get("/auth/me", "fake.jwt.token");
      expect(status).toBe(401);
    });
  });

  describe("Auth — Refresh", () => {
    it("should issue new token pair from valid refresh token", async () => {
      const { status, body } = await post("/auth/refresh", { refreshToken });

      expect(status).toBe(200);
      expect(body.data.accessToken).toBeTruthy();
      expect(body.data.refreshToken).toBeTruthy();
      // New token should differ from original
      expect(body.data.accessToken).not.toBe(accessToken);
    });

    it("should reject used refresh token (rotation)", async () => {
      // The refreshToken is now revoked after the test above
      const { status, body } = await post("/auth/refresh", { refreshToken });
      expect(status).toBe(401);
    });
  });

  describe("Auth — Logout", () => {
    it("should logout and revoke all sessions", async () => {
      // Login fresh
      const loginRes = await post("/auth/login", {
        email: TEST_EMAIL,
        password: "TestPass123!",
      });
      const freshAccess = loginRes.body.data.tokens.accessToken;
      const freshRefresh = loginRes.body.data.tokens.refreshToken;

      // Logout
      const { status } = await post("/auth/logout", {}, freshAccess);
      expect(status).toBe(200);

      // Refresh should now fail
      const { status: refreshStatus } = await post("/auth/refresh", {
        refreshToken: freshRefresh,
      });
      expect(refreshStatus).toBe(401);
    });
  });
});

describe("Auth — Tenant Isolation", () => {
  it("should not leak data between tenants", async () => {
    const unique = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const tenantBSlug = `tenant-b-isolation-${unique}`;
    const tenantBEmail = `manager.${unique}@tenant-b.fleet`;

    // Register Tenant B
    const tenantB = await post("/auth/register", {
      tenantName: "Tenant B Isolation Test",
      tenantSlug: tenantBSlug,
      name: "Tenant B Manager",
      email: tenantBEmail,
      password: "TestPass123!",
    });
    expect(tenantB.status).toBe(201);

    const tenantBToken = tenantB.body.data.tokens.accessToken;

    // Tenant A token
    const tenantALogin = await post("/auth/login", {
      email: TEST_EMAIL,
      password: "TestPass123!",
    });
    const tenantAToken = tenantALogin.body.data.tokens.accessToken;

    // Both should access /me — getting only their own data
    const meA = await get("/auth/me", tenantAToken);
    const meB = await get("/auth/me", tenantBToken);

    expect(meA.body.data.tenantId).not.toBe(meB.body.data.tenantId);
    expect(meA.body.data.email).toBe(TEST_EMAIL);
    expect(meB.body.data.email).toBe(tenantBEmail);

    // Cleanup tenant B
    const userB = await prisma.user.findUnique({
      where: { email: tenantBEmail },
    });
    if (userB) {
      await prisma.refreshToken.deleteMany({ where: { userId: userB.id } });
      await prisma.user.delete({ where: { id: userB.id } });
    }
    await prisma.tenant.deleteMany({ where: { slug: tenantBSlug } });
  });
});
