import type { FormState, Step } from "./types";

export function validateStep(step: Step, form: FormState): string | null {
  if (step === 1) {
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.orgName.trim()) {
      return "Please fill in all required account fields.";
    }
    if (form.password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    return null;
  }

  if (step === 2 && !form.countryCode) {
    return "Please choose a country.";
  }

  return null;
}

export function toTenantSlug(orgName: string): string {
  const base = orgName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const normalized = base.length >= 2 ? base : "fleet-team";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${normalized.slice(0, 45)}-${suffix}`.slice(0, 50);
}
