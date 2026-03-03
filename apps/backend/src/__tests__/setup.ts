import { prisma } from "../db/prisma";

export const BASE = "http://localhost:3000/api/v1";

// ─── Typed fetch helpers ──────────────────────────────────────────────────────
let requestSequence = 0;

function makeHeaders(token?: string, includeJson = false): Record<string, string> {
  const seq = ++requestSequence;
  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Avoid test flakiness from auth rate limits by varying client IP per request.
    "x-forwarded-for": `127.0.0.${(seq % 250) + 1}`,
  };
}

async function parseResponseBody(res: Response): Promise<any> {
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();

  if (!text) return null;

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function post(path: string, body: unknown, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    method:  "POST",
    headers: makeHeaders(token, true),
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await parseResponseBody(res) as any };
}

export async function get(path: string, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: makeHeaders(token),
  });
  return { status: res.status, body: await parseResponseBody(res) as any };
}

export async function patch(path: string, body: unknown, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    method:  "PATCH",
    headers: makeHeaders(token, true),
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await parseResponseBody(res) as any };
}

export async function del(path: string, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    method:  "DELETE",
    headers: makeHeaders(token),
  });
  return { status: res.status, body: await parseResponseBody(res) as any };
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function registerTenant(suffix: string) {
  const res = await post("/auth/register", {
    tenantName: `Test Tenant ${suffix}`,
    tenantSlug: `test-tenant-${suffix}`,
    name:       `Manager ${suffix}`,
    email:      `manager-${suffix}@test.fleet`,
    password:   "TestPass123!",
  });
  return res.body.data as {
    user:   { id: string; tenantId: string; role: string; email: string };
    tokens: { accessToken: string; refreshToken: string };
  };
}

export async function loginAs(email: string, password = "TestPass123!") {
  const res = await post("/auth/login", { email, password });
  return res.body.data?.tokens?.accessToken as string;
}

// ─── DB cleanup helpers ───────────────────────────────────────────────────────

export async function cleanupTenant(slug: string) {
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return;

  // Delete in dependency order
  await prisma.aILog.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.manualChunk.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.invoice.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.gpsPing.deleteMany({
    where: { trip: { tenantId: tenant.id } },
  });
  await prisma.trip.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.vehicle.deleteMany({ where: { tenantId: tenant.id } });

  const users = await prisma.user.findMany({ where: { tenantId: tenant.id } });
  for (const u of users) {
    await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
  }

  await prisma.user.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.auditLog.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.tenant.delete({ where: { id: tenant.id } });
}

export async function cleanupUser(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
}
