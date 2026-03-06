import type { ReactNode } from "react";
import type { LogisticsFlagKey, FormState, Step } from "./types";

interface StepConfig {
  id: Step;
  label: string;
  hint: string;
}

export function StepProgress({
  current,
  steps,
}: {
  current: Step;
  steps: StepConfig[];
}) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const active = step.id === current;
        const done = step.id < current;
        const dotClass = done
          ? "bg-emerald-500 text-black border-emerald-400"
          : active
            ? "bg-amber-500 text-black border-amber-400"
            : "bg-white/5 text-slate-500 border-white/10";

        return (
          <div key={step.id} className="relative flex items-center gap-3">
            <div
              className={`h-9 w-9 shrink-0 rounded-full border text-sm font-black
                font-mono flex items-center justify-center ${dotClass}`}
            >
              {done ? "OK" : step.id}
            </div>
            <div className="min-w-0">
              <p className={`font-mono text-xs uppercase tracking-[0.16em] ${
                active || done ? "text-amber-300" : "text-slate-600"
              }`}>
                {step.hint}
              </p>
              <p className={`text-sm font-black leading-tight ${
                active ? "text-white" : "text-slate-400"
              }`}>
                {step.label}
              </p>
            </div>

            {index < steps.length - 1 && (
              <span className={`absolute left-[17px] top-10 h-6 w-px ${
                done ? "bg-emerald-500/40" : "bg-white/10"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-mono uppercase tracking-[0.16em] text-slate-500">
        {label}
        {required && <span className="ml-1 text-amber-400">*</span>}
      </span>
      {children}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="w-full rounded-md border border-white/10 bg-slate-950/90 px-3 py-2.5
        text-sm font-mono text-white placeholder:text-slate-600 transition-colors
        focus:border-amber-500/60 focus:outline-none"
    />
  );
}

export function SelectInput({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (next: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-md border border-white/10 bg-slate-950/90 px-3 py-2.5
        text-sm font-mono text-white transition-colors focus:border-amber-500/60
        focus:outline-none"
    >
      {children}
    </select>
  );
}

export function ChoiceChip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-left text-xs font-mono
        transition-colors ${
          active
            ? "border-amber-500/60 bg-amber-500/12 text-amber-300"
            : "border-white/10 text-slate-400 hover:border-white/30 hover:text-white"
        } ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function ToggleCard({
  flag,
  form,
  label,
  description,
  onToggle,
}: {
  flag: LogisticsFlagKey;
  form: FormState;
  label: string;
  description: string;
  onToggle: (key: LogisticsFlagKey, value: boolean) => void;
}) {
  const active = form[flag];

  return (
    <button
      type="button"
      onClick={() => onToggle(flag, !active)}
      className={`w-full rounded-md border px-4 py-3 text-left transition-colors
        ${active
          ? "border-amber-500/35 bg-amber-500/8"
          : "border-white/10 hover:border-white/30"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-black ${active ? "text-amber-300" : "text-slate-200"}`}>
            {label}
          </p>
          <p className="mt-1 text-xs font-mono text-slate-500">{description}</p>
        </div>

        <span className={`relative mt-0.5 h-5 w-10 rounded-full ${
          active ? "bg-amber-500" : "bg-white/10"
        }`}>
          <span className={`absolute top-0 h-5 w-5 rounded-full bg-white transition-transform ${
            active ? "translate-x-5" : "translate-x-0"
          }`} />
        </span>
      </div>
    </button>
  );
}
