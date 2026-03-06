import type { FormState, LogisticsFlagKey, Step } from "./types";

export const STEPS: Array<{ id: Step; label: string; hint: string }> = [
  { id: 1, label: "Account", hint: "Identity" },
  { id: 2, label: "Region", hint: "Compliance" },
  { id: 3, label: "Fleet", hint: "Operations" },
  { id: 4, label: "Logistics", hint: "Workflow" },
];

export const FLEET_TYPES = [
  { value: "passenger", label: "Passenger / Taxi" },
  { value: "cargo", label: "Cargo / Freight" },
  { value: "refrigerated", label: "Refrigerated / Cold Chain" },
  { value: "tanker", label: "Tanker / Liquid Bulk" },
  { value: "construction", label: "Construction / Heavy" },
  { value: "logistics", label: "3PL / Logistics" },
  { value: "mixed", label: "Mixed Fleet" },
];

export const CARGO_TYPES = [
  "general",
  "perishable",
  "hazmat",
  "fragile",
  "livestock",
  "bulk",
  "automotive",
];

export const OPERATING_REGIONS = [
  { value: "domestic", label: "Domestic" },
  { value: "cross_border", label: "Cross-border" },
  { value: "international", label: "International" },
];

export const LOGISTICS_OPTIONS: Array<{
  key: LogisticsFlagKey;
  label: string;
  description: string;
}> = [
    {
      key: "requiresBOL",
      label: "Bill of Lading",
      description: "Require BOL number on every trip",
    },
    {
      key: "requiresPOD",
      label: "Proof of Delivery",
      description: "Capture receiver signature and optional proof photo",
    },
    {
      key: "requiresWaybill",
      label: "Waybill",
      description: "Generate a waybill number per consignment",
    },
    {
      key: "requiresCustoms",
      label: "Customs Declaration",
      description: "Track HS codes and country-of-origin data",
    },
    {
      key: "hasColdChain",
      label: "Cold Chain",
      description: "Track min and max temperature for each route",
    },
    {
      key: "hasHazmat",
      label: "Hazmat",
      description: "Enable hazardous goods fields and checks",
    },
    {
      key: "hasOverdimension",
      label: "Overdimensional Loads",
      description: "Track permits for oversized or heavy haulage",
    },
  ];

export const FALLBACK_COUNTRIES = [
  {
    code: "IN",
    name: "India",
    flag: "IN",
    currency: "INR",
    currencySymbol: "Rs",
  },
  {
    code: "US",
    name: "United States",
    flag: "US",
    currency: "USD",
    currencySymbol: "$",
  },
  {
    code: "CA",
    name: "Canada",
    flag: "CA",
    currency: "CAD",
    currencySymbol: "$",
  },

  {
    code: "GB",
    name: "United Kingdom",
    flag: "GB",
    currency: "GBP",
    currencySymbol: "GBP",
  },
];

export const INIT_FORM: FormState = {
  name: "",
  email: "",
  password: "",
  orgName: "",
  countryCode: "IN",
  phone: "",
  address: "",
  website: "",
  taxId: "",
  businessRegNo: "",
  fleetType: "mixed",
  fleetSizeTarget: "",
  annualKmTarget: "",
  operatingRegions: ["domestic"],
  cargoTypes: [],
  requiresBOL: false,
  requiresPOD: false,
  requiresWaybill: false,
  requiresCustoms: false,
  hasColdChain: false,
  hasHazmat: false,
  hasOverdimension: false,
};
