import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const Plan = t.Union(
  [
    t.Literal("TRIAL"),
    t.Literal("STARTER"),
    t.Literal("PROFESSIONAL"),
    t.Literal("ENTERPRISE"),
  ],
  { additionalProperties: false },
);
