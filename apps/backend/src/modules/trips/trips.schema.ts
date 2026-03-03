import { t } from "elysia";

export const StartTripBody = t.Object({
  vehicleId: t.String(),
});

export const TripIdParam = t.Object({
  id: t.String(),
});

export const TripListQuery = t.Object({
  page:      t.Optional(t.Numeric({ minimum: 1 })),
  pageSize:  t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  vehicleId: t.Optional(t.String()),
  driverId:  t.Optional(t.String()),
  status:    t.Optional(t.Union([
    t.Literal("PENDING"),
    t.Literal("ACTIVE"),
    t.Literal("COMPLETED"),
    t.Literal("FORCE_ENDED"),
  ])),
  from: t.Optional(t.String()),
  to:   t.Optional(t.String()),
});