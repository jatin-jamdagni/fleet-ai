import { NavLink, useNavigate } from "react-router";
import { useAuthStore } from "../../store/auth.store";
import { useFleetStore } from "../../store/fleet.store";
import { authApi } from "../../lib/api";
import { fleetWS } from "../../lib/ws";

const NAV = [
  {
    to: "/",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    label: "DASHBOARD",
    end: true,
  },

  {
    to: "/vehicles",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 5v3h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    label: "FLEET",
  },
  {
    to: "/trips",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12h18M3 6h18M3 18h18" />
      </svg>
    ),
    label: "TRIPS",
  },
  {
    to: "/invoices",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    label: "BILLING",
  },
  {
    to: "/team",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    label: "TEAM",
  },
  {
    to: "/ai",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 8v4l3 3" />
        <path d="M18 2v4h4" />
      </svg>
    ),
    label: "AI LOGS",
  },
  {
    to: "/analytics",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
    label: "ANALYTICS",
  },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const vehicles = useFleetStore((s) => s.vehicles);
  const connected = useFleetStore((s) => s.wsConnected);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuth();
    fleetWS.disconnect();
    navigate("/login");
  };

  return (
    <aside className="w-56 bg-black border-r border-white/8 flex flex-col h-screen sticky top-0 z-30">

      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/8">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-500 flex items-center justify-center text-black font-black text-sm">
            F
          </div>
          <div>
            <div className="text-white font-black text-sm tracking-tight">
              FLEET AI
            </div>
            <div className="text-slate-600 text-xs font-mono truncate max-w-[120px]">
              {user?.tenantName}
            </div>
          </div>
        </div>
      </div>

      {/* WS Status */}
      <div className="px-5 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-slate-600"
              }`}
          />
          <span className="text-xs font-mono text-slate-500">
            {connected ? "LIVE" : "OFFLINE"}
          </span>
          {vehicles.size > 0 && (
            <span className="ml-auto text-xs font-mono text-amber-400">
              {vehicles.size} active
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 text-xs font-mono tracking-wider transition-all ${isActive
                ? "text-amber-400 bg-amber-500/5 border-r-2 border-amber-500"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/3"
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-white/8 px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-black text-amber-400">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate">{user?.name}</p>
            <p className="text-slate-600 text-xs font-mono truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left text-xs font-mono text-slate-600 hover:text-red-400 transition-colors"
        >
          → LOGOUT
        </button>
      </div>
    </aside>
  );
}