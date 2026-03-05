import { prisma } from "../../db/prisma";
import { injectTenantContext } from "../../middleware/auth.middleware";
import type { UserContext } from "../../types/context";
import { getCountry } from "../../config/countries";

export async function getRateCard(user: UserContext) {
  return injectTenantContext(user, async () => {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: user.tenantId },
    });
    const country = getCountry(tenant.countryCode);

    const rateCard = await prisma.rateCard.findUnique({
      where: { tenantId: user.tenantId },
    });

    return {
      ...(rateCard ?? {
        currency:     country.currency,
        ratePerKm:    1.50,
        baseCharge:   0,
        taxRate:      country.tax.defaultRate,
        taxLabel:     country.tax.label,
      }),
      currencySymbol: country.currencySymbol,
      distanceUnit:   country.distanceUnit,
      taxLabel:       country.tax.label,
    };
  });
}

export async function updateRateCard(
  user: UserContext,
  body: {
    ratePerKm?:     number;
    ratePerHour?:   number;
    baseCharge?:    number;
    waitingPerMin?: number;
    taxRate?:       number;
  }
) {
  return injectTenantContext(user, async () => {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: user.tenantId },
    });
    const country = getCountry(tenant.countryCode);

    return prisma.rateCard.upsert({
      where:  { tenantId: user.tenantId },
      create: {
        tenantId:  user.tenantId,
        currency:  country.currency,
        taxRate:   country.tax.defaultRate,
        taxLabel:  country.tax.label,
        ...body,
      },
      update: { ...body, updatedAt: new Date() },
    });
  });
}