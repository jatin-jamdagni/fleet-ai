import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const PlanStatus = t.Union(
  [
    t.Literal("ACTIVE"),
    t.Literal("PAST_DUE"),
    t.Literal("CANCELED"),
    t.Literal("TRIALING"),
  ],
  { additionalProperties: false },
);
