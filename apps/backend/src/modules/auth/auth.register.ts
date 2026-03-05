import { getCountry, calculateTax } from "../../config/countries";
import { prisma } from "../../db/prisma";

export interface RegisterBody {
    // Account
    name: string;
    email: string;
    password: string;
    orgName: string;

    // Region
    countryCode: string;
    phone?: string;
    website?: string;
    address?: string;
    taxId?: string;
    businessRegNo?: string;

    // Fleet classification
    fleetType?: string;
    fleetSizeTarget?: number;
    operatingRegions?: string[];
    cargoTypes?: string[];
    annualKmTarget?: number;

    // Logistics flags
    requiresBOL?: boolean;
    requiresPOD?: boolean;
    requiresWaybill?: boolean;
    requiresCustoms?: boolean;
    hasColdChain?: boolean;
    hasHazmat?: boolean;
    hasOverdimension?: boolean;
}

export async function registerTenant(body: RegisterBody) {
    const country = getCountry(body.countryCode);

    // Validate tax ID format if provided and regex exists
    if (body.taxId && country.tax.idRegex) {
        const re = new RegExp(country.tax.idRegex);
        if (!re.test(body.taxId)) {
            throw new Error(
                `Invalid ${country.tax.idLabel} format. Expected: ${country.tax.idPlaceholder}`
            );
        }
    }

    // Validate business reg no if provided
    if (body.businessRegNo && country.businessIdRegex) {
        const re = new RegExp(country.businessIdRegex);
        if (!re.test(body.businessRegNo)) {
            throw new Error(`Invalid ${country.businessIdLabel} format`);
        }
    }

    return prisma.$transaction(async (tx) => {

        // Create tenant with full regional + logistics profile
        const tenant = await tx.tenant.create({
            data: {
                name: body.orgName,
                countryCode: body.countryCode.toUpperCase(),
                currency: country.currency,
                taxId: body.taxId,
                businessRegNo: body.businessRegNo,
                phone: body.phone,
                website: body.website,

                slug: body.orgName.toLowerCase().replace(/\s+/g, "-") + "-" + Math.floor(1000 + Math.random() * 9000),
                // Fleet profile
                fleetType: body.fleetType ?? "mixed",
                fleetSizeTarget: body.fleetSizeTarget,
                operatingRegions: body.operatingRegions ?? ["domestic"],
                cargoTypes: body.cargoTypes ?? [],
                annualKmTarget: body.annualKmTarget,

                // Logistics flags
                requiresBOL: body.requiresBOL ?? false,
                requiresPOD: body.requiresPOD ?? false,
                requiresWaybill: body.requiresWaybill ?? false,
                requiresCustoms: body.requiresCustoms ?? false,
                hasColdChain: body.hasColdChain ?? false,
                hasHazmat: body.hasHazmat ?? false,
                hasOverdimension: body.hasOverdimension ?? false,
            },
        });

        // Seed tenant settings with country defaults
        await tx.tenantSettings.create({
            data: {
                tenantId: tenant.id,
                companyName: body.orgName,
                timezone: country.timezone,
                currency: country.currency,
                distanceUnit: country.distanceUnit,
                vatNumber: body.taxId,
                address: body.address,
                primaryColor: "#f59e0b",
                accentColor: "#ffffff",
                invoicePrefix: "INV",
            },
        });

        // Seed rate card with country-appropriate defaults
        await tx.rateCard.create({
            data: {
                tenantId: tenant.id,
                currency: country.currency,
                ratePerKm: defaultRatePerKm(body.countryCode),
                baseCharge: defaultBaseCharge(body.countryCode),
                taxRate: country.tax.defaultRate,
                taxLabel: country.tax.label,
            },
        });

        return tenant;
    });
}

// ─── Country-appropriate default rates ────────────────────────────────────────

function defaultRatePerKm(countryCode: string): number {
    const rates: Record<string, number> = {
        US: 1.50,   // USD
        IN: 50,     // INR  (~₹50/km for commercial)
        AE: 3.50,   // AED
        GB: 1.20,   // GBP
        AU: 2.20,   // AUD
        ZA: 18,     // ZAR
        DE: 1.30,   // EUR
        CA: 2.00,   // CAD
        SG: 2.50,   // SGD
        KE: 120,    // KES
    };
    return rates[countryCode.toUpperCase()] ?? 1.50;
}

function defaultBaseCharge(countryCode: string): number {
    const charges: Record<string, number> = {
        US: 5,
        IN: 150,
        AE: 15,
        GB: 4,
        AU: 8,
        ZA: 60,
        DE: 5,
        CA: 6,
        SG: 8,
        KE: 400,
    };
    return charges[countryCode.toUpperCase()] ?? 5;
}