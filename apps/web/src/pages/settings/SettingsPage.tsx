import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Card, Button, Input, Badge, Spinner } from "../../components/ui";
import toast from "react-hot-toast";

type TenantSettings = {
  companyName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  customDomain: string | null;
  timezone: string | null;
  currency: string | null;
  distanceUnit: "km" | "mi" | null;
  invoicePrefix: string | null;
  invoiceFooter: string | null;
  vatNumber: string | null;
  address: string | null;
};

type BrandForm = {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  customDomain: string;
  timezone: string;
  currency: string;
  distanceUnit: "km" | "mi";
  invoicePrefix: string;
  invoiceFooter: string;
  vatNumber: string;
  address: string;
};

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  expiresAt: string | null;
  createdAt: string;
  lastUsedAt?: string | null;
  totalCalls?: number;
  isExpired?: boolean;
  key?: string;
  warning?: string;
};

type ApiKeyUsageRow = {
  endpoint: string;
  method: string;
  _count: { id: number };
};

type ShareLinkRow = {
  id: string;
  tripId: string;
  token: string;
  label: string | null;
  expiresAt: string | null;
  createdAt: string;
  viewCount: number;
  shareUrl: string;
  isExpired: boolean;
  trip: {
    id: string;
    status: string;
    startTime: string;
    distanceKm: string | number | null;
    vehicle: { licensePlate: string };
  };
};

type ApiError = {
  response?: { data?: { error?: { message?: string } } };
};

type RateCard = {
  ratePerKm: number | null;
  ratePerHour: number | null;
  baseCharge: number | null;
  waitingPerMin: number | null;
  taxRate: number | null;
  currency: string;
  currencySymbol: string;
  distanceUnit: "km" | "mi";
  taxLabel: string;
};

type RateCardForm = {
  ratePerKm: string;
  ratePerHour: string;
  baseCharge: string;
  waitingPerMin: string;
  taxRate: string;
};

type RateCardUpdatePayload = {
  ratePerKm: number;
  ratePerHour?: number;
  baseCharge: number;
  waitingPerMin?: number;
  taxRate: number;
};

function toBrandForm(settings?: TenantSettings | null): BrandForm {
  return {
    companyName: settings?.companyName ?? "",
    logoUrl: settings?.logoUrl ?? "",
    primaryColor: settings?.primaryColor ?? "#f59e0b",
    accentColor: settings?.accentColor ?? "#ffffff",
    customDomain: settings?.customDomain ?? "",
    timezone: settings?.timezone ?? "UTC",
    currency: settings?.currency ?? "USD",
    distanceUnit: settings?.distanceUnit === "mi" ? "mi" : "km",
    invoicePrefix: settings?.invoicePrefix ?? "INV",
    invoiceFooter: settings?.invoiceFooter ?? "",
    vatNumber: settings?.vatNumber ?? "",
    address: settings?.address ?? "",
  };
}

function toRateCardForm(rateCard?: RateCard | null): RateCardForm {
  return {
    ratePerKm: String(rateCard?.ratePerKm ?? ""),
    ratePerHour: String(rateCard?.ratePerHour ?? ""),
    baseCharge: String(rateCard?.baseCharge ?? ""),
    waitingPerMin: String(rateCard?.waitingPerMin ?? ""),
    taxRate: String((rateCard?.taxRate ?? 0) * 100),
  };
}

const settingsApi = {
  get: () => api.get("/settings").then((r) => r.data.data as TenantSettings),
  update: (b: Partial<TenantSettings>) => api.patch("/settings", b).then((r) => r.data.data as TenantSettings),
};
const rateCardApi = {
  get: () => api.get("/rate-card").then((r) => r.data.data as RateCard),
  update: (b: RateCardUpdatePayload) =>
    api.patch("/rate-card", b).then((r) => r.data.data as RateCard),
};


const apiKeyApi = {
  list: () => api.get("/api-keys").then((r) => r.data.data as ApiKey[]),
  create: (b: { name: string; scopes: string[]; expiresIn?: number }) =>
    api.post("/api-keys", b).then((r) => r.data.data as ApiKey),
  revoke: (id: string) => api.delete(`/api-keys/${id}`),
  usage: (id: string) => api.get(`/api-keys/${id}/usage`).then((r) => r.data.data as ApiKeyUsageRow[]),
};

