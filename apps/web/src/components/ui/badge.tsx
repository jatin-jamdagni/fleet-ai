import { ReactNode } from "react";

type BadgeColor = "green" | "amber" | "red" | "blue" | "slate" | "purple";

export function Badge({
  color = "slate",
  children,
}: {
  color?: BadgeColor;
  children: ReactNode;
}) {
  const colors: Record<BadgeColor, string> = {
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10  text-amber-400  border-amber-500/20",
    red: "bg-red-500/10    text-red-400    border-red-500/20",
    blue: "bg-blue-500/10   text-blue-400   border-blue-500/20",
    slate: "bg-white/5       text-slate-400  border-white/10",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold tracking-wide border rounded ${colors[color]}`}
    >
      {children}
    </span>
  );
}
