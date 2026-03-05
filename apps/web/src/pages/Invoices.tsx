import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage, invoicesApi } from "../lib/api";
import { Badge, Table } from "../components/ui";
import toast from "react-hot-toast";
import type { UpdateInvoiceStatusRequest } from "@fleet/shared";
import { InvoiceStatus } from "@fleet/shared";

function statusColor(s: InvoiceStatus) {
  return s === InvoiceStatus.PAID ? "green" : s === InvoiceStatus.PENDING ? "amber" : "red";
}

export default function Invoices() {
  const qc      = useQueryClient();
  const [filter, setFilter] = useState<InvoiceStatus | "">("");

  const { data: summary } = useQuery({
    queryKey: ["billing-summary"],
    queryFn:  () => invoicesApi.summary().then((r) => r.data.data),
  });

  const { data: invRes, isLoading } = useQuery({
    queryKey: ["invoices", filter],
    queryFn:  () =>
      invoicesApi.list(filter ? { status: filter } : undefined).then((r) => r.data),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string } & UpdateInvoiceStatusRequest) =>
      invoicesApi.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["billing-summary"] });
      toast.success("Invoice updated");
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });

  const invoices = invRes?.data ?? [];
  const token    = localStorage.getItem("accessToken") ?? "";

  const filters: Array<InvoiceStatus | ""> = [
    "",
    InvoiceStatus.PENDING,
    InvoiceStatus.PAID,
    InvoiceStatus.VOID,
  ];

  return (
    <div className="flex flex-col">
      <div className="px-6 py-5 border-b border-white/5">
        <h1 className="text-xl font-black text-white tracking-tight">BILLING</h1>
        <p className="text-xs font-mono text-slate-500 mt-0.5">Invoice management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-px bg-white/5 border-b border-white/5">
        {[
          { label: "TOTAL INVOICES",  value: summary?.totalInvoices  ?? 0 },
          { label: "PENDING",         value: summary?.pendingCount   ?? 0, accent: true },
          { label: "PAID",            value: summary?.paidCount      ?? 0 },
          { label: "MTD REVENUE",     value: summary ? `$${Number(summary.monthlyRevenue).toFixed(0)}` : "—", accent: false },
        ].map((s) => (
          <div key={s.label} className="bg-black px-6 py-4">
            <p className="text-xs font-mono uppercase tracking-widest text-slate-600">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.accent ? "text-amber-400" : "text-white"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-white/5">
        {filters.map((f) => (
          <button
            key={f || "ALL"}
            onClick={() => setFilter(f)}
            className={`px-5 py-3 text-xs font-mono tracking-widest transition-colors ${
              filter === f
                ? "text-amber-400 border-b-2 border-amber-500"
                : "text-slate-600 hover:text-slate-400"
            }`}
          >
            {f || "ALL"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="text-center py-20 text-slate-600 font-mono text-xs">LOADING...</div>
        ) : (
          <Table
            headers={["INVOICE", "VEHICLE", "DISTANCE", "RATE", "AMOUNT", "STATUS", "DATE", "ACTIONS"]}
            rows={invoices.map((inv) => [
              <span className="font-mono text-xs text-slate-400">
                #{inv.id.slice(-8).toUpperCase()}
              </span>,
              <span className="font-mono">{inv.vehicle?.licensePlate}</span>,
              <span className="font-mono">{Number(inv.distanceKm).toFixed(2)} km</span>,
              <span className="font-mono">${Number(inv.costPerKm).toFixed(2)}/km</span>,
              <span className="font-black text-white">${Number(inv.totalAmount).toFixed(2)}</span>,
              <Badge color={statusColor(inv.status)}>{inv.status}</Badge>,
              <span className="font-mono text-xs text-slate-500">
                {new Date(inv.generatedAt).toLocaleDateString()}
              </span>,
              <div className="flex gap-2 items-center">
                {inv.status === InvoiceStatus.PENDING && (
                  <button
                    onClick={() => statusMut.mutate({ id: inv.id, status: InvoiceStatus.PAID })}
                    className="text-xs font-mono text-emerald-500 hover:text-emerald-400"
                  >
                    MARK PAID
                  </button>
                )}
                {inv.status === InvoiceStatus.PENDING && (
                  <button
                    onClick={() => statusMut.mutate({ id: inv.id, status: InvoiceStatus.VOID })}
                    className="text-xs font-mono text-slate-600 hover:text-red-400"
                  >
                    VOID
                  </button>
                )}
                <a
                  href={`${invoicesApi.pdfUrl(inv.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    const url = invoicesApi.pdfUrl(inv.id);
                    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                      .then((r) => r.text())
                      .then((html) => {
                        const w = window.open("", "_blank");
                        w?.document.write(html);
                        w?.document.close();
                      });
                  }}
                  className="text-xs font-mono text-slate-500 hover:text-amber-400"
                >
                  PDF
                </a>
              </div>,
            ])}
          />
        )}
      </div>
    </div>
  );
}
