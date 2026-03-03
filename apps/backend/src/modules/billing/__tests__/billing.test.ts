import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { prisma } from "../../../db/prisma";
import {
  post, get, patch,
  registerTenant, cleanupTenant,
} from "../../../__tests__/setup";

const SLUG = "billing-test-tenant";

let managerToken: string;
let driverToken:  string;
let tenantId:     string;
let vehicleId:    string;
let driverId:     string;
let invoiceId:    string;
let costPerKm:    number;

async function runFullTrip(): Promise<{ tripId: string; invoiceId: string }> {
  // Start trip
  const trip   = await post("/trips/start", { vehicleId }, driverToken);
  const tripId = trip.body.data.id;

  // Seed GPS pings — Delhi route ~3km
  await prisma.gpsPing.createMany({
    data: [
      { id: crypto.randomUUID(), tripId, lat: 28.6139, lng: 77.2090, speed: 40, heading: 90, timestamp: new Date(Date.now() - 300_000) },
      { id: crypto.randomUUID(), tripId, lat: 28.6180, lng: 77.2150, speed: 55, heading: 88, timestamp: new Date(Date.now() - 240_000) },
      { id: crypto.randomUUID(), tripId, lat: 28.6220, lng: 77.2210, speed: 62, heading: 92, timestamp: new Date(Date.now() - 180_000) },
      { id: crypto.randomUUID(), tripId, lat: 28.6260, lng: 77.2280, speed: 58, heading: 90, timestamp: new Date(Date.now() - 120_000) },
      { id: crypto.randomUUID(), tripId, lat: 28.6300, lng: 77.2350, speed: 45, heading: 89, timestamp: new Date(Date.now() -  60_000) },
      { id: crypto.randomUUID(), tripId, lat: 28.6340, lng: 77.2420, speed: 30, heading: 91, timestamp: new Date() },
    ],
  });

  // End trip — triggers invoice generation
  await post(`/trips/${tripId}/end`, {}, driverToken);

  // Wait for async invoice
  await new Promise((r) => setTimeout(r, 500));

  // Find the invoice
  const invoices = await get("/invoices?status=PENDING", managerToken);
  const inv      = invoices.body.data.find((i: any) => i.tripId === tripId);

  return { tripId, invoiceId: inv?.id };
}

beforeAll(async () => {
  await cleanupTenant(SLUG);

  const tenant = await registerTenant("billing-t");
  managerToken = tenant.tokens.accessToken;
  tenantId     = tenant.user.tenantId;
  costPerKm    = 2.5;

  // Create vehicle
  const vehicle = await post("/vehicles", {
    licensePlate: "BILL-001",
    make: "Mercedes", model: "Actros",
    year: 2023, costPerKm,
  }, managerToken);
  vehicleId = vehicle.body.data.id;

  // Create driver
  const inv = await post("/users/invite",
    { name: "Billing Driver", email: "billing-driver@test.fleet", role: "DRIVER" },
    managerToken
  );
  driverId = inv.body.data.user.id;
  const tok = inv.body.data.inviteUrl.split("token=")[1];
  await post("/users/accept-invite", { token: tok, password: "TestPass123!" });

  const login = await post("/auth/login",
    { email: "billing-driver@test.fleet", password: "TestPass123!" }
  );
  driverToken = login.body.data.tokens.accessToken;

  // Assign vehicle to driver
  await post(`/vehicles/${vehicleId}/assign`, { driverId }, managerToken);
});

