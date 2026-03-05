// // Simple in-memory rate limiter
// // In production, we will swap this Map for Redis

// interface RateLimitEntry {
//   count: number;
//   resetAt: number;
// }

// const store = new Map<string, RateLimitEntry>();

// export interface RateLimitOptions {
//   windowMs: number;   // Time window in milliseconds
//   max: number;        // Max requests per window
//   keyPrefix?: string; // Namespace
// }

// export function checkRateLimit(
//   identifier: string,
//   options: RateLimitOptions
// ): { allowed: boolean; remaining: number; resetAt: number } {
//   const key = `${options.keyPrefix ?? "rl"}:${identifier}`;
//   const now = Date.now();

//   const entry = store.get(key);

//   // New window or expired
//   if (!entry || now > entry.resetAt) {
//     const newEntry: RateLimitEntry = {
//       count: 1,
//       resetAt: now + options.windowMs,
//     };
//     store.set(key, newEntry);
//     return {
//       allowed: true,
//       remaining: options.max - 1,
//       resetAt: newEntry.resetAt,
//     };
//   }

//   // Within window
//   if (entry.count >= options.max) {
//     return { allowed: false, remaining: 0, resetAt: entry.resetAt };
//   }

//   entry.count++;
//   return {
//     allowed: true,
//     remaining: options.max - entry.count,
//     resetAt: entry.resetAt,
//   };
// }

// // Cleanup expired entries every 5 minutes
// setInterval(() => {
//   const now = Date.now();
//   for (const [key, entry] of store.entries()) {
//     if (now > entry.resetAt) store.delete(key);
//   }
// }, 5 * 60 * 1000);

// // ─── Preset configs ───────────────────────────────────────────────────────────

// export const AUTH_RATE_LIMIT: RateLimitOptions = {
//   windowMs: 60 * 1000,   // 1 minute
//   max: 10,               // 10 attempts per minute per IP
//   keyPrefix: "auth",
// };

// export const API_RATE_LIMIT: RateLimitOptions = {
//   windowMs: 60 * 1000,   // 1 minute
//   max: 200,              // 200 requests per minute per tenant
//   keyPrefix: "api",
// };



// ─── Rate Limiter — Redis in production, in-memory fallback in dev ─────────────
//
// Production:  REDIS_URL set → uses Redis sliding window
// Development: no REDIS_URL → uses Map (single process only)

import Redis, { type Redis as RedisType } from "ioredis";

export interface RateLimitOptions {
  windowMs:  number;
  max:       number;
  keyPrefix: string;
}

export interface RateLimitResult {
  allowed:   boolean;
  remaining: number;
  resetAt:   number;
}

// ─── In-memory fallback ───────────────────────────────────────────────────────

interface Bucket { count: number; resetAt: number }
const memStore = new Map<string, Bucket>();

function checkMemory(
  identifier: string,
  opts: RateLimitOptions
): RateLimitResult {
  const key  = `${opts.keyPrefix}:${identifier}`;
  const now  = Date.now();
  let   bucket = memStore.get(key);

  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + opts.windowMs };
    memStore.set(key, bucket);
  }

  bucket.count++;
  const remaining = Math.max(0, opts.max - bucket.count);

  return {
    allowed:   bucket.count <= opts.max,
    remaining,
    resetAt:   bucket.resetAt,
  };
}

// ─── Redis sliding window ─────────────────────────────────────────────────────

let redisClient: RedisType | null = null;

async function getRedis(): Promise<RedisType | null> {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (redisClient) return redisClient;

  try {
    const client = new Redis(url, {
      maxRetriesPerRequest:   3,
      enableReadyCheck:       true,
      lazyConnect:            true,
      connectTimeout:         3000,
    });
    redisClient = client;

    client.on("error", (err) => {
      console.error("[Redis] Error:", err.message);
    });

    await client.connect();
    console.log("✅ Redis connected for rate limiting");
    return client;
  } catch (err) {
    console.warn("[Redis] Could not connect — falling back to in-memory rate limiter");
    redisClient = null;
    return null;
  }
}

// Lua script for atomic sliding window
const SLIDING_WINDOW_LUA = `
local key        = KEYS[1]
local now        = tonumber(ARGV[1])
local window_ms  = tonumber(ARGV[2])
local max        = tonumber(ARGV[3])
local window_start = now - window_ms

-- Remove expired entries
redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

-- Count current
local count = redis.call('ZCARD', key)

if count < max then
  -- Add this request
  redis.call('ZADD', key, now, now .. '-' .. math.random(1, 100000))
  redis.call('PEXPIRE', key, window_ms)
  return {1, max - count - 1}
else
  return {0, 0}
end
`;

async function checkRedis(
  identifier: string,
  opts:       RateLimitOptions
): Promise<RateLimitResult> {
  const redis = await getRedis();
  if (!redis) return checkMemory(identifier, opts);

  const key    = `rl:${opts.keyPrefix}:${identifier}`;
  const now    = Date.now();
  const resetAt = now + opts.windowMs;

  try {
    const result = await redis.eval(
      SLIDING_WINDOW_LUA,
      1,
      key,
      now.toString(),
      opts.windowMs.toString(),
      opts.max.toString()
    ) as [number, number];

    return {
      allowed:   result[0] === 1,
      remaining: Math.max(0, result[1]),
      resetAt,
    };
  } catch (err) {
    console.error("[Redis] Rate limit eval failed — falling back:", err);
    return checkMemory(identifier, opts);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function checkRateLimit(
  identifier: string,
  opts:       RateLimitOptions
): RateLimitResult {
  // In dev without Redis — synchronous in-memory
  if (!process.env.REDIS_URL) {
    return checkMemory(identifier, opts);
  }
  // Async path — caller must await
  throw new Error("Use checkRateLimitAsync in production");
}

export async function checkRateLimitAsync(
  identifier: string,
  opts:       RateLimitOptions
): Promise<RateLimitResult> {
  if (!process.env.REDIS_URL) {
    return checkMemory(identifier, opts);
  }
  return checkRedis(identifier, opts);
}

// ─── Preset configs ───────────────────────────────────────────────────────────

export const AUTH_RATE_LIMIT = {
  windowMs:  60_000,
  max:       10,
  keyPrefix: "auth",
};

export const LOGIN_RATE_LIMIT = {
  windowMs:  60_000,
  max:       5,
  keyPrefix: "login",
};

export const API_RATE_LIMIT = {
  windowMs:  60_000,
  max:       200,
  keyPrefix: "api",
};

export const WS_RATE_LIMIT = {
  windowMs:  10_000,
  max:       50,
  keyPrefix: "ws",
};

// ─── Health check ─────────────────────────────────────────────────────────────

export async function checkRedisHealth(): Promise<{
  connected: boolean;
  latencyMs?: number;
  mode:       "redis" | "memory";
}> {
  const redis = await getRedis();
  if (!redis) return { connected: false, mode: "memory" };

  const t0 = Date.now();
  try {
    await redis.ping();
    return { connected: true, latencyMs: Date.now() - t0, mode: "redis" };
  } catch {
    return { connected: false, mode: "memory" };
  }
}
