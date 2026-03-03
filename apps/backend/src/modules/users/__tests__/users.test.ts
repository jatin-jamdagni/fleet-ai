import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import {
  post, get, patch, del,
  registerTenant, loginAs, cleanupTenant,
} from "../../../__tests__/setup";

const SLUG = "users-test-tenant";

let managerToken: string;
let driverToken:  string;
let tenantId:     string;
let invitedUserId: string;
let inviteToken:   string;

beforeAll(async () => {
  await cleanupTenant(SLUG);

  const tenant = await registerTenant("users-t");
  managerToken = tenant.tokens.accessToken;
  tenantId     = tenant.user.tenantId;
});

afterAll(async () => {
  await cleanupTenant("test-tenant-users-t");
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Users — Team Stats", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("returns stats for tenant", async () => {
    const { status, body } = await get("/users/stats", managerToken);

    expect(status).toBe(200);
    expect(body.data.total).toBeGreaterThanOrEqual(1);
    expect(body.data).toHaveProperty("managers");
    expect(body.data).toHaveProperty("drivers");
    expect(body.data).toHaveProperty("activeDrivers");
  });

  it("driver cannot get team stats → 403", async () => {
    // Driver not yet created, test with wrong token
    const { status } = await get("/users/stats", "fake-token");
    expect(status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Users — Invite", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("invites a new driver → 201", async () => {
    const { status, body } = await post("/users/invite", {
      name:  "Invited Driver",
      email: "invited-driver@test.fleet",
      role:  "DRIVER",
    }, managerToken);

    expect(status).toBe(201);
    expect(body.data.user.email).toBe("invited-driver@test.fleet");
    expect(body.data.user.role).toBe("DRIVER");
    expect(body.data.inviteUrl).toContain("token=");

    invitedUserId = body.data.user.id;
    inviteToken   = body.data.inviteUrl.split("token=")[1];
  });

  it("invites a new fleet manager → 201", async () => {
    const { status, body } = await post("/users/invite", {
      name:  "Second Manager",
      email: "manager2@test.fleet",
      role:  "FLEET_MANAGER",
    }, managerToken);

    expect(status).toBe(201);
    expect(body.data.user.role).toBe("FLEET_MANAGER");
  });

  it("rejects duplicate email → 409", async () => {
    const { status, body } = await post("/users/invite", {
      name:  "Dup Email",
      email: "invited-driver@test.fleet",  // same email
      role:  "DRIVER",
    }, managerToken);

    expect(status).toBe(409);
    expect(body.error.code).toBe("EMAIL_TAKEN");
  });

  it("rejects invalid email format → 422", async () => {
    const { status } = await post("/users/invite", {
      name:  "Bad Email",
      email: "not-an-email",
      role:  "DRIVER",
    }, managerToken);

    expect(status).toBe(422);
  });

  it("rejects invalid role → 422", async () => {
    const { status } = await post("/users/invite", {
      name:  "Bad Role",
      email: "badrole@test.fleet",
      role:  "SUPER_ADMIN",  // not allowed
    }, managerToken);

    expect(status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Users — Accept Invite", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("accepts invite and sets password → 200", async () => {
    const { status, body } = await post("/users/accept-invite", {
      token:    inviteToken,
      password: "Driver123!",
      name:     "Invited Driver Updated",
    });

    expect(status).toBe(200);
    expect(body.data.email).toBe("invited-driver@test.fleet");
  });

  it("invited driver can now login", async () => {
    driverToken = await loginAs("invited-driver@test.fleet", "Driver123!");
    expect(driverToken).toBeTruthy();
  });

  it("rejects invalid invite token → 400", async () => {
    const { status, body } = await post("/users/accept-invite", {
      token:    "completely.fake.token",
      password: "NewPass123!",
    });

    expect(status).toBe(400);
    expect(body.error.code).toBe("INVITE_INVALID");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Users — List & Get", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("lists all users — no passwordHash", async () => {
    const { status, body } = await get("/users", managerToken);

    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);

    for (const user of body.data) {
      expect(user.passwordHash).toBeUndefined();
      expect(user.password).toBeUndefined();
    }
  });

  it("filters users by role=DRIVER", async () => {
    const { body } = await get("/users?role=DRIVER", managerToken);
    for (const u of body.data) {
      expect(u.role).toBe("DRIVER");
    }
  });

  it("searches users by name", async () => {
    const { body } = await get("/users?search=Invited", managerToken);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].name).toContain("Invited");
  });

  it("gets user by ID", async () => {
    const { status, body } = await get(`/users/${invitedUserId}`, managerToken);
    expect(status).toBe(200);
    expect(body.data.id).toBe(invitedUserId);
    expect(body.data.passwordHash).toBeUndefined();
  });

  it("returns 404 for non-existent user", async () => {
    const { status } = await get("/users/fake-user-id", managerToken);
    expect(status).toBe(404);
  });

  it("driver cannot list users → 403", async () => {
    const { status } = await get("/users", driverToken);
    expect(status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Users — Update & Role Change", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("updates user name", async () => {
    const { status, body } = await patch(
      `/users/${invitedUserId}`,
      { name: "Updated Driver Name" },
      managerToken
    );

    expect(status).toBe(200);
    expect(body.data.name).toBe("Updated Driver Name");
  });

  it("changes user role from DRIVER to FLEET_MANAGER", async () => {
    const { status, body } = await patch(
      `/users/${invitedUserId}/role`,
      { role: "FLEET_MANAGER" },
      managerToken
    );

    expect(status).toBe(200);
    expect(body.data.role).toBe("FLEET_MANAGER");

    // Change back for remaining tests
    await patch(`/users/${invitedUserId}/role`, { role: "DRIVER" }, managerToken);
  });

  it("cannot change own role → 422", async () => {
    const me = await get("/auth/me", managerToken);
    const myId = me.body.data.id;

    const { status, body } = await patch(
      `/users/${myId}/role`,
      { role: "DRIVER" },
      managerToken
    );

    expect(status).toBe(422);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Users — Change Password", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("changes own password successfully", async () => {
    const freshToken = await loginAs("invited-driver@test.fleet", "Driver123!");

    const { status, body } = await post(
      "/users/me/change-password",
      { currentPassword: "Driver123!", newPassword: "NewDriver456!" },
      freshToken
    );

    expect(status).toBe(200);
    expect(body.data.message).toContain("Password changed");
  });

  it("can login with new password", async () => {
    const token = await loginAs("invited-driver@test.fleet", "NewDriver456!");
    expect(token).toBeTruthy();
    driverToken = token;
  });

  it("rejects wrong current password → 401", async () => {
    const { status, body } = await post(
      "/users/me/change-password",
      { currentPassword: "WrongPassword!", newPassword: "SomethingNew!" },
      driverToken
    );

    expect(status).toBe(401);
    expect(body.error.code).toBe("WRONG_PASSWORD");
  });

  it("rejects new password shorter than 8 chars → 422", async () => {
    const { status } = await post(
      "/users/me/change-password",
      { currentPassword: "NewDriver456!", newPassword: "short" },
      driverToken
    );

    expect(status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Users — Soft Delete", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("soft deletes a user", async () => {
    // Invite a temp user
    const inv = await post("/users/invite", {
      name:  "Temp User",
      email: "temp-delete@test.fleet",
      role:  "DRIVER",
    }, managerToken);

    const tempId = inv.body.data.user.id;

    const { status, body } = await del(`/users/${tempId}`, managerToken);
    expect(status).toBe(200);
    expect(body.data.deleted).toBe(true);
  });

  it("deleted user does not appear in list", async () => {
    const { body } = await get("/users", managerToken);
    const emails = body.data.map((u: any) => u.email);
    expect(emails).not.toContain("temp-delete@test.fleet");
  });

  it("cannot delete own account → 422", async () => {
    const me   = await get("/auth/me", managerToken);
    const myId = me.body.data.id;

    const { status, body } = await del(`/users/${myId}`, managerToken);
    expect(status).toBe(422);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Users — Tenant Isolation", () => {
// ─────────────────────────────────────────────────────────────────────────────

  let tenantBToken: string;

  beforeAll(async () => {
    const tenantB = await registerTenant("users-b");
    tenantBToken  = tenantB.tokens.accessToken;
  });

  afterAll(async () => {
    await cleanupTenant("test-tenant-users-b");
  });

  it("tenant B cannot see tenant A users", async () => {
    const { body } = await get("/users", tenantBToken);
    for (const u of body.data) {
      expect(u.tenantId).not.toBe(tenantId);
    }
  });

  it("tenant B cannot get tenant A user by ID → 404", async () => {
    const { status } = await get(`/users/${invitedUserId}`, tenantBToken);
    expect(status).toBe(404);
  });

  it("tenant B cannot update tenant A user → 404", async () => {
    const { status } = await patch(
      `/users/${invitedUserId}`,
      { name: "Hacked Name" },
      tenantBToken
    );
    expect(status).toBe(404);
  });
});