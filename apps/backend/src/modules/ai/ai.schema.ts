import { t } from "elysia";

export const AskQuestionBody = t.Object({
  question:  t.String({ minLength: 3, maxLength: 1000 }),
  vehicleId: t.String(),
});

export const AILogListQuery = t.Object({
  page:      t.Optional(t.Numeric({ minimum: 1 })),
  pageSize:  t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  vehicleId: t.Optional(t.String()),
  driverId:  t.Optional(t.String()),
  from:      t.Optional(t.String()),
  to:        t.Optional(t.String()),
});

export const VehicleManualParam = t.Object({
  vehicleId: t.String(),
});