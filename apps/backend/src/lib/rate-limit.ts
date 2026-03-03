// Simple in-memory rate limiter
// In production, we will swap this Map for Redis

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  windowMs: number;   // Time window in milliseconds
  max: number;        // Max requests per window
  keyPrefix?: string; // Namespace
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${options.keyPrefix ?? "rl"}:${identifier}`;
  const now = Date.now();

  const entry = store.get(key);

  // New window or expired
  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    store.set(key, newEntry);
    return {
      allowed: true,
      remaining: options.max - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Within window
  if (entry.count >= options.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: options.max - entry.count,
    resetAt: entry.resetAt,
  };
}

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

// ─── Preset configs ───────────────────────────────────────────────────────────

export const AUTH_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60 * 1000,   // 1 minute
  max: 10,               // 10 attempts per minute per IP
  keyPrefix: "auth",
};

export const API_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60 * 1000,   // 1 minute
  max: 200,              // 200 requests per minute per tenant
  keyPrefix: "api",
};