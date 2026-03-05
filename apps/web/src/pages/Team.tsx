import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage, usersApi } from "../lib/api";
import { Badge, Table, Modal, Input, Button } from "../components/ui";
import toast from "react-hot-toast";

type InvitableRole = "DRIVER" | "FLEET_MANAGER";

export default function Team() {
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; role: InvitableRole }>({
    name: "",
    email: "",
    role: "DRIVER",
  });

  const { data: stats } = useQuery({
    queryKey: ["user-stats"],
    queryFn:  () => usersApi.stats().then((r) => r.data.data),
  });

  const { data: usersRes, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn:  () => usersApi.list().then((r) => r.data),
  });

  const inviteMut = useMutation({
    mutationFn: usersApi.invite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setShowInvite(false);
      setForm({ name: "", email: "", role: "DRIVER" });
      toast.success("Invite sent!");
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMut = useMutation({
    mutationFn: usersApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User removed");
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });

  const users = usersRes?.data ?? [];

  return (
    <div className="flex flex-col">
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">TEAM</h1>
          <p className="text-xs font-mono text-slate-500 mt-0.5">Drivers & managers</p>
        </div>
        <Button icon={<span>+</span>} onClick={() => setShowInvite(true)}>
          INVITE
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-white/5 border-b border-white/5">
        {[
          { label: "TOTAL",    value: stats?.total    ?? 0 },
          { label: "MANAGERS", value: stats?.managers  ?? 0 },
          { label: "DRIVERS",  value: stats?.drivers   ?? 0, accent: true },
        ].map((s) => (
          <div key={s.label} className="bg-black px-6 py-4">
            <p className="text-xs font-mono uppercase tracking-widest text-slate-600">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.accent ? "text-amber-400" : "text-white"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="text-center py-20 text-slate-600 font-mono text-xs">LOADING...</div>
        ) : (
          <Table
            headers={["NAME", "EMAIL", "ROLE", "VEHICLE", "LAST LOGIN", "ACTIONS"]}
            rows={users.map((u) => [
              <span className="font-bold text-white">{u.name}</span>,
              <span className="font-mono text-xs text-slate-400">{u.email}</span>,
              <Badge color={u.role === "FLEET_MANAGER" ? "blue" : "green"}>{u.role}</Badge>,
              u.vehicle
                ? <span className="font-mono text-amber-400">{u.vehicle.licensePlate}</span>
                : <span className="text-slate-600 font-mono text-xs">—</span>,
              <span className="font-mono text-xs text-slate-500">
                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
              </span>,
              <button
                onClick={() => {
                  if (confirm(`Remove ${u.name}?`)) deleteMut.mutate(u.id);
                }}
                className="text-xs font-mono text-slate-600 hover:text-red-400 transition-colors"
              >
                REMOVE
              </button>,
            ])}
          />
        )}
      </div>

      <Modal title="INVITE TEAM MEMBER" open={showInvite} onClose={() => setShowInvite(false)}>
        <div className="flex flex-col gap-4">
          <Input label="Full Name" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="John Driver" />
          <Input label="Email" type="email" value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="driver@company.com" />
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-slate-500 block mb-1">
              ROLE
            </label>
            <div className="flex gap-2">
              {(["DRIVER", "FLEET_MANAGER"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setForm((f) => ({ ...f, role: r }))}
                  className={`flex-1 py-2.5 text-xs font-mono tracking-wider border transition-colors ${
                    form.role === r
                      ? "bg-amber-500/10 border-amber-500/50 text-amber-400"
                      : "border-white/10 text-slate-500 hover:border-white/20"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <Button
            loading={inviteMut.isPending}
            onClick={() => inviteMut.mutate(form)}
            className="w-full justify-center mt-2"
          >
            SEND INVITE
          </Button>
        </div>
      </Modal>
    </div>
  );
}
