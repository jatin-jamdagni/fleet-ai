import { t } from "elysia";

export const AnalyticsQuery = t.Object({
  from:   t.Optional(t.String()),
  to:     t.Optional(t.String()),
  period: t.Optional(
    t.Union([
      t.Literal("day"),
      t.Literal("week"),
      t.Literal("month"),
    ])
  ),
});