import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useFleetStore, type LiveVehicle } from "../../store/fleet.store";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN ?? "";

export function FleetMap({ className = "" }: { className?: string }) {
  const mapContainer  = useRef<HTMLDivElement>(null);
  const map           = useRef<mapboxgl.Map | null>(null);
  const markers       = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const vehicles      = useFleetStore((s) => s.vehicles);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style:     "mapbox://styles/mapbox/dark-v11",
      center:    [77.2090, 28.6139],
      zoom:      11,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    const currentMarkers = markers.current;

    return () => {
      currentMarkers.forEach((m) => m.remove());
      currentMarkers.clear();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when vehicles change
  useEffect(() => {
    if (!map.current) return;

    // Remove stale markers
    markers.current.forEach((marker, vehicleId) => {
      if (!vehicles.has(vehicleId)) {
        marker.remove();
        markers.current.delete(vehicleId);
      }
    });

    // Add/update markers
    vehicles.forEach((v) => {
      if (!v.lat || !v.lng) return;

      const existing = markers.current.get(v.vehicleId);

      if (existing) {
        existing.setLngLat([v.lng, v.lat]);
        // Update popup
        existing.getPopup()?.setHTML(popupHTML(v));
      } else {
        // Create marker element
        const el = document.createElement("div");
        el.innerHTML = markerSVG(v.heading);
        el.style.cursor = "pointer";

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([v.lng, v.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 20, closeButton: false })
              .setHTML(popupHTML(v))
          )
          .addTo(map.current!);

        markers.current.set(v.vehicleId, marker);
      }
    });
  }, [vehicles]);

  return (
    <div
      ref={mapContainer}
      className={`w-full h-full ${className}`}
      style={{ minHeight: "400px" }}
    />
  );
}

function markerSVG(heading: number): string {
  return `
    <div style="
      transform: rotate(${heading}deg);
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="#f59e0b" opacity="0.15"/>
        <circle cx="18" cy="18" r="8" fill="#f59e0b"/>
        <polygon points="18,4 22,16 18,14 14,16" fill="#ffffff"/>
      </svg>
    </div>
  `;
}

function popupHTML(v: LiveVehicle): string {
  return `
    <div style="font-family:monospace;font-size:12px;color:#e2e8f0;min-width:160px">
      <div style="font-weight:900;color:#f59e0b;margin-bottom:6px">${v.licensePlate}</div>
      <div style="color:#94a3b8;margin-bottom:2px">${v.driverName}</div>
      <div>${v.speed.toFixed(1)} km/h · ${v.heading}°</div>
      <div style="color:#475569;margin-top:4px;font-size:10px">
        ${new Date(v.timestamp).toLocaleTimeString()}
      </div>
    </div>
  `;
}