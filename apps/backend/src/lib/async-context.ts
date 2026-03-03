import { AsyncLocalStorage } from "async_hooks";

// ─── Tenant Context ───────────────────────────────────────────────────────────

interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function runWithTenant<T>(
  context: TenantContext,
  fn: () => Promise<T>
): Promise<T> {
  return tenantStorage.run(context, fn);
}

export function getCurrentTenant(): TenantContext | null {
  return tenantStorage.getStore() ?? null;
}

export function requireTenantContext(): TenantContext {
  const ctx = tenantStorage.getStore();
  if (!ctx) {
    throw new Error(
      "[TenantContext] No tenant context found. " +
        "Ensure authMiddleware is applied to this route."
    );
  }
  return ctx;
}

// Shorthand helpers
export const getTenantId = (): string => requireTenantContext().tenantId;
export const getUserId = (): string => requireTenantContext().userId;