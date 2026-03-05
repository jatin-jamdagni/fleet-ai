import { t } from "elysia";

export const InvoiceIdParam = t.Object({
  id: t.String(),
});

export const UpdateInvoiceStatusBody = t.Object({
  status: t.Union([
    t.Literal("PAID"),
    t.Literal("VOID"),
  ]),
});

export const InvoiceListQuery = t.Object({
  page:      t.Optional(t.Numeric({ minimum: 1 })),
  pageSize:  t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  status:    t.Optional(t.Union([
    t.Literal("PENDING"),
    t.Literal("PAID"),
    t.Literal("VOID"),
  ])),
  vehicleId: t.Optional(t.String()),
  driverId:  t.Optional(t.String()),
  from:      t.Optional(t.String()),
  to:        t.Optional(t.String()),
});