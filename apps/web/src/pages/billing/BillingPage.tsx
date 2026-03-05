import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { Badge, Button, Card, Spinner } from "../../components/ui";

const saasApi = {
  subscription: () => api.get("/saas/subscription").then((r) => r.data.data),
  checkout: (plan: string) =>
    api.post("/saas/checkout", { plan }).then((r) => r.data.data),
  portal: () =>
    api.post("/saas/portal").then((r) => r.data.data),
  invoices: () => api.get("/saas/invoices").then((r) => r.data.data),
};

function UsageBar({
  label,
  used,
  limit,
  pct,
}: {
  label: string;
  used: number;
  limit: number;
  pct: number;
}) {
  const color = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#10b981";

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
          {label}
        </span>
        <span className="text-xs font-mono text-slate-400">
          {used} / {limit === 9999 ? "∞" : limit}
        </span>
      </div>
      <div className="h-1.5 bg-white/5 w-full">
        <div
          className="h-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function PlanCard({
  name,
  price,
  features,
  isCurrent,
  onUpgrade,
  loading,
}: {
  name: string;
  price: string;
  features: string[];
  isCurrent: boolean;
  onUpgrade: () => void;
  loading: boolean;
}) {
  return (
    <div
      className={`border p-6 transition-colors ${
        isCurrent
          ? "border-amber-500/50 bg-amber-500/5"
          : "border-white/8 bg-slate-900 hover:border-white/20"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-black text-white text-lg tracking-tight">{name}</h3>
            {isCurrent && <Badge color="amber">CURRENT</Badge>}
          </div>
          <p className="text-2xl font-black text-amber-400">{price}</p>
          <p className="text-xs font-mono text-slate-600 mt-0.5">per month</p>
        </div>
      </div>

      <ul className="space-y-2 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-slate-400">
            <span className="text-emerald-400 text-xs">✓</span>
            {feature}
          </li>
        ))}
      </ul>

      <Button
        variant={isCurrent ? "ghost" : "primary"}
        disabled={isCurrent}
        loading={loading}
        onClick={onUpgrade}
        className="w-full justify-center"
      >
        {isCurrent ? "CURRENT PLAN" : `UPGRADE TO ${name}`}
      </Button>
    </div>
  );
}

export default function BillingPage() {
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const { data: sub, isLoading: subLoading, refetch } = useQuery({
    queryKey: ["subscription"],
    queryFn: saasApi.subscription,
    refetchInterval: 60_000,
  });

  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ["stripe-invoices"],
    queryFn: saasApi.invoices,
  });

  const checkoutMut = useMutation({
    mutationFn: (plan: string) => saasApi.checkout(plan),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message ?? "Checkout failed");
    },
  });

  const portalMut = useMutation({
    mutationFn: saasApi.portal,
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message ?? "Could not open portal");
    },
  });

  const handleUpgrade = (plan: string) => {
    setCheckingOut(plan);
    checkoutMut.mutate(plan, {
      onSettled: () => setCheckingOut(null),
    });
  };

  const plans = [
    {
      name: "STARTER",
      price: "$49",
      features: [
        "Up to 5 vehicles",
        "Up to 10 drivers",
        "50 AI queries / day",
        "30-day analytics retention",
        "Email support",
      ],
    },
    {
      name: "PRO",
      price: "$149",
      features: [
        "Up to 25 vehicles",
        "Up to 50 drivers",
        "500 AI queries / day",
        "90-day analytics retention",
        "Custom branding",
        "API access",
        "Priority support",
      ],
    },
    {
      name: "ENTERPRISE",
      price: "$499",
      features: [
        "Unlimited vehicles",
        "Unlimited drivers",
        "Unlimited AI queries",
        "365-day analytics retention",
        "Custom branding",
        "Full API access",
        "Dedicated support",
        "SLA guarantee",
      ],
    },
  ];

  if (subLoading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <Spinner size={32} />
      </div>
    );
  }

  const trialBannerVisible = sub?.plan === "TRIAL" && (sub?.trialDaysLeft ?? 0) <= 7;

  return (
    <div className="flex flex-col">
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">BILLING</h1>
          <p className="text-xs font-mono text-slate-500 mt-0.5">
            Subscription and usage management
          </p>
        </div>
        {sub?.hasStripe && (
          <Button
            variant="outline"
            loading={portalMut.isPending}
            onClick={() => portalMut.mutate()}
          >
            MANAGE BILLING →
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {trialBannerVisible && (
          <div className="border border-amber-500/30 bg-amber-500/5 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-amber-400 font-black text-sm">
                TRIAL ENDING IN {sub.trialDaysLeft} DAYS
              </p>
              <p className="text-slate-400 text-xs font-mono mt-0.5">
                Upgrade now to keep your fleet data and avoid service interruption.
              </p>
            </div>
            <Button onClick={() => handleUpgrade("PRO")} loading={checkingOut === "PRO"}>
              UPGRADE NOW
            </Button>
          </div>
        )}

        {sub?.planStatus === "PAST_DUE" && (
          <div className="border border-red-500/30 bg-red-500/5 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-red-400 font-black text-sm">PAYMENT FAILED</p>
              <p className="text-slate-400 text-xs font-mono mt-0.5">
                Update your payment method to restore full access.
              </p>
            </div>
            <Button
              variant="danger"
              loading={portalMut.isPending}
              onClick={() => portalMut.mutate()}
            >
              FIX PAYMENT →
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-4">
              Current Plan
            </h2>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-black text-white">{sub?.plan}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      color={
                        sub?.planStatus === "ACTIVE"
                          ? "green"
                          : sub?.planStatus === "TRIALING"
                            ? "amber"
                            : sub?.planStatus === "PAST_DUE"
                              ? "red"
                              : "slate"
                      }
                    >
                      {sub?.planStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {sub?.trialDaysLeft != null && sub?.plan === "TRIAL" && (
                <div className="text-xs font-mono text-slate-500 mb-4">
                  Trial ends:{" "}
                  <span className={sub.trialDaysLeft <= 3 ? "text-red-400" : "text-amber-400"}>
                    {sub.trialDaysLeft} days remaining
                  </span>
                </div>
              )}

              {sub?.currentPeriodEnd && (
                <p className="text-xs font-mono text-slate-600 mb-4">
                  {sub.cancelAtPeriodEnd
                    ? `Cancels: ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews: ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`}
                </p>
              )}

              <div className="border-t border-white/5 pt-4">
                <p className="text-xs font-mono uppercase tracking-widest text-slate-600 mb-3">
                  Usage This Period
                </p>
                {sub?.usage && (
                  <>
                    <UsageBar
                      label="Vehicles"
                      used={sub.usage.vehicles.used}
                      limit={sub.usage.vehicles.limit}
                      pct={sub.usage.vehicles.pct}
                    />
                    <UsageBar
                      label="Drivers"
                      used={sub.usage.drivers.used}
                      limit={sub.usage.drivers.limit}
                      pct={sub.usage.drivers.pct}
                    />
                    <UsageBar
                      label="AI Queries Today"
                      used={sub.usage.aiQueriesDaily.used}
                      limit={sub.usage.aiQueriesDaily.limit}
                      pct={sub.usage.aiQueriesDaily.pct}
                    />
                  </>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-4">
              Plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.name}
                  name={plan.name}
                  price={plan.price}
                  features={plan.features}
                  isCurrent={sub?.plan === plan.name}
                  onUpgrade={() => handleUpgrade(plan.name)}
                  loading={checkingOut === plan.name}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-4">
            Billing History
          </h2>
          <Card noPad>
            {invLoading ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-10 text-slate-700 font-mono text-xs">
                NO BILLING HISTORY — SUBSCRIBE TO SEE INVOICES
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {["PERIOD", "INVOICE #", "AMOUNT", "STATUS", ""].map((header) => (
                      <th
                        key={header}
                        className="text-left px-4 py-3 text-xs font-mono tracking-widest text-slate-600"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b border-white/5 hover:bg-white/3">
                      <td className="px-4 py-3 font-mono text-slate-300">{inv.period}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{inv.number}</td>
                      <td className="px-4 py-3 font-black text-white">
                        ${inv.amount} {inv.currency}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={inv.status === "paid" ? "green" : "red"}>
                          {inv.status?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {inv.pdfUrl && (
                          <a
                            href={inv.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-mono text-slate-500 hover:text-amber-400 transition-colors"
                          >
                            PDF ↗
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {sub?.hasStripe && !sub?.cancelAtPeriodEnd && (
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-red-800 mb-4">
              Danger Zone
            </h2>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">Cancel Subscription</p>
                  <p className="text-slate-500 text-xs font-mono mt-0.5">
                    Access continues until end of the current billing period.
                  </p>
                </div>
                <Button
                  variant="danger"
                  onClick={async () => {
                    if (confirm("Cancel your subscription? Access remains until period end.")) {
                      try {
                        await api.delete("/saas/subscription");
                        toast.success("Subscription will be canceled at period end");
                        refetch();
                      } catch (err: any) {
                        toast.error(err.response?.data?.error?.message ?? "Failed");
                      }
                    }
                  }}
                >
                  CANCEL PLAN
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
