import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { authRoutes } from "./modules/auth/auth.routes";
import { prisma } from "./db/prisma";
import { setupTenantIsolation } from "./middleware/tenant.middleware";  // ← ADD
import { vehicleRoutes } from "./modules/vehicles/vehicles.routes";
import { userPublicRoutes, userRoutes, userSelfRoutes } from "./modules/users/users.routes";
import { startBatchWriter } from "./modules/websocket/ws.batch";
import { tripDriverRoutes, tripManagerRoutes } from "./modules/trips/trips.routes";
import { billingRoutes } from "./modules/billing/billing.routes";

const PORT = Number(process.env.PORT) || 3000;

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

  // ─── Health ────────────────────────────────────────────────────────────────
  .get("/health", async () => {
    // Also verify DB connection
    let dbStatus = "ok";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "error";
    }

    return {
      status: dbStatus === "ok" ? "ok" : "degraded",
      service: "fleet-ai-backend",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV ?? "development",
      database: dbStatus,
    };
  })

  // ─── API v1 ────────────────────────────────────────────────────────────────
  .group("/api/v1", (app) =>
    app
      .use(authRoutes)
      .use(userPublicRoutes)   // ← public first (accept-invite)
      .use(userRoutes)         // ← protected manager routes
      .use(userSelfRoutes)  // ← self-service (change password)
      .use(vehicleRoutes)
      .use(tripManagerRoutes)
      .use(tripDriverRoutes)
      .use(billingRoutes)
    // .use(billingRoutes)
    // .use(aiRoutes)

  )

  // ─── Global error handler ──────────────────────────────────────────────────
  .onError(({ error, set }) => {
    console.error("[Error]", error);

    if (error instanceof Error && "code" in error && "statusCode" in error) {
      const appErr = error as any;
      set.status = appErr.statusCode;
      return {
        success: false,
        error: {
          code: appErr.code,
          message: appErr.message,
          statusCode: appErr.statusCode,
        },
      };
    }

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