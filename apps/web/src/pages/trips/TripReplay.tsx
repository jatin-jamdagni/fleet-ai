import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import mapboxgl from "mapbox-gl";
import { api } from "../../lib/api";
import { Spinner, Badge } from "../../components/ui";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

type TripReplayPoint = {
  lat: number;
  lng: number;
  speedKmh: number | null;
  heading: number | null;
  recordedAt: string;
};

type TripReplayStats = {
  pingCount: number;
  maxSpeedKmh: string | null;
  avgSpeedKmh: string | null;
  durationMin: number | null;
  distanceKm: string | null;
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number; lng: number };
};

type TripReplayTrip = {
  id: string;
  status: string;
  startTime: string | null;
  endTime: string | null;
  distanceKm: string | number | null;
  vehicle: { licensePlate: string };
};

type TripReplayResponse = {
  trip: TripReplayTrip;
  route: TripReplayPoint[];
  geojson: unknown | null;
  stats: TripReplayStats | null;
};

type SpeedingEvent = {
  id: string;
  speedKmh: number;
  limitKmh: number;
  lat: number;
  lng: number;
  occurredAt: string;
};

const tripsApi = {
  route: (id: string) =>
    api.get(`/trips/${id}/route`).then((r) => r.data.data as TripReplayResponse),
  speeding: (id: string) =>
    api.get(`/trips/${id}/speeding`).then((r) => r.data.data as SpeedingEvent[]),
};

function speedColor(speedKmh: number): string {
  if (speedKmh > 120) return "#ef4444";
  if (speedKmh > 80)  return "#f59e0b";
  if (speedKmh > 40)  return "#10b981";
  return "#3b82f6";
}

