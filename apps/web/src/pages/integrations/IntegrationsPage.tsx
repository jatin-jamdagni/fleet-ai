import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api, type VehicleWithDriver } from "../../lib/api";
import { Card, Badge, Button, Input, Spinner } from "../../components/ui";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useState } from "react";

type ApiErrorLike = {
    response?: { data?: { error?: { message?: string } } };
};

type WebhookCreateBody = {
    name: string;
    url: string;
    events: string[];
};

type WebhookDeliverySummary = {
    status: number;
    deliveredAt: string;
};

type WebhookEndpoint = {
    id: string;
    name: string;
    url: string;
    events: string[];
    active: boolean;
    createdAt: string;
    totalDeliveries: number;
    lastDelivery: WebhookDeliverySummary | null;
};

type WebhookEndpointCreated = WebhookEndpoint & {
    secret: string;
};

type WebhookTestResult = {
    status: number;
    durationMs: number;
    responseBody: string;
    success: boolean;
};

type WebhookDelivery = {
    id: string;
    event: string;
    status: number;
    durationMs: number | null;
    attempt: number;
    deliveredAt: string;
    responseBody: string | null;
};

type FuelLogCreateBody = {
    vehicleId: string;
    litres: number;
    pricePerL: number;
    odometerKm: number;
    fuelType?: string;
    station?: string;
    notes?: string;
};

type FuelSummaryVehicle = {
    vehicleId: string;
    licensePlate: string;
    make: string;
    model: string;
    totalLitres: string;
    totalCost: string;
    fillCount: number;
    lastFill: string | null;
    pctOfFleet: string;
};

type FuelSummary = {
    period: string;
    totalCost: string;
    totalLitres: string;
    vehicles: FuelSummaryVehicle[];
};

type FuelLog = {
    id: string;
    vehicleId: string;
    litres: number;
    pricePerL: number;
    totalCost: number;
    odometerKm: number;
    fuelType: string;
    station: string | null;
    notes: string | null;
    createdAt: string;
    vehicle: {
        licensePlate: string;
        make: string;
        model: string;
    };
};

type IntegrationProvider = "quickbooks" | "xero" | "google_maps";
type IntegrationConfig = Record<string, string>;

type IntegrationItem = {
    provider: IntegrationProvider;
    enabled: boolean;
    lastSyncAt: string | null;
    configured: boolean;
    config: IntegrationConfig | null;
};

type IntegrationSavePayload = {
    provider: IntegrationProvider;
    config: IntegrationConfig;
};

type ProviderField = { key: string; label: string; type?: string };
type ProviderMeta = { icon: string; name: string; desc: string; fields: ProviderField[] };

// ─── API helpers ──────────────────────────────────────────────────────────────

const webhookApi = {
    list: () => api.get("/webhooks").then((r) => r.data.data as WebhookEndpoint[]),
    events: () => api.get("/webhooks/events").then((r) => r.data.data as string[]),
    create: (b: WebhookCreateBody) => api.post("/webhooks", b).then((r) => r.data.data as WebhookEndpointCreated),
    test: (id: string) => api.post(`/webhooks/${id}/test`).then((r) => r.data.data as WebhookTestResult),
    toggle: (id: string, active: boolean) =>
        api.patch(`/webhooks/${id}`, { active }),
    delete: (id: string) => api.delete(`/webhooks/${id}`),
    deliveries: (id: string) => api.get(`/webhooks/${id}/deliveries`).then((r) => r.data.data as WebhookDelivery[]),
};

const fuelApi = {
    summary: (days: number) =>
        api.get(`/fuel?days=${days}`).then((r) => r.data.data as FuelSummary),
    logs: () => api.get("/fuel/logs").then((r) => r.data.data as FuelLog[]),
    log: (b: FuelLogCreateBody) => api.post("/fuel/logs", b).then((r) => r.data.data as FuelLog),
};

