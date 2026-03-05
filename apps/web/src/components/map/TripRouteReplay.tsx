import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { gpsApi } from "../../lib/api";

interface TripPoint {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
}

function normalize(points: TripPoint[]) {
  if (points.length === 0) return [];

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const dLat = maxLat - minLat || 0.001;
  const dLng = maxLng - minLng || 0.001;

  return points.map((p) => ({
    ...p,
    x: ((p.lng - minLng) / dLng) * 100,
    y: (1 - (p.lat - minLat) / dLat) * 100,
  }));
}

export default function TripRouteReplay({ tripId }: { tripId: string }) {
  const [progress, setProgress] = useState(100);

  const { data, isLoading } = useQuery({
    queryKey: ["gps-trip-route", tripId],
    queryFn: async () => {
      const res = await gpsApi.tripRoute(tripId);
      return res.data.data;
    },
    enabled: Boolean(tripId),
    retry: false,
  });

  const points = useMemo(() => normalize(data?.pings ?? []), [data?.pings]);
  const visibleCount = Math.max(1, Math.floor((points.length * progress) / 100));
  const visible = points.slice(0, visibleCount);
  const path = visible
    .map((p, index) => `${index === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  return (
    <div className="flex h-full flex-col border border-white/10 bg-black">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <p className="text-xs font-mono tracking-widest text-slate-500">TRIP ROUTE REPLAY</p>
        <p className="text-xs font-mono text-slate-500">{data?.geojson.properties.pingCount ?? 0} PINGS</p>
      </div>

      <div className="relative flex-1">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs font-mono text-slate-600">LOADING...</p>
          </div>
        )}

        {!isLoading && points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs font-mono text-slate-600">NO GPS DATA FOR THIS TRIP</p>
          </div>
        )}

        {points.length > 0 && (
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <rect x="0" y="0" width="100" height="100" fill="#050505" />
            <path d={path} stroke="#f59e0b" strokeWidth="0.6" fill="none" />
            <circle cx={visible[0]?.x ?? 0} cy={visible[0]?.y ?? 0} r="1" fill="#10b981" />
            <circle cx={visible[visible.length - 1]?.x ?? 0} cy={visible[visible.length - 1]?.y ?? 0} r="1.2" fill="#ef4444" />
          </svg>
        )}
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}
