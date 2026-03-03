import { prisma } from "../../db/prisma";
import { Errors, AppError } from "../../lib/errors";
import { paginate } from "../../lib/response";
import { injectTenantContext } from "../../middleware/auth.middleware";
import { broadcastToManagers } from "../websocket/ws.broadcast";
import type { UserContext } from "../../types/context";

// ─── Calculate trip distance via PostGIS ──────────────────────────────────────

export async function calculateTripDistance(tripId: string): Promise<number> {
  try {
    // Count pings first — need at least 2 for a line
    const pingCount = await prisma.gpsPing.count({ where: { tripId } });

    if (pingCount < 2) {
      console.warn(`[Billing] Trip ${tripId} has < 2 pings — distance = 0`);
      return 0;
    }

    const result = await prisma.$queryRaw<{ distance_km: number }[]>`
      SELECT
        COALESCE(
          ST_Length(
            ST_MakeLine(
              ARRAY(
                SELECT ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geometry
                FROM   gps_pings
                WHERE  trip_id = ${tripId}
                ORDER  BY timestamp ASC
              )
            )::geography
          ) / 1000.0,
          0
        ) AS distance_km
    `;

    const km = Number(result[0]?.distance_km ?? 0);

    // Sanity check — no single trip should be > 2000km
    if (km > 2000) {
      console.warn(`[Billing] Suspicious distance ${km}km for trip ${tripId} — capping at raw value`);
    }

    return Math.max(0, km);
  } catch (err) {
    console.error("[Billing] Distance calculation error:", err);
    return 0;
  }
}

// ─── Generate Invoice ─────────────────────────────────────────────────────────

export async function generateInvoice(tripId: string): Promise<void> {
  // Load completed trip with vehicle cost
  const trip = await prisma.trip.findUnique({
    where:   { id: tripId },
    include: {
      vehicle: {
        select: { id: true, costPerKm: true, licensePlate: true },
      },
    },
  });

  if (!trip) {
    console.error(`[Billing] Trip ${tripId} not found`);
    return;
  }

  if (trip.status !== "COMPLETED" && trip.status !== "FORCE_ENDED") {
    console.warn(`[Billing] Trip ${tripId} not completed — skipping invoice`);
    return;
  }

  // Don't double-generate
  const existing = await prisma.invoice.findUnique({ where: { tripId } });
  if (existing) {
    console.warn(`[Billing] Invoice already exists for trip ${tripId}`);
    return;
  }

  // Use stored distanceKm if available, recalculate if zero
  let distanceKm = Number(trip.distanceKm ?? 0);
  if (distanceKm === 0) {
    distanceKm = await calculateTripDistance(tripId);
  }

  const costPerKm    = Number(trip.vehicle.costPerKm);
  const totalAmount  = Number((distanceKm * costPerKm).toFixed(2));

  const invoice = await prisma.invoice.create({
    data: {
      tenantId:    trip.tenantId,
      tripId:      trip.id,
      vehicleId:   trip.vehicleId,
      driverId:    trip.driverId,
      distanceKm,
      costPerKm,
      totalAmount,
      currency:    "USD",
      status:      "PENDING",
      generatedAt: new Date(),
    },
  });

  console.log(
    `[Billing] Invoice ${invoice.id} generated | Trip: ${tripId} | ` +
    `Distance: ${distanceKm.toFixed(3)}km | Amount: $${totalAmount}`
  );

  // Notify Fleet Managers via WebSocket
  broadcastToManagers(trip.tenantId, {
    type:    "INVOICE_GENERATED",
    payload: {
      invoiceId:   invoice.id,
      tripId:      trip.id,
      totalAmount,
      distanceKm,
      currency:    "USD",
    },
  });
}

// ─── List Invoices ────────────────────────────────────────────────────────────