const integApi = {
    list: () => api.get("/integrations").then((r) => r.data.data as IntegrationItem[]),
    save: (provider: IntegrationProvider, config: IntegrationConfig, enabled = true) =>
        api.put(`/integrations/${provider}`, { config, enabled }),
    remove: (provider: IntegrationProvider) => api.delete(`/integrations/${provider}`),
    exportQb: (from?: string, to?: string) => {
        const q = new URLSearchParams();
        if (from) q.set("from", from);
        if (to) q.set("to", to);
        return api.get(`/integrations/export/quickbooks?${q}`, { responseType: "blob" });
    },
    exportXero: (from?: string, to?: string) => {
        const q = new URLSearchParams();
        if (from) q.set("from", from);
        if (to) q.set("to", to);
        return api.get(`/integrations/export/xero?${q}`, { responseType: "blob" });
    },
    exportFuel: () =>
        api.get("/integrations/export/fuel", { responseType: "blob" }),
};

// ─── CSV download helper ──────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

type Tab = "webhooks" | "fuel" | "accounting" | "integrations";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
    const qc = useQueryClient();
    const [tab, setTab] = useState<Tab>("webhooks");

    const TABS: { key: Tab; label: string }[] = [
        { key: "webhooks", label: "WEBHOOKS" },
        { key: "fuel", label: "FUEL TRACKING" },
        { key: "accounting", label: "ACCOUNTING EXPORT" },
        { key: "integrations", label: "INTEGRATIONS" },
    ];

    return (
        <div className="flex flex-col">
            <div className="px-6 py-5 border-b border-white/5">
                <h1 className="text-xl font-black text-white tracking-tight">
                    INTEGRATIONS
                </h1>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                    Webhooks, accounting exports, fuel tracking & third-party connections
                </p>
            </div>

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
                {tab === "webhooks" && <WebhooksTab qc={qc} />}
                {tab === "fuel" && <FuelTab qc={qc} />}
                {tab === "accounting" && <AccountingTab />}
                {tab === "integrations" && <IntegrationsTab qc={qc} />}
            </div>
        </div>
    );
}

// ─── WEBHOOKS TAB ─────────────────────────────────────────────────────────────

