import { Field, SelectInput, TextInput } from "../ui";
import type {
  CountryConfig,
  CountryListItem,
  FormState,
  SetFormField,
} from "../types";

export function RegionStep({
  form,
  setField,
  countries,
  countryConfig,
}: {
  form: FormState;
  setField: SetFormField;
  countries: CountryListItem[];
  countryConfig?: CountryConfig;
}) {
  const docs = countryConfig?.complianceDocs ?? [];

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-xl font-black text-white">Region and compliance</h2>
        <p className="text-xs font-mono text-slate-500">
          Configure taxation and legal fields based on your operating country.
        </p>
      </header>

      <Field label="Country" required>
        <SelectInput
          value={form.countryCode}
          onChange={(value) => setField("countryCode", value)}
        >
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.name} ({country.currency})
            </option>
          ))}
        </SelectInput>
      </Field>

      {countryConfig && (
        <div className="grid gap-3 rounded-md border border-amber-500/25 bg-amber-500/6 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-mono text-slate-500">Currency</p>
            <p className="mt-0.5 text-sm font-black text-amber-300">
              {countryConfig.currencySymbol} {countryConfig.currency}
            </p>
          </div>
          <div>
            <p className="text-xs font-mono text-slate-500">{countryConfig.tax.label}</p>
            <p className="mt-0.5 text-sm font-black text-white">
              {countryConfig.tax.defaultRate > 0
                ? `${(countryConfig.tax.defaultRate * 100).toFixed(0)}%`
                : "Varies"}
            </p>
          </div>
          <div>
            <p className="text-xs font-mono text-slate-500">Distance unit</p>
            <p className="mt-0.5 text-sm font-black text-white">{countryConfig.distanceUnit}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone">
          <div className="flex overflow-hidden rounded-md border border-white/10 focus-within:border-amber-500/60">
            <span className="flex items-center bg-slate-900 px-3 text-sm font-mono text-slate-500">
              {countryConfig?.phonePrefix ?? "+1"}
            </span>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => setField("phone", event.target.value)}
              placeholder="5551234567"
              className="min-w-0 flex-1 bg-slate-950/90 px-3 py-2.5 text-sm font-mono text-white
                placeholder:text-slate-600 focus:outline-none"
            />
          </div>
        </Field>

        <Field label="Website">
          <TextInput
            value={form.website}
            onChange={(value) => setField("website", value)}
            placeholder="https://yourcompany.com"
          />
        </Field>
      </div>

      {countryConfig && (
        <>
          <Field label={countryConfig.tax.idLabel}>
            <TextInput
              value={form.taxId}
              onChange={(value) => setField("taxId", value)}
              placeholder={countryConfig.tax.idPlaceholder}
            />
          </Field>

          <Field label={countryConfig.businessIdLabel}>
            <TextInput
              value={form.businessRegNo}
              onChange={(value) => setField("businessRegNo", value)}
              placeholder={`Your ${countryConfig.businessIdLabel}`}
            />
          </Field>
        </>
      )}

      <Field label="Business address">
        <TextInput
          value={form.address}
          onChange={(value) => setField("address", value)}
          placeholder="123 Main Street, City, Country"
        />
      </Field>

      {countryConfig && docs.length > 0 && (
        <div className="rounded-md border border-white/10 bg-slate-950/80 p-4">
          <p className="text-xs font-mono uppercase tracking-[0.16em] text-slate-500">
            Typical compliance documents
          </p>
          <ul className="mt-3 grid gap-1.5">
            {docs.map((doc) => (
              <li key={doc} className="text-xs font-mono text-slate-400">
                - {doc}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
