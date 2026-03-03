import { describe, it, expect } from "bun:test";
import { checkRateLimit } from "../../../lib/rate-limit";

describe("Rate Limiter", () => {
    it("should allow requests under the limit", () => {
        const result = checkRateLimit("test-ip-1", {
            windowMs: 60000,
            max: 5,
            keyPrefix: "test",
        });
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
    });

    it("should block requests over the limit", () => {
        const opts = { windowMs: 60000, max: 3, keyPrefix: "block-test" };
        const id = "test-ip-block";

        checkRateLimit(id, opts);
        checkRateLimit(id, opts);
        checkRateLimit(id, opts);
        const result = checkRateLimit(id, opts); // 4th — over limit

        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
    });

    it("should use separate buckets per prefix", () => {
        checkRateLimit("shared-ip", { windowMs: 60000, max: 1, keyPrefix: "ns1" });
        checkRateLimit("shared-ip", { windowMs: 60000, max: 1, keyPrefix: "ns1" });

        // ns2 should still have quota
        const result = checkRateLimit("shared-ip", {
            windowMs: 60000,
            max: 5,
            keyPrefix: "ns2",
        });
        expect(result.allowed).toBe(true);
    });
});

describe("Async Context", () => {
    it("should run code within tenant context", async () => {
        const { runWithTenant, getTenantId } = await import(
            '../../../lib/async-context.js'
        );

        let capturedTenantId = "";

        await runWithTenant(
            { tenantId: "tenant-abc", userId: "user-123", role: "FLEET_MANAGER" },
            async () => {
                capturedTenantId = getTenantId();
            }
        );

        expect(capturedTenantId).toBe("tenant-abc");
    });

    it("should isolate context between concurrent runs", async () => {
        const { runWithTenant, getTenantId } = await import(
            '../../../lib/async-context.js'
        );

        const results: string[] = [];

        await Promise.all([
            runWithTenant(
                { tenantId: "tenant-A", userId: "u1", role: "FLEET_MANAGER" },
                async () => {
                    await new Promise((r) => setTimeout(r, 10));
                    results.push(getTenantId());
                }
            ),
            runWithTenant(
                { tenantId: "tenant-B", userId: "u2", role: "FLEET_MANAGER" },
                async () => {
                    results.push(getTenantId());
                }
            ),
        ]);

        // Both should have captured their OWN tenantId despite being concurrent
        expect(results).toContain("tenant-A");
        expect(results).toContain("tenant-B");
        expect(results).toHaveLength(2);
    });
});