const shareLinkApi = {
  list: () => api.get("/share-links").then((r) => r.data.data as ShareLinkRow[]),
  delete: (id: string) => api.delete(`/share-links/${id}`),
};

const ALL_SCOPES = [
  "trips:read", "trips:write",
  "vehicles:read", "vehicles:write",
  "invoices:read", "analytics:read",
];

type Tab = "branding" | "apikeys" | "sharelinks" | "ratecard";

export default function SettingsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("branding");

  // ── Branding ────────────────────────────────────────────────────────────────

  const { data: settings, isLoading: settingsLoading } = useQuery<TenantSettings>({
    queryKey: ["settings"],
    queryFn: settingsApi.get,
  });

  const baseBrandForm = useMemo(() => toBrandForm(settings), [settings]);
  const [brandForm, setBrandForm] = useState<BrandForm | null>(null);
  const form = brandForm ?? baseBrandForm;
  const updateBrandForm = (patch: Partial<BrandForm>) => {
    setBrandForm((f) => ({ ...(f ?? baseBrandForm), ...patch }));
  };

  const brandMut = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      setBrandForm(null);
      toast.success("Settings saved");
    },
    onError: (err: ApiError) => {
      toast.error(err.response?.data?.error?.message ?? "Save failed");
    },
  });

  // ── API Keys ─────────────────────────────────────────────────────────────────

  const { data: apiKeys = [], isLoading: keysLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: apiKeyApi.list,
    enabled: tab === "apikeys",
  });

  const [newKey, setNewKey] = useState<ApiKey | null>(null);
  const [keyName, setKeyName] = useState("");
  const [keyScopes, setKeyScopes] = useState<string[]>([]);
  const [keyExpiry, setKeyExpiry] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const createKeyMut = useMutation({
    mutationFn: apiKeyApi.create,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      setNewKey(data);
      setShowCreate(false);
      setKeyName(""); setKeyScopes([]); setKeyExpiry("");
    },
    onError: (err: ApiError) => {
      toast.error(err.response?.data?.error?.message ?? "Failed");
    },
  });

  const revokeKeyMut = useMutation({
    mutationFn: apiKeyApi.revoke,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Key revoked");
    },
  });

  // ── Share Links ───────────────────────────────────────────────────────────────

  const { data: shareLinks = [], isLoading: linksLoading } = useQuery({
    queryKey: ["share-links"],
    queryFn: shareLinkApi.list,
    enabled: tab === "sharelinks",
  });

  const deleteShareMut = useMutation({
    mutationFn: shareLinkApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["share-links"] });
      toast.success("Share link deleted");
    },
  });

  const TABS: { key: Tab; label: string }[] = [
    { key: "branding", label: "BRANDING" },
    { key: "apikeys", label: "API KEYS" },
    { key: "sharelinks", label: "SHARE LINKS" },
    { key: "ratecard", label: "RATE CARD" }

  ];

  return (
    <div className="flex flex-col">

      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5">
        <h1 className="text-xl font-black text-white tracking-tight">
          SETTINGS
        </h1>
        <p className="text-xs font-mono text-slate-500 mt-0.5">
          Organisation branding, API access & share links
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-3 text-xs font-mono tracking-widest transition-colors
              border-b-2 ${tab === t.key
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-slate-600 hover:text-slate-400"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">

        {/* ── BRANDING TAB ───────────────────────────────────────────────── */}
        {tab === "branding" && (
          settingsLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : (
            <div className="max-w-2xl space-y-8">

              {/* Preview */}
              <Card>
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-12 h-12 flex items-center justify-center
                      font-black text-black text-xl shrink-0"
                    style={{ background: form.primaryColor }}
                  >
                    {form.logoUrl ? (
                      <img
                        src={form.logoUrl}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      (form.companyName || "F").charAt(0)
                    )}
                  </div>
                  <div>
                    <p
                      className="font-black text-lg"
                      style={{ color: form.primaryColor }}
                    >
                      {form.companyName || "Your Company"}
                    </p>
                    <p className="text-xs font-mono text-slate-600">
                      Live preview
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Company Name"
                    value={form.companyName}
                    onChange={(e) => updateBrandForm({ companyName: e.target.value })}
                    placeholder="Acme Logistics"
                  />
                  <Input
                    label="Logo URL"
                    value={form.logoUrl}
                    onChange={(e) => updateBrandForm({ logoUrl: e.target.value })}
                    placeholder="https://cdn.example.com/logo.png"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest
                      text-slate-500 block mb-1.5">
                      Primary Colour
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.primaryColor}
                        onChange={(e) =>
                          updateBrandForm({ primaryColor: e.target.value })
                        }
                        className="w-10 h-10 cursor-pointer bg-transparent border-0"
                      />
                      <Input
                        value={form.primaryColor}
                        onChange={(e) =>
                          updateBrandForm({ primaryColor: e.target.value })
                        }
                        placeholder="#f59e0b"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest
                      text-slate-500 block mb-1.5">
                      Accent Colour
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.accentColor}
                        onChange={(e) => updateBrandForm({ accentColor: e.target.value })}
                        className="w-10 h-10 cursor-pointer bg-transparent border-0"
                      />
                      <Input
                        value={form.accentColor}
                        onChange={(e) => updateBrandForm({ accentColor: e.target.value })}
                        placeholder="#ffffff"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Regional */}
              <Card>
                <h3 className="text-white font-black text-sm mb-4">
                  Regional Settings
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest
                      text-slate-500 block mb-1.5">
                      Currency
                    </label>
                    <select
                      value={form.currency}
                      onChange={(e) => updateBrandForm({ currency: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 px-3 py-2
                        text-white font-mono text-sm"
                    >
                      {["USD", "EUR", "GBP", "AUD", "CAD", "INR", "ZAR"].map(
                        (c) => <option key={c} value={c}>{c}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest
                      text-slate-500 block mb-1.5">
                      Distance Unit
                    </label>
                    <select
                      value={form.distanceUnit}
                      onChange={(e) =>
                        updateBrandForm({ distanceUnit: e.target.value === "mi" ? "mi" : "km" })
                      }
                      className="w-full bg-slate-900 border border-white/10 px-3 py-2
                        text-white font-mono text-sm"
                    >
                      <option value="km">Kilometres (km)</option>
                      <option value="mi">Miles (mi)</option>
                    </select>
                  </div>
                  <Input
                    label="Timezone"
                    value={form.timezone}
                    onChange={(e) => updateBrandForm({ timezone: e.target.value })}
                    placeholder="UTC"
                  />
                </div>
              </Card>

              {/* Invoice */}
              <Card>
                <h3 className="text-white font-black text-sm mb-4">
                  Invoice Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Invoice Prefix"
                    value={form.invoicePrefix}
                    onChange={(e) => updateBrandForm({ invoicePrefix: e.target.value })}
                    placeholder="INV"
                  />
                  <Input
                    label="VAT Number"
                    value={form.vatNumber}
                    onChange={(e) => updateBrandForm({ vatNumber: e.target.value })}
                    placeholder="GB123456789"
                  />
                </div>
                <div className="mt-4">
                  <Input
                    label="Business Address"
                    value={form.address}
                    onChange={(e) => updateBrandForm({ address: e.target.value })}
                    placeholder="123 Fleet St, London, UK"
                  />
                </div>
                <div className="mt-4">
                  <label className="text-xs font-mono uppercase tracking-widest
                    text-slate-500 block mb-1.5">
                    Invoice Footer
                  </label>
                  <textarea
                    value={form.invoiceFooter}
                    onChange={(e) => updateBrandForm({ invoiceFooter: e.target.value })}
                    placeholder="Payment terms: Net 30. Thank you for your business."
                    className="w-full bg-slate-900 border border-white/10 px-3 py-2
                      text-white font-mono text-sm h-20 resize-none focus:outline-none
                      focus:border-amber-500/50"
                  />
                </div>
              </Card>

              {/* Custom domain */}
              <Card>
                <h3 className="text-white font-black text-sm mb-1">
                  Custom Domain
                </h3>
                <p className="text-xs font-mono text-slate-600 mb-4">
                  Point a CNAME to fleet.yourdomain.com to use your own domain.
                </p>
                <Input
                  label="Custom Domain"
                  value={form.customDomain}
                  onChange={(e) => updateBrandForm({ customDomain: e.target.value })}
                  placeholder="fleet.yourcompany.com"
                />
                <div className="mt-3 px-4 py-3 bg-slate-900 border border-white/5">
                  <p className="text-xs font-mono text-slate-600">
                    Add this CNAME record to your DNS:
                  </p>
                  <p className="text-xs font-mono text-amber-400 mt-1">
                    {form.customDomain || "fleet.yourcompany.com"} →{" "}
                    fleet.fleetai.app
                  </p>
                </div>
              </Card>

              <Button
                loading={brandMut.isPending}
                onClick={() => brandMut.mutate(form)}
                className="w-full justify-center"
              >
                SAVE SETTINGS
              </Button>
            </div>
          )
        )}

        {/* ── API KEYS TAB ────────────────────────────────────────────────── */}
        {tab === "apikeys" && (
          <div className="max-w-3xl space-y-6">

            {/* New key banner */}
            {newKey && (
              <div className="border border-emerald-500/30 bg-emerald-500/5 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-emerald-400 font-black text-sm">
                      ✓ API Key Created — {newKey.name}
                    </p>
                    <p className="text-slate-500 font-mono text-xs mt-0.5">
                      ⚠ Copy now. This key will not be shown again.
                    </p>
                  </div>
                  <button
                    onClick={() => setNewKey(null)}
                    className="text-slate-600 hover:text-white text-xs font-mono"
                  >
                    DISMISS
                  </button>
                </div>
                <div className="flex items-center gap-3 bg-black/60 px-4 py-3 border
                  border-white/10">
                  <code className="text-amber-400 font-mono text-sm flex-1 break-all">
                    {newKey.key}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newKey.key!);
                      toast.success("Copied");
                    }}
                    className="text-xs font-mono text-slate-500 hover:text-amber-400
                      transition-colors shrink-0"
                  >
                    COPY
                  </button>
                </div>
              </div>
            )}

            {/* Create form */}
            {showCreate && (
              <Card>
                <h3 className="text-white font-black text-sm mb-4">
                  Generate API Key
                </h3>
                <div className="space-y-4">
                  <Input
                    label="Key Name"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. QuickBooks Integration"
                  />

                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest
                      text-slate-500 block mb-2">
                      Scopes
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {ALL_SCOPES.map((scope) => (
                        <label
                          key={scope}
                          className="flex items-center gap-2 cursor-pointer
                            px-3 py-2 border border-white/8 hover:border-white/20
                            transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={keyScopes.includes(scope)}
                            onChange={(e) =>
                              setKeyScopes((prev) =>
                                e.target.checked
                                  ? [...prev, scope]
                                  : prev.filter((s) => s !== scope)
                              )
                            }
                            className="accent-amber-500"
                          />
                          <span className="text-xs font-mono text-slate-400">
                            {scope}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Input
                    label="Expires In (days, leave blank = never)"
                    type="number"
                    value={keyExpiry}
                    onChange={(e) => setKeyExpiry(e.target.value)}
                    placeholder="90"
                  />

                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setShowCreate(false)}
                      className="flex-1 justify-center"
                    >
                      CANCEL
                    </Button>
                    <Button
                      loading={createKeyMut.isPending}
                      onClick={() => {
                        if (!keyName || keyScopes.length === 0) {
                          toast.error("Name and at least one scope required");
                          return;
                        }
                        createKeyMut.mutate({
                          name: keyName,
                          scopes: keyScopes,
                          expiresIn: keyExpiry ? Number(keyExpiry) : undefined,
                        });
                      }}
                      className="flex-1 justify-center"
                    >
                      GENERATE KEY
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Key list */}
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono uppercase tracking-widest
                text-slate-500">
                Active Keys ({apiKeys.length}/10)
              </h2>
              {!showCreate && (
                <Button onClick={() => setShowCreate(true)}>
                  + NEW KEY
                </Button>
              )}
            </div>

            {keysLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-12 text-slate-700 font-mono text-xs">
                NO API KEYS — CREATE ONE ABOVE
              </div>
            ) : (
              <Card noPad>
                {apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className="px-5 py-4 border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-bold text-sm">
                            {k.name}
                          </p>
                          {k.isExpired && (
                            <Badge color="red">EXPIRED</Badge>
                          )}
                        </div>
                        <p className="text-xs font-mono text-slate-600">
                          {k.keyPrefix}••••••••
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {k.scopes.map((s: string) => (
                            <span
                              key={s}
                              className="text-xs font-mono px-1.5 py-0.5
                                bg-white/5 text-slate-500 border border-white/8"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-xs font-mono text-slate-600 mb-1">
                          {k.totalCalls} calls
                        </p>
                        {k.lastUsedAt && (
                          <p className="text-xs font-mono text-slate-700">
                            Last: {new Date(k.lastUsedAt).toLocaleDateString()}
                          </p>
                        )}
                        {k.expiresAt && (
                          <p className={`text-xs font-mono mt-1 ${k.isExpired ? "text-red-500" : "text-slate-700"
                            }`}>
                            Expires:{" "}
                            {new Date(k.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Revoke key "${k.name}"?`)) {
                              revokeKeyMut.mutate(k.id);
                            }
                          }}
                          className="text-xs font-mono text-red-700
                            hover:text-red-400 transition-colors mt-2 block"
                        >
                          REVOKE
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </Card>
            )}

            {/* API Docs link */}
            <div className="border border-white/5 px-5 py-4">
              <p className="text-xs font-mono text-slate-600">
                Base URL:{" "}
                <code className="text-amber-400">
                  {import.meta.env.VITE_API_URL?.replace("/api/v1", "") ?? "http://localhost:3000"}
                  /public/v1
                </code>
              </p>
              <p className="text-xs font-mono text-slate-700 mt-1">
                Auth: <code className="text-slate-500">
                  Authorization: Bearer flk_...
                </code>
              </p>
            </div>
          </div>
        )}

        {/* ── SHARE LINKS TAB ─────────────────────────────────────────────── */}
        {tab === "sharelinks" && (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-mono uppercase tracking-widest
                text-slate-500">
                Share Links
              </h2>
              <p className="text-xs font-mono text-slate-700">
                Create from the Trips page
              </p>
            </div>

            {linksLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : shareLinks.length === 0 ? (
              <div className="text-center py-12 text-slate-700 font-mono text-xs">
                NO SHARE LINKS YET — CREATE FROM TRIPS PAGE
              </div>
            ) : (
              <Card noPad>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["TRIP", "LABEL", "VIEWS", "EXPIRES", ""].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-mono
                            tracking-widest text-slate-600"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shareLinks.map((l) => (
                      <tr
                        key={l.id}
                        className={`border-b border-white/5 hover:bg-white/3 ${l.isExpired ? "opacity-50" : ""
                          }`}
                      >
                        <td className="px-4 py-3 font-mono text-amber-400">
                          {l.trip?.vehicle?.licensePlate ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {l.label ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-white">
                          {l.viewCount}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {l.expiresAt
                            ? new Date(l.expiresAt).toLocaleDateString()
                            : "Never"}
                          {l.isExpired && (
                            <span className="text-red-500 ml-1">EXPIRED</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(l.shareUrl);
                                toast.success("Copied");
                              }}
                              className="text-xs font-mono text-slate-600
                                hover:text-amber-400 transition-colors"
                            >
                              COPY
                            </button>
                            <a
                              href={l.shareUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-mono text-slate-600
                                hover:text-amber-400 transition-colors"
                            >
                              OPEN ↗
                            </a>
                            <button
                              onClick={() => deleteShareMut.mutate(l.id)}
                              className="text-xs font-mono text-red-700
                                hover:text-red-400 transition-colors"
                            >
                              DELETE
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}

        {tab === "ratecard" && (
          <RateCardTab />
        )}

      </div>
    </div>
  );
}



function RateCardTab() {
  const qc = useQueryClient();
  const { data: rc, isLoading } = useQuery<RateCard>({
    queryKey: ["rate-card"],
    queryFn:  rateCardApi.get,
  });
  const baseForm = useMemo(() => toRateCardForm(rc), [rc]);
  const [draftForm, setDraftForm] = useState<RateCardForm | null>(null);
  const form = draftForm ?? baseForm;
  const updateForm = (patch: Partial<RateCardForm>) => {
    setDraftForm((prev) => ({ ...(prev ?? baseForm), ...patch }));
  };

  const updateMut = useMutation({
    mutationFn: rateCardApi.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rate-card"] });
      setDraftForm(null);
      toast.success("Rate card saved");
    },
  });

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="max-w-lg space-y-6">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20
            text-amber-400 font-black font-mono text-sm">
            {rc?.currencySymbol} {rc?.currency}
          </div>
          <span className="text-xs font-mono text-slate-600">
            per {rc?.distanceUnit}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={`Rate per ${rc?.distanceUnit ?? "km"} (${rc?.currency})`}
            type="number"
            value={form.ratePerKm}
            onChange={(e) => updateForm({ ratePerKm: e.target.value })}
            placeholder="1.50"
          />
          <Input
            label="Base Charge"
            type="number"
            value={form.baseCharge}
            onChange={(e) => updateForm({ baseCharge: e.target.value })}
            placeholder="0.00"
          />
          <Input
            label="Rate per Hour (optional)"
            type="number"
            value={form.ratePerHour}
            onChange={(e) => updateForm({ ratePerHour: e.target.value })}
            placeholder="leave blank to disable"
          />
          <Input
            label="Waiting (per min, optional)"
            type="number"
            value={form.waitingPerMin}
            onChange={(e) => updateForm({ waitingPerMin: e.target.value })}
            placeholder="leave blank to disable"
          />
          <Input
            label={`${rc?.taxLabel ?? "Tax"} Rate (%)`}
            type="number"
            value={form.taxRate}
            onChange={(e) => updateForm({ taxRate: e.target.value })}
            placeholder={rc?.taxLabel === "GST" ? "18" : "0"}
          />
        </div>

        {/* Live preview */}
        {form.ratePerKm && (
          <div className="mt-4 px-4 py-3 bg-slate-900 border border-white/5
            text-xs font-mono space-y-1">
            <p className="text-slate-600">Sample — 50 {rc?.distanceUnit} trip</p>
            {Number(form.baseCharge) > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Base charge</span>
                <span className="text-white">
                  {rc?.currencySymbol}{Number(form.baseCharge).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">
                50 {rc?.distanceUnit} × {rc?.currencySymbol}{form.ratePerKm}
              </span>
              <span className="text-white">
                {rc?.currencySymbol}
                {(50 * Number(form.ratePerKm)).toFixed(2)}
              </span>
            </div>
            {Number(form.taxRate) > 0 && (() => {
              const subtotal = (50 * Number(form.ratePerKm)) +
                Number(form.baseCharge || 0);
              const tax = subtotal * (Number(form.taxRate) / 100);
              return (
                <>
                  <div className="flex justify-between text-amber-700">
                    <span>{rc?.taxLabel} ({form.taxRate}%)</span>
                    <span>{rc?.currencySymbol}{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-400 font-bold
                    border-t border-white/5 pt-1">
                    <span>TOTAL</span>
                    <span>
                      {rc?.currencySymbol}{(subtotal + tax).toFixed(2)}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        <Button
          loading={updateMut.isPending}
          onClick={() => updateMut.mutate({
            ratePerKm:    Number(form.ratePerKm),
            ratePerHour:  form.ratePerHour   ? Number(form.ratePerHour)   : undefined,
            baseCharge:   Number(form.baseCharge),
            waitingPerMin: form.waitingPerMin ? Number(form.waitingPerMin) : undefined,
            taxRate:      Number(form.taxRate) / 100,
          })}
          className="w-full justify-center mt-4"
        >
          SAVE RATE CARD
        </Button>
      </Card>
    </div>
  );
}
