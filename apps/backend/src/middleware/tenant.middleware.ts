import { prisma } from "../db/prisma";

// Tenant isolation is applied in db/prisma.ts via Prisma Client extensions.
// Keep this initializer for backward compatibility with index bootstrap code.

export function setupTenantIsolation() {

  // view in db/prisma.ts for implementation details
  // You do not need to manually register Prisma tenant middleware here.

  // Current behavior:

  // In prisma.ts, tenant isolation is attached when prisma is created via basePrisma.$extends(...).
  // So any import of prisma already uses that extension automatically.
  // About setupTenantIsolation():

  // In tenant.middleware.ts, it is currently a no-op/log wrapper for backward compatibility.
  // Calling it is optional for functionality.

  console.log("✅ Tenant isolation enabled via Prisma query extensions");
}

// ─── Audit Log Helper ─────────────────────────────────────────────────────────

export async function writeAuditLog(
  tenantId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    await prisma.auditLog.create({
      data: { tenantId, userId, action, entityType, entityId, metadata: metadata as any },
    });
  } catch (err) {
    // Never let audit logging break main flow
    console.error("[AuditLog] Failed to write:", err);
  }
}
