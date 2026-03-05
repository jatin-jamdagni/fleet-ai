import { t } from "elysia";

export const CreateVehicleBody = t.Object({
  licensePlate: t.String({ minLength: 2, maxLength: 20 }),
  make: t.String({ minLength: 1, maxLength: 50 }),
  model: t.String({ minLength: 1, maxLength: 50 }),
  year: t.Number({ minimum: 1990, maximum: new Date().getFullYear() + 1 }),
  costPerKm: t.Number({ minimum: 0.01, maximum: 999 }),
  speedLimitKmh: t.Optional(t.Number({ minimum: 0, maximum: 300 })),

});

export const UpdateVehicleBody = t.Object({
  licensePlate: t.Optional(t.String({ minLength: 2, maxLength: 20 })),
  make: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
  model: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
  year: t.Optional(t.Number({ minimum: 1990, maximum: new Date().getFullYear() + 1 })),
  costPerKm: t.Optional(t.Number({ minimum: 0.01, maximum: 999 })),
  status: t.Optional(t.Union([
    t.Literal("ACTIVE"),
    t.Literal("INACTIVE"),
  ])),
  speedLimitKmh: t.Optional(t.Number({ minimum: 0, maximum: 300 })),

});

export const AssignDriverBody = t.Object({
  driverId: t.Nullable(t.String()),
});

export const VehicleListQuery = t.Object({
  page:     t.Optional(t.Numeric({ minimum: 1 })),
  pageSize: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  search:   t.Optional(t.String()),
  status:   t.Optional(t.Union([
    t.Literal("ACTIVE"),
    t.Literal("INACTIVE"),
    t.Literal("IN_TRIP"),
  ])),
});

export const VehicleIdParam = t.Object({
  id: t.String(),
});