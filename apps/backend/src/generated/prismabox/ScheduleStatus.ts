import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const ScheduleStatus = t.Union(
  [
    t.Literal("PENDING"),
    t.Literal("NOTIFIED"),
    t.Literal("STARTED"),
    t.Literal("COMPLETED"),
    t.Literal("CANCELED"),
  ],
  { additionalProperties: false },
);
