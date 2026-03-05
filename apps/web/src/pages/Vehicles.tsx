import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage, vehiclesApi, usersApi } from "../lib/api";
import { Button, Badge, Modal, Input, Table } from "../components/ui";
import toast from "react-hot-toast";
import type { VehicleStatus } from "@fleet/shared";

function statusColor(s: VehicleStatus) {
  return s === "ACTIVE" ? "green" : s === "IN_TRIP" ? "amber" : "slate";
}

export default function Vehicles() {
  const qc = useQueryClient();
  const [search,   setSearch]   = useState("");
  const [showAdd,  setShowAdd]  = useState(false);
  const [showAssign, setShowAssign] = useState<string | null>(null);

  const [form, setForm] = useState({
    licensePlate: "",
    make: "", model: "",
    year: new Date().getFullYear(),
    costPerKm: 2.5,
  });

  const { data: stats } = useQuery({
    queryKey: ["vehicle-stats"],
    queryFn:  () => vehiclesApi.stats().then((r) => r.data.data),
  });

  const { data: vehiclesRes, isLoading } = useQuery({
    queryKey: ["vehicles", search],
    queryFn:  () => vehiclesApi.list({ search: search || undefined }).then((r) => r.data),
  });

  const { data: driversRes } = useQuery({
    queryKey: ["drivers"],
    queryFn:  () => usersApi.list({ role: "DRIVER" }).then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: vehiclesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["vehicle-stats"] });
      setShowAdd(false);
      setForm({ licensePlate: "", make: "", model: "", year: new Date().getFullYear(), costPerKm: 2.5 });
      toast.success("Vehicle added to fleet");
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMut = useMutation({
    mutationFn: vehiclesApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Vehicle removed");
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });

  const assignMut = useMutation({
    mutationFn: ({ id, driverId }: { id: string; driverId: string | null }) =>
      vehiclesApi.assign(id, { driverId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      setShowAssign(null);
      toast.success("Driver assignment updated");
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });

  const vehicles = vehiclesRes?.data ?? [];
  const drivers  = driversRes?.data ?? [];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">FLEET</h1>
          <p className="text-xs font-mono text-slate-500 mt-0.5">Vehicle management</p>
        </div>
        <Button icon={<span>+</span>} onClick={() => setShowAdd(true)}>
          ADD VEHICLE
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-px bg-white/5 border-b border-white/5">
        {[
          { label: "TOTAL",    value: stats?.total   ?? 0 },
          { label: "ACTIVE",   value: stats?.active  ?? 0, accent: true },
          { label: "IN TRIP",  value: stats?.inTrip  ?? 0 },
          { label: "INACTIVE", value: stats?.inactive ?? 0 },
        ].map((s) => (
          <div key={s.label} className="bg-black px-6 py-4">
            <p className="text-xs font-mono uppercase tracking-widest text-slate-600">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.accent ? "text-amber-400" : "text-white"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-white/5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by plate, make, model..."
          className="bg-transparent text-sm font-mono text-white placeholder-slate-700 outline-none w-full max-w-xs"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="text-center py-20 text-slate-600 font-mono text-xs">LOADING...</div>
        ) : (
          <Table
            headers={["PLATE", "VEHICLE", "YEAR", "RATE/KM", "STATUS", "DRIVER", "ACTIONS"]}
            rows={vehicles.map((v) => [
              <span className="font-mono font-bold text-amber-400">{v.licensePlate}</span>,
              <span>{v.make} {v.model}</span>,
              <span className="font-mono">{v.year}</span>,
              <span className="font-mono">${Number(v.costPerKm).toFixed(2)}</span>,
              <Badge color={statusColor(v.status)}>{v.status}</Badge>,
              v.assignedDriver
                ? <span className="text-slate-300">{v.assignedDriver.name}</span>
                : <span className="text-slate-600 font-mono text-xs">UNASSIGNED</span>,
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAssign(v.id)}
                  className="text-xs font-mono text-slate-500 hover:text-amber-400 transition-colors"
                >
                  ASSIGN
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Remove ${v.licensePlate}?`)) deleteMut.mutate(v.id);
                  }}
                  className="text-xs font-mono text-slate-600 hover:text-red-400 transition-colors"
                >
                  DELETE
                </button>
              </div>,
            ])}
          />
        )}
      </div>

      {/* Add Vehicle Modal */}
      <Modal title="ADD VEHICLE" open={showAdd} onClose={() => setShowAdd(false)}>
        <div className="flex flex-col gap-4">
          <Input label="License Plate" value={form.licensePlate}
            onChange={(e) => setForm((f) => ({ ...f, licensePlate: e.target.value }))}
            placeholder="TRK-001" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Make" value={form.make}
              onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
              placeholder="Mercedes-Benz" />
            <Input label="Model" value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              placeholder="Actros" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Year" type="number" value={form.year}
              onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))} />
            <Input label="Cost / km ($)" type="number" step="0.01" value={form.costPerKm}
              onChange={(e) => setForm((f) => ({ ...f, costPerKm: Number(e.target.value) }))} />
          </div>
          <Button
            loading={createMut.isPending}
            onClick={() => createMut.mutate(form)}
            className="w-full justify-center mt-2"
          >
            ADD VEHICLE
          </Button>
        </div>
      </Modal>

      {/* Assign Driver Modal */}
      <Modal
        title="ASSIGN DRIVER"
        open={Boolean(showAssign)}
        onClose={() => setShowAssign(null)}
      >
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              if (!showAssign) return;
              assignMut.mutate({ id: showAssign, driverId: null });
            }}
            className="w-full text-left px-4 py-3 font-mono text-xs text-slate-500
              hover:bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
          >
            UNASSIGN DRIVER
          </button>
          {drivers.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                if (!showAssign) return;
                assignMut.mutate({ id: showAssign, driverId: d.id });
              }}
              className="w-full text-left px-4 py-3 font-mono text-sm text-white
                hover:bg-white/5 border border-white/5 hover:border-amber-500/30 transition-colors"
            >
              <div className="font-bold">{d.name}</div>
              <div className="text-slate-500 text-xs">{d.email}</div>
            </button>
          ))}
          {drivers.length === 0 && (
            <p className="text-slate-600 font-mono text-xs text-center py-4">
              No available drivers — invite drivers first
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
