import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { prisma } from "../../../db/prisma";
import {
  post, get,
  registerTenant, cleanupTenant,
} from "../../../__tests__/setup";

const SLUG = "trips-test-tenant";

let managerToken: string;
let driverToken:  string;
let tenantId:     string;
let vehicleId:    string;
let driverId:     string;
let activeTripId: string;

async function seedGpsPings(tripId: string, count = 5) {
  const pings = Array.from({ length: count }, (_, i) => ({
    id:        crypto.randomUUID(),
    tripId,
    lat:       28.6139 + i * 0.005,
    lng:       77.2090 + i * 0.005,
    speed:     40 + i,
    heading:   90,
    timestamp: new Date(Date.now() - (count - i) * 60_000),
  }));

  await prisma.gpsPing.createMany({ data: pings });
}

beforeAll(async () => {
  await cleanupTenant(SLUG);

  // Setup tenant
  const tenant  = await registerTenant("trips-t");
  managerToken  = tenant.tokens.accessToken;
  tenantId      = tenant.user.tenantId;

  // Create vehicle
  const vehicle = await post("/vehicles", {
    licensePlate: "TRIP-001",
    make:         "Volvo",
    model:        "FH16",
    year:         2022,
    costPerKm:    2.5,
  }, managerToken);
  vehicleId = vehicle.body.data.id;

  // Invite + create driver
  const inv  = await post("/users/invite",
    { name: "Trip Driver", email: "trip-driver@test.fleet", role: "DRIVER" },
    managerToken
  );
  driverId   = inv.body.data.user.id;
  const tok  = inv.body.data.inviteUrl.split("token=")[1];

  await post("/users/accept-invite", { token: tok, password: "TestPass123!" });

  // Login driver
  const login = await post("/auth/login", {
    email: "trip-driver@test.fleet", password: "TestPass123!",
  });
  driverToken = login.body.data.tokens.accessToken;

  // Assign vehicle to driver
  await post(`/vehicles/${vehicleId}/assign`, { driverId }, managerToken);
});

