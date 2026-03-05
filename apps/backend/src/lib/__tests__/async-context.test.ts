import { describe, it, expect } from "bun:test";
import {
  runWithTenant,
  getTenantId,
  getUserId,
  getCurrentTenant,
  requireTenantContext,
} from "../../lib/async-context";

describe("AsyncLocalStorage — Tenant Context", () => {

  it("provides tenantId within runWithTenant", async () => {
    let captured = "";

    await runWithTenant(
      { tenantId: "tenant-abc", userId: "user-1", role: "FLEET_MANAGER" },
      async () => { captured = getTenantId(); }
    );

    expect(captured).toBe("tenant-abc");
  });

  it("provides userId within context", async () => {
    let captured = "";

    await runWithTenant(
      { tenantId: "t-1", userId: "user-xyz", role: "DRIVER" },
      async () => { captured = getUserId(); }
    );

    expect(captured).toBe("user-xyz");
  });

  it("getCurrentTenant returns null outside context", () => {
    // Called outside any runWithTenant
    const ctx = getCurrentTenant();
    expect(ctx).toBeNull();
  });

  it("requireTenantContext throws outside context", () => {
    expect(() => requireTenantContext()).toThrow();
  });

  it("isolates concurrent contexts from each other", async () => {
    const results: string[] = [];

    await Promise.all([
      runWithTenant(
        { tenantId: "tenant-A", userId: "u1", role: "FLEET_MANAGER" },
        async () => {
          await new Promise((r) => setTimeout(r, 20));
          results.push(getTenantId());
        }
      ),
      runWithTenant(
        { tenantId: "tenant-B", userId: "u2", role: "FLEET_MANAGER" },
        async () => {
          await new Promise((r) => setTimeout(r, 5));
          results.push(getTenantId());
        }
      ),
      runWithTenant(
        { tenantId: "tenant-C", userId: "u3", role: "DRIVER" },
        async () => {
          results.push(getTenantId());
        }
      ),
    ]);

    // All three must be present — no leakage between concurrent runs
    expect(results).toContain("tenant-A");
    expect(results).toContain("tenant-B");
    expect(results).toContain("tenant-C");
    expect(results).toHaveLength(3);

    // No duplicates
    expect(new Set(results).size).toBe(3);
  });

  it("nested contexts use the innermost value", async () => {
    let outer = "";
    let inner = "";

    await runWithTenant(
      { tenantId: "outer-tenant", userId: "u1", role: "FLEET_MANAGER" },
      async () => {
        outer = getTenantId();
        await runWithTenant(
          { tenantId: "inner-tenant", userId: "u2", role: "DRIVER" },
          async () => { inner = getTenantId(); }
        );
      }
    );

    expect(outer).toBe("outer-tenant");
    expect(inner).toBe("inner-tenant");
  });
});