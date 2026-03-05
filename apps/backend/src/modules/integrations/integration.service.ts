import { prisma } from "../../db/prisma";
import { injectTenantContext } from "../../middleware/auth.middleware";
import type { UserContext } from "../../types/context";

export const PROVIDERS = ["quickbooks", "xero", "google_maps"] as const;
export type Provider = (typeof PROVIDERS)[number];

// ─── Get all integration statuses ────────────────────────────────────────────

export async function listIntegrations(user: UserContext) {
  return injectTenantContext(user, async () => {
    const configs = await prisma.integrationConfig.findMany({
      where: { tenantId: user.tenantId },
    });

    const configMap = Object.fromEntries(
      configs.map((c) => [c.provider, c])
    );

    return PROVIDERS.map((provider) => {
      const cfg = configMap[provider];
      return {
        provider,
        enabled:    cfg?.enabled  ?? false,
        lastSyncAt: cfg?.lastSyncAt ?? null,
        configured: !!cfg,
        config:     cfg ? sanitizeConfig(provider, cfg.config as any) : null,
      };
    });
  });
}

// ─── Save integration config ──────────────────────────────────────────────────

export async function saveIntegration(
  user:     UserContext,
  provider: Provider,
  config:   Record<string, any>,
  enabled:  boolean = true
) {
  return injectTenantContext(user, async () => {
    return prisma.integrationConfig.upsert({
      where:  { tenantId_provider: { tenantId: user.tenantId, provider } },
      create: { tenantId: user.tenantId, provider, config, enabled },
      update: { config, enabled, updatedAt: new Date() },
    });
  });
}

// ─── Remove integration ───────────────────────────────────────────────────────

export async function removeIntegration(user: UserContext, provider: Provider) {
  return injectTenantContext(user, async () => {
    await prisma.integrationConfig.deleteMany({
      where: { tenantId: user.tenantId, provider },
    });
    return { removed: true };
  });
}

// ─── Sanitise — never expose secrets to frontend ─────────────────────────────

function sanitizeConfig(
  provider: string,
  config:   Record<string, any>
): Record<string, any> {
  const out = { ...config };

  // Mask sensitive fields
  const sensitiveKeys = ["clientSecret", "secret", "apiKey", "privateKey", "token"];
  for (const key of sensitiveKeys) {
    if (out[key]) out[key] = "••••••••";
  }

  return out;
}