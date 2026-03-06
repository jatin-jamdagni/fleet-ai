import { LOGISTICS_OPTIONS } from "../constants";
import { ToggleCard } from "../ui";
import type {
  CountryConfig,
  FormState,
  LogisticsFlagKey,
  SetFormField,
} from "../types";

export function LogisticsStep({
  form,
  setField,
  countryConfig,
}: {
  form: FormState;
  setField: SetFormField;
  countryConfig?: CountryConfig;
}) {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-xl font-black text-white">Logistics requirements</h2>
        <p className="text-xs font-mono text-slate-500">
          Enable workflows your operation needs from day one.
        </p>
      </header>

      <div className="grid gap-3">
        {LOGISTICS_OPTIONS.map((item) => (
          <ToggleCard
            key={item.key}
            flag={item.key}
            form={form}
            label={item.label}
            description={item.description}
            onToggle={(key: LogisticsFlagKey, value: boolean) => setField(key, value)}
          />
        ))}
      </div>

      {countryConfig && (
        <div className="rounded-md border border-white/10 bg-slate-950/80 p-4">
          <p className="text-xs font-mono uppercase tracking-[0.16em] text-slate-500">
            Monthly pricing in {countryConfig.currency}
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {[
              { name: "Starter", price: countryConfig.plans.starter },
              { name: "Pro", price: countryConfig.plans.pro },
              { name: "Enterprise", price: countryConfig.plans.enterprise },
            ].map((plan) => (
              <div key={plan.name} className="rounded-md border border-white/10 px-3 py-3 text-center">
                <p className="text-xs font-mono text-slate-500">{plan.name}</p>
                <p className="mt-1 text-lg font-black text-amber-300">
                  {countryConfig.currencySymbol}
                  {plan.price.toLocaleString()}
                </p>
                <p className="text-xs font-mono text-slate-600">/month</p>
              </div>
            ))}
          </div>

          <p className="mt-3 text-center text-xs font-mono text-slate-500">
            {countryConfig.tax.defaultRate > 0
              ? `${(countryConfig.tax.defaultRate * 100).toFixed(0)}% ${countryConfig.tax.label} is applied at checkout`
              : "Prices exclude applicable taxes"}
          </p>
        </div>
      )}
    </div>
  );
}
