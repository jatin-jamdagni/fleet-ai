import { useEffect, useRef } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import { format } from "date-fns";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

type ShareBranding = {
  companyName: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
};

type ShareRoutePoint = {
  lat: number;
  lng: number;
  speedKmh: number | null;
  recordedAt: string | Date;
};

type ShareTrip = {
  id: string;
  status: string;
  startTime: string;
  endTime: string | null;
  distanceKm: number | null;
  vehicle: {
    licensePlate: string;
    make: string;
    model: string;
  };
};

type ShareData = {
  trip: ShareTrip;
  route: ShareRoutePoint[];
  branding: ShareBranding;
  viewCount: number;
  label: string | null;
};

function getLast<T>(items: T[]): T | undefined {
  return items.length ? items[items.length - 1] : undefined;
}

async function fetchShareData(token: string): Promise<ShareData> {
  const res = await axios.get(`${API}/share-links/resolve/${token}`);
  return res.data.data as ShareData;
}

function StatCard({
  label,
  value,
  primary,
}: {
  label: string;
  value: string | number;
  primary?: string;
}) {
  return (
    <div className="p-4 border border-white/8 bg-black/60">
      <p
        className="text-xs font-mono uppercase tracking-widest mb-1"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        {label}
      </p>
      <p
        className="text-xl font-black font-mono"
        style={{ color: primary ?? "#fff" }}
      >
        {value}
      </p>
    </div>
  );
}

