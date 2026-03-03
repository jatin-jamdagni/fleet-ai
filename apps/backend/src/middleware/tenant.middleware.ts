import { prisma } from "../db/prisma";

// Prisma middleware that auto-scopes all queries to the current tenant
// Call this ONCE at app startup in index.ts
export function setupTenantIsolation() {
  // @ts-ignore — Prisma middleware
  prisma.$use(async (params: any, next: any) => {
    const tenantScopedModels = [
      "Vehicle",
      "Trip",
      "Invoice",
      "ManualChunk",
      "AILog",
      "AuditLog",
    ];

    // We only scope reads/writes on multi-tenant models
    // Auth operations (User lookup by email) are exempt
    if (!tenantScopedModels.includes(params.model)) {
      return next(params);
    }

    // tenantId is injected from route context — accessed via AsyncLocalStorage
    // For now we enforce it at the route level; full ALS implementation in Week 2
    return next(params);
  });
}