import { prisma } from "../../db/prisma";
import { AppError } from "../../lib/errors";
import { injectTenantContext } from "../../middleware/auth.middleware";
import type { UserContext } from "../../types/context";
import { notifyManagers } from "../notifications/notifications.service";

// ─── Create document ──────────────────────────────────────────────────────────

export async function createDocument(
  user: UserContext,
  body: {
    entityType: string;
    entityId:   string;
    docType:    string;
    label:      string;
    expiresAt?: string;
    fileUrl?:   string;
  }
) {
  return injectTenantContext(user, async () => {
    return prisma.document.create({
      data: {
        tenantId:   user.tenantId,
        entityType: body.entityType,
        entityId:   body.entityId,
        docType:    body.docType,
        label:      body.label,
        expiresAt:  body.expiresAt ? new Date(body.expiresAt) : null,
        fileUrl:    body.fileUrl,
      },
    });
  });
}

// ─── List documents ───────────────────────────────────────────────────────────

export async function listDocuments(
  user:       UserContext,
  entityId?:  string,
  entityType?: string
) {
  return injectTenantContext(user, async () => {
    const where: any = { tenantId: user.tenantId };
    if (entityId)   where.entityId   = entityId;
    if (entityType) where.entityType = entityType;

    const docs = await prisma.document.findMany({
      where,
      orderBy: { expiresAt: "asc" },
    });

    return docs.map((d) => ({
      ...d,
      expiryStatus: getExpiryStatus(d.expiresAt),
    }));
  });
}

// ─── Delete document ──────────────────────────────────────────────────────────

export async function deleteDocument(user: UserContext, id: string) {
  return injectTenantContext(user, async () => {
    const doc = await prisma.document.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!doc) throw new AppError("NOT_FOUND", "Document not found", 404);

    await prisma.document.delete({ where: { id } });
    return { deleted: true };
  });
}

// ─── Check expiring documents (cron) ─────────────────────────────────────────

export async function checkExpiringDocuments(): Promise<void> {
  const now     = new Date();
  const in30    = new Date(now.getTime() + 30 * 86_400_000);
  const in7     = new Date(now.getTime() + 7  * 86_400_000);

  // Documents expiring in 30 days that haven't been notified recently
  const expiring = await prisma.document.findMany({
    where: {
      expiresAt: { gte: now, lte: in30 },
      OR: [
        { notifiedAt: null },
        { notifiedAt: { lt: new Date(now.getTime() - 7 * 86_400_000) } },
      ],
    },
  });

  for (const doc of expiring) {
    const daysLeft = Math.ceil(
      (doc.expiresAt!.getTime() - now.getTime()) / 86_400_000
    );

    const urgency = daysLeft <= 7 ? "🔴" : "🟡";

    await notifyManagers({
      tenantId: doc.tenantId,
      type:     "SYSTEM",
      title:    `${urgency} Document Expiring`,
      body:     `${doc.label} expires in ${daysLeft} days`,
      data:     {
        documentId: doc.id,
        entityType: doc.entityType,
        entityId:   doc.entityId,
        daysLeft,
        expiresAt:  doc.expiresAt,
      },
    }).catch(() => {});

    await prisma.document.update({
      where: { id: doc.id },
      data:  { notifiedAt: now },
    });

    console.log(`[Docs] Expiry alert — ${doc.label} (${daysLeft} days)`);
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getExpiryStatus(
  expiresAt: Date | null
): "expired" | "critical" | "warning" | "ok" | "none" {
  if (!expiresAt) return "none";

  const now      = new Date();
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / 86_400_000);

  if (daysLeft < 0)  return "expired";
  if (daysLeft <= 7) return "critical";
  if (daysLeft <= 30)return "warning";
  return "ok";
}