export async function listInvoices(
  user: UserContext,
  input: {
    page?:      number;
    pageSize?:  number;
    status?:    string;
    vehicleId?: string;
    driverId?:  string;
    from?:      string;
    to?:        string;
  }
) {
  return injectTenantContext(user, async () => {
    const page     = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, input.pageSize ?? 20);
    const skip     = (page - 1) * pageSize;

    const where: any = { tenantId: user.tenantId };

    if (input.status)    where.status    = input.status;
    if (input.vehicleId) where.vehicleId = input.vehicleId;
    if (input.driverId)  where.driverId  = input.driverId;

    if (input.from || input.to) {
      where.generatedAt = {};
      if (input.from) where.generatedAt.gte = new Date(input.from);
      if (input.to)   where.generatedAt.lte = new Date(input.to);
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { generatedAt: "desc" },
        skip,
        take: pageSize,
        include: {
          trip: {
            select: {
              startTime: true,
              endTime:   true,
              status:    true,
            },
          },
          vehicle: {
            select: { licensePlate: true, make: true, model: true },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return paginate(invoices, total, page, pageSize);
  });
}

// ─── Get Single Invoice ───────────────────────────────────────────────────────

export async function getInvoice(user: UserContext, invoiceId: string) {
  return injectTenantContext(user, async () => {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId: user.tenantId },
      include: {
        trip: {
          include: {
            gpsPings: {
              select:  { lat: true, lng: true, speed: true, timestamp: true },
              orderBy: { timestamp: "asc" },
            },
          },
        },
        vehicle: {
          select: { licensePlate: true, make: true, model: true, year: true },
        },
      },
    });

    if (!invoice) throw Errors.NOT_FOUND("Invoice");
    return invoice;
  });
}

// ─── Update Invoice Status ────────────────────────────────────────────────────

export async function updateInvoiceStatus(
  user: UserContext,
  invoiceId: string,
  status: "PAID" | "VOID"
) {
  return injectTenantContext(user, async () => {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId: user.tenantId },
    });

    if (!invoice) throw Errors.NOT_FOUND("Invoice");

    if (invoice.status === "VOID") {
      throw new AppError("INVOICE_VOIDED", "Cannot update a voided invoice", 409);
    }

    if (invoice.status === "PAID" && status === "PAID") {
      throw new AppError("INVOICE_ALREADY_PAID", "Invoice is already paid", 409);
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status,
        paidAt: status === "PAID" ? new Date() : null,
      },
      include: {
        vehicle: { select: { licensePlate: true, make: true, model: true } },
      },
    });

    return updated;
  });
}

// ─── Billing Summary Stats ────────────────────────────────────────────────────

export async function getBillingSummary(user: UserContext) {
  return injectTenantContext(user, async () => {
    const now       = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalInvoices,
      pendingCount,
      paidCount,
      voidCount,
      monthlyRevenue,
      totalRevenue,
      avgDistance,
    ] = await Promise.all([
      prisma.invoice.count({
        where: { tenantId: user.tenantId },
      }),
      prisma.invoice.count({
        where: { tenantId: user.tenantId, status: "PENDING" },
      }),
      prisma.invoice.count({
        where: { tenantId: user.tenantId, status: "PAID" },
      }),
      prisma.invoice.count({
        where: { tenantId: user.tenantId, status: "VOID" },
      }),
      // Revenue this calendar month
      prisma.invoice.aggregate({
        where: {
          tenantId:    user.tenantId,
          status:      "PAID",
          generatedAt: { gte: monthStart },
        },
        _sum: { totalAmount: true },
      }),
      // All-time revenue
      prisma.invoice.aggregate({
        where: { tenantId: user.tenantId, status: "PAID" },
        _sum:  { totalAmount: true },
      }),
      // Average trip distance
      prisma.invoice.aggregate({
        where: { tenantId: user.tenantId },
        _avg:  { distanceKm: true },
      }),
    ]);

    return {
      totalInvoices,
      pendingCount,
      paidCount,
      voidCount,
      monthlyRevenue: Number(monthlyRevenue._sum.totalAmount ?? 0),
      totalRevenue:   Number(totalRevenue._sum.totalAmount ?? 0),
      avgDistanceKm:  Number((avgDistance._avg.distanceKm ?? 0)).toFixed(2),
    };
  });
}