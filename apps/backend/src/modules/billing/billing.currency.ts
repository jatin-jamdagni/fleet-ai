import { prisma } from "../../db/prisma";
import { getCountry, calculateTax, formatCurrency } from "../../config/countries";

export interface InvoiceLineItem {
  description: string;
  quantity:    number;
  unitAmount:  number;
  amount:      number;
}

// ─── Build invoice with correct currency + tax for tenant's country ───────────

export async function buildInvoiceAmounts(
  tenantId:   string,
  distanceKm: number,
  durationMin: number
): Promise<{
  currency:    string;
  currencySymbol: string;
  lineItems:   InvoiceLineItem[];
  subtotal:    number;
  taxAmount:   number;
  taxLabel:    string;
  taxRate:     number;
  totalAmount: number;
  formatted:   {
    subtotal:    string;
    tax:         string;
    total:       string;
  };
}> {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where:   { id: tenantId },
    select:  { countryCode: true, currency: true },
  });

  const rateCard = await prisma.rateCard.findUnique({
    where: { tenantId },
  });

  const country = getCountry(tenant.countryCode);

  // Use distance units
  const distUnit  = country.distanceUnit;
  const distance  = distUnit === "mi"
    ? distanceKm * 0.621371
    : distanceKm;

  const ratePerUnit = rateCard?.ratePerKm   ?? defaultRatePerKm(tenant.countryCode);
  const baseCharge  = rateCard?.baseCharge  ?? 0;
  const ratePerHour = rateCard?.ratePerHour;
  const waitingRate = rateCard?.waitingPerMin;

  const lineItems: InvoiceLineItem[] = [];

  // Base charge
  if (baseCharge > 0) {
    lineItems.push({
      description: "Base charge",
      quantity:    1,
      unitAmount:  baseCharge,
      amount:      baseCharge,
    });
  }

  // Distance charge
  const distCharge = distance * ratePerUnit;
  lineItems.push({
    description: `Distance (${distance.toFixed(2)} ${distUnit} × ${
      formatCurrency(ratePerUnit, tenant.countryCode)
    }/${distUnit})`,
    quantity:   distance,
    unitAmount: ratePerUnit,
    amount:     distCharge,
  });

  // Time charge (if rate card has hourly rate)
  if (ratePerHour && durationMin > 0) {
    const hours      = durationMin / 60;
    const timeCharge = hours * ratePerHour;
    lineItems.push({
      description: `Duration (${durationMin} min × ${
        formatCurrency(ratePerHour, tenant.countryCode)
      }/hr)`,
      quantity:   hours,
      unitAmount: ratePerHour,
      amount:     timeCharge,
    });
  }

  const subtotal = lineItems.reduce((a, b) => a + b.amount, 0);
  const taxCalc  = calculateTax(subtotal, tenant.countryCode);

  return {
    currency:       country.currency,
    currencySymbol: country.currencySymbol,
    lineItems,
    subtotal:       Math.round(subtotal    * 100) / 100,
    taxAmount:      taxCalc.tax,
    taxLabel:       taxCalc.label,
    taxRate:        taxCalc.rate,
    totalAmount:    taxCalc.gross,
    formatted: {
      subtotal: formatCurrency(subtotal,       tenant.countryCode),
      tax:      formatCurrency(taxCalc.tax,    tenant.countryCode),
      total:    formatCurrency(taxCalc.gross,  tenant.countryCode),
    },
  };
}

function defaultRatePerKm(countryCode: string): number {
  const rates: Record<string, number> = {
    US: 1.50, IN: 50, AE: 3.50, GB: 1.20,
    AU: 2.20, ZA: 18, DE: 1.30, CA: 2.00, SG: 2.50, KE: 120,
  };
  return rates[countryCode] ?? 1.50;
}