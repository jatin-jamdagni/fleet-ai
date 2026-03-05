import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, startOfWeek, endOfWeek, addMonths,
  subMonths,
} from "date-fns";
import { api } from "../../lib/api";
import { Card, Badge, Button, Modal, Input, Spinner } from "../../components/ui";
import toast from "react-hot-toast";

type ScheduleStatus = "PENDING" | "NOTIFIED" | "STARTED" | "COMPLETED" | "CANCELED";

type ScheduleVehicle = {
  licensePlate: string;
  make?: string | null;
  model?: string | null;
};

type ScheduleDriver = {
  name: string;
  email?: string | null;
};

type ScheduleItem = {
  id: string;
  title: string;
  notes?: string | null;
  scheduledAt: string;
  status: ScheduleStatus;
  vehicle?: ScheduleVehicle | null;
  driver?: ScheduleDriver | null;
};

type ScheduleCreatePayload = {
  vehicleId: string;
  driverId: string;
  title: string;
  notes?: string;
  scheduledAt: string;
};

type VehicleListItem = {
  id: string;
  licensePlate: string;
  make?: string | null;
  model?: string | null;
};

type DriverListItem = {
  id: string;
  name: string;
};

type ApiError = {
  response?: { data?: { error?: { message?: string } } };
};

const scheduleApi = {
  list:    (from: string, to: string) =>
    api.get(`/schedules?from=${from}&to=${to}`).then((r) => r.data.data as ScheduleItem[]),
  create:  (body: ScheduleCreatePayload) =>
    api.post("/schedules", body).then((r) => r.data.data),
  cancel:  (id: string) =>
    api.patch(`/schedules/${id}/status`, { status: "CANCELED" }),
  delete:  (id: string) =>
    api.delete(`/schedules/${id}`),
};

const vehiclesApi = {
  list: () => api.get("/vehicles").then((r) => r.data.data as VehicleListItem[]),
};

const usersApi = {
  drivers: () =>
    api.get("/users?role=DRIVER").then((r) => r.data.data as DriverListItem[]),
};

function statusColor(s: ScheduleStatus): "green" | "amber" | "red" | "slate" {
  return s === "COMPLETED" ? "green"
       : s === "NOTIFIED"  ? "amber"
       : s === "PENDING"   ? "slate"
       : s === "STARTED"   ? "amber"
       : "red";
}

