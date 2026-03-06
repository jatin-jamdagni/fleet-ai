export interface ApiResponse<T> {
  data: T;
}

export interface CountryListItem {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
}

export interface CountryTaxConfig {
  label: string;
  defaultRate: number;
  idLabel: string;
  idPlaceholder: string;
}

export interface CountryPlans {
  starter: number;
  pro: number;
  enterprise: number;
}

export interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  phonePrefix: string;
  distanceUnit: string;
  businessIdLabel: string;
  tax: CountryTaxConfig;
  complianceDocs: string[];
  plans: CountryPlans;
}

export interface RegisterApiError {
  error?: {
    message?: string;
  };
}

export type Step = 1 | 2 | 3 | 4;

export interface FormState {
  name: string;
  email: string;
  password: string;
  orgName: string;
  countryCode: string;
  phone: string;
  address: string;
  website: string;
  taxId: string;
  businessRegNo: string;
  fleetType: string;
  fleetSizeTarget: string;
  annualKmTarget: string;
  operatingRegions: string[];
  cargoTypes: string[];
  requiresBOL: boolean;
  requiresPOD: boolean;
  requiresWaybill: boolean;
  requiresCustoms: boolean;
  hasColdChain: boolean;
  hasHazmat: boolean;
  hasOverdimension: boolean;
}

export type LogisticsFlagKey =
  | "requiresBOL"
  | "requiresPOD"
  | "requiresWaybill"
  | "requiresCustoms"
  | "hasColdChain"
  | "hasHazmat"
  | "hasOverdimension";

export interface RegisterPayload {
  tenantName: string;
  tenantSlug: string;
  name: string;
  email: string;
  password: string;
}

export type SetFormField = <K extends keyof FormState>(
  key: K,
  value: FormState[K]
) => void;