export default function SharePage() {
  const { token }    = useParams<{ token: string }>();
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef    = useRef<mapboxgl.Marker | null>(null);

  const { data, isLoading, isError, error } = useQuery<ShareData>({
    queryKey: ["share", token],
    queryFn:  () => fetchShareData(token!),
    enabled:  !!token,
    retry:    false,
  });

  const branding = data?.branding ?? {
    companyName:  "Fleet AI",
    primaryColor: "#f59e0b",
    accentColor:  "#ffffff",
    logoUrl:      null,
  };

  const route = data?.route || [];
  const trip  = data?.trip;

  // ── Init map ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style:     "mapbox://styles/mapbox/dark-v11",
      center:    [0, 0],
      zoom:      2,
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Draw route ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const map = mapRef.current;
    if (!map || route.length < 2) return;

    const draw = () => {
      if (map.getLayer("share-route")) map.removeLayer("share-route");
      if (map.getSource("share-route")) map.removeSource("share-route");
      if (map.getLayer("share-points")) map.removeLayer("share-points");
      if (map.getSource("share-points")) map.removeSource("share-points");

      // Route line
      map.addSource("share-route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type:        "LineString",
            coordinates: route.map((p) => [p.lng, p.lat]),
          },
        },
      });

      map.addLayer({
        id:     "share-route",
        type:   "line",
        source: "share-route",
        paint: {
          "line-color":   branding.primaryColor,
          "line-width":   3,
          "line-opacity": 0.9,
        },
      });

      // Start marker
      const firstPoint = getLast(route.slice(0, 1));
      if (firstPoint) {
        new mapboxgl.Marker({ color: branding.primaryColor })
          .setLngLat([firstPoint.lng, firstPoint.lat])
          .setPopup(new mapboxgl.Popup().setText("Trip Start"))
          .addTo(map);
      }

      // End / live marker
      const endEl = document.createElement("div");
      endEl.style.cssText = `
        width: 18px; height: 18px;
        background: ${branding.primaryColor};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 8px ${branding.primaryColor}80;
      `;
      const lastPoint = getLast(route);
      if (lastPoint) {
        markerRef.current = new mapboxgl.Marker({ element: endEl })
          .setLngLat([lastPoint.lng, lastPoint.lat])
          .addTo(map);
      }

      // Fit bounds
      const bounds = new mapboxgl.LngLatBounds();
      route.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: 60, duration: 1200 });
    };

    if (map.isStyleLoaded()) draw();
    else map.on("load", draw);
  }, [route, branding.primaryColor]);

  // ── Live position polling (for ACTIVE trips) ──────────────────────────────

  useEffect(() => {
    if (trip?.status !== "ACTIVE") return;

    const interval = setInterval(async () => {
      try {
        const fresh = await fetchShareData(token!);
        const newRoute = fresh?.route ?? [];
        const last = getLast(newRoute);
        if (last && markerRef.current) {
          markerRef.current.setLngLat([last.lng, last.lat]);
        }
      } catch { /* ignore */ }
    }, 10_000);

    return () => clearInterval(interval);
  }, [trip?.status, token]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#000" }}
      >
        <div
          className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: `${branding.primaryColor} transparent transparent` }}
        />
      </div>
    );
  }

  if (isError) {
    const err = error as { response?: { data?: { error?: { message?: string } }, status?: number } };
    const msg = err?.response?.data?.error?.message ?? "Link not found";
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: "#000" }}
      >
        <p className="text-4xl mb-4">🔗</p>
        <h1 className="text-white font-black text-xl mb-2">
          {err?.response?.status === 410
            ? "Link Expired"
            : "Not Found"}
        </h1>
        <p className="text-slate-500 font-mono text-sm">{msg}</p>
      </div>
    );
  }

  const isActive   = trip?.status === "ACTIVE";
  const durationMin = trip?.startTime && trip?.endTime
    ? Math.round(
        (new Date(trip.endTime).getTime() -
          new Date(trip.startTime).getTime()) / 60_000
      )
    : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#000" }}>

      {/* Header — branded */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{
          borderColor:     "rgba(255,255,255,0.06)",
          backgroundColor: "#0a0a0a",
        }}
      >
        <div className="flex items-center gap-3">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.companyName}
              className="h-8 object-contain"
            />
          ) : (
            <div
              className="w-8 h-8 flex items-center justify-center
                text-black font-black text-sm"
              style={{ background: branding.primaryColor }}
            >
              {branding.companyName?.charAt(0) ?? "F"}
            </div>
          )}
          <div>
            <p
              className="font-black text-sm"
              style={{ color: branding.primaryColor }}
            >
              {branding.companyName}
            </p>
            <p className="text-xs font-mono text-slate-600">
              Trip Tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isActive ? (
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: branding.primaryColor }}
              />
              <span
                className="text-xs font-mono font-bold"
                style={{ color: branding.primaryColor }}
              >
                LIVE
              </span>
            </div>
          ) : (
            <span className="text-xs font-mono text-slate-600">
              {trip?.status}
            </span>
          )}
        </div>
      </div>

      {/* Map fills remaining space */}
      <div className="flex flex-1 overflow-hidden">
        <div ref={containerRef} className="flex-1" />

        {/* Info Panel */}
        <div
          className="w-72 border-l overflow-y-auto flex flex-col"
          style={{
            background:   "#0a0a0a",
            borderColor:  "rgba(255,255,255,0.06)",
          }}
        >
          {/* Vehicle */}
          <div
            className="px-5 py-5 border-b"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <p
              className="text-xs font-mono uppercase tracking-widest mb-1"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Vehicle
            </p>
            <p
              className="text-2xl font-black font-mono"
              style={{ color: branding.primaryColor }}
            >
              {trip?.vehicle?.licensePlate}
            </p>
            <p className="text-sm text-slate-500 font-mono mt-0.5">
              {trip?.vehicle?.make} {trip?.vehicle?.model}
            </p>
          </div>

          {/* Stats */}
          <div className="p-4 grid grid-cols-2 gap-2">
            <StatCard
              label="Start"
              value={
                trip?.startTime
                  ? format(new Date(trip.startTime), "HH:mm")
                  : "—"
              }
              primary={branding.primaryColor}
            />
            <StatCard
              label={isActive ? "Running" : "End"}
              value={
                isActive
                  ? "Live"
                  : trip?.endTime
                    ? format(new Date(trip.endTime), "HH:mm")
                    : "—"
              }
            />
            <StatCard
              label="Distance"
              value={
                trip?.distanceKm
                  ? `${Number(trip.distanceKm).toFixed(2)} km`
                  : route.length > 0
                    ? `${route.length} pings`
                    : "—"
              }
            />
            <StatCard
              label="Duration"
              value={
                durationMin !== null
                  ? durationMin >= 60
                    ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
                    : `${durationMin}m`
                  : "—"
              }
            />
          </div>

          {/* Date */}
          {trip?.startTime && (
            <div
              className="px-5 py-4 border-t text-xs font-mono text-slate-700"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              {format(new Date(trip.startTime), "EEEE, MMMM d yyyy")}
            </div>
          )}

          {/* View count */}
          <div
            className="px-5 py-4 border-t mt-auto text-xs font-mono text-slate-700"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            {data?.viewCount} view{data?.viewCount !== 1 ? "s" : ""}
            {data?.label && (
              <span className="block text-slate-600 mt-1">{data.label}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
