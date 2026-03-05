import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { authRoutes } from "./modules/auth/auth.routes";
import { prisma } from "./db/prisma";
import { setupTenantIsolation } from "./middleware/tenant.middleware";  // ← ADD
import { vehicleDriverRoutes, vehicleRoutes } from "./modules/vehicles/vehicles.routes";
import { userPublicRoutes, userRoutes, userSelfRoutes } from "./modules/users/users.routes";
import { flushAllPendingPings, startBatchWriter } from "./modules/websocket/ws.batch";
import { tripDriverRoutes, tripManagerRoutes } from "./modules/trips/trips.routes";
import { billingRoutes } from "./modules/billing/billing.routes";
import { aiDriverRoutes, aiHealthRoutes, aiManagerRoutes } from "./modules/ai/ai.routes";
import { wsHandler } from "./modules/websocket/ws.handler";
import { analyticsRoutes } from "./modules/analytics/analytics.routes";
import { gpsRoutes } from "./modules/gps/gps.routes";
import { checkRedisHealth } from "./lib/rate-limit";
const PORT = Number(process.env.PORT) || 3000;
import { initSentry, captureException } from "./lib/sentry";
import { AppError } from "./lib/errors";
import { register } from "./lib/metrics";

// ─── Sentry ─────────────────────────────────────────────────────────────

initSentry();

// ─── Validate ENV ─────────────────────────────────────────────────────────────
const required = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}



// ─── Register Prisma middleware BEFORE app starts ─────────────────────────────
setupTenantIsolation();
startBatchWriter();


const app = new Elysia()
  .use(
    cors({
      origin: [
        "http://localhost:5173",
        "http://localhost:4173",
        process.env.WEB_URL ?? "",
      ].filter(Boolean),
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "Fleet AI SaaS API",
          version: "1.0.0",
          description: "Multi-tenant fleet management, GPS tracking & AI driver assistant",
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
        tags: [
          { name: "Auth", description: "Authentication & tenant registration" },
          { name: "Vehicles", description: "Fleet vehicle management" },
          { name: "Trips", description: "Trip lifecycle" },
          { name: "Billing", description: "Invoices & billing" },
          { name: "AI", description: "RAG-powered driver assistant" },
        ],
      },
    })
  )
  .use(wsHandler)
  .use(aiHealthRoutes)

  // ─── Health ────────────────────────────────────────────────────────────────
  // .get("/health", async () => {
  //   // Also verify DB connection
  //   let dbStatus = "ok";
  //   try {
  //     await prisma.$queryRaw`SELECT 1`;
  //   } catch {
  //     dbStatus = "error";
  //   }

  //   return {
  //     status: dbStatus === "ok" ? "ok" : "degraded",
  //     service: "fleet-ai-backend",
  //     timestamp: new Date().toISOString(),
  //     version: "1.0.0",
  //     environment: process.env.NODE_ENV ?? "development",
  //     database: dbStatus,
  //   };
  // })
  .get("/health", async () => {
    const start = Date.now();

    // DB ping
    let dbOk = false;
    let dbMs = 0;
    try {
      await prisma.$executeRaw`SELECT 1`;
      dbOk = true;
      dbMs = Date.now() - start;
    } catch { /* noop */ }

    // Redis ping
    const redis = await checkRedisHealth();

    const healthy = dbOk;

    return new Response(JSON.stringify({
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version ?? "1.0.0",
      services: {
        database: {
          status: dbOk ? "up" : "down",
          latencyMs: dbMs,
        },
        redis: {
          status: redis.connected ? "up" : "memory-fallback",
          latencyMs: redis.latencyMs,
          mode: redis.mode,
        },
        ai: {
          provider: process.env.AI_PROVIDER ?? "ollama",
        },
      },
    }), {
      status: healthy ? 200 : 503,
      headers: { "Content-Type": "application/json" },
    });
  })

  // prometheus metrics endpoint

  .get("/metrics", async ({ set }) => {
    set.headers["Content-Type"] = register.contentType;
    return register.metrics();
  })
  // ─── API v1 ────────────────────────────────────────────────────────────────
  .group("/api/v1", (app) =>
    app
      .use(aiHealthRoutes)
      .use(authRoutes)
      .use(userPublicRoutes)   // ← public first (accept-invite)
      .use(userRoutes)         // ← protected manager routes
      .use(userSelfRoutes)  // ← self-service (change password)
      .use(vehicleRoutes)
      .use(vehicleDriverRoutes)
      .use(tripManagerRoutes)
      .use(tripDriverRoutes)
      .use(billingRoutes)
      .use(aiDriverRoutes)
      .use(aiManagerRoutes)
      .use(analyticsRoutes)
      .use(gpsRoutes)


  )

  // ─── Global error handler ──────────────────────────────────────────────────
  .onError(({ error, set, request }) => {
    const maybeError = error as {
      code?: unknown;
      message?: unknown;
      statusCode?: unknown;
      status?: unknown;
    };

    const code = typeof maybeError.code === "string" ? maybeError.code : undefined;
    const statusCode =
      typeof maybeError.statusCode === "number"
        ? maybeError.statusCode
        : typeof maybeError.status === "number"
          ? maybeError.status
          : undefined;
    const message =
      typeof maybeError.message === "string"
        ? maybeError.message
        : "An unexpected error occurred";

    if (statusCode) {
      if (statusCode >= 500) {
        console.error("[Error]", error);
      } else if (statusCode !== 404) {
        console.warn("[Warn]", code ?? "CLIENT_ERROR", message);
      }

      set.status = statusCode;
      return {
        success: false,
        error: {
          code: code ?? (statusCode === 404 ? "NOT_FOUND" : "ERROR"),
          message,
          statusCode,
        },
      };
    }



    // Log to Sentry
    captureException(error, {
      url: request.url,
      method: request.method,
    });

    if (error instanceof AppError) {
      set.status = error.statusCode;
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
        },
      };
    }

    console.error("[UnhandledError]", error);

    set.status = 500;

    return {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
        statusCode: 500,
      },
    };



  })

  .listen(PORT);

const shutdown = async (signal: string) => {
  console.log(`[Shutdown] ${signal} received. Flushing pending GPS pings...`);
  try {
    await flushAllPendingPings();
  } finally {
    process.exit(0);
  }
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

console.log(`
╔══════════════════════════════════════════════════╗
          🚛  Fleet AI Backend  v1.0.0            
╠══════════════════════════════════════════════════╣
║  Status  →  Running                              ║
║  Port    →  ${PORT}                              ║
║  Health  →  http://localhost:${PORT}/health      ║
║  API     →  http://localhost:${PORT}/api/v1      ║
║  Docs    →  http://localhost:${PORT}/docs        ║
╚══════════════════════════════════════════════════╝
`);

export type App = typeof app;
