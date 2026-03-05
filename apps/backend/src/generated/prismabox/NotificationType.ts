import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const NotificationType = t.Union(
  [
    t.Literal("TRIP_STARTED"),
    t.Literal("TRIP_ENDED"),
    t.Literal("TRIP_FORCE_ENDED"),
    t.Literal("INVOICE_GENERATED"),
    t.Literal("INVOICE_PAID"),
    t.Literal("VEHICLE_ASSIGNED"),
    t.Literal("DRIVER_INVITED"),
    t.Literal("PLAN_LIMIT_WARNING"),
    t.Literal("PAYMENT_FAILED"),
    t.Literal("SYSTEM"),
  ],
  { additionalProperties: false },
);
