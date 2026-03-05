import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { api } from "../../lib/api";
import { Card, Badge, Spinner } from "../../components/ui";

type SafetyScoreBreakdown = Record<string, number>;

type LeaderboardRow = {
    rank: number;
    driverId: string;
    driverName: string;
    email: string;
    avgScore: number;
    totalTrips: number;
    totalDistance: string;
    totalSpeeding: number;
    totalHours: string;
    grade: string;
};

type DriverScorePoint = {
    date: string | Date;
    score: number;
    trips: number;
    distanceKm: string;
    speedingEvents: number;
    hoursOnRoad: string;
    breakdown: SafetyScoreBreakdown;
};

type DriverScoreSummary = {
    currentScore: number | null;
    avgScore: number | null;
    trend: number | null;
    scores: DriverScorePoint[];
    totalTrips: number;
    totalDistanceKm: string;
    totalSpeedingEvents: number;
    totalHoursOnRoad: string;
};

type HosStatus = "OK" | "WARNING" | "OVER_LIMIT";

type HosDriverRow = {
    driverId: string;
    driverName: string;
    email: string;
    todayMin: number;
    todayHours: string;
    limitHours: string;
    pct: number;
    status: HosStatus;
};

type MaintenanceRow = {
    vehicleId: string;
    licensePlate: string;
    make: string;
    model: string;
    odometerKm: string;
    maintenanceDueKm: string | null;
    kmUntilService: string | null;
    isDue: boolean;
    urgency: "OVERDUE" | "SOON" | "OK";
    lastServiceType: string | null;
    lastServiceAt: string | null;
};

type DocumentRow = {
    id: string;
    entityType: string;
    entityId: string;
    docType: string;
    label: string;
    expiresAt: string | null;
    expiryStatus: string;
};

const safetyApi = {
    leaderboard: (days: number) =>
        api.get(`/safety/scores?days=${days}`).then((r) => r.data.data as LeaderboardRow[]),
    driverScore: (id: string, days: number) =>
        api.get(`/safety/scores/${id}?days=${days}`).then((r) => r.data.data as DriverScoreSummary),
    hosAll: () =>
        api.get("/safety/hos").then((r) => r.data.data as HosDriverRow[]),
    fleetMaint: () =>
        api.get("/maintenance/fleet").then((r) => r.data.data as MaintenanceRow[]),
    documents: () =>
        api.get("/maintenance/documents").then((r) => r.data.data as DocumentRow[]),
};

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number | null }) {
    if (score === null) return (
        <span className="text-slate-600 font-mono text-sm">—</span>
    );

    const color = score >= 90 ? "text-emerald-400"
        : score >= 75 ? "text-amber-400"
            : score >= 60 ? "text-orange-400"
                : "text-red-400";

    const grade = score >= 90 ? "A"
        : score >= 80 ? "B"
            : score >= 70 ? "C"
                : score >= 60 ? "D"
                    : "F";

    return (
        <div className="flex items-center gap-2">
            <span className={`text-2xl font-black font-mono ${color}`}>
                {score}
            </span>
            <span className={`text-xs font-black px-1.5 py-0.5 border ${score >= 90
                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                    : score >= 75
                        ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                        : "border-red-500/30 text-red-400 bg-red-500/10"
                }`}>
                {grade}
            </span>
        </div>
    );
}

// ─── HOS bar ─────────────────────────────────────────────────────────────────

function HosBar({ pct, status }: { pct: number; status: string }) {
    const color = status === "OVER_LIMIT" ? "#ef4444"
        : status === "WARNING" ? "#f59e0b"
            : "#10b981";
    return (
        <div className="h-1.5 bg-white/5 w-full">
            <div
                className="h-full transition-all"
                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
            />
        </div>
    );
}

// ─── Urgency badge ────────────────────────────────────────────────────────────

function UrgencyBadge({ urgency }: { urgency: string }) {
    return (
        <Badge color={
            urgency === "OVERDUE" ? "red" :
                urgency === "SOON" ? "amber" : "green"
        }>
            {urgency}
        </Badge>
    );
}

// ─── Document expiry badge ────────────────────────────────────────────────────

