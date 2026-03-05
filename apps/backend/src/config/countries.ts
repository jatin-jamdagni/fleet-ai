// ─── Country master config ────────────────────────────────────────────────────
// Each entry drives: currency, tax label/rate, locale, distance unit,
// date format, phone prefix, business ID label, and compliance fields.

export interface CountryConfig {
    code: string;       // ISO 3166-1 alpha-2
    name: string;
    flag: string;
    currency: string;       // ISO 4217
    currencySymbol: string;
    currencyLocale: string;       // Intl.NumberFormat locale
    distanceUnit: "km" | "mi";
    timezone: string;       // Default TZ (tenant can override)
    dateFormat: string;       // date-fns format string
    phonePrefix: string;
    tax: {
        label: string;       // "GST" | "VAT" | "Sales Tax" | "None"
        defaultRate: number;       // 0–1  e.g. 0.18 for 18%
        inclusive: boolean;      // Is tax included in displayed price?
        idLabel: string;       // "GSTIN" | "TRN" | "EIN" | "VAT No."
        idRegex?: string;       // Validation pattern
        idPlaceholder: string;
        required: boolean;
    };
    businessIdLabel: string;     // "Company No." | "CIN" | "CR No."
    businessIdRegex?: string;
    complianceDocs: string[];   // Required docs typical for fleet ops
    stripePriceIds?: {             // Overridden per-country Stripe prices
        starter?: string;
        pro?: string;
        enterprise?: string;
    };
    plans: {                       // Localised monthly pricing
        starter: number;
        pro: number;
        enterprise: number;
    };
}

