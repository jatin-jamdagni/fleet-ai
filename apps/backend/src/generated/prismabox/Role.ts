import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const Role = t.Union(
  [t.Literal("SUPER_ADMIN"), t.Literal("FLEET_MANAGER"), t.Literal("DRIVER")],
  { additionalProperties: false },
);