function WebhooksTab({ qc }: { qc: QueryClient }) {
    const [showCreate, setShowCreate] = useState(false);
    const [newEndpoint, setNewEndpoint] = useState<WebhookEndpointCreated | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", url: "", events: [] as string[] });

    const { data: endpoints = [], isLoading } = useQuery<WebhookEndpoint[]>({
        queryKey: ["webhooks"],
        queryFn: webhookApi.list,
    });

    const { data: supportedEvents = [] } = useQuery<string[]>({
        queryKey: ["webhook-events"],
        queryFn: webhookApi.events,
    });

    const { data: deliveries = [] } = useQuery<WebhookDelivery[]>({
        queryKey: ["webhook-deliveries", selectedId],
        queryFn: () => webhookApi.deliveries(selectedId!),
        enabled: !!selectedId,
    });

    const createMut = useMutation({
        mutationFn: webhookApi.create,
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["webhooks"] });
            setNewEndpoint(data);
            setShowCreate(false);
            setForm({ name: "", url: "", events: [] });
            toast.success("Webhook endpoint created");
        },
        onError: (err: ApiErrorLike) =>
            toast.error(err.response?.data?.error?.message ?? "Failed"),
    });

    const testMut = useMutation({
        mutationFn: (id: string) => webhookApi.test(id),
        onSuccess: (data) => {
            toast(data.success
                ? `✓ Ping delivered — ${data.status} in ${data.durationMs}ms`
                : `⚠ Delivery failed — ${data.status}`,
                { icon: data.success ? "✅" : "❌" }
            );
        },
    });

    const toggleMut = useMutation({
        mutationFn: ({ id, active }: { id: string; active: boolean }) =>
            webhookApi.toggle(id, active),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
    });

    const deleteMut = useMutation({
        mutationFn: webhookApi.delete,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["webhooks"] });
            toast.success("Endpoint deleted");
        },
    });

    return (
        <div className="max-w-3xl space-y-6">

            {/* New endpoint secret banner */}
            {newEndpoint && (
                <div className="border border-emerald-500/30 bg-emerald-500/5 p-5">
                    <div className="flex justify-between mb-3">
                        <p className="text-emerald-400 font-black text-sm">
                            ✓ Endpoint created — {newEndpoint.name}
                        </p>
                        <button
                            onClick={() => setNewEndpoint(null)}
                            className="text-slate-600 text-xs font-mono"
                        >
                            DISMISS
                        </button>
                    </div>
                    <p className="text-slate-500 font-mono text-xs mb-2">
                        ⚠ Save this signing secret. It will not be shown again.
                    </p>
                    <div className="flex items-center gap-3 bg-black/60 px-4 py-3
            border border-white/10">
                        <code className="text-amber-400 font-mono text-xs flex-1 break-all">
                            {newEndpoint.secret}
                        </code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(newEndpoint.secret);
                                toast.success("Copied");
                            }}
                            className="text-xs font-mono text-slate-500 hover:text-amber-400"
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
                        Create Webhook Endpoint
                    </h3>
                    <div className="space-y-4">
                        <Input
                            label="Name"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            placeholder="e.g. Slack Trip Alerts"
                        />
                        <Input
                            label="URL"
                            value={form.url}
                            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                            placeholder="https://hooks.example.com/fleet"
                        />
                        <div>
                            <label className="text-xs font-mono uppercase tracking-widest
                text-slate-500 block mb-2">
                                Events
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {supportedEvents.map((event: string) => (
                                    <label
                                        key={event}
                                        className="flex items-center gap-2 cursor-pointer px-3 py-2
                      border border-white/8 hover:border-white/20 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.events.includes(event)}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    events: e.target.checked
                                                        ? [...f.events, event]
                                                        : f.events.filter((ev) => ev !== event),
                                                }))
                                            }
                                            className="accent-amber-500"
                                        />
                                        <span className="text-xs font-mono text-slate-400">
                                            {event}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setShowCreate(false)}
                                className="flex-1 justify-center"
                            >
                                CANCEL
                            </Button>
                            <Button
                                loading={createMut.isPending}
                                onClick={() => {
                                    if (!form.name || !form.url || form.events.length === 0) {
                                        toast.error("Name, URL and at least one event required");
                                        return;
                                    }
                                    createMut.mutate(form);
                                }}
                                className="flex-1 justify-center"
                            >
                                CREATE ENDPOINT
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500">
                    Endpoints ({endpoints.length}/20)
                </h2>
                {!showCreate && (
                    <Button onClick={() => setShowCreate(true)}>+ ENDPOINT</Button>
                )}
            </div>

            {/* Endpoint list */}
            {isLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
            ) : endpoints.length === 0 ? (
                <div className="text-center py-12 text-slate-700 font-mono text-xs">
                    NO ENDPOINTS — CREATE ONE ABOVE
                </div>
            ) : (
                endpoints.map((ep) => (
                    <Card key={ep.id} noPad>
                        <div className="px-5 py-4 flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-white font-bold text-sm">{ep.name}</p>
                                    <Badge color={ep.active ? "green" : "slate"}>
                                        {ep.active ? "ACTIVE" : "PAUSED"}
                                    </Badge>
                                </div>
                                <p className="text-xs font-mono text-slate-500 truncate mb-2">
                                    {ep.url}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {ep.events.map((ev: string) => (
                                        <span
                                            key={ev}
                                            className="text-xs font-mono px-1.5 py-0.5 bg-white/5
                        text-slate-500 border border-white/8"
                                        >
                                            {ev}
                                        </span>
                                    ))}
                                </div>
                                {ep.lastDelivery && (
                                    <p className="text-xs font-mono text-slate-700 mt-2">
                                        Last:{" "}
                                        <span className={
                                            ep.lastDelivery.status >= 200 &&
                                                ep.lastDelivery.status < 300
                                                ? "text-emerald-700"
                                                : "text-red-700"
                                        }>
                                            {ep.lastDelivery.status}
                                        </span>{" "}
                                        · {ep.totalDeliveries} total
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">
                                <button
                                    onClick={() => testMut.mutate(ep.id)}
                                    className="text-xs font-mono text-slate-600 hover:text-amber-400
                    transition-colors"
                                >
                                    TEST
                                </button>
                                <button
                                    onClick={() =>
                                        setSelectedId(selectedId === ep.id ? null : ep.id)
                                    }
                                    className="text-xs font-mono text-slate-600 hover:text-white
                    transition-colors"
                                >
                                    {selectedId === ep.id ? "HIDE LOGS" : "LOGS"}
                                </button>
                                <button
                                    onClick={() =>
                                        toggleMut.mutate({ id: ep.id, active: !ep.active })
                                    }
                                    className="text-xs font-mono text-slate-600 hover:text-amber-400
                    transition-colors"
                                >
                                    {ep.active ? "PAUSE" : "ENABLE"}
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm(`Delete endpoint "${ep.name}"?`)) {
                                            deleteMut.mutate(ep.id);
                                        }
                                    }}
                                    className="text-xs font-mono text-red-800 hover:text-red-400
                    transition-colors"
                                >
                                    DELETE
                                </button>
                            </div>
                        </div>

                        {/* Delivery log */}
                        {selectedId === ep.id && (
                            <div className="border-t border-white/5">
                                {deliveries.length === 0 ? (
                                    <div className="px-5 py-4 text-slate-700 font-mono text-xs">
                                        No deliveries yet
                                    </div>
                                ) : (
                                    deliveries.slice(0, 10).map((d) => (
                                        <div
                                            key={d.id}
                                            className="px-5 py-3 border-b border-white/5 flex
                        items-center justify-between last:border-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs font-mono font-bold ${d.status >= 200 && d.status < 300
                                                        ? "text-emerald-400"
                                                        : "text-red-400"
                                                    }`}>
                                                    {d.status || "ERR"}
                                                </span>
                                                <span className="text-xs font-mono text-slate-500">
                                                    {d.event}
                                                </span>
                                                {d.attempt > 1 && (
                                                    <span className="text-xs font-mono text-amber-700">
                                                        attempt {d.attempt}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-mono text-slate-700">
                                                    {d.durationMs}ms
                                                </p>
                                                <p className="text-xs font-mono text-slate-800">
                                                    {format(new Date(d.deliveredAt), "MM/dd HH:mm")}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </Card>
                ))
            )}

            {/* Signature verification docs */}
            <Card>
                <h3 className="text-white font-black text-sm mb-3">
                    Verifying Signatures
                </h3>
                <pre className="text-xs font-mono text-slate-500 bg-black/60 p-4
          overflow-x-auto">
                    {`// Node.js verification example
const crypto = require('crypto');

function verifyFleetWebhook(body, signature, secret) {
  const parts = Object.fromEntries(
    signature.split(',').map(p => p.split('='))
  );
  const timestamp = Number(parts.t);
  const toSign    = \`\${timestamp}.\${body}\`;
  const expected  = crypto
    .createHmac('sha256', secret)
    .update(toSign)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(parts.v1, 'hex'),
    Buffer.from(expected, 'hex')
  );
}`}
                </pre>
            </Card>
        </div>
    );
}

// ─── FUEL TAB ─────────────────────────────────────────────────────────────────

function FuelTab({ qc }: { qc: QueryClient }) {
    const [days, setDays] = useState(30);
    const [showLog, setShowLog] = useState(false);
    const [form, setForm] = useState({
        vehicleId: "", litres: "", pricePerL: "",
        odometerKm: "", fuelType: "diesel", station: "", notes: "",
    });

    const { data: summary, isLoading: sumLoading } = useQuery<FuelSummary>({
        queryKey: ["fuel-summary", days],
        queryFn: () => fuelApi.summary(days),
    });

    const { data: logs = [], isLoading: logsLoading } = useQuery<FuelLog[]>({
        queryKey: ["fuel-logs"],
        queryFn: fuelApi.logs,
    });

    const { data: vehicles = [] } = useQuery<VehicleWithDriver[]>({
        queryKey: ["vehicles-list-for-fuel"],
        queryFn: () => api.get("/vehicles").then((r) => (r.data.data ?? []) as VehicleWithDriver[]),
        enabled: showLog,
    });

    const logMut = useMutation({
        mutationFn: fuelApi.log,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["fuel-summary"] });
            qc.invalidateQueries({ queryKey: ["fuel-logs"] });
            setShowLog(false);
            setForm({
                vehicleId: "", litres: "", pricePerL: "",
                odometerKm: "", fuelType: "diesel", station: "", notes: "",
            });
            toast.success("Fuel log saved");
        },
        onError: (err: ApiErrorLike) =>
            toast.error(err.response?.data?.error?.message ?? "Failed"),
    });

    return (
        <div className="max-w-3xl space-y-6">

            {/* Summary KPIs */}
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500">
                    Fleet Fuel — Last
                </h2>
                <div className="flex gap-1">
                    {[7, 30, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-3 py-1 text-xs font-mono border transition-colors ${days === d
                                    ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                                    : "border-white/8 text-slate-600"
                                }`}
                        >
                            {d}D
                        </button>
                    ))}
                </div>
            </div>

            {sumLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
            ) : (
                <>
                    <div className="grid grid-cols-3 gap-px bg-white/5">
                        {[
                            { label: "TOTAL SPEND", value: `$${summary?.totalCost ?? "0.00"}` },
                            { label: "TOTAL LITRES", value: `${summary?.totalLitres ?? "0.0"}L` },
                            { label: "VEHICLES", value: summary?.vehicles?.length ?? 0 },
                        ].map((s) => (
                            <div key={s.label} className="bg-black px-5 py-4">
                                <p className="text-xs font-mono uppercase tracking-widest
                  text-slate-600 mb-1">
                                    {s.label}
                                </p>
                                <p className="text-2xl font-black text-amber-400">{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Per-vehicle breakdown */}
                    <Card noPad>
                        <div className="px-4 py-3 border-b border-white/5 flex justify-between">
                            <span className="text-xs font-mono uppercase tracking-widest
                text-slate-600">
                                By Vehicle
                            </span>
                            <button
                                onClick={() => setShowLog(true)}
                                className="text-xs font-mono text-amber-400 hover:text-amber-300"
                            >
                                + LOG FILL-UP
                            </button>
                        </div>
                        {summary?.vehicles?.length === 0 ? (
                            <div className="py-8 text-center text-slate-700 font-mono text-xs">
                                NO FUEL LOGS YET
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        {["VEHICLE", "LITRES", "COST", "FILLS", "% FLEET"].map((h) => (
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
                                    {summary?.vehicles?.map((v) => (
                                        <tr
                                            key={v.vehicleId}
                                            className="border-b border-white/5 hover:bg-white/3"
                                        >
                                            <td className="px-4 py-3 font-mono font-bold text-amber-400">
                                                {v.licensePlate}
                                                <div className="text-xs text-slate-600 font-normal">
                                                    {v.make} {v.model}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-white">
                                                {v.totalLitres}L
                                            </td>
                                            <td className="px-4 py-3 font-mono text-white">
                                                ${v.totalCost}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-slate-400">
                                                {v.fillCount}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1 bg-white/5 flex-1">
                                                        <div
                                                            className="h-full bg-amber-500"
                                                            style={{ width: `${v.pctOfFleet}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-mono text-slate-600">
                                                        {v.pctOfFleet}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Card>
                </>
            )}

            {/* Recent fuel logs */}
            <Card noPad>
                <div className="px-4 py-3 border-b border-white/5 flex justify-between">
                    <span className="text-xs font-mono uppercase tracking-widest text-slate-600">
                        Recent Fill-Ups
                    </span>
                    <span className="text-xs font-mono text-slate-700">
                        {logs.length} total
                    </span>
                </div>
                {logsLoading ? (
                    <div className="flex justify-center py-8"><Spinner /></div>
                ) : logs.length === 0 ? (
                    <div className="py-8 text-center text-slate-700 font-mono text-xs">
                        NO FILL-UP LOGS YET
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5">
                                {["DATE", "VEHICLE", "LITRES", "COST", "ODOMETER", "STATION"].map((h) => (
                                    <th
                                        key={h}
                                        className="text-left px-4 py-3 text-xs font-mono tracking-widest text-slate-600"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {logs.slice(0, 10).map((log) => (
                                <tr key={log.id} className="border-b border-white/5 hover:bg-white/3">
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                        {format(new Date(log.createdAt), "MM/dd HH:mm")}
                                    </td>
                                    <td className="px-4 py-3 font-mono font-bold text-amber-400">
                                        {log.vehicle.licensePlate}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-white">
                                        {Number(log.litres).toFixed(1)}L
                                    </td>
                                    <td className="px-4 py-3 font-mono text-white">
                                        ${Number(log.totalCost).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-slate-400">
                                        {Number(log.odometerKm).toLocaleString()} km
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                        {log.station ?? "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>

            {/* Log fill-up form */}
            {showLog && (
                <Card>
                    <h3 className="text-white font-black text-sm mb-4">Log Fuel Fill-Up</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-mono uppercase tracking-widest
                text-slate-500 block mb-1.5">
                                Vehicle
                            </label>
                            <select
                                value={form.vehicleId}
                                onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
                                className="w-full bg-slate-900 border border-white/10 px-3 py-2
                  text-white font-mono text-sm"
                            >
                                <option value="">Select vehicle...</option>
                                {vehicles.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.licensePlate} — {v.make} {v.model}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Litres"
                            type="number"
                            value={form.litres}
                            onChange={(e) => setForm((f) => ({ ...f, litres: e.target.value }))}
                            placeholder="45.0"
                        />
                        <Input
                            label="Price per Litre"
                            type="number"
                            value={form.pricePerL}
                            onChange={(e) => setForm((f) => ({ ...f, pricePerL: e.target.value }))}
                            placeholder="1.85"
                        />
                        <Input
                            label="Odometer (km)"
                            type="number"
                            value={form.odometerKm}
                            onChange={(e) => setForm((f) => ({ ...f, odometerKm: e.target.value }))}
                            placeholder="15420"
                        />
                        <div>
                            <label className="text-xs font-mono uppercase tracking-widest
                text-slate-500 block mb-1.5">
                                Fuel Type
                            </label>
                            <select
                                value={form.fuelType}
                                onChange={(e) => setForm((f) => ({ ...f, fuelType: e.target.value }))}
                                className="w-full bg-slate-900 border border-white/10 px-3 py-2
                  text-white font-mono text-sm"
                            >
                                {["diesel", "petrol", "electric", "hybrid"].map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Station (optional)"
                            value={form.station}
                            onChange={(e) => setForm((f) => ({ ...f, station: e.target.value }))}
                            placeholder="Shell Main St"
                        />
                        <Input
                            label="Notes (optional)"
                            value={form.notes}
                            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                            placeholder="Full tank"
                        />
                    </div>

                    {form.litres && form.pricePerL && (
                        <div className="mt-3 px-4 py-2 bg-slate-900 border border-white/5
              text-xs font-mono text-amber-400">
                            Total cost:{" "}
                            ${(Number(form.litres) * Number(form.pricePerL)).toFixed(2)}
                        </div>
                    )}

                    <div className="flex gap-3 mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setShowLog(false)}
                            className="flex-1 justify-center"
                        >
                            CANCEL
                        </Button>
                        <Button
                            loading={logMut.isPending}
                            onClick={() => {
                                if (!form.vehicleId || !form.litres ||
                                    !form.pricePerL || !form.odometerKm) {
                                    toast.error("Fill in all required fields");
                                    return;
                                }
                                logMut.mutate({
                                    vehicleId: form.vehicleId,
                                    litres: Number(form.litres),
                                    pricePerL: Number(form.pricePerL),
                                    odometerKm: Number(form.odometerKm),
                                    fuelType: form.fuelType,
                                    station: form.station || undefined,
                                    notes: form.notes || undefined,
                                });
                            }}
                            className="flex-1 justify-center"
                        >
                            SAVE FILL-UP
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}

// ─── ACCOUNTING EXPORT TAB ────────────────────────────────────────────────────

function AccountingTab() {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [loading, setLoading] = useState<string | null>(null);

    const exportFile = async (
        type: "quickbooks" | "xero" | "fuel",
        filename: string
    ) => {
        setLoading(type);
        try {
            let res;
            if (type === "quickbooks") res = await integApi.exportQb(from || undefined, to || undefined);
            else if (type === "xero") res = await integApi.exportXero(from || undefined, to || undefined);
            else res = await integApi.exportFuel();

            downloadBlob(res.data as Blob, filename);
            toast.success(`${filename} downloaded`);
        } catch (err: unknown) {
            const apiErr = err as ApiErrorLike;
            toast.error(apiErr.response?.data?.error?.message ?? "Export failed");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="max-w-2xl space-y-6">

            {/* Date range */}
            <Card>
                <h3 className="text-white font-black text-sm mb-4">Date Range</h3>
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="From"
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                    />
                    <Input
                        label="To"
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                    />
                </div>
                <p className="text-xs font-mono text-slate-700 mt-2">
                    Leave blank to export all paid invoices
                </p>
            </Card>

            {/* Export buttons */}
            {[
                {
                    key: "quickbooks" as const,
                    icon: "📊",
                    name: "QuickBooks",
                    desc: "Exports paid invoices as QuickBooks Online import-ready CSV",
                    filename: `fleet-quickbooks-${Date.now()}.csv`,
                    color: "border-green-500/20 bg-green-500/5",
                },
                {
                    key: "xero" as const,
                    icon: "🔵",
                    name: "Xero",
                    desc: "Exports paid invoices in Xero import CSV format",
                    filename: `fleet-xero-${Date.now()}.csv`,
                    color: "border-blue-500/20 bg-blue-500/5",
                },
                {
                    key: "fuel" as const,
                    icon: "⛽",
                    name: "Fuel Expenses",
                    desc: "Export all fuel logs as an expense CSV",
                    filename: `fleet-fuel-expenses-${Date.now()}.csv`,
                    color: "border-amber-500/20 bg-amber-500/5",
                },
            ].map((exp) => (
                <div
                    key={exp.key}
                    className={`border p-5 flex items-center justify-between ${exp.color}`}
                >
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span>{exp.icon}</span>
                            <p className="text-white font-black text-sm">{exp.name}</p>
                        </div>
                        <p className="text-slate-500 text-xs font-mono">{exp.desc}</p>
                    </div>
                    <Button
                        loading={loading === exp.key}
                        onClick={() => exportFile(exp.key, exp.filename)}
                    >
                        ↓ EXPORT
                    </Button>
                </div>
            ))}

            {/* Format notes */}
            <Card>
                <h3 className="text-white font-black text-sm mb-3">Import Instructions</h3>
                <div className="space-y-3 text-xs font-mono text-slate-500">
                    <p>
                        <span className="text-slate-300">QuickBooks:</span>{" "}
                        Gear → Import Data → Invoices → Upload CSV
                    </p>
                    <p>
                        <span className="text-slate-300">Xero:</span>{" "}
                        Accounting → Invoices → Import → Choose file
                    </p>
                    <p>
                        <span className="text-slate-300">Fuel expenses:</span>{" "}
                        Import as expenses in your accounting package of choice.
                        Map columns manually to match your chart of accounts.
                    </p>
                </div>
            </Card>
        </div>
    );
}

// ─── INTEGRATIONS TAB ────────────────────────────────────────────────────────

function IntegrationsTab({ qc }: { qc: QueryClient }) {
    const { data: integrations = [], isLoading } = useQuery<IntegrationItem[]>({
        queryKey: ["integrations"],
        queryFn: integApi.list,
    });

    const saveMut = useMutation({
        mutationFn: ({ provider, config }: IntegrationSavePayload) =>
            integApi.save(provider, config),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["integrations"] });
            toast.success("Integration saved");
        },
        onError: (err: ApiErrorLike) =>
            toast.error(err.response?.data?.error?.message ?? "Failed"),
    });

    const removeMut = useMutation({
        mutationFn: (provider: IntegrationProvider) => integApi.remove(provider),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["integrations"] });
            toast.success("Integration removed");
        },
    });

    const providerMeta: Record<IntegrationProvider, ProviderMeta> = {
        google_maps: {
            icon: "🗺️",
            name: "Google Maps",
            desc: "Reverse geocode trip start/end points into readable addresses",
            fields: [
                { key: "apiKey", label: "API Key" },
            ],
        },
        quickbooks: {
            icon: "📊",
            name: "QuickBooks Online",
            desc: "Sync invoices to QuickBooks (OAuth2 flow — add credentials below)",
            fields: [
                { key: "clientId", label: "Client ID" },
                { key: "clientSecret", label: "Client Secret" },
                { key: "realmId", label: "Realm ID (Company ID)" },
            ],
        },
        xero: {
            icon: "🔵",
            name: "Xero",
            desc: "Export invoices to Xero via OAuth2",
            fields: [
                { key: "clientId", label: "Client ID" },
                { key: "clientSecret", label: "Client Secret" },
                { key: "tenantId", label: "Xero Tenant ID" },
            ],
        },
    };

    if (isLoading) {
        return <div className="flex justify-center py-16"><Spinner /></div>;
    }

    return (
        <div className="max-w-2xl space-y-4">
            {integrations.map((integ) => {
                const meta = providerMeta[integ.provider];
                if (!meta) return null;

                return (
                    <IntegrationCard
                        key={integ.provider}
                        integ={integ}
                        meta={meta}
                        onSave={(config) =>
                            saveMut.mutate({ provider: integ.provider, config })
                        }
                        onRemove={() => removeMut.mutate(integ.provider)}
                        saving={saveMut.isPending}
                    />
                );
            })}
        </div>
    );
}

function IntegrationCard({
    integ, meta, onSave, onRemove, saving,
}: {
    integ: IntegrationItem;
    meta: ProviderMeta;
    onSave: (config: IntegrationConfig) => void;
    onRemove: () => void;
    saving: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const [fields, setFields] = useState<Record<string, string>>(
        integ.config ?? {}
    );

    return (
        <Card>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{meta.icon}</span>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-white font-black text-sm">{meta.name}</p>
                            {integ.configured && (
                                <Badge color={integ.enabled ? "green" : "slate"}>
                                    {integ.enabled ? "CONNECTED" : "DISABLED"}
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs font-mono text-slate-500">{meta.desc}</p>
                    </div>
                </div>
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="text-xs font-mono text-slate-600 hover:text-white
            transition-colors ml-4"
                >
                    {expanded ? "COLLAPSE" : "CONFIGURE"}
                </button>
            </div>

            {expanded && (
                <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                    {meta.fields.map((f) => (
                        <Input
                            key={f.key}
                            label={f.label}
                            type={f.key.toLowerCase().includes("secret") ? "password" : "text"}
                            value={fields[f.key] ?? ""}
                            onChange={(e) =>
                                setFields((prev) => ({ ...prev, [f.key]: e.target.value }))
                            }
                            placeholder={
                                integ.config?.[f.key]
                                    ? "••••••••"
                                    : `Enter ${f.label.toLowerCase()}...`
                            }
                        />
                    ))}
                    <div className="flex gap-3">
                        {integ.configured && (
                            <Button
                                variant="danger"
                                onClick={onRemove}
                                className="justify-center"
                            >
                                REMOVE
                            </Button>
                        )}
                        <Button
                            loading={saving}
                            onClick={() => onSave(fields)}
                            className="flex-1 justify-center"
                        >
                            SAVE
                        </Button>
                    </div>
                    {integ.lastSyncAt && (
                        <p className="text-xs font-mono text-slate-700">
                            Last sync:{" "}
                            {format(new Date(integ.lastSyncAt), "MMM d, HH:mm")}
                        </p>
                    )}
                </div>
            )}
        </Card>
    );
}
