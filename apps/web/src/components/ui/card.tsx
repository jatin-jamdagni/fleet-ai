import { ReactNode } from "react";

export function Card({
  children,
  className = "",
  noPad,
}: {
  children: ReactNode;
  className?: string;
  noPad?: boolean;
}) {
  return (
    <div
      className={`bg-slate-900 border border-white/8 rounded-sm ${noPad ? "" : "p-5"} ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  icon?: ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-1">
            {label}
          </p>
          <p
            className={`text-3xl font-black tracking-tight ${accent ? "text-amber-400" : "text-white"}`}
          >
            {value}
          </p>
          {sub && <p className="text-xs text-slate-500 mt-1 font-mono">{sub}</p>}
        </div>
        {icon && <div className="text-slate-700 mt-1">{icon}</div>}
      </div>
    </Card>
  );
}
