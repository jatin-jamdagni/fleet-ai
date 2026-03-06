import axios from "axios";
import { FALLBACK_COUNTRIES } from "./constants";
import { API_ROOT, API_URL } from "../../lib/api";
import type {
  ApiResponse,
  CountryConfig,
  CountryListItem,
  RegisterPayload,
} from "./types";

export const API_V1 = API_URL;

function fallbackCountryConfig(code: string): CountryConfig {
  const item = FALLBACK_COUNTRIES.find((country) => country.code === code)
    ?? FALLBACK_COUNTRIES[0]!;

  return {
    code: item.code,
    name: item.name,
    currency: item.currency,
    currencySymbol: item.currencySymbol,
    phonePrefix: "+1",
    distanceUnit: "km",
    businessIdLabel: "Business Registration No.",
    tax: {
      label: "Tax",
      defaultRate: 0,
      idLabel: "Tax ID",
      idPlaceholder: "Tax identifier",
    },
    complianceDocs: [],
    plans: {
      starter: 49,
      pro: 149,
      enterprise: 399,
    },
  };
}

export const countryApi = {
  async list(): Promise<CountryListItem[]> {
    try {
      const res = await axios.get<ApiResponse<CountryListItem[]>>(`${API_V1}/countries`);
      return res.data.data;
    } catch {
      try {
        const res = await axios.get<ApiResponse<CountryListItem[]>>(`${API_ROOT}/countries`);
        return res.data.data;
      } catch {
        return FALLBACK_COUNTRIES;
      }
    }
  },

  async get(code: string): Promise<CountryConfig> {
    try {
      const res = await axios.get<ApiResponse<CountryConfig>>(`${API_V1}/countries/${code}`);
      return res.data.data;
    } catch {
      try {
        const res = await axios.get<ApiResponse<CountryConfig>>(`${API_ROOT}/countries/${code}`);
        return res.data.data;
      } catch {
        return fallbackCountryConfig(code);
      }
    }
  },
};

export const registerApi = {
  register: (payload: RegisterPayload) =>
    axios.post<ApiResponse<{ message?: string }>>(`${API_V1}/auth/register`, payload),
};
