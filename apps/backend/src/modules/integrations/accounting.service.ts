import { prisma } from "../../db/prisma";
import { AppError } from "../../lib/errors";
import { injectTenantContext } from "../../middleware/auth.middleware";
import type { UserContext } from "../../types/context";

// ─── Export invoices to QuickBooks CSV format ─────────────────────────────────
//
// QuickBooks imports from a CSV with specific column headers.
// Reference: https://quickbooks.intuit.com/learn-support/en-us/import-data

export async function exportQuickBooksCSV(
  user: UserContext,
  from?: string,
  to?:   string
): Promise<string> {
  return injectTenantContext(user, async () => {
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId },
    });

    const where: any = { tenantId: user.tenantId, status: "PAID" };
    if (from || to) where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to)   where.createdAt.lte = new Date(to);

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { generatedAt: "asc" },
      include: {
        trip: {
          include: {
            vehicle: { select: { licensePlate: true, make: true, model: true } },
            driver:  { select: { name: true } },
          },
        },
      },
    });

    if (invoices.length === 0) {
      throw new AppError( "NO_DATA", "No paid invoices found for the period",404);
    }

    const prefix   = settings?.invoicePrefix ?? "INV";
    const currency = settings?.currency      ?? "USD";

    // QuickBooks Online Invoice import format
    const headers = [
      "InvoiceNo",
      "Customer",
      "InvoiceDate",
      "DueDate",
      "Terms",
      "ItemName",
      "ItemDescription",
      "ItemQuantity",
      "ItemRate",
      "ItemAmount",
      "Currency",
    ];

    const rows = invoices.map((inv) => {
      const invoiceNo  = `${prefix}-${inv.id.slice(-8).toUpperCase()}`;
      const customer   = inv.trip?.driver?.name ?? "Unknown Driver";
      const invDate    = new Date(inv.generatedAt).toLocaleDateString("en-US");
      const dueDate    = invDate;
      const itemDesc   = [
        `${inv.trip?.vehicle?.licensePlate ?? ""}`,
        `${Number(inv.trip?.distanceKm ?? 0).toFixed(2)} km`,
      ].join(" — ");
      const amount     = Number(inv.totalAmount).toFixed(2);

      return [
        invoiceNo,
        customer,
        invDate,
        dueDate,
        "Net 30",
        "Fleet Transport",
        itemDesc,
        "1",
        amount,
        amount,
        currency,
      ].map(escapeCsv).join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  });
}

// ─── Export to Xero CSV format ────────────────────────────────────────────────
//
// Xero uses a different CSV schema for invoice import.

export async function exportXeroCSV(
  user: UserContext,
  from?: string,
  to?:   string
): Promise<string> {
  return injectTenantContext(user, async () => {
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId },
    });

    const where: any = { tenantId: user.tenantId, status: "PAID" };
    if (from || to) where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to)   where.createdAt.lte = new Date(to);

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { generatedAt: "asc" },
      include: {
        trip: {
          include: {
            vehicle: { select: { licensePlate: true } },
            driver:  { select: { name: true } },
          },
        },
      },
    });

    if (invoices.length === 0) {
      throw new AppError( "NO_DATA", "No paid invoices found for the period",404);
    }

    const prefix   = settings?.invoicePrefix ?? "INV";
    const currency = settings?.currency      ?? "USD";
    const vatNo    = settings?.vatNumber     ?? "";

    // Xero import format
    const headers = [
      "*ContactName",
      "EmailAddress",
      "*InvoiceNumber",
      "*InvoiceDate",
      "*DueDate",
      "Description",
      "*UnitAmount",
      "*Quantity",
      "*AccountCode",
      "*TaxType",
      "Currency",
      "Reference",
    ];

    const rows = invoices.map((inv) => {
      const invoiceNo = `${prefix}-${inv.id.slice(-8).toUpperCase()}`;
      const contact   = inv.trip?.driver?.name ?? "Fleet Customer";
      const date      = new Date(inv.generatedAt).toLocaleDateString("en-GB");
      const due       = new Date(
        inv.generatedAt.getTime() + 30 * 86_400_000
      ).toLocaleDateString("en-GB");
      const desc      = `Fleet trip — ${inv.trip?.vehicle?.licensePlate ?? ""} — ${
        Number(inv.trip?.distanceKm ?? 0).toFixed(2)
      } km`;
      const amount    = Number(inv.totalAmount).toFixed(2);

      return [
        contact,
        "",            // email
        invoiceNo,
        date,
        due,
        desc,
        amount,
        "1",
        "200",         // Xero account code: Sales
        "TAX001",      // Tax type
        currency,
        vatNo,
      ].map(escapeCsv).join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  });
}

// ─── Export fuel costs as expenses CSV (QuickBooks / Xero generic) ────────────

export async function exportFuelExpensesCSV(
  user: UserContext,
  from?: string,
  to?:   string
): Promise<string> {
  return injectTenantContext(user, async () => {
    const where: any = { tenantId: user.tenantId };
    if (from || to) where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to)   where.createdAt.lte = new Date(to);

    const logs = await prisma.fuelLog.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        vehicle: { select: { licensePlate: true, make: true, model: true } },
      },
    });

    if (logs.length === 0) {
      throw new AppError( "NO_DATA", "No fuel logs found for the period",404);
    }

    const headers = [
      "Date",
      "Vehicle",
      "FuelType",
      "Station",
      "Litres",
      "PricePerLitre",
      "TotalCost",
      "Odometer",
      "Notes",
    ];

    const rows = logs.map((l) => [
      new Date(l.createdAt).toLocaleDateString("en-GB"),
      l.vehicle.licensePlate,
      l.fuelType,
      l.station ?? "",
      Number(l.litres).toFixed(2),
      Number(l.pricePerL).toFixed(3),
      Number(l.totalCost).toFixed(2),
      Number(l.odometerKm).toFixed(0),
      l.notes ?? "",
    ].map(escapeCsv).join(","));

    return [headers.join(","), ...rows].join("\n");
  });
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function escapeCsv(val: string | number): string {
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}