import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

interface ApiResponse<T> {
  data: T;
}

interface CountryListItem {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
}

interface CountryTaxConfig {
  label: string;
  defaultRate: number;
  idLabel: string;
  idPlaceholder: string;
}

interface CountryPlans {
  starter: number;
  pro: number;
  enterprise: number;
}

interface CountryConfig {
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

interface RegisterApiError {
  error?: {
    message?: string;
  };
}

const countryApi = {
  list: () =>
    axios
      .get<ApiResponse<CountryListItem[]>>(`${API}/countries`)
      .then((r) => r.data.data),
  get:  (code: string) =>
    axios
      .get<ApiResponse<CountryConfig>>(`${API}/countries/${code}`)
      .then((r) => r.data.data),
};

const FLEET_TYPES = [
  { value: "passenger",    label: "🚗 Passenger / Taxi" },
  { value: "cargo",        label: "📦 Cargo / Freight" },
  { value: "refrigerated", label: "🧊 Refrigerated / Cold Chain" },
  { value: "tanker",       label: "🛢 Tanker / Liquid Bulk" },
  { value: "construction", label: "🏗 Construction / Heavy" },
  { value: "logistics",    label: "🏭 3PL / Logistics" },
  { value: "mixed",        label: "🔀 Mixed Fleet" },
];

const CARGO_TYPES = [
  "general", "perishable", "hazmat",
  "fragile", "livestock", "bulk", "automotive",
];

const OPERATING_REGIONS = [
  { value: "domestic",      label: "Domestic" },
  { value: "cross_border",  label: "Cross-Border" },
  { value: "international", label: "International" },
];

type Step = 1 | 2 | 3 | 4;

interface FormState {
  // Step 1 — Account
  name:      string;
  email:     string;
  password:  string;
  orgName:   string;

  // Step 2 — Region
  countryCode:   string;
  phone:         string;
  address:       string;
  website:       string;
  taxId:         string;
  businessRegNo: string;

  // Step 3 — Fleet profile
  fleetType:        string;
  fleetSizeTarget:  string;
  annualKmTarget:   string;
  operatingRegions: string[];
  cargoTypes:       string[];

