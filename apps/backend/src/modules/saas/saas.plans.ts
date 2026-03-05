import type { Plan as PrismaPlan } from "../../generated/prisma/enums";

export type PersistedPlanName = PrismaPlan;
export type PublicPlanName = "TRIAL" | "STARTER" | "PRO" | "ENTERPRISE";
export type CheckoutPlan = Exclude<PublicPlanName, "TRIAL">;
export type PlanName = PersistedPlanName | PublicPlanName;

export interface PlanLimits {
  maxVehicles:       number;
  maxDrivers:        number;
  aiQueriesPerDay:   number;
  analyticsRetention: number; // days
  customBranding:    boolean;
  apiAccess:         boolean;
  prioritySupport:   boolean;
}

const PLAN_LIMITS: Record<PersistedPlanName, PlanLimits> = {
  TRIAL: {
    maxVehicles:        3,
    maxDrivers:         5,
    aiQueriesPerDay:    20,
    analyticsRetention: 7,
    customBranding:     false,
    apiAccess:          false,
    prioritySupport:    false,
  },
  STARTER: {
    maxVehicles:        5,
    maxDrivers:         10,
    aiQueriesPerDay:    50,
    analyticsRetention: 30,
    customBranding:     false,
    apiAccess:          false,
    prioritySupport:    false,
  },
  PROFESSIONAL: {
    maxVehicles:        25,
    maxDrivers:         50,
    aiQueriesPerDay:    500,
    analyticsRetention: 90,
    customBranding:     true,
    apiAccess:          true,
    prioritySupport:    false,
  },
  ENTERPRISE: {
    maxVehicles:        9999,
    maxDrivers:         9999,
    aiQueriesPerDay:    9999,
    analyticsRetention: 365,
    customBranding:     true,
    apiAccess:          true,
    prioritySupport:    true,
  },
};

export const PLANS: Record<PublicPlanName, PlanLimits> = {
  TRIAL: PLAN_LIMITS.TRIAL,
  STARTER: PLAN_LIMITS.STARTER,
  PRO: PLAN_LIMITS.PROFESSIONAL,
  ENTERPRISE: PLAN_LIMITS.ENTERPRISE,
};

export const STRIPE_PRICE_IDS: Record<CheckoutPlan, string> = {
  STARTER:    process.env.STRIPE_PRICE_STARTER    ?? "",
  PRO:        process.env.STRIPE_PRICE_PRO        ?? "",
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE ?? "",
};

export function isCheckoutPlan(value: unknown): value is CheckoutPlan {
  return value === "STARTER" || value === "PRO" || value === "ENTERPRISE";
}

export function toPersistedPlan(plan: PlanName): PersistedPlanName {
  switch (plan) {
    case "PRO":
      return "PROFESSIONAL";
    case "TRIAL":
    case "STARTER":
    case "ENTERPRISE":
    case "PROFESSIONAL":
      return plan;
    default:
      return "TRIAL";
  }
}

export function toPublicPlan(plan: PlanName): PublicPlanName {
  const persisted = toPersistedPlan(plan);
  if (persisted === "PROFESSIONAL") return "PRO";
  return persisted;
}

export function getPlanLimits(plan: PlanName): PlanLimits {
  return PLAN_LIMITS[toPersistedPlan(plan)] ?? PLAN_LIMITS.TRIAL;
}

export function getPlanFromPriceId(priceId: string): PersistedPlanName {
  if (priceId === STRIPE_PRICE_IDS.STARTER) return "STARTER";
  if (priceId === STRIPE_PRICE_IDS.PRO) return "PROFESSIONAL";
  if (priceId === STRIPE_PRICE_IDS.ENTERPRISE) return "ENTERPRISE";
  return "STARTER";
}

export const TRIAL_DAYS = 14;
