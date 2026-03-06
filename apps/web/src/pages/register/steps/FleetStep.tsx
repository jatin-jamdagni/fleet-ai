import { CARGO_TYPES, FLEET_TYPES, OPERATING_REGIONS } from "../constants";
import { ChoiceChip, Field, TextInput } from "../ui";
import type { FormState, SetFormField } from "../types";

export function FleetStep({
  form,
  setField,
}: {
  form: FormState;
  setField: SetFormField;
}) {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-xl font-black text-white">Fleet profile</h2>
        <p className="text-xs font-mono text-slate-500">
          Tell us how your operation runs so dashboards and defaults fit better.
        </p>
      </header>

      <Field label="Fleet type" required>
        <div className="grid gap-2 sm:grid-cols-2">
          {FLEET_TYPES.map((fleetType) => (
            <ChoiceChip
              key={fleetType.value}
              active={form.fleetType === fleetType.value}
              onClick={() => setField("fleetType", fleetType.value)}
            >
              {fleetType.label}
            </ChoiceChip>
          ))}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Target fleet size">
          <TextInput
            type="number"
            value={form.fleetSizeTarget}
            onChange={(value) => setField("fleetSizeTarget", value)}
            placeholder="e.g. 25"
          />
        </Field>

        <Field label="Average km per vehicle / year">
          <TextInput
            type="number"
            value={form.annualKmTarget}
            onChange={(value) => setField("annualKmTarget", value)}
            placeholder="e.g. 80000"
          />
        </Field>
      </div>

      <Field label="Operating regions">
        <div className="flex flex-wrap gap-2">
          {OPERATING_REGIONS.map((region) => {
            const active = form.operatingRegions.includes(region.value);
            return (
              <ChoiceChip
                key={region.value}
                active={active}
                onClick={() => {
                  const next = active
                    ? form.operatingRegions.filter((value) => value !== region.value)
                    : [...form.operatingRegions, region.value];
                  setField("operatingRegions", next);
                }}
              >
                {region.label}
              </ChoiceChip>
            );
          })}
        </div>
      </Field>

      <Field label="Cargo types">
        <div className="flex flex-wrap gap-2">
          {CARGO_TYPES.map((cargoType) => {
            const active = form.cargoTypes.includes(cargoType);
            return (
              <ChoiceChip
                key={cargoType}
                active={active}
                onClick={() => {
                  const next = active
                    ? form.cargoTypes.filter((value) => value !== cargoType)
                    : [...form.cargoTypes, cargoType];
                  setField("cargoTypes", next);
                }}
                className="py-1.5"
              >
                {cargoType}
              </ChoiceChip>
            );
          })}
        </div>
      </Field>
    </div>
  );
}
