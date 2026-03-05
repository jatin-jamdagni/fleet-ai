import { useMemo } from "react";
import { useLiveMap } from "../../hooks/useLiveMap";

function projectToMiniMap(lat: number, lng: number) {
  // Simple deterministic projection for lightweight live preview.
  const x = ((lng + 180) / 360) * 100;
  const y = (1 - (lat + 90) / 180) * 100;
  return { x, y };
}

export default function LiveMapPanel() {
  const { positions, activeCount } = useLiveMap();

  const dots = useMemo(
    () =>
      positions.map((p) => {
        const point = projectToMiniMap(p.lat, p.lng);
        return { ...p, ...point };
      }),
    [positions]
  );

  return (
    <div className="flex h-full flex-col border border-white/10 bg-black">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <p className="text-xs font-mono tracking-widest text-slate-500">LIVE MAP PANEL</p>
        <p className="text-xs font-mono text-amber-400">{activeCount} ACTIVE</p>
      </div>

      <div className="relative flex-1">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect x="0" y="0" width="100" height="100" fill="#050505" />
          {dots.map((p) => (
            <g key={p.vehicleId}>
              <circle cx={p.x} cy={p.y} r="1.6" fill="#f59e0b" />
              <text
                x={p.x + 1.8}
                y={p.y - 1.8}
                fill="#cbd5e1"
                fontSize="2.2"
                fontFamily="monospace"
              >
                {p.licensePlate}
              </text>
            </g>
          ))}
        </svg>

        {dots.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs font-mono text-slate-600">NO ACTIVE VEHICLES</p>
          </div>
        )}
      </div>
    </div>
  );
}
