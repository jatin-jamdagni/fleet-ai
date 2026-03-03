import { describe, it, expect } from "bun:test";
import { checkRateLimit } from "../../lib/rate-limit";

describe("Rate Limiter", () => {

  it("allows requests under the limit", () => {
    const result = checkRateLimit("ip-under", {
      windowMs:  60_000,
      max:       5,
      keyPrefix: "rl-test-1",
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests at the limit", () => {
    const opts = { windowMs: 60_000, max: 3, keyPrefix: "rl-test-2" };
    const id   = "ip-block";

    checkRateLimit(id, opts); // 1
    checkRateLimit(id, opts); // 2
    checkRateLimit(id, opts); // 3 — hits limit

    const result = checkRateLimit(id, opts); // 4 — blocked
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("remaining decrements correctly", () => {
    const opts = { windowMs: 60_000, max: 5, keyPrefix: "rl-test-3" };
    const id   = "ip-decrement";

    const r1 = checkRateLimit(id, opts);
    const r2 = checkRateLimit(id, opts);
    const r3 = checkRateLimit(id, opts);

    expect(r1.remaining).toBe(4);
    expect(r2.remaining).toBe(3);
    expect(r3.remaining).toBe(2);
  });

  it("uses separate buckets per keyPrefix", () => {
    const id  = "shared-ip";
    checkRateLimit(id, { windowMs: 60_000, max: 1, keyPrefix: "ns-alpha" });
    checkRateLimit(id, { windowMs: 60_000, max: 1, keyPrefix: "ns-alpha" });

    // ns-beta should still have quota
    const result = checkRateLimit(id, { windowMs: 60_000, max: 5, keyPrefix: "ns-beta" });
    expect(result.allowed).toBe(true);
  });

  it("uses separate buckets per identifier", () => {
    const opts = { windowMs: 60_000, max: 1, keyPrefix: "rl-test-5" };

    checkRateLimit("ip-one", opts);
    const blocked = checkRateLimit("ip-one", opts);  // blocked
    const ok      = checkRateLimit("ip-two", opts);  // different IP — allowed

    expect(blocked.allowed).toBe(false);
    expect(ok.allowed).toBe(true);
  });
});