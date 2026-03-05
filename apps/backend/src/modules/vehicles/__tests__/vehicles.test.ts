import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import {
  post, get, patch, del,
  registerTenant, loginAs, cleanupTenant,
} from "../../../__tests__/setup";

const SLUG_A = "veh-tenant-a";
const SLUG_B = "veh-tenant-b";

let managerToken: string;
let driverToken:  string;
let tenantAId:    string;
let vehicleId:    string;
let driverId:     string;

beforeAll(async () => {
  await cleanupTenant(SLUG_A);
  await cleanupTenant(SLUG_B);

  // Register tenant A
  const tenantA    = await registerTenant("veh-a");
  managerToken     = tenantA.tokens.accessToken;
  tenantAId        = tenantA.user.tenantId;

  // Invite a driver
  const invite = await post("/users/invite",
    { name: "Test Driver", email: "driver-veh@test.fleet", role: "DRIVER" },
    managerToken
  );
  driverId = invite.body.data.user.id;

  // Accept invite
  const token = invite.body.data.inviteUrl.split("token=")[1];
  await post("/users/accept-invite", {
    token,
    password: "TestPass123!",
    name:     "Test Driver",
  });

  driverToken = await loginAs("driver-veh@test.fleet");
});

afterAll(async () => {
  await cleanupTenant(`test-tenant-veh-a`);
  await cleanupTenant(`test-tenant-veh-b`);
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Vehicles — Fleet Stats", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("returns stats with all zeroes initially", async () => {
    const { status, body } = await get("/vehicles/stats", managerToken);

    expect(status).toBe(200);
    expect(body.data.total).toBeGreaterThanOrEqual(0);
    expect(body.data).toHaveProperty("active");
    expect(body.data).toHaveProperty("inTrip");
    expect(body.data).toHaveProperty("inactive");
  });

  it("driver cannot access stats → 403", async () => {
    const { status } = await get("/vehicles/stats", driverToken);
    expect(status).toBe(403);
  });

  it("unauthenticated request → 401", async () => {
    const { status } = await get("/vehicles/stats");
    expect(status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Vehicles — CRUD", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("creates a vehicle → 201", async () => {
    const { status, body } = await post("/vehicles", {
      licensePlate: "TEST-001",
      make:         "Mercedes-Benz",
      model:        "Actros",
      year:         2023,
      costPerKm:    2.5,
    }, managerToken);

    expect(status).toBe(201);
    expect(body.data.licensePlate).toBe("TEST-001");
    expect(body.data.status).toBe("ACTIVE");
    expect(body.data.tenantId).toBe(tenantAId);
    expect(Number(body.data.costPerKm)).toBe(2.5);

    vehicleId = body.data.id;
  });

  it("auto-uppercases license plate", async () => {
    const { body } = await post("/vehicles", {
      licensePlate: "lowercase-abc",
      make:         "Volvo",
      model:        "FH16",
      year:         2022,
      costPerKm:    3.0,
    }, managerToken);

    expect(body.data.licensePlate).toBe("LOWERCASE-ABC");
    // cleanup
    await del(`/vehicles/${body.data.id}`, managerToken);
  });

  it("rejects duplicate license plate → 422", async () => {
    const { status, body } = await post("/vehicles", {
      licensePlate: "TEST-001",  // same plate
      make:         "DAF",
      model:        "XF",
      year:         2021,
      costPerKm:    2.0,
    }, managerToken);

    expect(status).toBe(422);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("lists vehicles with pagination meta", async () => {
    const { status, body } = await get("/vehicles", managerToken);

    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toHaveProperty("total");
    expect(body.meta).toHaveProperty("page");
    expect(body.meta).toHaveProperty("totalPages");
  });

  it("searches vehicles by make", async () => {
    const { body } = await get("/vehicles?search=mercedes", managerToken);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].make.toLowerCase()).toContain("mercedes");
  });

  it("filters vehicles by status", async () => {
    const { body } = await get("/vehicles?status=ACTIVE", managerToken);
    for (const v of body.data) {
      expect(v.status).toBe("ACTIVE");
    }
  });

  it("gets vehicle by ID", async () => {
    const { status, body } = await get(`/vehicles/${vehicleId}`, managerToken);
    expect(status).toBe(200);
    expect(body.data.id).toBe(vehicleId);
    expect(body.data).toHaveProperty("_count");
  });

  it("returns 404 for non-existent vehicle", async () => {
    const { status, body } = await get("/vehicles/non-existent-id", managerToken);
    expect(status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("updates vehicle fields", async () => {
    const { status, body } = await patch(`/vehicles/${vehicleId}`, {
      costPerKm: 4.0,
    }, managerToken);

    expect(status).toBe(200);
    expect(Number(body.data.costPerKm)).toBe(4.0);
  });

  it("rejects setting status to IN_TRIP manually → 422", async () => {
    const { status, body } = await patch(`/vehicles/${vehicleId}`, {
      status: "IN_TRIP",
    }, managerToken);

    expect(status).toBe(422);
  });

  it("rejects invalid year → 422", async () => {
    const { status } = await post("/vehicles", {
      licensePlate: "INVALID-YR",
      make:         "Test",
      model:        "Test",
      year:         1800,   // below minimum
      costPerKm:    1.0,
    }, managerToken);

    expect(status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Vehicles — Driver Assignment", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("assigns a driver to a vehicle", async () => {
    const { status, body } = await post(
      `/vehicles/${vehicleId}/assign`,
      { driverId },
      managerToken
    );

    expect(status).toBe(200);
    expect(body.data.assignedDriverId).toBe(driverId);
    expect(body.data.assignedDriver.id).toBe(driverId);
  });

  it("rejects assigning driver to a second vehicle", async () => {
    // Create another vehicle
    const v2 = await post("/vehicles", {
      licensePlate: "TEST-002",
      make:         "Scania",
      model:        "R500",
      year:         2022,
      costPerKm:    3.0,
    }, managerToken);

    const { status, body } = await post(
      `/vehicles/${v2.body.data.id}/assign`,
      { driverId },
      managerToken
    );

    expect(status).toBe(422); // driver already assigned
    await del(`/vehicles/${v2.body.data.id}`, managerToken);
  });

  it("unassigns driver by setting driverId null", async () => {
    const { status, body } = await post(
      `/vehicles/${vehicleId}/assign`,
      { driverId: null },
      managerToken
    );

    expect(status).toBe(200);
    expect(body.data.assignedDriverId).toBeNull();
  });

  it("rejects assigning non-existent driver → 404", async () => {
    const { status, body } = await post(
      `/vehicles/${vehicleId}/assign`,
      { driverId: "fake-driver-id" },
      managerToken
    );

    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Vehicles — Soft Delete", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("soft deletes vehicle", async () => {
    const newVehicle = await post("/vehicles", {
      licensePlate: "DELETE-ME",
      make:         "Test",
      model:        "Delete",
      year:         2020,
      costPerKm:    1.0,
    }, managerToken);

    const id = newVehicle.body.data.id;

    const { status, body } = await del(`/vehicles/${id}`, managerToken);
    expect(status).toBe(200);
    expect(body.data.deleted).toBe(true);

    // Should not appear in list
    const list = await get("/vehicles", managerToken);
    const ids  = list.body.data.map((v: any) => v.id);
    expect(ids).not.toContain(id);
  });

  it("returns 404 after soft delete", async () => {
    const newVehicle = await post("/vehicles", {
      licensePlate: "DELETE-ME-2",
      make:         "Test",
      model:        "Delete2",
      year:         2020,
      costPerKm:    1.0,
    }, managerToken);

    const id = newVehicle.body.data.id;
    await del(`/vehicles/${id}`, managerToken);

    const { status } = await get(`/vehicles/${id}`, managerToken);
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Vehicles — Tenant Isolation", () => {
// ─────────────────────────────────────────────────────────────────────────────

  let tenantBToken: string;

  beforeAll(async () => {
    const tenantB = await registerTenant("veh-b");
    tenantBToken  = tenantB.tokens.accessToken;
  });

  it("tenant B cannot read tenant A vehicle → 404", async () => {
    const { status, body } = await get(`/vehicles/${vehicleId}`, tenantBToken);
    expect(status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("tenant B cannot update tenant A vehicle → 404", async () => {
    const { status } = await patch(
      `/vehicles/${vehicleId}`,
      { costPerKm: 99 },
      tenantBToken
    );
    expect(status).toBe(404);
  });

  it("tenant B cannot delete tenant A vehicle → 404", async () => {
    const { status } = await del(`/vehicles/${vehicleId}`, tenantBToken);
    expect(status).toBe(404);
  });

  it("tenant B list only shows their own vehicles", async () => {
    const { body } = await get("/vehicles", tenantBToken);
    for (const v of body.data) {
      expect(v.tenantId).not.toBe(tenantAId);
    }
  });
});