export default function TripReplay() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const mapRef     = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef    = useRef<mapboxgl.Marker | null>(null);
  const animRef      = useRef<number | null>(null);

  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed,    setSpeed]    = useState(1);  // playback multiplier

  const { data, isLoading } = useQuery<TripReplayResponse>({
    queryKey: ["trip-route", id],
    queryFn:  () => tripsApi.route(id!),
    enabled:  !!id,
  });

  const { data: speedingEvents = [] } = useQuery<SpeedingEvent[]>({
    queryKey: ["trip-speeding", id],
    queryFn:  () => tripsApi.speeding(id!),
    enabled:  !!id,
  });

  const route  = data?.route ?? [];
  const stats  = data?.stats;
  const trip   = data?.trip;

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

  const drawRoute = useCallback((map: mapboxgl.Map) => {
    if (route.length < 2) return;

    // Remove existing layers
    ["route-line", "route-points", "speeding-points"].forEach((id) => {
      if (map.getLayer(id))  map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });

    // Full route line
    map.addSource("route-line", {
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
      id:     "route-line",
      type:   "line",
      source: "route-line",
      paint: {
        "line-color":   "#f59e0b",
        "line-width":   2.5,
        "line-opacity": 0.8,
      },
    });

    // Speed-coloured points
    map.addSource("route-points", {
      type: "geojson",
      data: {
        type:     "FeatureCollection",
        features: route.map((p, i) => ({
          type:       "Feature",
          properties: { speed: p.speedKmh ?? 0, index: i },
          geometry:   { type: "Point", coordinates: [p.lng, p.lat] },
        })),
      },
    });

    map.addLayer({
      id:     "route-points",
      type:   "circle",
      source: "route-points",
      paint: {
        "circle-radius":  3,
        "circle-color": [
          "interpolate", ["linear"],
          ["get", "speed"],
          0,   "#3b82f6",
          40,  "#10b981",
          80,  "#f59e0b",
          120, "#ef4444",
        ],
        "circle-opacity": 0.7,
      },
    });

    // Speeding event markers
      if (speedingEvents.length > 0) {
        map.addSource("speeding-points", {
          type: "geojson",
          data: {
            type:     "FeatureCollection",
            features: speedingEvents.map((e) => ({
              type:       "Feature",
              properties: {
                speed: e.speedKmh.toFixed(0),
                limit: e.limitKmh,
            },
            geometry: { type: "Point", coordinates: [e.lng, e.lat] },
          })),
        },
      });

      map.addLayer({
        id:     "speeding-points",
        type:   "circle",
        source: "speeding-points",
        paint: {
          "circle-radius":       8,
          "circle-color":        "#ef4444",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1.5,
        },
      });
    }

    // Animated marker
    const el = document.createElement("div");
    el.style.cssText = `
      width: 20px; height: 20px; background: #f59e0b;
      border: 2px solid white; border-radius: 50%;
      box-shadow: 0 0 8px rgba(245,158,11,0.6);
    `;

    if (markerRef.current) markerRef.current.remove();
    markerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([route[0]!.lng, route[0]!.lat])
      .addTo(map);

    // Fit bounds
    const bounds = new mapboxgl.LngLatBounds();
    route.forEach((p) => bounds.extend([p.lng, p.lat]));
    map.fitBounds(bounds, { padding: 60, duration: 1000 });
  }, [route, speedingEvents]);

  // ── Draw route when data loads ───────────────────────────────────────────────

  useEffect(() => {
    const map = mapRef.current;
    if (!map || route.length < 2) return;

    map.on("load", () => {
      drawRoute(map);
    });

    if (map.isStyleLoaded()) {
      drawRoute(map);
    }
  }, [route, speedingEvents, drawRoute]);

  // ── Playback animation ───────────────────────────────────────────────────────

  const startIndex = useRef(0);
  const lastTime   = useRef(0);

  function animate(timestamp: number) {
    if (!lastTime.current) lastTime.current = timestamp;
    const elapsed = (timestamp - lastTime.current) * speed;
    lastTime.current = timestamp;

    // Advance ~1 ping per 200ms of real time
    const step = Math.max(1, Math.floor(elapsed / 200));
    startIndex.current = Math.min(startIndex.current + step, route.length - 1);

    const point = route[startIndex.current];
    if (point && markerRef.current) {
      markerRef.current.setLngLat([point.lng, point.lat]);

      // Pan map to keep marker visible
      mapRef.current?.panTo([point.lng, point.lat], { duration: 100 });
    }

    const pct = (startIndex.current / (route.length - 1)) * 100;
    setProgress(pct);

    if (startIndex.current < route.length - 1) {
      animRef.current = requestAnimationFrame(animate);
    } else {
      setPlaying(false);
    }
  }

  const handlePlay = () => {
    if (startIndex.current >= route.length - 1) {
      startIndex.current = 0;
      setProgress(0);
    }
    lastTime.current = 0;
    setPlaying(true);
    animRef.current = requestAnimationFrame(animate);
  };

  const handlePause = () => {
    setPlaying(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  };

  const handleRestart = () => {
    handlePause();
    startIndex.current = 0;
    setProgress(0);
    if (route[0] && markerRef.current) {
      markerRef.current.setLngLat([route[0].lng, route[0].lat]);
    }
  };

  // Cleanup animation on unmount
  useEffect(() => () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-4 shrink-0">
        <button
          onClick={() => navigate("/trips")}
          className="text-slate-500 hover:text-white transition-colors font-mono text-sm"
        >
          ← TRIPS
        </button>
        <div className="flex-1">
          <h1 className="text-base font-black text-white tracking-tight">
            TRIP REPLAY
            {trip && (
              <span className="text-amber-400 ml-2">
                {trip.vehicle.licensePlate}
              </span>
            )}
          </h1>
          {trip?.startTime && (
            <p className="text-xs font-mono text-slate-600 mt-0.5">
              {new Date(trip.startTime).toLocaleString()}
            </p>
          )}
        </div>
        <Badge color={trip?.status === "COMPLETED" ? "green" : "amber"}>
          {trip?.status}
        </Badge>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Map */}
        <div ref={containerRef} className="flex-1 relative">
          {route.length === 0 && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center
              bg-black/80 z-10">
              <div className="text-center">
                <p className="text-slate-500 font-mono text-sm">NO GPS DATA</p>
                <p className="text-slate-700 font-mono text-xs mt-1">
                  No pings were recorded for this trip
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-72 border-l border-white/5 flex flex-col bg-black overflow-y-auto">

          {/* Stats */}
          {stats && (
            <div className="p-4 border-b border-white/5">
              <p className="text-xs font-mono uppercase tracking-widest text-slate-600 mb-3">
                Trip Stats
              </p>
              {[
                { label: "DISTANCE",    value: `${stats.distanceKm} km` },
                { label: "DURATION",    value: `${stats.durationMin} min` },
                { label: "AVG SPEED",   value: stats.avgSpeedKmh ? `${stats.avgSpeedKmh} km/h` : "—" },
                { label: "MAX SPEED",   value: stats.maxSpeedKmh ? `${stats.maxSpeedKmh} km/h` : "—" },
                { label: "PINGS",       value: stats.pingCount },
                { label: "SPEEDING",    value: speedingEvents.length > 0
                  ? `${speedingEvents.length} events`
                  : "None",
                },
              ].map((s) => (
                <div key={s.label}
                  className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-xs font-mono text-slate-600">
                    {s.label}
                  </span>
                  <span className={`text-xs font-mono font-bold ${
                    s.label === "SPEEDING" && speedingEvents.length > 0
                      ? "text-red-400"
                      : "text-white"
                  }`}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Playback controls */}
          {route.length > 0 && (
            <div className="p-4 border-b border-white/5">
              <p className="text-xs font-mono uppercase tracking-widest text-slate-600 mb-3">
                Playback
              </p>

              {/* Progress bar */}
              <div className="h-1 bg-white/5 mb-4 cursor-pointer">
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={handleRestart}
                  className="text-slate-500 hover:text-white transition-colors
                    font-mono text-lg"
                  title="Restart"
                >
                  ⏮
                </button>
                <button
                  onClick={playing ? handlePause : handlePlay}
                  className="w-10 h-10 bg-amber-500 text-black font-black
                    flex items-center justify-center hover:bg-amber-400
                    transition-colors text-base"
                >
                  {playing ? "⏸" : "▶"}
                </button>
                <span className="text-xs font-mono text-slate-500 ml-auto">
                  {Math.round(progress)}%
                </span>
              </div>

              {/* Speed multiplier */}
              <div>
                <p className="text-xs font-mono text-slate-600 mb-2">
                  Speed: {speed}×
                </p>
                <div className="flex gap-1">
                  {[1, 2, 5, 10].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`px-2 py-1 text-xs font-mono border transition-colors ${
                        speed === s
                          ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
                          : "border-white/8 text-slate-600 hover:text-white"
                      }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Speed legend */}
          <div className="p-4 border-b border-white/5">
            <p className="text-xs font-mono uppercase tracking-widest
              text-slate-600 mb-3">
              Speed Legend
            </p>
            {[
              { label: "< 40 km/h",   color: speedColor(0) },
              { label: "40–80 km/h",  color: speedColor(50) },
              { label: "80–120 km/h", color: speedColor(90) },
              { label: "> 120 km/h",  color: speedColor(130) },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: l.color }}
                />
                <span className="text-xs font-mono text-slate-500">{l.label}</span>
              </div>
            ))}
            {speedingEvents.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-3 h-3 rounded-full bg-red-500
                  ring-1 ring-white shrink-0" />
                <span className="text-xs font-mono text-red-400">
                  Speeding Event
                </span>
              </div>
            )}
          </div>

          {/* Speeding Events List */}
          {speedingEvents.length > 0 && (
            <div className="p-4">
              <p className="text-xs font-mono uppercase tracking-widest
                text-slate-600 mb-3">
                Speeding Events ({speedingEvents.length})
              </p>
              <div className="space-y-2">
                {speedingEvents.map((e) => (
                  <div
                    key={e.id}
                    className="border border-red-500/20 bg-red-500/5 px-3 py-2"
                  >
                    <div className="flex justify-between">
                      <span className="text-red-400 font-black text-sm font-mono">
                        {e.speedKmh.toFixed(0)} km/h
                      </span>
                      <span className="text-slate-600 text-xs font-mono">
                        limit: {e.limitKmh}
                      </span>
                    </div>
                    <span className="text-slate-700 text-xs font-mono">
                      {new Date(e.occurredAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
