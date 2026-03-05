import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage, tripsApi } from "../lib/api";
import { Badge, Table } from "../components/ui";
import toast from "react-hot-toast";
import { TripStatus } from "@fleet/shared";
import TripRouteReplay from "../components/map/TripRouteReplay";

function statusColor(s: TripStatus) {
  return s === TripStatus.ACTIVE
    ? "amber"
    : s === TripStatus.COMPLETED
      ? "green"
      : s === TripStatus.FORCE_ENDED
        ? "red"
        : "slate";
}

export default function Trips() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<TripStatus | "">("");
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const { data: tripsRes, isLoading } = useQuery({
    queryKey: ["trips", filter],
    queryFn:  () => tripsApi.all(filter ? { status: filter } : undefined).then((r) => r.data),
    refetchInterval: 10_000,
  });

  const forceEndMut = useMutation({
    mutationFn: tripsApi.forceEnd,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Trip force-ended");
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });

  const trips   = tripsRes?.data ?? [];
  const filters: Array<TripStatus | ""> = [
    "",
    TripStatus.ACTIVE,
    TripStatus.COMPLETED,
    TripStatus.FORCE_ENDED,
  ];

  return (
    <div className="flex flex-col">
      <div className="px-6 py-5 border-b border-white/5">
        <h1 className="text-xl font-black text-white tracking-tight">TRIPS</h1>
        <p className="text-xs font-mono text-slate-500 mt-0.5">
          All fleet trips — {tripsRes?.meta?.total ?? 0} total
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-white/5">
        {filters.map((f) => (
          <button
            key={f || "ALL"}
            onClick={() => {
              setFilter(f);
              setSelectedTripId(null);
            }}
            className={`px-5 py-3 text-xs font-mono tracking-widest transition-colors ${
              filter === f
                ? "text-amber-400 border-b-2 border-amber-500"
                : "text-slate-600 hover:text-slate-400"
            }`}
          >
            {f || "ALL"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="text-center py-20 text-slate-600 font-mono text-xs">LOADING...</div>
        ) : (
          <Table
            headers={["TRIP ID", "VEHICLE", "DRIVER", "DISTANCE", "START", "END", "STATUS", "INVOICE", "ACTIONS"]}
            rows={trips.map((t) => [
              <span className="font-mono text-xs text-slate-500">
                {t.id.slice(-8).toUpperCase()}
              </span>,
              <span className="font-mono">{t.vehicle?.licensePlate}</span>,
              <span>{t.driver?.name}</span>,
              <span className="font-mono">
                {t.distanceKm ? `${Number(t.distanceKm).toFixed(2)} km` : "—"}
              </span>,
              <span className="font-mono text-xs text-slate-400">
                {new Date(t.startTime).toLocaleString()}
              </span>,
              <span className="font-mono text-xs text-slate-400">
                {t.endTime ? new Date(t.endTime).toLocaleString() : "—"}
              </span>,
              <Badge color={statusColor(t.status)}>{t.status}</Badge>,
              t.invoice ? (
                <span className="font-mono text-xs text-emerald-400">
                  ${Number(t.invoice.totalAmount).toFixed(2)}
                </span>
              ) : (
                <span className="text-slate-600 font-mono text-xs">—</span>
              ),
              <div className="flex items-center gap-3">
                {t.status === TripStatus.ACTIVE ? (
                  <button
                    onClick={() => {
                      if (confirm("Force end this trip?")) forceEndMut.mutate(t.id);
                    }}
                    className="text-xs font-mono text-red-500 hover:text-red-400"
                  >
                    FORCE END
                  </button>
                ) : null}
                {t.status !== TripStatus.ACTIVE ? (
                  <button
                    onClick={() => setSelectedTripId((prev) => (prev === t.id ? null : t.id))}
                    className="text-xs font-mono text-amber-400 hover:text-amber-300"
                  >
                    {selectedTripId === t.id ? "HIDE REPLAY" : "REPLAY"}
                  </button>
                ) : null}
              </div>,
            ])}
          />
        )}
      </div>

      {selectedTripId && (
        <div className="border-t border-white/5 p-4">
          <div className="h-[360px]">
            <TripRouteReplay tripId={selectedTripId} />
          </div>
        </div>
      )}
    </div>
  );
}
