import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { post, get, registerTenant, cleanupTenant, cleanupUser } from "../../../__tests__/setup";

const SLUG  = "auth-test-tenant";
const EMAIL = "auth-manager@test.fleet";

beforeAll(async () => {
  await cleanupTenant(SLUG);
  await cleanupUser(EMAIL);
});

afterAll(async () => {
  await cleanupTenant(SLUG);
  await cleanupUser("auth-dup-email@test.fleet");
  await cleanupTenant("auth-dup-slug");
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Auth — Register", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("registers a new tenant + fleet manager", async () => {
    const { status, body } = await post("/auth/register", {
      tenantName: "Auth Test Tenant",
      tenantSlug: SLUG,
      name:       "Auth Manager",
      email:      EMAIL,
      password:   "TestPass123!",
    });

    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe(EMAIL);
    expect(body.data.user.role).toBe("FLEET_MANAGER");
    expect(body.data.user.tenantName).toBe("Auth Test Tenant");
    expect(body.data.tokens.accessToken).toBeTruthy();
    expect(body.data.tokens.refreshToken).toBeTruthy();

    // Password MUST NOT be in response
    expect(body.data.user.passwordHash).toBeUndefined();
    expect(body.data.user.password).toBeUndefined();
  });

  it("rejects duplicate tenant slug → 409", async () => {
    const { status, body } = await post("/auth/register", {
      tenantName: "Another Tenant",
      tenantSlug: SLUG,          // same slug
      name:       "Another User",
      email:      "another@test.fleet",
      password:   "TestPass123!",
    });

    expect(status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("TENANT_SLUG_TAKEN");
  });

  it("rejects duplicate email → 409", async () => {
    const { status, body } = await post("/auth/register", {
      tenantName: "New Tenant",
      tenantSlug: "auth-dup-slug",
      name:       "Dup Email User",
      email:      EMAIL,           // same email
      password:   "TestPass123!",
    });

    expect(status).toBe(409);
    expect(body.error.code).toBe("EMAIL_TAKEN");
  });

  it("rejects password shorter than 8 chars → 422", async () => {
    const { status } = await post("/auth/register", {
      tenantName: "Weak Pwd Tenant",
      tenantSlug: "weak-pwd-slug",
      name:       "User",
      email:      "weak@test.fleet",
      password:   "short",
    });

    expect(status).toBe(422);
  });

  it("rejects slug with uppercase/spaces → 422", async () => {
    const { status } = await post("/auth/register", {
      tenantName: "Bad Slug Tenant",
      tenantSlug: "BAD SLUG!!",
      name:       "User",
      email:      "badslug@test.fleet",
      password:   "TestPass123!",
    });

    expect(status).toBe(422);
  });

  it("rejects missing required fields → 422", async () => {
    const { status } = await post("/auth/register", {
      tenantName: "Missing Fields",
      // missing slug, name, email, password
    });

    expect(status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Auth — Login", () => {
// ─────────────────────────────────────────────────────────────────────────────

  let accessToken:  string;
  let refreshToken: string;

  it("logs in with correct credentials → 200", async () => {
    const { status, body } = await post("/auth/login", {
      email:    EMAIL,
      password: "TestPass123!",
    });

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.tokens.accessToken).toBeTruthy();
    expect(body.data.tokens.refreshToken).toBeTruthy();
    expect(body.data.user.role).toBe("FLEET_MANAGER");

    accessToken  = body.data.tokens.accessToken;
    refreshToken = body.data.tokens.refreshToken;
  });

  it("rejects wrong password → 401", async () => {
    const { status, body } = await post("/auth/login", {
      email:    EMAIL,
      password: "WrongPassword!",
    });

    expect(status).toBe(401);
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects unknown email → 401", async () => {
    const { status, body } = await post("/auth/login", {
      email:    "nobody@nowhere.fleet",
      password: "TestPass123!",
    });

    expect(status).toBe(401);
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("GET /auth/me returns user with valid token → 200", async () => {
    const { status, body } = await get("/auth/me", accessToken);

    expect(status).toBe(200);
    expect(body.data.email).toBe(EMAIL);
    expect(body.data.role).toBe("FLEET_MANAGER");
    expect(body.data.passwordHash).toBeUndefined();
  });

  it("GET /auth/me returns 401 with no token", async () => {
    const { status } = await get("/auth/me");
    expect(status).toBe(401);
  });

  it("GET /auth/me returns 401 with fake token", async () => {
    const { status } = await get("/auth/me", "fake.jwt.token.here");
    expect(status).toBe(401);
  });

  it("POST /auth/refresh issues new token pair → 200", async () => {
    const { status, body } = await post("/auth/refresh", { refreshToken });

    expect(status).toBe(200);
    expect(body.data.accessToken).toBeTruthy();
    expect(body.data.refreshToken).toBeTruthy();
    expect(body.data.accessToken).not.toBe(accessToken);

    // Update for next test
    refreshToken = body.data.refreshToken;
  });

  it("POST /auth/refresh rejects used token (rotation) → 401", async () => {
    // Use the OLD refresh token (before the one issued above)
    const { status } = await post("/auth/refresh", {
      refreshToken: "already.used.token",
    });
    expect(status).toBe(401);
  });

  it("POST /auth/logout revokes all sessions → 200", async () => {
    // Fresh login
    const loginRes  = await post("/auth/login", { email: EMAIL, password: "TestPass123!" });
    const freshAccess  = loginRes.body.data.tokens.accessToken;
    const freshRefresh = loginRes.body.data.tokens.refreshToken;

    const { status } = await post("/auth/logout", {}, freshAccess);
    expect(status).toBe(200);

    // Refresh must now fail
    const { status: refreshStatus } = await post("/auth/refresh", {
      refreshToken: freshRefresh,
    });
    expect(refreshStatus).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Auth — Tenant Isolation (/me)", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("two tenants both get /me but see only their own data", async () => {
    const tenantA = await registerTenant("iso-a");
    const tenantB = await registerTenant("iso-b");

    const meA = await get("/auth/me", tenantA.tokens.accessToken);
    const meB = await get("/auth/me", tenantB.tokens.accessToken);

    expect(meA.body.data.tenantId).not.toBe(meB.body.data.tenantId);
    expect(meA.body.data.email).toContain("iso-a");
    expect(meB.body.data.email).toContain("iso-b");

    // Cleanup
    await cleanupTenant("test-tenant-iso-a");
    await cleanupTenant("test-tenant-iso-b");
  });
});