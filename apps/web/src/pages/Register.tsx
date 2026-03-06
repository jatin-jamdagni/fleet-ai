import { type FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";

import { FALLBACK_COUNTRIES, INIT_FORM, LOGISTICS_OPTIONS, STEPS } from "./register/constants";
import { countryApi, registerApi } from "./register/api";
import { AccountStep, FleetStep, LogisticsStep, RegionStep } from "./register/steps";
import type {
  CountryConfig,
  CountryListItem,
  FormState,
  RegisterApiError,
  RegisterPayload,
  Step,
} from "./register/types";
import { StepProgress } from "./register/ui";
import { toTenantSlug, validateStep } from "./register/validation";
import { Button } from "../components/ui";

function RegisterPreview({
  form,
  step,
  countryConfig,
}: {
  form: FormState;
  step: Step;
  countryConfig?: CountryConfig;
}) {
  const enabledLogistics = LOGISTICS_OPTIONS.filter((option) => form[option.key]).length;

  return (
    <aside className="rounded-xl border border-white/10 bg-slate-950/70 p-5 backdrop-blur-sm">
      <p className="text-xs font-mono uppercase tracking-[0.16em] text-slate-500">Setup progress</p>
      <div className="mt-4">
        <StepProgress current={step} steps={STEPS} />
      </div>

      <div className="mt-6 space-y-3">
        <div className="rounded-md border border-white/10 bg-black/60 p-3.5">
          <p className="text-xs font-mono text-slate-500">Workspace</p>
          <p className="mt-1 text-sm font-black text-white">{form.orgName || "Your organization"}</p>
          <p className="mt-1 text-xs font-mono text-slate-600">Manager: {form.name || "Not set"}</p>
        </div>

        <div className="rounded-md border border-white/10 bg-black/60 p-3.5">
          <p className="text-xs font-mono text-slate-500">Region</p>
          <p className="mt-1 text-sm font-black text-white">{countryConfig?.name ?? form.countryCode}</p>
          <p className="mt-1 text-xs font-mono text-slate-600">
            {countryConfig
              ? `${countryConfig.currencySymbol} ${countryConfig.currency}`
              : "Currency details load automatically"}
          </p>
        </div>

        <div className="rounded-md border border-white/10 bg-black/60 p-3.5">
          <p className="text-xs font-mono text-slate-500">Operation profile</p>
          <p className="mt-1 text-sm font-black text-white">{form.fleetType || "mixed"}</p>
          <p className="mt-1 text-xs font-mono text-slate-600">
            {enabledLogistics} logistics rules enabled
          </p>
        </div>
      </div>
    </aside>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(INIT_FORM);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const countriesQuery = useQuery<CountryListItem[]>({
    queryKey: ["countries"],
    queryFn: countryApi.list,
  });

  const countries = countriesQuery.data?.length
    ? countriesQuery.data
    : FALLBACK_COUNTRIES;
  const usingCountryFallback = countriesQuery.isError;

  const countryCode = form.countryCode || countries[0]?.code || "US";

  const { data: countryConfig } = useQuery<CountryConfig>({
    queryKey: ["country", countryCode],
    queryFn: () => countryApi.get(countryCode),
    enabled: !!countryCode,
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => registerApi.register(payload),
    onSuccess: () => {
      toast.success("Account created. You can sign in now.");
      navigate("/login");
    },
    onError: (error: AxiosError<RegisterApiError>) => {
      toast.error(error.response?.data?.error?.message ?? "Registration failed");
    },
  });

  const progress = useMemo(() => Math.round((step / STEPS.length) * 100), [step]);

  const isLastStep = step === 4;

  const handleSubmit = () => {
    registerMutation.mutate({
      tenantName: form.orgName.trim(),
      tenantSlug: toTenantSlug(form.orgName),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });
  };

  const handleNext = (event: FormEvent) => {
    event.preventDefault();

    const validationError = validateStep(step, form);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!isLastStep) {
      setStep((current) => (current + 1) as Step);
      return;
    }

    handleSubmit();
  };

  const renderStep = () => {
    if (step === 1) {
      return <AccountStep form={form} setField={setField} />;
    }

    if (step === 2) {
      return (
        <RegionStep
          form={form}
          setField={setField}
          countries={countries}
          countryConfig={countryConfig}
        />
      );
    }

    if (step === 3) {
      return <FleetStep form={form} setField={setField} />;
    }

    return <LogisticsStep form={form} setField={setField} countryConfig={countryConfig} />;
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 15% 15%, rgba(245, 158, 11, 0.2), transparent 42%), radial-gradient(circle at 85% 90%, rgba(30, 41, 59, 0.45), transparent 38%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-amber-500 text-xl font-black text-black">
              F
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Fleet AI</h1>
              <p className="text-xs font-mono text-slate-500">Start your 14-day free trial</p>
            </div>
          </div>

          <p className="text-xs font-mono text-slate-500">
            Already registered?{" "}
            <Link to="/login" className="text-amber-300 hover:text-amber-200">
              Sign in
            </Link>
          </p>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <RegisterPreview form={form} step={step} countryConfig={countryConfig} />

          <section className="rounded-xl border border-white/10 bg-black/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] sm:p-7">
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-xs font-mono text-slate-500">
                <span>
                  Step {step} of {STEPS.length}
                </span>
                <span>{progress}% complete</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <form onSubmit={handleNext} className="space-y-6">
              {usingCountryFallback && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                  <p className="text-xs font-mono text-amber-200">
                    Live country metadata is unavailable. Using fallback country options.
                  </p>
                </div>
              )}

              {renderStep()}

              <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setStep((current) => (current - 1) as Step)}
                  disabled={step === 1}
                  className="inline-flex items-center justify-center rounded-md border border-white/12 px-4 py-2.5
                    text-xs font-mono font-semibold tracking-[0.12em] text-slate-300 transition-colors
                    hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Back
                </button>

                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="inline-flex flex-1 items-center justify-center rounded-md bg-amber-500 px-4 py-2.5
                    text-xs font-mono font-black tracking-[0.12em] text-black transition-colors
                    hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {registerMutation.isPending
                    ? "Creating account..."
                    : isLastStep
                      ? "Create account"
                      : "Continue"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