export default function SchedulePage() {
  const qc               = useQueryClient();
  const [month, setMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]  = useState({
    vehicleId: "", driverId: "", title: "",
    notes: "", scheduledAt: "",
  });

  const monthStart = startOfMonth(month);
  const monthEnd   = endOfMonth(month);
  const calStart   = startOfWeek(monthStart);
  const calEnd     = endOfWeek(monthEnd);
  const days       = eachDayOfInterval({ start: calStart, end: calEnd });

  const { data: schedules = [], isLoading } = useQuery<ScheduleItem[]>({
    queryKey: ["schedules", format(monthStart, "yyyy-MM")],
    queryFn:  () => scheduleApi.list(
      monthStart.toISOString(),
      monthEnd.toISOString()
    ),
  });

  const { data: vehicles = [] } = useQuery<VehicleListItem[]>({
    queryKey: ["vehicles-list"],
    queryFn:  vehiclesApi.list,
  });

  const { data: drivers = [] } = useQuery<DriverListItem[]>({
    queryKey: ["drivers-list"],
    queryFn:  usersApi.drivers,
  });

  const createMut = useMutation({
    mutationFn: scheduleApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      setShowModal(false);
      setForm({ vehicleId: "", driverId: "", title: "", notes: "", scheduledAt: "" });
      toast.success("Trip scheduled");
    },
    onError: (err: ApiError) => {
      toast.error(err.response?.data?.error?.message ?? "Failed to schedule");
    },
  });

  const cancelMut = useMutation({
    mutationFn: scheduleApi.cancel,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Schedule canceled");
    },
  });

  const schedulesOnDay = (day: Date) =>
    schedules.filter((s) => isSameDay(new Date(s.scheduledAt), day));

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">
            SCHEDULE
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-0.5">
            Planned trips calendar
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ SCHEDULE TRIP</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setMonth((m) => subMonths(m, 1))}
            className="px-3 py-1.5 text-xs font-mono border border-white/8
              text-slate-500 hover:text-white transition-colors"
          >
            ← PREV
          </button>
          <h2 className="text-lg font-black text-white tracking-tight">
            {format(month, "MMMM yyyy").toUpperCase()}
          </h2>
          <button
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="px-3 py-1.5 text-xs font-mono border border-white/8
              text-slate-500 hover:text-white transition-colors"
          >
            NEXT →
          </button>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-white/5">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
            <div key={d}
              className="bg-black px-2 py-2 text-center text-xs font-mono
                tracking-widest text-slate-600">
              {d}
            </div>
          ))}

          {days.map((day) => {
            const daySchedules = schedulesOnDay(day);
            const inMonth      = day.getMonth() === month.getMonth();
            const today        = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`bg-black min-h-[100px] px-2 py-2 ${
                  !inMonth ? "opacity-30" : ""
                } ${today ? "ring-1 ring-amber-500/30" : ""}`}
              >
                <div className={`text-xs font-mono font-bold mb-1 ${
                  today ? "text-amber-400" : "text-slate-500"
                }`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {daySchedules.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className={`px-1.5 py-1 text-xs font-mono truncate
                        border cursor-pointer group relative ${
                        s.status === "CANCELED"
                          ? "border-red-500/20 bg-red-500/5 text-red-700"
                          : "border-amber-500/20 bg-amber-500/5 text-amber-400"
                      }`}
                      title={`${s.title} — ${s.vehicle?.licensePlate}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{s.title}</span>
                        {s.status !== "CANCELED" && (
                          <button
                            onClick={() => cancelMut.mutate(s.id)}
                            className="opacity-0 group-hover:opacity-100
                              text-red-500 hover:text-red-400 transition-all
                              text-xs flex-shrink-0"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {format(new Date(s.scheduledAt), "HH:mm")} ·{" "}
                        {s.vehicle?.licensePlate}
                      </div>
                    </div>
                  ))}
                  {daySchedules.length > 3 && (
                    <div className="text-xs font-mono text-slate-600 pl-1">
                      +{daySchedules.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Upcoming list */}
        <div className="mt-8">
          <h2 className="text-xs font-mono uppercase tracking-widest
            text-slate-600 mb-4">
            Upcoming This Month
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : schedules.filter(
              (s) => s.status !== "CANCELED" && s.status !== "COMPLETED"
            ).length === 0 ? (
            <div className="text-center py-8 text-slate-700 font-mono text-xs">
              NO SCHEDULED TRIPS THIS MONTH
            </div>
          ) : (
            <Card noPad>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {["DATE / TIME", "TRIP", "VEHICLE", "DRIVER", "STATUS", ""].map((h) => (
                      <th key={h}
                        className="text-left px-4 py-3 text-xs font-mono
                          tracking-widest text-slate-600">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedules
                    .filter((s) => s.status !== "CANCELED" && s.status !== "COMPLETED")
                    .sort((a, b) =>
                      new Date(a.scheduledAt).getTime() -
                      new Date(b.scheduledAt).getTime()
                    )
                    .map((s) => (
                      <tr key={s.id}
                        className="border-b border-white/5 hover:bg-white/3">
                        <td className="px-4 py-3 font-mono text-xs">
                          <div className="text-white font-bold">
                            {format(new Date(s.scheduledAt), "MMM d")}
                          </div>
                          <div className="text-slate-600">
                            {format(new Date(s.scheduledAt), "HH:mm")}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-white font-bold text-sm">
                            {s.title}
                          </div>
                          {s.notes && (
                            <div className="text-slate-600 text-xs font-mono truncate max-w-[160px]">
                              {s.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-amber-400">
                          {s.vehicle?.licensePlate}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {s.driver?.name}
                        </td>
                        <td className="px-4 py-3">
                          <Badge color={statusColor(s.status)}>
                            {s.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => cancelMut.mutate(s.id)}
                            className="text-xs font-mono text-slate-600
                              hover:text-red-400 transition-colors"
                          >
                            CANCEL
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="SCHEDULE TRIP"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono uppercase tracking-widest
              text-slate-500 block mb-1.5">
              Vehicle
            </label>
            <select
              value={form.vehicleId}
              onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
              className="w-full bg-slate-900 border border-white/10 px-3 py-2
                text-white font-mono text-sm focus:outline-none
                focus:border-amber-500/50"
            >
              <option value="">Select vehicle...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.licensePlate} — {v.make} {v.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-mono uppercase tracking-widest
              text-slate-500 block mb-1.5">
              Driver
            </label>
            <select
              value={form.driverId}
              onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}
              className="w-full bg-slate-900 border border-white/10 px-3 py-2
                text-white font-mono text-sm focus:outline-none
                focus:border-amber-500/50"
            >
              <option value="">Select driver...</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Trip Title"
            placeholder="e.g. Delivery to Warehouse A"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />

          <Input
            label="Notes (optional)"
            placeholder="Additional instructions..."
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />

          <Input
            label="Date & Time"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
          />

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowModal(false)}
              className="flex-1 justify-center"
            >
              CANCEL
            </Button>
            <Button
              loading={createMut.isPending}
              onClick={() => {
                if (!form.vehicleId || !form.driverId ||
                    !form.title || !form.scheduledAt) {
                  toast.error("Fill in all required fields");
                  return;
                }
                createMut.mutate({
                  ...form,
                  scheduledAt: new Date(form.scheduledAt).toISOString(),
                });
              }}
              className="flex-1 justify-center"
            >
              SCHEDULE
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