function ExpiryBadge({ status }: { status: string }) {
    const map: Record<string, { color: "red" | "amber" | "green" | "slate"; label: string }> = {
        expired: { color: "red", label: "EXPIRED" },
        critical: { color: "red", label: "< 7 DAYS" },
        warning: { color: "amber", label: "< 30 DAYS" },
        ok: { color: "green", label: "OK" },
        none: { color: "slate", label: "NO EXPIRY" },
    };
    const { color, label } = map[status] ?? { color: "slate", label: "—" };
    return <Badge color={color}>{label}</Badge>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "scores" | "hos" | "maintenance" | "documents";

export default function SafetyPage() {
    const [tab, setTab] = useState<Tab>("scores");
    const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
    const [days, setDays] = useState(30);

    const { data: leaderboard = [], isLoading: ldLoading } = useQuery<LeaderboardRow[]>({
        queryKey: ["safety-leaderboard", days],
        queryFn: () => safetyApi.leaderboard(days),
        enabled: tab === "scores",
    });

    const { data: driverScore } = useQuery<DriverScoreSummary>({
        queryKey: ["driver-score", selectedDriver, days],
        queryFn: () => safetyApi.driverScore(selectedDriver!, days),
        enabled: !!selectedDriver && tab === "scores",
    });

    const { data: hosData = [], isLoading: hosLoading } = useQuery<HosDriverRow[]>({
        queryKey: ["hos-all"],
        queryFn: safetyApi.hosAll,
        enabled: tab === "hos",
        refetchInterval: 60_000,
    });

    const { data: maintData = [], isLoading: maintLoading } = useQuery<MaintenanceRow[]>({
        queryKey: ["fleet-maint"],
        queryFn: safetyApi.fleetMaint,
        enabled: tab === "maintenance",
    });

    const { data: documents = [], isLoading: docsLoading } = useQuery<DocumentRow[]>({
        queryKey: ["documents"],
        queryFn: safetyApi.documents,
        enabled: tab === "documents",
    });

    const TABS: { key: Tab; label: string }[] = [
        { key: "scores", label: "DRIVER SCORES" },
        { key: "hos", label: "HOURS OF SERVICE" },
        { key: "maintenance", label: "MAINTENANCE" },
        { key: "documents", label: "DOCUMENTS" },
    ];

    return (
        <div className="flex flex-col">

            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5">
                <h1 className="text-xl font-black text-white tracking-tight">SAFETY</h1>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                    Driver compliance & fleet safety monitoring
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => { setTab(t.key); setSelectedDriver(null); }}
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

                {/* ── DRIVER SCORES TAB ──────────────────────────────────────────── */}
                {tab === "scores" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Leaderboard */}
                        <div className="lg:col-span-1">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xs font-mono uppercase tracking-widest
                  text-slate-500">
                                    Leaderboard
                                </h2>
                                <div className="flex">
                                    {[7, 30, 90].map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setDays(d)}
                                            className={`px-2 py-1 text-xs font-mono border-y border-r
                        first:border-l transition-colors ${days === d
                                                    ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                                                    : "border-white/8 text-slate-600"
                                                }`}
                                        >
                                            {d}D
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {ldLoading ? (
                                <div className="flex justify-center py-8"><Spinner /></div>
                            ) : (
                                <Card noPad>
                                    {leaderboard.length === 0 ? (
                                        <div className="text-center py-8 text-slate-700 font-mono text-xs">
                                            NO SCORE DATA
                                        </div>
                                    ) : (
                                        leaderboard.map((d) => (
                                            <div
                                                key={d.driverId}
                                                onClick={() => setSelectedDriver(d.driverId)}
                                                className={`px-4 py-3 border-b border-white/5 cursor-pointer
                          transition-colors hover:bg-white/3 ${selectedDriver === d.driverId ? "bg-amber-500/5" : ""
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`font-black font-mono w-5 text-sm ${d.rank === 1 ? "text-amber-400"
                                                                : d.rank === 2 ? "text-slate-300"
                                                                    : d.rank === 3 ? "text-amber-700"
                                                                        : "text-slate-600"
                                                            }`}>
                                                            {d.rank === 1 ? "◆" : d.rank}
                                                        </span>
                                                        <div>
                                                            <p className="text-sm font-bold text-white">
                                                                {d.driverName}
                                                            </p>
                                                            <p className="text-xs font-mono text-slate-600">
                                                                {d.totalTrips} trips · {d.totalDistance} km
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ScoreBadge score={d.avgScore} />
                                                </div>
                                                {d.totalSpeeding > 0 && (
                                                    <p className="text-xs font-mono text-red-500 mt-1 pl-8">
                                                        ⚠ {d.totalSpeeding} speeding event{d.totalSpeeding > 1 ? "s" : ""}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </Card>
                            )}
                        </div>

                        {/* Driver Detail */}
                        <div className="lg:col-span-2">
                            {!selectedDriver ? (
                                <div className="flex items-center justify-center h-48
                  text-slate-700 font-mono text-xs">
                                    SELECT A DRIVER TO SEE DETAILS
                                </div>
                            ) : driverScore ? (
                                <div className="space-y-6">
                                    {/* Score breakdown radar */}
                                    <Card>
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-white font-black text-base">
                                                    Score Breakdown
                                                </h3>
                                                <p className="text-slate-600 font-mono text-xs">
                                                    Last {days} days
                                                </p>
                                            </div>
                                            <ScoreBadge score={driverScore.currentScore} />
                                        </div>

                                        {driverScore.scores.length > 0 && (
                                            <ResponsiveContainer width="100%" height={180}>
                                                <AreaChart
                                                    data={driverScore.scores}
                                                    margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                                                >
                                                    <defs>
                                                        <linearGradient
                                                            id="scoreGrad" x1="0" y1="0" x2="0" y2="1"
                                                        >
                                                            <stop offset="5%"
                                                                stopColor="#f59e0b" stopOpacity={0.15} />
                                                            <stop offset="95%"
                                                                stopColor="#f59e0b" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid
                                                        stroke="#1e1e1e" strokeDasharray="2 4"
                                                        vertical={false}
                                                    />
                                                    <XAxis
                                                        dataKey="date"
                                                        tickFormatter={(d) =>
                                                            format(new Date(d), "MM/dd")
                                                        }
                                                        tick={{
                                                            fill: "#4b5563", fontSize: 10,
                                                            fontFamily: "monospace",
                                                        }}
                                                        axisLine={false} tickLine={false}
                                                    />
                                                    <YAxis
                                                        domain={[0, 100]}
                                                        tick={{
                                                            fill: "#4b5563", fontSize: 10,
                                                            fontFamily: "monospace",
                                                        }}
                                                        axisLine={false} tickLine={false}
                                                        width={30}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            background: "#0a0a0a",
                                                            border: "1px solid #2a2a2a",
                                                            fontFamily: "monospace",
                                                        }}
                                                        formatter={(v: number | undefined) => v !== undefined ? [`${Math.round(v)}`, "score"] : ["—", "score"]}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="score"
                                                        stroke="#f59e0b"
                                                        strokeWidth={2}
                                                        fill="url(#scoreGrad)"
                                                        dot={false}
                                                        activeDot={{
                                                            r: 4, fill: "#f59e0b", strokeWidth: 0,
                                                        }}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        )}
                                    </Card>

                                    {/* Summary stats */}
                                    <div className="grid grid-cols-2 gap-px bg-white/5">
                                        {[
                                            { label: "AVG SCORE", value: driverScore.avgScore ?? "—" },
                                            {
                                                label: "TREND",
                                                value: driverScore.trend !== null
                                                    ? `${driverScore.trend > 0 ? "↑" : "↓"} ${Math.abs(driverScore.trend)}`
                                                    : "—",
                                                accent: driverScore.trend !== null && driverScore.trend >= 0,
                                            },
                                            { label: "TOTAL TRIPS", value: driverScore.totalTrips },
                                            {
                                                label: "TOTAL KM",
                                                value: `${Number(driverScore.totalDistanceKm).toFixed(0)} km`,
                                            },
                                            {
                                                label: "SPEEDING EVENTS", value: driverScore.totalSpeedingEvents,
                                                danger: driverScore.totalSpeedingEvents > 0,
                                            },
                                            {
                                                label: "HOURS ON ROAD",
                                                value: `${driverScore.totalHoursOnRoad}h`,
                                            },
                                        ].map((s: { label: string; value: string | number; accent?: boolean; danger?: boolean }) => (
                                            <div key={s.label} className="bg-black px-4 py-4">
                                                <p className="text-xs font-mono uppercase tracking-widest
                          text-slate-600">
                                                    {s.label}
                                                </p>
                                                <p className={`text-xl font-black mt-1 ${s.danger ? "text-red-400"
                                                        : s.accent ? "text-emerald-400"
                                                            : "text-white"
                                                    }`}>
                                                    {s.value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-center py-16">
                                    <Spinner />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── HOS TAB ────────────────────────────────────────────────────── */}
                {tab === "hos" && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xs font-mono uppercase tracking-widest
                text-slate-500">
                                Today's Hours of Service
                            </h2>
                            <p className="text-xs font-mono text-slate-700">
                                Daily limit: 10 hours
                            </p>
                        </div>

                        {hosLoading ? (
                            <div className="flex justify-center py-8"><Spinner /></div>
                        ) : hosData.length === 0 ? (
                            <div className="text-center py-16 text-slate-700 font-mono text-xs">
                                NO DRIVERS
                            </div>
                        ) : (
                            <Card noPad>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            {[
                                                "DRIVER", "TODAY",
                                                "HOURS / LIMIT", "PROGRESS", "STATUS",
                                            ].map((h) => (
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
                                        {hosData.map((d) => (
                                            <tr
                                                key={d.driverId}
                                                className="border-b border-white/5 hover:bg-white/3"
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="text-white font-bold">
                                                        {d.driverName}
                                                    </div>
                                                    <div className="text-slate-600 text-xs font-mono">
                                                        {d.email}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 font-mono font-bold text-white">
                                                    {d.todayHours}h
                                                </td>
                                                <td className="px-4 py-4 font-mono text-slate-400 text-xs">
                                                    {d.todayHours}h / {d.limitHours}h
                                                </td>
                                                <td className="px-4 py-4 w-40">
                                                    <HosBar pct={d.pct} status={d.status} />
                                                    <p className="text-xs font-mono text-slate-600 mt-1">
                                                        {d.pct}%
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge color={
                                                        d.status === "OVER_LIMIT" ? "red" :
                                                            d.status === "WARNING" ? "amber" : "green"
                                                    }>
                                                        {d.status.replace("_", " ")}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        )}
                    </div>
                )}

                {/* ── MAINTENANCE TAB ────────────────────────────────────────────── */}
                {tab === "maintenance" && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xs font-mono uppercase tracking-widest
                text-slate-500">
                                Fleet Maintenance Status
                            </h2>
                        </div>

                        {maintLoading ? (
                            <div className="flex justify-center py-8"><Spinner /></div>
                        ) : (
                            <Card noPad>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            {[
                                                "VEHICLE", "ODOMETER",
                                                "NEXT SERVICE", "KM UNTIL", "LAST SERVICE", "STATUS",
                                            ].map((h) => (
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
                                        {maintData.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="text-center py-10 text-slate-700
                            font-mono text-xs"
                                                >
                                                    NO VEHICLE DATA
                                                </td>
                                            </tr>
                                        ) : (
                                            maintData.map((v) => (
                                                <tr
                                                    key={v.vehicleId}
                                                    className={`border-b border-white/5 hover:bg-white/3 ${v.urgency === "OVERDUE" ? "bg-red-500/3" :
                                                            v.urgency === "SOON" ? "bg-amber-500/3" : ""
                                                        }`}
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="font-mono font-bold text-amber-400">
                                                            {v.licensePlate}
                                                        </div>
                                                        <div className="text-slate-600 text-xs">
                                                            {v.make} {v.model}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-white">
                                                        {Number(v.odometerKm).toLocaleString()} km
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-slate-300">
                                                        {v.maintenanceDueKm
                                                            ? `${Number(v.maintenanceDueKm).toLocaleString()} km`
                                                            : "—"}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono">
                                                        {v.kmUntilService !== null ? (
                                                            <span className={
                                                                Number(v.kmUntilService) <= 0
                                                                    ? "text-red-400 font-bold"
                                                                    : Number(v.kmUntilService) <= 500
                                                                        ? "text-amber-400"
                                                                        : "text-slate-400"
                                                            }>
                                                                {Number(v.kmUntilService) <= 0
                                                                    ? `Overdue ${Math.abs(Number(v.kmUntilService))} km`
                                                                    : `${Number(v.kmUntilService).toLocaleString()} km`}
                                                            </span>
                                                        ) : "—"}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                                                        {v.lastServiceAt
                                                            ? format(new Date(v.lastServiceAt), "MMM d, yyyy")
                                                            : "—"}
                                                        {v.lastServiceType && (
                                                            <div className="text-slate-600">
                                                                {v.lastServiceType.replace("_", " ")}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <UrgencyBadge urgency={v.urgency} />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </Card>
                        )}
                    </div>
                )}

                {/* ── DOCUMENTS TAB ──────────────────────────────────────────────── */}
                {tab === "documents" && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xs font-mono uppercase tracking-widest
                text-slate-500">
                                Fleet Documents
                            </h2>
                        </div>

                        {docsLoading ? (
                            <div className="flex justify-center py-8"><Spinner /></div>
                        ) : (
                            <Card noPad>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            {[
                                                "DOCUMENT", "TYPE", "ENTITY",
                                                "EXPIRES", "STATUS",
                                            ].map((h) => (
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
                                        {documents.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="text-center py-10 text-slate-700
                            font-mono text-xs"
                                                >
                                                    NO DOCUMENTS — ADD VIA API
                                                </td>
                                            </tr>
                                        ) : (
                                            documents.map((d) => (
                                                <tr
                                                    key={d.id}
                                                    className={`border-b border-white/5 hover:bg-white/3 ${d.expiryStatus === "expired" ||
                                                            d.expiryStatus === "critical"
                                                            ? "bg-red-500/3"
                                                            : d.expiryStatus === "warning"
                                                                ? "bg-amber-500/3"
                                                                : ""
                                                        }`}
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="text-white font-bold">{d.label}</div>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-slate-400 text-xs uppercase">
                                                        {d.docType.replace("_", " ")}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs text-slate-500 uppercase">
                                                        {d.entityType}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs">
                                                        {d.expiresAt
                                                            ? format(new Date(d.expiresAt), "MMM d, yyyy")
                                                            : "—"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <ExpiryBadge status={d.expiryStatus} />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </Card>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
