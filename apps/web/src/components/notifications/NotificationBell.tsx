import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { api } from "../../lib/api";
import { fleetWS } from "../../lib/ws";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface NotificationListResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

const notifApi = {
  list: () => api.get("/notifications").then((r) => r.data.data as NotificationListResponse),
  markRead: (ids: string[]) => api.patch("/notifications/read", { ids }),
  markAll: () => api.patch("/notifications/read-all"),
};

function typeIcon(type: string): string {
  const icons: Record<string, string> = {
    TRIP_STARTED: "🚗",
    TRIP_ENDED: "✅",
    TRIP_FORCE_ENDED: "⛔",
    INVOICE_GENERATED: "🧾",
    INVOICE_PAID: "💰",
    VEHICLE_ASSIGNED: "🔑",
    DRIVER_INVITED: "👤",
    PLAN_LIMIT_WARNING: "⚠️",
    PAYMENT_FAILED: "❌",
    SYSTEM: "ℹ️",
  };
  return icons[type] ?? "🔔";
}

export function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: notifApi.list,
    refetchInterval: 30_000,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  useEffect(() => {
    const off = fleetWS.on((msg) => {
      if (msg.type === "NOTIFICATION") {
        qc.invalidateQueries({ queryKey: ["notifications"] });
      }
    });
    return off;
  }, [qc]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllMut = useMutation({
    mutationFn: notifApi.markAll,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markReadMut = useMutation({
    mutationFn: (ids: string[]) => notifApi.markRead(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const handleOpen = () => {
    setOpen((v) => !v);

    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      setTimeout(() => markReadMut.mutate(unreadIds), 1000);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-black text-xs font-black flex items-center justify-center rounded-none leading-none"
            style={{ fontSize: 9 }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-slate-900 border border-white/10 shadow-2xl z-50 max-h-[480px] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
              Notifications
              {unreadCount > 0 && <span className="ml-2 text-amber-400">({unreadCount})</span>}
            </span>
            <button
              onClick={() => markAllMut.mutate()}
              className="text-xs font-mono text-slate-600 hover:text-amber-400 transition-colors"
            >
              Mark all read
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-700 font-mono text-xs">
                NO NOTIFICATIONS
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-white/5 hover:bg-white/3 transition-colors cursor-default ${
                    !n.read ? "bg-amber-500/3" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-base mt-0.5 flex-shrink-0">{typeIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold truncate ${!n.read ? "text-white" : "text-slate-300"}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{n.body}</p>
                      <p className="text-xs text-slate-700 font-mono mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