afterAll(async () => {
  await cleanupTenant("test-tenant-billing-t");
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Billing — Summary Stats", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("returns summary with zero values initially", async () => {
    const { status, body } = await get("/invoices/summary", managerToken);

    expect(status).toBe(200);
    expect(body.data).toHaveProperty("totalInvoices");
    expect(body.data).toHaveProperty("pendingCount");
    expect(body.data).toHaveProperty("paidCount");
    expect(body.data).toHaveProperty("voidCount");
    expect(body.data).toHaveProperty("monthlyRevenue");
    expect(body.data).toHaveProperty("totalRevenue");
  });

  it("driver cannot access billing summary → 403", async () => {
    const { status } = await get("/invoices/summary", driverToken);
    expect(status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Billing — Invoice Auto-Generation", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("auto-generates invoice when trip ends", async () => {
    const result = await runFullTrip();
    invoiceId    = result.invoiceId;

    expect(invoiceId).toBeTruthy();
  });

  it("invoice has correct fields", async () => {
    const { status, body } = await get(`/invoices/${invoiceId}`, managerToken);

    expect(status).toBe(200);
    expect(body.data.status).toBe("PENDING");
    expect(body.data.currency).toBe("USD");
    expect(Number(body.data.distanceKm)).toBeGreaterThan(0);
    expect(Number(body.data.costPerKm)).toBe(costPerKm);
    expect(Number(body.data.totalAmount)).toBeGreaterThan(0);
    expect(body.data.tripId).toBeTruthy();
    expect(body.data.vehicleId).toBe(vehicleId);
  });

  it("totalAmount = distanceKm × costPerKm (accurate to 2 decimals)", async () => {
    const { body } = await get(`/invoices/${invoiceId}`, managerToken);
    const inv      = body.data;

    const expected = Number(
      (Number(inv.distanceKm) * Number(inv.costPerKm)).toFixed(2)
    );
    const actual   = Number(Number(inv.totalAmount).toFixed(2));

    expect(actual).toBe(expected);
  });

  it("does not double-generate invoice for same trip", async () => {
    // Wait another second to ensure no duplicate job fired
    await new Promise((r) => setTimeout(r, 1000));

    const { body } = await get(
      `/invoices?vehicleId=${vehicleId}`,
      managerToken
    );

    const invoicesForVehicle = body.data.filter(
      async (i: any) => i.tripId === (await get(`/invoices/${invoiceId}`, managerToken)).body.data.tripId
    );

    expect(invoicesForVehicle.length).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Billing — List & Filter Invoices", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("lists all invoices with pagination meta", async () => {
    const { status, body } = await get("/invoices", managerToken);

    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toHaveProperty("total");
    expect(body.meta).toHaveProperty("page");
    expect(body.meta).toHaveProperty("totalPages");
  });

  it("filters by status=PENDING", async () => {
    const { body } = await get("/invoices?status=PENDING", managerToken);
    for (const inv of body.data) {
      expect(inv.status).toBe("PENDING");
    }
  });

  it("filters by vehicleId", async () => {
    const { body } = await get(`/invoices?vehicleId=${vehicleId}`, managerToken);
    for (const inv of body.data) {
      expect(inv.vehicleId).toBe(vehicleId);
    }
  });

  it("filters by date range", async () => {
    const from = new Date(Date.now() - 86_400_000).toISOString(); // yesterday
    const to   = new Date(Date.now() + 86_400_000).toISOString(); // tomorrow

    const { status, body } = await get(
      `/invoices?from=${from}&to=${to}`,
      managerToken
    );

    expect(status).toBe(200);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Billing — Status Updates", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("marks invoice as PAID → sets paidAt", async () => {
    const { status, body } = await patch(
      `/invoices/${invoiceId}/status`,
      { status: "PAID" },
      managerToken
    );

    expect(status).toBe(200);
    expect(body.data.status).toBe("PAID");
    expect(body.data.paidAt).toBeTruthy();
  });

  it("cannot pay an already paid invoice → 409", async () => {
    const { status, body } = await patch(
      `/invoices/${invoiceId}/status`,
      { status: "PAID" },
      managerToken
    );

    expect(status).toBe(409);
    expect(body.error.code).toBe("INVOICE_ALREADY_PAID");
  });

  it("voids an invoice", async () => {
    // Create another trip + invoice for void test
    const { invoiceId: inv2Id } = await runFullTrip();

    const { status, body } = await patch(
      `/invoices/${inv2Id}/status`,
      { status: "VOID" },
      managerToken
    );

    expect(status).toBe(200);
    expect(body.data.status).toBe("VOID");
    expect(body.data.paidAt).toBeNull();
  });

  it("cannot update a voided invoice → 409", async () => {
    const { invoiceId: voidId } = await runFullTrip();

    await patch(`/invoices/${voidId}/status`, { status: "VOID" }, managerToken);

    const { status, body } = await patch(
      `/invoices/${voidId}/status`,
      { status: "PAID" },
      managerToken
    );

    expect(status).toBe(409);
    expect(body.error.code).toBe("INVOICE_VOIDED");
  });

  it("rejects invalid status value → 422", async () => {
    const { status } = await patch(
      `/invoices/${invoiceId}/status`,
      { status: "CANCELLED" },   // not a valid status
      managerToken
    );

    expect(status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Billing — Summary After Activity", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("summary reflects paid invoices in revenue", async () => {
    const { body } = await get("/invoices/summary", managerToken);

    expect(body.data.paidCount).toBeGreaterThanOrEqual(1);
    expect(body.data.totalRevenue).toBeGreaterThan(0);
    expect(body.data.monthlyRevenue).toBeGreaterThan(0);
  });

  it("summary counts match actual invoice statuses", async () => {
    const summary  = await get("/invoices/summary", managerToken);
    const pending  = await get("/invoices?status=PENDING", managerToken);
    const paid     = await get("/invoices?status=PAID", managerToken);
    const voided   = await get("/invoices?status=VOID", managerToken);

    expect(summary.body.data.pendingCount).toBe(pending.body.meta.total);
    expect(summary.body.data.paidCount).toBe(paid.body.meta.total);
    expect(summary.body.data.voidCount).toBe(voided.body.meta.total);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Billing — PDF / HTML Invoice", () => {
// ─────────────────────────────────────────────────────────────────────────────

  it("returns HTML invoice with correct Content-Type", async () => {
    const res = await fetch(
      `http://localhost:3000/api/v1/invoices/${invoiceId}/pdf`,
      { headers: { Authorization: `Bearer ${managerToken}` } }
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");

    const html = await res.text();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Fleet AI");
  });

  it("invoice HTML contains correct amount", async () => {
    const inv = await get(`/invoices/${invoiceId}`, managerToken);
    const amount = Number(inv.body.data.totalAmount).toFixed(2);

    const res = await fetch(
      `http://localhost:3000/api/v1/invoices/${invoiceId}/pdf`,
      { headers: { Authorization: `Bearer ${managerToken}` } }
    );
    const html = await res.text();

    expect(html).toContain(amount);
  });

  it("returns 404 for non-existent invoice PDF", async () => {
    const res = await fetch(
      "http://localhost:3000/api/v1/invoices/fake-invoice-id/pdf",
      { headers: { Authorization: `Bearer ${managerToken}` } }
    );

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Billing — Tenant Isolation", () => {
// ─────────────────────────────────────────────────────────────────────────────

  let tenantBToken: string;

  beforeAll(async () => {
    const tenantB = await registerTenant("billing-b");
    tenantBToken  = tenantB.tokens.accessToken;
  });

  afterAll(async () => {
    await cleanupTenant("test-tenant-billing-b");
  });

  it("tenant B cannot see tenant A invoices → empty list", async () => {
    const { body } = await get("/invoices", tenantBToken);
    expect(body.data.length).toBe(0);
  });

  it("tenant B cannot get tenant A invoice by ID → 404", async () => {
    const { status } = await get(`/invoices/${invoiceId}`, tenantBToken);
    expect(status).toBe(404);
  });

  it("tenant B cannot update tenant A invoice status → 404", async () => {
    const { status } = await patch(
      `/invoices/${invoiceId}/status`,
      { status: "PAID" },
      tenantBToken
    );
    expect(status).toBe(404);
  });
});