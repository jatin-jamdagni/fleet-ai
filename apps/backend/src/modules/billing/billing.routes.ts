import Elysia from "elysia";
import { requireRole } from "../../middleware/auth.middleware";
import * as BillingService from "./billing.service";
import { generateInvoiceHTML } from "./billing.pdf";
import { AppError } from "../../lib/errors";
import { ok as okRes } from "../../lib/response";
import { prisma } from "../../db/prisma";
import {
  InvoiceIdParam,
  InvoiceListQuery,
  UpdateInvoiceStatusBody,
} from "./billing.schema";
import { Role } from "@fleet/shared";

function handleError(e: unknown, set: any) {
  if (e instanceof AppError) {
    set.status = e.statusCode;
    return {
      success: false,
      error: { code: e.code, message: e.message, statusCode: e.statusCode },
    };
  }
  console.error("[BillingRoute]", e);
  set.status = 500;
  return {
    success: false,
    error: { code: "INTERNAL", message: "Something went wrong", statusCode: 500 },
  };
}

export const billingRoutes = new Elysia({ prefix: "/invoices" })
  .use(requireRole(Role.FLEET_MANAGER, Role.SUPER_ADMIN))

  // ── GET /invoices/summary ───────────────────────────────────────────────────
  .get(
    "/summary",
    async ({ user, set }) => {
      try {
        const summary = await BillingService.getBillingSummary(user);
        return okRes(summary);
      } catch (e) { return handleError(e, set); }
    },
    {
      detail: {
        tags:    ["Billing"],
        summary: "Get billing summary stats (revenue, counts)",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ── GET /invoices ───────────────────────────────────────────────────────────
  .get(
    "/",
    async ({ user, query, set }) => {
      try {
        return await BillingService.listInvoices(user, query);
      } catch (e) { return handleError(e, set); }
    },
    {
      query: InvoiceListQuery,
      detail: {
        tags:    ["Billing"],
        summary: "List invoices with filters",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ── GET /invoices/:id ───────────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ user, params, set }) => {
      try {
        const invoice = await BillingService.getInvoice(user, params.id);
        return okRes(invoice);
      } catch (e) { return handleError(e, set); }
    },
    {
      params: InvoiceIdParam,
      detail: {
        tags:    ["Billing"],
        summary: "Get invoice detail",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ── PATCH /invoices/:id/status ──────────────────────────────────────────────
  .patch(
    "/:id/status",
    async ({ user, params, body, set }) => {
      try {
        const updated = await BillingService.updateInvoiceStatus(
          user,
          params.id,
          body.status
        );
        return okRes(updated);
      } catch (e) { return handleError(e, set); }
    },
    {
      params: InvoiceIdParam,
      body:   UpdateInvoiceStatusBody,
      detail: {
        tags:    ["Billing"],
        summary: "Update invoice status (PAID or VOID)",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ── GET /invoices/:id/pdf ───────────────────────────────────────────────────
  .get(
    "/:id/pdf",
    async ({ user, params, set }) => {
      try {
        // Load full invoice with all relations needed for PDF
        const invoice = await prisma.invoice.findFirst({
          where: { id: params.id, tenantId: user.tenantId },
          include: {
            trip: {
              select: { startTime: true, endTime: true },
            },
            vehicle: {
              select: { licensePlate: true, make: true, model: true, year: true },
            },
            tenant: {
              select: { name: true, slug: true },
            },
          },
        });

        if (!invoice) {
          set.status = 404;
          return {
            success: false,
            error: { code: "NOT_FOUND", message: "Invoice not found", statusCode: 404 },
          };
        }

        // Load driver separately (not in tenant-scoped invoice relation)
        const driver = await prisma.user.findUnique({
          where:  { id: invoice.driverId },
          select: { name: true, email: true },
        });

        const html = generateInvoiceHTML({
          id:          invoice.id,
          generatedAt: invoice.generatedAt,
          status:      invoice.status,
          distanceKm:  Number(invoice.distanceKm),
          costPerKm:   Number(invoice.costPerKm),
          totalAmount: Number(invoice.totalAmount),
          currency:    invoice.currency,
          paidAt:      invoice.paidAt,
          tenant:      invoice.tenant,
          vehicle:     invoice.vehicle as any,
          trip:        invoice.trip as any,
          driver:      driver ?? undefined,
        });

        // Return HTML — browser can print to PDF
        // In production: use Puppeteer or WeasyPrint to convert to actual PDF
        set.headers["Content-Type"]        = "text/html; charset=utf-8";
        set.headers["Content-Disposition"] = `inline; filename="invoice-${invoice.id.slice(-8).toUpperCase()}.html"`;

        return html;
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      params: InvoiceIdParam,
      detail: {
        tags:    ["Billing"],
        summary: "Get invoice as printable HTML (open in browser → Print → Save as PDF)",
        security: [{ bearerAuth: [] }],
      },
    }
  );