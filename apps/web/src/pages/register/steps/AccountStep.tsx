import { Field, TextInput } from "../ui";
import type { FormState, SetFormField } from "../types";

export function AccountStep({
  form,
  setField,
}: {
  form: FormState;
  setField: SetFormField;
}) {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-xl font-black text-white">Create your account</h2>
        <p className="text-xs font-mono text-slate-500">
          Start with manager credentials for your fleet workspace.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" required>
          <TextInput
            value={form.name}
            onChange={(value) => setField("name", value)}
            placeholder="Jane Doe"
            autoComplete="name"
          />
        </Field>

        <Field label="Organization" required>
          <TextInput
            value={form.orgName}
            onChange={(value) => setField("orgName", value)}
            placeholder="Acme Logistics"
            autoComplete="organization"
          />
        </Field>
      </div>

      <Field label="Work email" required>
        <TextInput
          type="email"
          value={form.email}
          onChange={(value) => setField("email", value)}
          placeholder="ops@company.com"
          autoComplete="email"
        />
      </Field>

      <Field label="Password" required>
        <TextInput
          type="password"
          value={form.password}
          onChange={(value) => setField("password", value)}
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
        />
      </Field>
    </div>
  );
}
