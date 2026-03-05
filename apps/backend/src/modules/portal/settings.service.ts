import { prisma } from "../../db/prisma";
import { injectTenantContext } from "../../middleware/auth.middleware";
import type { UserContext } from "../../types/context";

export interface BrandingUpdate {
  companyName?:   string;
  logoUrl?:       string;
  primaryColor?:  string;
  accentColor?:   string;
  customDomain?:  string;
  timezone?:      string;
  currency?:      string;
  distanceUnit?:  string;
  invoicePrefix?: string;
  invoiceFooter?: string;
  vatNumber?:     string;
  address?:       string;
}

// ─── Get settings ─────────────────────────────────────────────────────────────

export async function getSettings(user: UserContext) {
  return injectTenantContext(user, async () => {
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!settings) {
      // Return defaults if no settings saved yet
      return {
        companyName:   null,
        logoUrl:       null,
        primaryColor:  "#f59e0b",
        accentColor:   "#ffffff",
        customDomain:  null,
        timezone:      "UTC",
        currency:      "USD",
        distanceUnit:  "km",
        invoicePrefix: "INV",
        invoiceFooter: null,
        vatNumber:     null,
        address:       null,
      };
    }

    return settings;
  });
}

// ─── Upsert settings ──────────────────────────────────────────────────────────

export async function updateSettings(
  user: UserContext,
  body: BrandingUpdate
) {
  return injectTenantContext(user, async () => {
    // Validate hex colour format
    const hexRe = /^#[0-9a-fA-F]{6}$/;
    if (body.primaryColor && !hexRe.test(body.primaryColor)) {
      throw new Error("primaryColor must be a valid hex colour e.g. #f59e0b");
    }
    if (body.accentColor && !hexRe.test(body.accentColor)) {
      throw new Error("accentColor must be a valid hex colour");
    }

    // Validate custom domain format (no protocol, no path)
    if (body.customDomain) {
      const domainRe = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
      if (!domainRe.test(body.customDomain)) {
        throw new Error("customDomain must be a valid domain e.g. fleet.yourcompany.com");
      }
    }

    return prisma.tenantSettings.upsert({
      where:  { tenantId: user.tenantId },
      create: { tenantId: user.tenantId, ...body },
      update: { ...body, updatedAt: new Date() },
    });
  });
}

// ─── Resolve tenant by custom domain ─────────────────────────────────────────

export async function getTenantByDomain(domain: string) {
  return prisma.tenantSettings.findFirst({
    where:   { customDomain: domain },
    include: { tenant: true },
  });
}

// ─── Get public branding (no auth — for share pages) ─────────────────────────

export async function getPublicBranding(tenantId: string) {
  const settings = await prisma.tenantSettings.findUnique({
    where:  { tenantId },
    select: {
      companyName:  true,
      logoUrl:      true,
      primaryColor: true,
      accentColor:  true,
    },
  });

  const tenant = await prisma.tenant.findUnique({
    where:  { id: tenantId },
    select: { name: true },
  });

  return {
    companyName:  settings?.companyName ?? tenant?.name ?? "Fleet AI",
    logoUrl:      settings?.logoUrl     ?? null,
    primaryColor: settings?.primaryColor ?? "#f59e0b",
    accentColor:  settings?.accentColor  ?? "#ffffff",
  };
}