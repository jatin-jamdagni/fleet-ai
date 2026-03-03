import { t } from "elysia";

export const RegisterBody = t.Object({
  tenantName: t.String({ minLength: 2, maxLength: 100 }),
  tenantSlug: t.String({
    minLength: 2,
    maxLength: 50,
    pattern: "^[a-z0-9-]+$",
    error: "Slug must be lowercase letters, numbers and hyphens only",
  }),
  name: t.String({ minLength: 2, maxLength: 100 }),
  email: t.String({ format: "email" }),
  password: t.String({
    minLength: 8,
    error: "Password must be at least 8 characters",
  }),
});

export const LoginBody = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 1 }),
});

export const RefreshBody = t.Object({
  refreshToken: t.String(),
});