afterAll(async () => {
  await cleanupTenant("test-tenant-trips-t");
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Trips — Start", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("driver starts a trip → 201", async () => {
    const { status, body } = await post("/trips/start",
      { vehicleId },
      driverToken
    );

    expect(status).toBe(201);
    expect(body.data.status).toBe("ACTIVE");
    expect(body.data.vehicleId).toBe(vehicleId);
    expect(body.data.driverId).toBe(driverId);

    activeTripId = body.data.id;
  });

  it("vehicle status is IN_TRIP after start", async () => {
    const { body } = await get(`/vehicles/${vehicleId}`, managerToken);
    expect(body.data.status).toBe("IN_TRIP");
  });

  it("rejects second trip start while one is active → 409", async () => {
    const { status, body } = await post("/trips/start",
      { vehicleId },
      driverToken
    );

    expect(status).toBe(409);
    expect(body.error.code).toBe("DRIVER_IN_TRIP");
  });

  it("manager cannot start a trip → 403", async () => {
    const { status } = await post("/trips/start",
      { vehicleId },
      managerToken
    );
    expect(status).toBe(403);
  });

  it("rejects unassigned vehicle → 403", async () => {
    const v2 = await post("/vehicles", {
      licensePlate: "NODRIVER",
      make: "Test", model: "Test",
      year: 2020, costPerKm: 1.0,
    }, managerToken);

    const { status, body } = await post("/trips/start",
      { vehicleId: v2.body.data.id },
      driverToken
    );

    expect(status).toBe(403);
    expect(body.error.code).toBe("VEHICLE_NOT_ASSIGNED");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Trips — Active & List", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("GET /trips/active returns current live vehicles", async () => {
    const { status, body } = await get("/trips/active", managerToken);
    expect(status).toBe(200);
    expect(body.data).toHaveProperty("activeTrips");
  });

  it("driver lists own trips", async () => {
    const { status, body } = await get("/trips", driverToken);
    expect(status).toBe(200);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    for (const t of body.data) {
      expect(t.driverId).toBe(driverId);
    }
  });

  it("manager lists all tenant trips", async () => {
    const { status, body } = await get("/trips/all", managerToken);
    expect(status).toBe(200);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("manager gets trip by ID", async () => {
    const { status, body } = await get(`/trips/${activeTripId}`, managerToken);
    expect(status).toBe(200);
    expect(body.data.id).toBe(activeTripId);
    expect(body.data).toHaveProperty("gpsPings");
    expect(body.data).toHaveProperty("vehicle");
    expect(body.data).toHaveProperty("driver");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Trips — End", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("seeds GPS pings and ends trip → COMPLETED", async () => {
    await seedGpsPings(activeTripId, 8);

    const { status, body } = await post(
      `/trips/${activeTripId}/end`,
      {},
      driverToken
    );

    expect(status).toBe(200);
    expect(body.data.status).toBe("COMPLETED");
    expect(body.data.endTime).toBeTruthy();
    expect(Number(body.data.distanceKm)).toBeGreaterThanOrEqual(0);
  });

  it("vehicle status returns to ACTIVE after trip end", async () => {
    const { body } = await get(`/vehicles/${vehicleId}`, managerToken);
    expect(body.data.status).toBe("ACTIVE");
  });

  it("cannot end an already completed trip → 404", async () => {
    const { status, body } = await post(
      `/trips/${activeTripId}/end`,
      {},
      driverToken
    );

    expect(status).toBe(404);
    expect(body.error.code).toBe("TRIP_NOT_FOUND");
  });

  it("driver cannot end another driver's trip → 404", async () => {
    // Start a new trip as our driver
    const trip2 = await post("/trips/start", { vehicleId }, driverToken);
    const trip2Id = trip2.body.data.id;

    // Register + create another driver
    const inv2 = await post("/users/invite",
      { name: "Other Driver", email: "other-driver@test.fleet", role: "DRIVER" },
      managerToken
    );
    const tok2 = inv2.body.data.inviteUrl.split("token=")[1];
    await post("/users/accept-invite", { token: tok2, password: "TestPass123!" });
    const login2 = await post("/auth/login",
      { email: "other-driver@test.fleet", password: "TestPass123!" }
    );
    const otherToken = login2.body.data.tokens.accessToken;

    // Other driver tries to end our driver's trip
    const { status } = await post(`/trips/${trip2Id}/end`, {}, otherToken);
    expect(status).toBe(404);

    // Cleanup — manager force ends
    await post(`/trips/${trip2Id}/force-end`, {}, managerToken);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Trips — Force End", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("manager force-ends an active trip → FORCE_ENDED", async () => {
    const trip = await post("/trips/start", { vehicleId }, driverToken);
    const tripId = trip.body.data.id;

    const { status, body } = await post(
      `/trips/${tripId}/force-end`,
      {},
      managerToken
    );

    expect(status).toBe(200);
    expect(body.data.status).toBe("FORCE_ENDED");
  });

  it("driver cannot force-end a trip → 403", async () => {
    const trip = await post("/trips/start", { vehicleId }, driverToken);
    const tripId = trip.body.data.id;

    const { status } = await post(
      `/trips/${tripId}/force-end`,
      {},
      driverToken      // driver calling force-end — should fail
    );

    expect(status).toBe(403);

    // Cleanup
    await post(`/trips/${tripId}/force-end`, {}, managerToken);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Trips — Filters", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("filters trips by status=COMPLETED", async () => {
    const { body } = await get("/trips/all?status=COMPLETED", managerToken);
    for (const t of body.data) {
      expect(t.status).toBe("COMPLETED");
    }
  });

  it("filters trips by vehicleId", async () => {
    const { body } = await get(`/trips/all?vehicleId=${vehicleId}`, managerToken);
    for (const t of body.data) {
      expect(t.vehicleId).toBe(vehicleId);
    }
  });

  it("paginates trips correctly", async () => {
    const { body } = await get("/trips/all?page=1&pageSize=2", managerToken);
    expect(body.data.length).toBeLessThanOrEqual(2);
    expect(body.meta.pageSize).toBe(2);
    expect(body.meta).toHaveProperty("totalPages");
  });
});