  // Step 4 — Logistics flags
  requiresBOL:      boolean;
  requiresPOD:      boolean;
  requiresWaybill:  boolean;
  requiresCustoms:  boolean;
  hasColdChain:     boolean;
  hasHazmat:        boolean;
  hasOverdimension: boolean;
}

type LogisticsFlagKey =
  | "requiresBOL"
  | "requiresPOD"
  | "requiresWaybill"
  | "requiresCustoms"
  | "hasColdChain"
  | "hasHazmat"
  | "hasOverdimension";

interface RegisterPayload extends Omit<FormState, "fleetSizeTarget" | "annualKmTarget"> {
  fleetSizeTarget?: number;
  annualKmTarget?: number;
}

const INIT: FormState = {
  name: "", email: "", password: "", orgName: "",
  countryCode: "US", phone: "", address: "",
  website: "", taxId: "", businessRegNo: "",
  fleetType: "mixed", fleetSizeTarget: "",
  annualKmTarget: "", operatingRegions: ["domestic"],
  cargoTypes: [], requiresBOL: false, requiresPOD: false,
  requiresWaybill: false, requiresCustoms: false,
  hasColdChain: false, hasHazmat: false, hasOverdimension: false,
};

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDot({
  n, current, label,
}: { n: Step; current: Step; label: string }) {
  const done    = n < current;
  const active  = n === current;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-8 h-8 flex items-center justify-center font-black
        text-sm font-mono transition-all ${
        done   ? "bg-emerald-500 text-black" :
        active ? "bg-amber-500 text-black"   :
        "bg-white/10 text-slate-600"
      }`}>
        {done ? "✓" : n}
      </div>
      <span className={`text-xs font-mono hidden sm:block ${
        active ? "text-amber-400" : "text-slate-700"
      }`}>
        {label}
      </span>
    </div>
  );
}

function StepLine({ done }: { done: boolean }) {
  return (
    <div className={`h-px flex-1 mx-2 transition-all ${
      done ? "bg-emerald-500/40" : "bg-white/8"
    }`} />
  );
}

// ─── Input helper ─────────────────────────────────────────────────────────────

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-mono uppercase tracking-widest
        text-slate-500 block mb-1.5">
        {label}{required && <span className="text-amber-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-slate-900 border border-white/10 px-3 py-2.5
        text-white font-mono text-sm focus:outline-none
        focus:border-amber-500/50 placeholder:text-slate-700"
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Register() {
  const navigate  = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(INIT);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  // Fetch country list
  const { data: countries = [] } = useQuery<CountryListItem[]>({
    queryKey: ["countries"],
    queryFn:  countryApi.list,
  });

  // Fetch selected country config reactively
  const { data: countryConfig } = useQuery<CountryConfig>({
    queryKey: ["country", form.countryCode],
    queryFn:  () => countryApi.get(form.countryCode),
    enabled:  !!form.countryCode,
  });
  const complianceDocs = countryConfig?.complianceDocs ?? [];

  const registerMut = useMutation({
    mutationFn: (body: RegisterPayload) =>
      axios.post(`${API}/auth/register`, body).then((r) => r.data),
    onSuccess: () => {
      toast.success("Account created! Check your email.");
      navigate("/login");
    },
    onError: (err: AxiosError<RegisterApiError>) => {
      toast.error(
        err.response?.data?.error?.message ?? "Registration failed",
      );
    },
  });

  const handleSubmit = () => {
    registerMut.mutate({
      ...form,
      fleetSizeTarget:  form.fleetSizeTarget ? Number(form.fleetSizeTarget) : undefined,
      annualKmTarget:   form.annualKmTarget   ? Number(form.annualKmTarget)  : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center
      justify-center px-4 py-12">

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-12 h-12 bg-amber-500 flex items-center justify-center
          font-black text-black text-xl mx-auto mb-3">
          F
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          FLEET AI
        </h1>
        <p className="text-xs font-mono text-slate-600 mt-1">
          Start your 14-day free trial
        </p>
      </div>

      {/* Step progress */}
      <div className="flex items-center w-full max-w-lg mb-8">
        <StepDot n={1} current={step} label="ACCOUNT" />
        <StepLine done={step > 1} />
        <StepDot n={2} current={step} label="REGION" />
        <StepLine done={step > 2} />
        <StepDot n={3} current={step} label="FLEET" />
        <StepLine done={step > 3} />
        <StepDot n={4} current={step} label="LOGISTICS" />
      </div>

      {/* Card */}
      <div className="w-full max-w-lg border border-white/8 bg-black/80 p-8">

        {/* ── STEP 1: Account ──────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-white font-black text-lg mb-5">
              Create Your Account
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Your Name" required>
                <TextInput
                  value={form.name}
                  onChange={(v) => set("name", v)}
                  placeholder="Jane Doe"
                />
              </Field>
              <Field label="Organisation" required>
                <TextInput
                  value={form.orgName}
                  onChange={(v) => set("orgName", v)}
                  placeholder="Acme Logistics"
                />
              </Field>
            </div>
            <Field label="Work Email" required>
              <TextInput
                type="email"
                value={form.email}
                onChange={(v) => set("email", v)}
                placeholder="you@company.com"
              />
            </Field>
            <Field label="Password" required>
              <TextInput
                type="password"
                value={form.password}
                onChange={(v) => set("password", v)}
                placeholder="Min 8 characters"
              />
            </Field>
          </div>
        )}

        {/* ── STEP 2: Region ───────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-white font-black text-lg mb-5">
              Region & Compliance
            </h2>

            <Field label="Country" required>
              <select
                value={form.countryCode}
                onChange={(e) => set("countryCode", e.target.value)}
                className="w-full bg-slate-900 border border-white/10 px-3 py-2.5
                  text-white font-mono text-sm focus:outline-none
                  focus:border-amber-500/50"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.currency})
                  </option>
                ))}
              </select>
            </Field>

            {/* Currency display */}
            {countryConfig && (
              <div className="px-4 py-3 bg-amber-500/5 border border-amber-500/20
                text-xs font-mono">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Currency</span>
                  <span className="text-amber-400 font-bold">
                    {countryConfig.currencySymbol} {countryConfig.currency}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">
                    {countryConfig.tax.label} Rate
                  </span>
                  <span className="text-white">
                    {countryConfig.tax.defaultRate > 0
                      ? `${(countryConfig.tax.defaultRate * 100).toFixed(0)}%`
                      : "N/A (varies by state)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Distance</span>
                  <span className="text-white">{countryConfig.distanceUnit}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone">
                <div className="flex">
                  <span className="px-3 py-2.5 bg-slate-800 border border-r-0
                    border-white/10 text-slate-500 font-mono text-sm">
                    {countryConfig?.phonePrefix ?? "+1"}
                  </span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="5551234567"
                    className="flex-1 bg-slate-900 border border-white/10 px-3
                      py-2.5 text-white font-mono text-sm focus:outline-none
                      focus:border-amber-500/50"
                  />
                </div>
              </Field>
              <Field label="Website">
                <TextInput
                  value={form.website}
                  onChange={(v) => set("website", v)}
                  placeholder="https://yourcompany.com"
                />
              </Field>
            </div>

            {countryConfig && (
              <>
                <Field label={countryConfig.tax.idLabel}>
                  <TextInput
                    value={form.taxId}
                    onChange={(v) => set("taxId", v)}
                    placeholder={countryConfig.tax.idPlaceholder}
                  />
                </Field>
                <Field label={countryConfig.businessIdLabel}>
                  <TextInput
                    value={form.businessRegNo}
                    onChange={(v) => set("businessRegNo", v)}
                    placeholder={`Your ${countryConfig.businessIdLabel}`}
                  />
                </Field>
              </>
            )}

            <Field label="Business Address">
              <TextInput
                value={form.address}
                onChange={(v) => set("address", v)}
                placeholder="123 Main St, City, Country"
              />
            </Field>

            {/* Compliance docs reminder */}
            {countryConfig && complianceDocs.length > 0 && (
              <div className="px-4 py-3 bg-slate-900 border border-white/5
                text-xs font-mono">
                <p className="text-slate-500 mb-2">
                  📋 Typical compliance docs for {countryConfig.name}:
                </p>
                <ul className="space-y-1">
                  {complianceDocs.map((doc) => (
                    <li key={doc} className="text-slate-600 flex items-center gap-1">
                      <span className="text-slate-700">—</span> {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Fleet profile ─────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-white font-black text-lg mb-5">
              Fleet Profile
            </h2>

            <Field label="Fleet Type" required>
              <div className="grid grid-cols-2 gap-2">
                {FLEET_TYPES.map((ft) => (
                  <button
                    key={ft.value}
                    type="button"
                    onClick={() => set("fleetType", ft.value)}
                    className={`px-3 py-2.5 text-left text-xs font-mono border
                      transition-colors ${
                      form.fleetType === ft.value
                        ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
                        : "border-white/8 text-slate-500 hover:text-white"
                    }`}
                  >
                    {ft.label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Target Fleet Size">
                <TextInput
                  type="number"
                  value={form.fleetSizeTarget}
                  onChange={(v) => set("fleetSizeTarget", v)}
                  placeholder="e.g. 25"
                />
              </Field>
              <Field label={`Avg km/vehicle/year`}>
                <TextInput
                  type="number"
                  value={form.annualKmTarget}
                  onChange={(v) => set("annualKmTarget", v)}
                  placeholder="e.g. 80000"
                />
              </Field>
            </div>

            <Field label="Operating Regions">
              <div className="flex gap-2">
                {OPERATING_REGIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => {
                      const curr = form.operatingRegions;
                      set(
                        "operatingRegions",
                        curr.includes(r.value)
                          ? curr.filter((v) => v !== r.value)
                          : [...curr, r.value]
                      );
                    }}
                    className={`px-3 py-2 text-xs font-mono border transition-colors ${
                      form.operatingRegions.includes(r.value)
                        ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
                        : "border-white/8 text-slate-500 hover:text-white"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Cargo Types (select all that apply)">
              <div className="flex flex-wrap gap-2">
                {CARGO_TYPES.map((ct) => (
                  <button
                    key={ct}
                    type="button"
                    onClick={() => {
                      const curr = form.cargoTypes;
                      set(
                        "cargoTypes",
                        curr.includes(ct)
                          ? curr.filter((v) => v !== ct)
                          : [...curr, ct]
                      );
                    }}
                    className={`px-2.5 py-1.5 text-xs font-mono border
                      transition-colors ${
                      form.cargoTypes.includes(ct)
                        ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
                        : "border-white/8 text-slate-500 hover:text-white"
                    }`}
                  >
                    {ct}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* ── STEP 4: Logistics flags ───────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-white font-black text-lg mb-2">
              Logistics Requirements
            </h2>
            <p className="text-xs font-mono text-slate-500 mb-5">
              Enables the right fields and workflows for your operation.
            </p>

            {[
              {
                key: "requiresBOL" as const,
                label: "Bill of Lading",
                desc: "Require BOL number on every trip",
              },
              {
                key: "requiresPOD" as const,
                label: "Proof of Delivery",
                desc: "Capture receiver signature + optional photo",
              },
              {
                key: "requiresWaybill" as const,
                label: "Waybill",
                desc: "Generate waybill numbers per consignment",
              },
              {
                key: "requiresCustoms" as const,
                label: "Customs Declaration",
                desc: "HS codes, origin/destination country for cross-border",
              },
              {
                key: "hasColdChain" as const,
                label: "Cold Chain / Refrigerated",
                desc: "Track min/max temperature per trip",
              },
              {
                key: "hasHazmat" as const,
                label: "Hazardous Materials (ADR/IMDG)",
                desc: "Unlock hazmat fields and compliance checks",
              },
              {
                key: "hasOverdimension" as const,
                label: "Overdimensional / Heavy Haulage",
                desc: "Permit tracking for oversized loads",
              },
            ].map((item: { key: LogisticsFlagKey; label: string; desc: string }) => (
              <div
                key={item.key}
                onClick={() =>
                  set(item.key, !form[item.key])
                }
                className={`flex items-center justify-between px-4 py-3.5 border
                  cursor-pointer transition-all ${
                  form[item.key]
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-white/8 hover:border-white/20"
                }`}
              >
                <div>
                  <p className={`text-sm font-bold transition-colors ${
                    form[item.key] ? "text-amber-400" : "text-slate-400"
                  }`}>
                    {item.label}
                  </p>
                  <p className="text-xs font-mono text-slate-600 mt-0.5">
                    {item.desc}
                  </p>
                </div>
                <div className={`w-10 h-5 transition-all shrink-0 ml-4 ${
                  form[item.key]
                    ? "bg-amber-500"
                    : "bg-white/10"
                }`}>
                  <div className={`w-5 h-5 bg-white transform transition-transform ${
                    form[item.key] ? "translate-x-5" : "translate-x-0"
                  }`} />
                </div>
              </div>
            ))}

            {/* Plan pricing for selected country */}
            {countryConfig && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-xs font-mono uppercase tracking-widest
                  text-slate-600 mb-3">
                  Pricing in {countryConfig.currency}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "STARTER", price: countryConfig.plans.starter },
                    { name: "PRO",     price: countryConfig.plans.pro     },
                    { name: "ENTERPRISE", price: countryConfig.plans.enterprise },
                  ].map((plan) => (
                    <div
                      key={plan.name}
                      className="border border-white/8 px-3 py-3 text-center"
                    >
                      <p className="text-xs font-mono text-slate-600">
                        {plan.name}
                      </p>
                      <p className="text-lg font-black text-amber-400 mt-1">
                        {countryConfig.currencySymbol}{plan.price.toLocaleString()}
                      </p>
                      <p className="text-xs font-mono text-slate-700">/mo</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs font-mono text-slate-700 mt-2 text-center">
                  {countryConfig.tax.defaultRate > 0
                    ? `${(countryConfig.tax.defaultRate * 100).toFixed(0)}% ${countryConfig.tax.label} added at checkout`
                    : "All prices excl. applicable taxes"
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="px-5 py-2.5 text-xs font-mono border border-white/10
                text-slate-500 hover:text-white transition-colors"
            >
              ← BACK
            </button>
          )}

          <button
            disabled={registerMut.isPending}
            onClick={() => {
              if (step < 4) {
                // Basic validation per step
                if (step === 1) {
                  if (!form.name || !form.email || !form.password || !form.orgName) {
                    toast.error("Please fill in all required fields");
                    return;
                  }
                  if (form.password.length < 8) {
                    toast.error("Password must be at least 8 characters");
                    return;
                  }
                }
                if (step === 2 && !form.countryCode) {
                  toast.error("Please select a country");
                  return;
                }
                setStep((s) => (s + 1) as Step);
              } else {
                handleSubmit();
              }
            }}
            className="flex-1 py-2.5 bg-amber-500 text-black font-black
              text-sm font-mono hover:bg-amber-400 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {registerMut.isPending
              ? "CREATING ACCOUNT..."
              : step < 4
                ? `CONTINUE →`
                : "CREATE ACCOUNT →"}
          </button>
        </div>

        {step === 1 && (
          <p className="text-center text-xs font-mono text-slate-700 mt-4">
            Already have an account?{" "}
            <a href="/login"
              className="text-amber-400 hover:text-amber-300">
              Sign in
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
