import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";

const PORT = Number(process.env.PORT) || 3000;

const app = new Elysia({ prefix: "/api/v1" })
  .use(
    cors({
      origin: [
        "http://localhost:5173", // web dashboard dev
        "http://localhost:4173", // web dashboard preview
        process.env.WEB_URL ?? "",
      ].filter(Boolean),
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
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
        tags: [
          { name: "Auth", description: "Authentication & tenant registration" },
          { name: "Vehicles", description: "Fleet vehicle management" },
          { name: "Trips", description: "Trip lifecycle management" },
          { name: "Billing", description: "Invoices & billing" },
          { name: "AI", description: "RAG-powered driver assistant" },
        ],
      },
    })
  )
  .get("/health", () => ({
    status: "ok",
    service: "fleet-ai-backend",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV ?? "development",
  }))
  .listen(PORT);

console.log(`
  Running  →  http://localhost:${PORT}       
  Health   →  http://localhost:${PORT}/api/v1/health   
  Docs     →  http://localhost:${PORT}/api/v1/docs   
`);

export type App = typeof app;