import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const TripStatus = t.Union(
  [
    t.Literal("PENDING"),
    t.Literal("ACTIVE"),
    t.Literal("COMPLETED"),
    t.Literal("FORCE_ENDED"),
  ],
  { additionalProperties: false },
);
