import { prisma } from "../../db/prisma";
import { getPlanLimits, type PlanName } from "./saas.plans";
import { AppError } from "../../lib/errors";

// ─── Increment usage counter ──────────────────────────────────────────────────

export async function incrementUsage(
  tenantId: string,
  metric:   string,
  count:    number = 1
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.$executeRaw`
    INSERT INTO usage_logs (id, tenant_id, metric, count, date)
    VALUES (gen_random_uuid(), ${tenantId}, ${metric}, ${count}, ${today})
    ON CONFLICT (tenant_id, metric, date)
    DO UPDATE SET count = usage_logs.count + ${count}
  `;
}

// ─── Get today's usage ────────────────────────────────────────────────────────

export async function getTodayUsage(
  tenantId: string,
  metric:   string
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const row = await prisma.usageLog.findUnique({
    where: {
      tenantId_metric_date: {
        tenantId,
        metric,
        date: today,
      },
    },
  });

  return row?.count ?? 0;
}

// ─── Enforce plan limit ───────────────────────────────────────────────────────

export async function enforceLimit(
  tenantId:  string,
  plan:      PlanName,
  resource:  "vehicles" | "drivers" | "ai_query"
): Promise<void> {
  const limits = getPlanLimits(plan);

  switch (resource) {
    case "vehicles": {
      const count = await prisma.vehicle.count({
        where: { tenantId, deletedAt: null },
      });
      if (count >= limits.maxVehicles) {
        throw new AppError(
          "PLAN_LIMIT_REACHED",
          `Your ${plan} plan allows up to ${limits.maxVehicles} vehicles. Upgrade to add more.`,
          402
        );
      }
      break;
    }

    case "drivers": {
      const count = await prisma.user.count({
        where: { tenantId, role: "DRIVER", deletedAt: null },
      });
      if (count >= limits.maxDrivers) {
        throw new AppError(
          "PLAN_LIMIT_REACHED",
          `Your ${plan} plan allows up to ${limits.maxDrivers} drivers. Upgrade to add more.`,
          402
        );
      }
      break;
    }

    case "ai_query": {
      const todayCount = await getTodayUsage(tenantId, "ai_query");
      if (todayCount >= limits.aiQueriesPerDay) {
        throw new AppError(
          "AI_QUOTA_EXCEEDED",
          `Your ${plan} plan allows ${limits.aiQueriesPerDay} AI queries per day. Quota resets at midnight.`,
          402
        );
      }
      break;
    }
  }
}

// ─── Get full usage summary ───────────────────────────────────────────────────

export async function getUsageSummary(tenantId: string, plan: PlanName) {
  const limits = getPlanLimits(plan);

  const [vehicleCount, driverCount, aiTodayCount] = await Promise.all([
    prisma.vehicle.count({ where: { tenantId, deletedAt: null } }),
    prisma.user.count({ where: { tenantId, role: "DRIVER", deletedAt: null } }),
    getTodayUsage(tenantId, "ai_query"),
  ]);

  return {
    vehicles: {
      used:  vehicleCount,
      limit: limits.maxVehicles,
      pct:   Math.round((vehicleCount / limits.maxVehicles) * 100),
    },
    drivers: {
      used:  driverCount,
      limit: limits.maxDrivers,
      pct:   Math.round((driverCount / limits.maxDrivers) * 100),
    },
    aiQueriesDaily: {
      used:  aiTodayCount,
      limit: limits.aiQueriesPerDay,
      pct:   Math.round((aiTodayCount / limits.aiQueriesPerDay) * 100),
    },
  };
}
