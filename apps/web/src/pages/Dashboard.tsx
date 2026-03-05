import { useQuery } from "@tanstack/react-query";
import { vehiclesApi, invoicesApi } from "../lib/api";
import { useFleetStore } from "../store/fleet.store";
import { Badge } from "../components/ui";
import { FleetMap } from "../components/map/FleetMap";
import LiveMapPanel from "../components/map/LiveMapPanel";
import { useFleetWS } from "../hooks/useFleetWS";

export default function Dashboard() {
    useFleetWS(); // connect WebSocket

    const vehicles = useFleetStore((s) => s.vehicles);
    const connected = useFleetStore((s) => s.wsConnected);

    const { data: vStats } = useQuery({
        queryKey: ["vehicle-stats"],
        queryFn: () => vehiclesApi.stats().then((r) => r.data.data),
        refetchInterval: 30_000,
    });

    const { data: billing } = useQuery({
        queryKey: ["billing-summary"],
        queryFn: () => invoicesApi.summary().then((r) => r.data.data),
        refetchInterval: 60_000,
    });

    const liveList = Array.from(vehicles.values());

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-white tracking-tight">
                        FLEET OVERVIEW
                    </h1>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">
                        Live operational status
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                    <div
                        className={`w-2 h-2 rounded-full ${connected
                                ? "bg-emerald-400 animate-pulse"
                                : "bg-slate-600"
                            }`}
                    />
                    <span className="text-slate-500">
                        {connected ? "LIVE" : "CONNECTING..."}
                    </span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border-b border-white/5">
                {[
                    {
                        label: "TOTAL FLEET",
                        value: vStats?.total ?? "—",
                        sub: "registered vehicles",
                    },
                    {
                        label: "ACTIVE TRIPS",
                        value: liveList.length,
                        sub: "vehicles on road now",
                        accent: true,
                    },
                    {
                        label: "REVENUE MTD",
                        value: billing ? `$${Number(billing.monthlyRevenue).toFixed(0)}` : "—",
                        sub: "this month",
                    },
                    {
                        label: "PENDING",
                        value: billing?.pendingCount ?? "—",
                        sub: "invoices to settle",
                    },
                ].map((s) => (
                    <div key={s.label} className="bg-black px-6 py-5">
                        <p className="text-xs font-mono uppercase tracking-widest text-slate-600 mb-1">
                            {s.label}
                        </p>
                        <p
                            className={`text-3xl font-black tracking-tight ${s.accent ? "text-amber-400" : "text-white"
                                }`}
                        >
                            {s.value}
                        </p>
                        <p className="text-xs font-mono text-slate-600 mt-1">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Map + Live Table */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 min-h-0">

                {/* Map */}
                <div className="lg:col-span-2 relative border-r border-white/5">
                    {!import.meta.env.VITE_MAPBOX_TOKEN ? (
                        <div className="absolute inset-0">
                            <LiveMapPanel />
                        </div>
                    ) : (
                        <FleetMap className="absolute inset-0" />
                    )}

                    {/* Overlay: active count */}
                    <div className="absolute top-4 left-4 bg-black/80 border border-white/10 px-3 py-2 backdrop-blur-sm">
                        <p className="text-xs font-mono text-amber-400">
                            {liveList.length} VEHICLE{liveList.length !== 1 ? "S" : ""} LIVE
                        </p>
                    </div>
                </div>

                {/* Live vehicle list */}
                <div className="overflow-y-auto bg-slate-950">
                    <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
                            Active Vehicles
                        </p>
                    </div>

                    {liveList.length === 0 ? (
                        <div className="px-4 py-12 text-center">
                            <p className="text-slate-700 font-mono text-xs">
                                No active trips
                            </p>
                        </div>
                    ) : (
                        liveList.map((v) => (
                            <div
                                key={v.vehicleId}
                                className="px-4 py-3 border-b border-white/5 hover:bg-white/3"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-white font-mono font-bold text-sm">
                                        {v.licensePlate}
                                    </span>
                                    <Badge color="amber">{v.speed.toFixed(0)} km/h</Badge>
                                </div>
                                <p className="text-slate-500 text-xs font-mono">
                                    {v.driverName}
                                </p>
                                <p className="text-slate-700 text-xs font-mono mt-0.5">
                                    {v.lat.toFixed(4)}, {v.lng.toFixed(4)}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
