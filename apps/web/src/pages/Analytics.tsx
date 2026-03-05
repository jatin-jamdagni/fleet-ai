import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from "recharts";
import { format, subDays, subMonths } from "date-fns";
import { analyticsApi } from "../lib/api";
import {  Card } from "../components/ui";

// ─── Colour palette ───────────────────────────────────────────────────────────

const AMBER  = "#f59e0b";
// const AMBER2 = "#fbbf24";
const DIM    = "#1a1a1a";
const GRID   = "#1e1e1e";
const MUTED  = "#4b5563";
const GREEN  = "#10b981";
const RED    = "#ef4444";

// ─── Range presets ────────────────────────────────────────────────────────────

type Range = "7d" | "30d" | "90d" | "12m";

function rangeParams(
  r: Range
): { from: string; to: string; period: "day" | "week" | "month" } {
  const to  = new Date();
  let   from: Date;
  let   period: "day" | "week" | "month";

  switch (r) {
    case "7d":  from = subDays(to, 7);    period = "day";   break;
    case "30d": from = subDays(to, 30);   period = "day";   break;
    case "90d": from = subDays(to, 90);   period = "week";  break;
    case "12m": from = subMonths(to, 12); period = "month"; break;
  }

  return {
    from:   from.toISOString(),
    to:     to.toISOString(),
    period,
  };
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

type ChartTooltipItem = {
  name?: string | number;
  value?: number | string | Array<number | string> | null;
  color?: string;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<ChartTooltipItem>;
  label?: string | number;
  prefix?: string;
  suffix?: string;
};

function ChartTooltip({
  active,
  payload,
  label,
  prefix = "",
  suffix = "",
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div style={{
      background: "#0a0a0a",
      border:     "1px solid #2a2a2a",
      padding:    "10px 14px",
      fontFamily: "monospace",
    }}>
      <p style={{ color: MUTED, fontSize: 11, marginBottom: 6, letterSpacing: 1 }}>
        {label}
      </p>
      {payload.map((p, idx) => (
        <p key={`${String(p.name ?? "item")}-${idx}`} style={{ color: p.color ?? AMBER, fontSize: 13, fontWeight: 700 }}>
          {prefix}{typeof p.value === "number" ? p.value.toFixed(2) : String(p.value ?? "0")}{suffix}
          <span style={{ color: MUTED, fontWeight: 400, marginLeft: 6 }}>
            {p.name}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Delta Badge ──────────────────────────────────────────────────────────────

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span style={{ color: MUTED, fontSize: 11 }}>—</span>;

  const up    = value >= 0;
  const color = up ? GREEN : RED;

  return (
    <span style={{
      color,
      fontSize:   12,
      fontWeight: 700,
      fontFamily: "monospace",
    }}>
      {up ? "↑" : "↓"} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500">
        {title}
      </h2>
      {sub && (
        <p className="text-white font-black text-lg tracking-tight">{sub}</p>
      )}
    </div>
  );
}

// ─── Range Selector ───────────────────────────────────────────────────────────

function RangePicker({
  value,
  onChange,
}: {
  value:    Range;
  onChange: (r: Range) => void;
}) {
  const opts: Range[] = ["7d", "30d", "90d", "12m"];
  return (
    <div className="flex">
      {opts.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`px-3 py-1.5 text-xs font-mono tracking-widest border-y border-r first:border-l transition-colors ${
            value === o
              ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
              : "border-white/8 text-slate-600 hover:text-slate-400"
          }`}
        >
          {o.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ─── Analytics Page ───────────────────────────────────────────────────────────

export default function Analytics() {
  const [range, setRange] = useState<Range>("30d");
  const params = useMemo(() => rangeParams(range), [range]);

  // Queries
  const { data: overview } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn:  () => analyticsApi.overview().then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  const { data: revenueData = [] } = useQuery({
    queryKey: ["analytics-revenue", range],
    queryFn:  () => analyticsApi.revenue(params).then((r) => r.data.data),
  });

  const { data: distanceData = [] } = useQuery({
    queryKey: ["analytics-distance", range],
    queryFn:  () => analyticsApi.distance(params).then((r) => r.data.data),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["analytics-drivers", range],
    queryFn:  () => analyticsApi.drivers(params).then((r) => r.data.data),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["analytics-vehicles", range],
    queryFn:  () => analyticsApi.vehicles(params).then((r) => r.data.data),
  });

  const { data: hoursData = [] } = useQuery({
    queryKey: ["analytics-hours", range],
    queryFn:  () => analyticsApi.hours(params).then((r) => r.data.data),
  });

  // Format x-axis labels for charts
  const fmtDate = (d: string) => {
    try {
      const date = new Date(d);
      return params.period === "month"
        ? format(date, "MMM")
        : params.period === "week"
          ? format(date, "MM/dd")
          : format(date, "MM/dd");
    } catch { return d; }
  };

  // Max values for bar scaling
  const maxHourTrips = Math.max(...hoursData.map((h) => h.trips), 1);

  return (
    <div className="flex flex-col min-h-full">

      {/* Page Header */}
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">ANALYTICS</h1>
          <p className="text-xs font-mono text-slate-500 mt-0.5">
            Fleet performance intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RangePicker value={range} onChange={setRange} />
          <button
            onClick={() => analyticsApi.exportCsv({
              from:   params.from,
              to:     params.to,
            })}
            className="px-3 py-1.5 text-xs font-mono tracking-widest border border-white/8
              text-slate-500 hover:text-amber-400 hover:border-amber-500/30 transition-colors"
          >
            ↓ CSV
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">

        {/* ── KPI Row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
          {[
            {
              label: "TRIPS THIS MONTH",
              value: overview?.tripsThisMonth ?? "—",
              sub:   `${overview?.totalTrips ?? 0} all-time`,
              delta: overview?.tripDelta ?? null,
            },
            {
              label:  "DISTANCE THIS MONTH",
              value:  overview
                ? `${Number(overview.distanceThisMonth).toFixed(0)} km`
                : "—",
              sub:    `${Number(overview?.totalDistanceKm ?? 0).toFixed(0)} km all-time`,
              delta:  overview?.distanceDelta ?? null,
              accent: true,
            },
            {
              label: "REVENUE THIS MONTH",
              value: overview
                ? `$${Number(overview.revenueThisMonth).toFixed(0)}`
                : "—",
              sub:   `$${Number(overview?.totalRevenue ?? 0).toFixed(0)} all-time`,
              delta: overview?.revenueDelta ?? null,
            },
            {
              label: "AVG TRIP DISTANCE",
              value: overview
                ? `${overview.avgTripDistanceKm} km`
                : "—",
              sub:   `${overview?.activeVehicles ?? 0} vehicles · ${overview?.totalDrivers ?? 0} drivers`,
              delta: null,
            },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-black px-6 py-5">
              <p className="text-xs font-mono uppercase tracking-widest text-slate-600">
                {kpi.label}
              </p>
              <p className={`text-3xl font-black tracking-tight mt-1 ${
                kpi.accent ? "text-amber-400" : "text-white"
              }`}>
                {kpi.value}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-mono text-slate-600">{kpi.sub}</span>
                <Delta value={kpi.delta} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Revenue Chart ────────────────────────────────────────────────── */}
        <div>
          <SectionHeader title="Revenue" sub="Paid Invoice Revenue Over Time" />
          <Card noPad>
            <div className="px-5 pt-5 pb-1">
              {revenueData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-700 font-mono text-xs">
                  NO DATA FOR SELECTED PERIOD
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={AMBER} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={AMBER} stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
                    <XAxis
                      dataKey="period"
                      tickFormatter={fmtDate}
                      tick={{ fill: MUTED, fontSize: 10, fontFamily: "monospace" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `$${v}`}
                      tick={{ fill: MUTED, fontSize: 10, fontFamily: "monospace" }}
                      axisLine={false}
                      tickLine={false}
                      width={50}
                    />
                    <Tooltip
                      content={(p) => (
                        <ChartTooltip {...p} prefix="$" suffix="" />
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="revenue"
                      stroke={AMBER}
                      strokeWidth={2}
                      fill="url(#revGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: AMBER, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* ── Distance Chart ────────────────────────────────────────────────── */}
        <div>
          <SectionHeader title="Distance" sub="Kilometres Driven Over Time" />
          <Card noPad>
            <div className="px-5 pt-5 pb-1">
              {distanceData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-700 font-mono text-xs">
                  NO DATA FOR SELECTED PERIOD
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={distanceData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
                    <XAxis
                      dataKey="period"
                      tickFormatter={fmtDate}
                      tick={{ fill: MUTED, fontSize: 10, fontFamily: "monospace" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `${v}km`}
                      tick={{ fill: MUTED, fontSize: 10, fontFamily: "monospace" }}
                      axisLine={false}
                      tickLine={false}
                      width={56}
                    />
                    <Tooltip
                      content={(p) => (
                        <ChartTooltip {...p} suffix=" km" />
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey="distanceKm"
                      name="distance"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#distGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* ── Trip Hour Distribution ─────────────────────────────────────────── */}
        <div>
          <SectionHeader title="Activity" sub="Trip Starts by Hour of Day" />
          <Card noPad>
            <div className="px-5 pt-5 pb-2">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={hoursData}
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: MUTED, fontSize: 9, fontFamily: "monospace" }}
                    axisLine={false}
                    tickLine={false}
                    interval={2}
                  />
                  <YAxis hide />
                  <Tooltip
                    content={(p) => (
                      <ChartTooltip {...p} suffix=" trips" />
                    )}
                  />
                  <Bar dataKey="trips" name="trips" radius={[1, 1, 0, 0]}>
                    {hoursData.map((entry) => (
                      <Cell
                        key={entry.hour}
                        fill={
                          entry.trips === maxHourTrips
                            ? AMBER
                            : entry.trips > maxHourTrips * 0.6
                              ? AMBER + "80"
                              : DIM
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between mt-1 px-1">
                <span className="text-xs font-mono text-slate-700">00:00</span>
                <span className="text-xs font-mono text-amber-500/60">Peak hours highlighted</span>
                <span className="text-xs font-mono text-slate-700">23:00</span>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Two-column: Driver Leaderboard + Vehicle Utilization ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Driver Leaderboard */}
          <div>
            <SectionHeader title="Drivers" sub="Leaderboard by Distance" />
            <Card noPad>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["#", "DRIVER", "TRIPS", "DISTANCE", "REVENUE"].map((h) => (
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
                    {drivers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-700 font-mono text-xs">
                          NO DRIVER DATA
                        </td>
                      </tr>
                    ) : (
                      drivers.map((d) => (
                        <tr
                          key={d.driverId}
                          className="border-b border-white/5 hover:bg-white/3 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className={`font-black font-mono text-sm ${
                              d.rank === 1 ? "text-amber-400"
                            : d.rank === 2 ? "text-slate-300"
                            : d.rank === 3 ? "text-amber-700"
                            : "text-slate-600"
                            }`}>
                              {d.rank === 1 ? "◆" : d.rank}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-white text-sm">{d.driverName}</div>
                            <div className="text-slate-600 text-xs font-mono">{d.email}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-300">{d.trips}</td>
                          <td className="px-4 py-3 font-mono font-bold text-white">
                            {Number(d.distanceKm).toFixed(1)} km
                          </td>
                          <td className="px-4 py-3 font-mono text-amber-400">
                            ${Number(d.revenue).toFixed(0)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Vehicle Utilization */}
          <div>
            <SectionHeader title="Vehicles" sub="Utilization & Efficiency" />
            <Card noPad>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["PLATE", "VEHICLE", "TRIPS", "DISTANCE", "EFFICIENCY"].map((h) => (
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
                    {vehicles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-700 font-mono text-xs">
                          NO VEHICLE DATA
                        </td>
                      </tr>
                    ) : (
                      vehicles.map((v) => {
                        const eff = Number(v.efficiency);
                        return (
                          <tr
                            key={v.vehicleId}
                            className="border-b border-white/5 hover:bg-white/3 transition-colors"
                          >
                            <td className="px-4 py-3 font-mono font-bold text-amber-400">
                              {v.licensePlate}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-white text-sm font-bold">
                                {v.make} {v.model}
                              </div>
                              <div className="text-slate-600 text-xs font-mono">
                                {v.year} · {v.activeDays}d active
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-300">{v.trips}</td>
                            <td className="px-4 py-3 font-mono text-white font-bold">
                              {Number(v.distanceKm).toFixed(1)} km
                            </td>
                            <td className="px-4 py-3">
                              {/* Efficiency bar */}
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-white/5 rounded-none overflow-hidden">
                                  <div
                                    className="h-full transition-all"
                                    style={{
                                      width: `${Math.min(eff, 100)}%`,
                                      backgroundColor:
                                        eff >= 80 ? GREEN
                                      : eff >= 50 ? AMBER
                                      : RED,
                                    }}
                                  />
                                </div>
                                <span className={`text-xs font-mono font-bold ${
                                  eff >= 80 ? "text-emerald-400"
                                : eff >= 50 ? "text-amber-400"
                                : "text-red-400"
                                }`}>
                                  {eff.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>

        {/* ── Revenue vs Distance Scatter ───────────────────────────────────── */}
        <div>
          <SectionHeader title="Correlation" sub="Revenue vs Distance per Period" />
          <Card noPad>
            <div className="px-5 pt-5 pb-2">
              {revenueData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-slate-700 font-mono text-xs">
                  NO DATA
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={revenueData.map((r, i: number) => ({
                      ...r,
                      distanceKm: distanceData[i]?.distanceKm ?? 0,
                      label: fmtDate(r.period),
                    }))}
                    margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                    barCategoryGap="30%"
                    barGap={2}
                  >
                    <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: MUTED, fontSize: 10, fontFamily: "monospace" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="rev"
                      orientation="left"
                      tickFormatter={(v) => `$${v}`}
                      tick={{ fill: MUTED, fontSize: 10, fontFamily: "monospace" }}
                      axisLine={false}
                      tickLine={false}
                      width={50}
                    />
                    <YAxis
                      yAxisId="dist"
                      orientation="right"
                      tickFormatter={(v) => `${v}km`}
                      tick={{ fill: MUTED, fontSize: 10, fontFamily: "monospace" }}
                      axisLine={false}
                      tickLine={false}
                      width={56}
                    />
                    <Tooltip
                      content={(p) => <ChartTooltip {...p} />}
                    />
                    <Bar
                      yAxisId="rev"
                      dataKey="revenue"
                      name="revenue ($)"
                      fill={AMBER + "60"}
                      stroke={AMBER}
                      strokeWidth={1}
                      radius={[1, 1, 0, 0]}
                    />
                    <Bar
                      yAxisId="dist"
                      dataKey="distanceKm"
                      name="distance (km)"
                      fill="#3b82f640"
                      stroke="#3b82f6"
                      strokeWidth={1}
                      radius={[1, 1, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