export const COUNTRIES: Record<string, CountryConfig> = {

    // ── United States ──────────────────────────────────────────────────────────
    US: {
        code: "US",
        name: "United States",
        flag: "🇺🇸",
        currency: "USD",
        currencySymbol: "$",
        currencyLocale: "en-US",
        distanceUnit: "mi",
        timezone: "America/New_York",
        dateFormat: "MM/dd/yyyy",
        phonePrefix: "+1",
        tax: {
            label: "Sales Tax",
            defaultRate: 0,            // Varies by state — no federal rate
            inclusive: false,
            idLabel: "EIN",
            idRegex: "^\\d{2}-\\d{7}$",
            idPlaceholder: "12-3456789",
            required: false,
        },
        businessIdLabel: "EIN / LLC No.",
        complianceDocs: ["DOT Number", "FMCSA Registration", "CDL", "Vehicle Title"],
        plans: { starter: 49, pro: 149, enterprise: 499 },
    },

    // ── India ──────────────────────────────────────────────────────────────────
    IN: {
        code: "IN",
        name: "India",
        flag: "🇮🇳",
        currency: "INR",
        currencySymbol: "₹",
        currencyLocale: "en-IN",
        distanceUnit: "km",
        timezone: "Asia/Kolkata",
        dateFormat: "dd/MM/yyyy",
        phonePrefix: "+91",
        tax: {
            label: "GST",
            defaultRate: 0.18,
            inclusive: false,
            idLabel: "GSTIN",
            idRegex: "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$",
            idPlaceholder: "22AAAAA0000A1Z5",
            required: true,
        },
        businessIdLabel: "CIN / LLPIN",
        businessIdRegex: "^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$",
        complianceDocs: [
            "RC Book", "National Permit", "Fitness Certificate",
            "Commercial Vehicle Insurance", "Driver DL (Transport)",
            "PUC Certificate",
        ],
        plans: { starter: 3999, pro: 11999, enterprise: 39999 },
    },

    // ── United Arab Emirates ───────────────────────────────────────────────────
    AE: {
        code: "AE",
        name: "United Arab Emirates",
        flag: "🇦🇪",
        currency: "AED",
        currencySymbol: "د.إ",
        currencyLocale: "ar-AE",
        distanceUnit: "km",
        timezone: "Asia/Dubai",
        dateFormat: "dd/MM/yyyy",
        phonePrefix: "+971",
        tax: {
            label: "VAT",
            defaultRate: 0.05,
            inclusive: false,
            idLabel: "TRN",
            idRegex: "^[0-9]{15}$",
            idPlaceholder: "100123456700003",
            required: true,
        },
        businessIdLabel: "CR No. (Commercial Registration)",
        complianceDocs: [
            "Trade Licence", "RTA Vehicle Registration",
            "UAE Transport Permit", "Vehicle Insurance",
            "Driver UAE Licence",
        ],
        plans: { starter: 179, pro: 549, enterprise: 1849 },
    },

    // ── United Kingdom ─────────────────────────────────────────────────────────
    GB: {
        code: "GB",
        name: "United Kingdom",
        flag: "🇬🇧",
        currency: "GBP",
        currencySymbol: "£",
        currencyLocale: "en-GB",
        distanceUnit: "mi",
        timezone: "Europe/London",
        dateFormat: "dd/MM/yyyy",
        phonePrefix: "+44",
        tax: {
            label: "VAT",
            defaultRate: 0.20,
            inclusive: false,
            idLabel: "VAT No.",
            idRegex: "^GB[0-9]{9}$",
            idPlaceholder: "GB123456789",
            required: false,
        },
        businessIdLabel: "Companies House No.",
        complianceDocs: [
            "Operator Licence (O-Licence)", "MOT Certificate",
            "Vehicle Registration (V5C)", "Goods Vehicle Operator Licence",
            "Driver CPC", "Tachograph Card",
        ],
        plans: { starter: 39, pro: 119, enterprise: 399 },
    },

    // ── Australia ──────────────────────────────────────────────────────────────
    AU: {
        code: "AU",
        name: "Australia",
        flag: "🇦🇺",
        currency: "AUD",
        currencySymbol: "A$",
        currencyLocale: "en-AU",
        distanceUnit: "km",
        timezone: "Australia/Sydney",
        dateFormat: "dd/MM/yyyy",
        phonePrefix: "+61",
        tax: {
            label: "GST",
            defaultRate: 0.10,
            inclusive: false,
            idLabel: "ABN",
            idRegex: "^[0-9]{2} [0-9]{3} [0-9]{3} [0-9]{3}$",
            idPlaceholder: "12 345 678 901",
            required: false,
        },
        businessIdLabel: "ACN / ABN",
        complianceDocs: [
            "Heavy Vehicle National Law Permit", "Vehicle Registration",
            "CTP Insurance", "Chain of Responsibility (CoR)",
        ],
        plans: { starter: 79, pro: 229, enterprise: 749 },
    },

    // ── South Africa ───────────────────────────────────────────────────────────
    ZA: {
        code: "ZA",
        name: "South Africa",
        flag: "🇿🇦",
        currency: "ZAR",
        currencySymbol: "R",
        currencyLocale: "en-ZA",
        distanceUnit: "km",
        timezone: "Africa/Johannesburg",
        dateFormat: "dd/MM/yyyy",
        phonePrefix: "+27",
        tax: {
            label: "VAT",
            defaultRate: 0.15,
            inclusive: false,
            idLabel: "VAT No.",
            idPlaceholder: "4123456789",
            required: false,
        },
        businessIdLabel: "CIPC Reg. No.",
        complianceDocs: [
            "NATIS Registration Certificate", "Operating Licence",
            "Cross-Border Permit", "Professional Driving Permit (PDP)",
        ],
        plans: { starter: 899, pro: 2699, enterprise: 8999 },
    },

    // ── Germany (EU) ──────────────────────────────────────────────────────────
    DE: {
        code: "DE",
        name: "Germany",
        flag: "🇩🇪",
        currency: "EUR",
        currencySymbol: "€",
        currencyLocale: "de-DE",
        distanceUnit: "km",
        timezone: "Europe/Berlin",
        dateFormat: "dd.MM.yyyy",
        phonePrefix: "+49",
        tax: {
            label: "MwSt. (VAT)",
            defaultRate: 0.19,
            inclusive: false,
            idLabel: "USt-IdNr.",
            idRegex: "^DE[0-9]{9}$",
            idPlaceholder: "DE123456789",
            required: false,
        },
        businessIdLabel: "HRB / HRA No.",
        complianceDocs: [
            "Zulassungsbescheinigung (Vehicle Registration)",
            "Güterkraftverkehrslizenz (Haulage Licence)",
            "ADR Certificate (if hazmat)", "Fahrerkarte (Driver Card)",
        ],
        plans: { starter: 45, pro: 135, enterprise: 449 },
    },

    // ── Canada ─────────────────────────────────────────────────────────────────
    CA: {
        code: "CA",
        name: "Canada",
        flag: "🇨🇦",
        currency: "CAD",
        currencySymbol: "CA$",
        currencyLocale: "en-CA",
        distanceUnit: "km",
        timezone: "America/Toronto",
        dateFormat: "yyyy-MM-dd",
        phonePrefix: "+1",
        tax: {
            label: "HST / GST",
            defaultRate: 0.13,      // Ontario HST; varies by province
            inclusive: false,
            idLabel: "GST/HST No.",
            idRegex: "^[0-9]{9}RT[0-9]{4}$",
            idPlaceholder: "123456789RT0001",
            required: false,
        },
        businessIdLabel: "BN (Business Number)",
        complianceDocs: [
            "CVOR Certificate", "NSC Number",
            "ELD Mandate", "Bill of Lading",
        ],
        plans: { starter: 65, pro: 199, enterprise: 649 },
    },

    // ── Singapore ──────────────────────────────────────────────────────────────
    SG: {
        code: "SG",
        name: "Singapore",
        flag: "🇸🇬",
        currency: "SGD",
        currencySymbol: "S$",
        currencyLocale: "en-SG",
        distanceUnit: "km",
        timezone: "Asia/Singapore",
        dateFormat: "dd/MM/yyyy",
        phonePrefix: "+65",
        tax: {
            label: "GST",
            defaultRate: 0.09,
            inclusive: false,
            idLabel: "GST Reg. No.",
            idPlaceholder: "M12345678X",
            required: false,
        },
        businessIdLabel: "UEN (Unique Entity No.)",
        complianceDocs: [
            "LTA Vehicle Registration", "Road Tax", "MIDAS Permit",
        ],
        plans: { starter: 65, pro: 199, enterprise: 649 },
    },

    // ── Kenya ──────────────────────────────────────────────────────────────────
    KE: {
        code: "KE",
        name: "Kenya",
        flag: "🇰🇪",
        currency: "KES",
        currencySymbol: "KSh",
        currencyLocale: "sw-KE",
        distanceUnit: "km",
        timezone: "Africa/Nairobi",
        dateFormat: "dd/MM/yyyy",
        phonePrefix: "+254",
        tax: {
            label: "VAT",
            defaultRate: 0.16,
            inclusive: false,
            idLabel: "KRA PIN",
            idPlaceholder: "A012345678Z",
            required: false,
        },
        businessIdLabel: "BRS Reg. No.",
        complianceDocs: [
            "NTSA Registration", "PSV/NFT Licence",
            "Good Conduct Certificate", "Speed Limiter Certificate",
        ],
        plans: { starter: 5999, pro: 17999, enterprise: 59999 },
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getCountry(code: string): CountryConfig {
    const fallback = COUNTRIES.IN;
    if (!fallback) {
        throw new Error("Default country configuration for US is missing");
    }
    return COUNTRIES[code.toUpperCase()] ?? fallback;
}

export function listCountries(): Array<Pick<CountryConfig,
    "code" | "name" | "flag" | "currency" | "currencySymbol"
    >> {
    return Object.values(COUNTRIES).map(
        ({ code, name, flag, currency, currencySymbol }) => ({
            code,
            name,
            flag,
            currency,
            currencySymbol,
        }),
    );
}

export function formatCurrency(
    amount: number,
    countryCode: string
): string {
    const cfg = getCountry(countryCode);
    try {
        return new Intl.NumberFormat(cfg.currencyLocale, {
            style: "currency",
            currency: cfg.currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${cfg.currencySymbol}${amount.toFixed(2)}`;
    }
}

export function calculateTax(
    amount: number,
    countryCode: string
): { net: number; tax: number; gross: number; label: string; rate: number } {
    const cfg = getCountry(countryCode);
    const rate = cfg.tax.defaultRate;

    if (rate === 0) {
        return { net: amount, tax: 0, gross: amount, label: cfg.tax.label, rate: 0 };
    }

    if (cfg.tax.inclusive) {
        const net = amount / (1 + rate);
        return {
            net: Math.round(net * 100) / 100,
            tax: Math.round((amount - net) * 100) / 100,
            gross: amount,
            label: cfg.tax.label,
            rate,
        };
    }

    const tax = amount * rate;
    return {
        net: amount,
        tax: Math.round(tax * 100) / 100,
        gross: Math.round((amount + tax) * 100) / 100,
        label: cfg.tax.label,
        rate,
    };
}
