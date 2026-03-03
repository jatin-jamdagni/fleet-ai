import { prisma } from "../db/prisma";

// Tenant isolation is applied in db/prisma.ts via Prisma Client extensions.
// Keep this initializer for backward compatibility with index bootstrap code.

export function setupTenantIsolation() {

  // view in db/prisma.ts for implementation details
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
