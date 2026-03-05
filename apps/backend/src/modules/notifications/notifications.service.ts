import { prisma } from "../../db/prisma";
import { NotificationType } from "../../generated/prisma/enums";
import { AppError } from "../../lib/errors";
import type { UserContext } from "../../types/context";
import { fleetStore } from "../gps/gps.store";
import { sendExpoPush } from "./push.service";
 
// ─── Create + deliver notification ───────────────────────────────────────────

export async function createNotification(opts: {
  tenantId: string;
  userId:   string;
  type:     NotificationType;
  title:    string;
  body:     string;
  data?:    Record<string, any>;
}): Promise<void> {
  // Persist to DB
  const notification = await prisma.notification.create({
    data: {
      tenantId: opts.tenantId,
      userId:   opts.userId,
      type:     opts.type,
      title:    opts.title,
      body:     opts.body,
      data:     opts.data,
    },
  });

  // Deliver via WebSocket if user is connected
  const delivered = fleetStore.sendToUser(opts.userId, {
    type:    "NOTIFICATION",
    payload: {
      id:        notification.id,
      type:      notification.type,
      title:     notification.title,
      body:      notification.body,
      data:      notification.data,
      createdAt: notification.createdAt,
    },
  });

  // Deliver via push if not online
  if (!delivered) {
    await sendExpoPush(opts.userId, {
      title: opts.title,
      body:  opts.body,
      data:  opts.data,
    }).catch(() => { /* non-critical */ });
  }
}

// ─── Bulk notify all managers in a tenant ────────────────────────────────────

export async function notifyManagers(opts: {
  tenantId: string;
  type:     NotificationType;
  title:    string;
  body:     string;
  data?:    Record<string, any>;
}): Promise<void> {
  const managers = await prisma.user.findMany({
    where: {
      tenantId:  opts.tenantId,
      role:      { in: ["FLEET_MANAGER", "SUPER_ADMIN"] },
      deletedAt: null,
    },
    select: { id: true },
  });

  await Promise.all(
    managers.map((m) =>
      createNotification({ ...opts, userId: m.id }).catch(() => {})
    )
  );
}

// ─── List notifications for current user ─────────────────────────────────────

export async function listNotifications(
  user:     UserContext,
  unreadOnly: boolean = false,
  pageSize: number    = 30
) {
  const where: any = {
    tenantId: user.tenantId,
    userId:   user.userId,
  };
  if (unreadOnly) where.read = false;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy:  { createdAt: "desc" },
      take:     pageSize,
    }),
    prisma.notification.count({
      where: { tenantId: user.tenantId, userId: user.userId, read: false },
    }),
  ]);

  return { notifications, unreadCount };
}

// ─── Mark as read ─────────────────────────────────────────────────────────────

export async function markRead(
  user: UserContext,
  ids:  string[]
): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      id:       { in: ids },
      tenantId: user.tenantId,
      userId:   user.userId,
    },
    data: {
      read:   true,
      readAt: new Date(),
    },
  });
}

// ─── Mark all read ────────────────────────────────────────────────────────────

export async function markAllRead(user: UserContext): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      tenantId: user.tenantId,
      userId:   user.userId,
      read:     false,
    },
    data: {
      read:   true,
      readAt: new Date(),
    },
  });
}

// ─── Delete notification ──────────────────────────────────────────────────────

export async function deleteNotification(
  user: UserContext,
  id:   string
): Promise<void> {
  const notif = await prisma.notification.findFirst({
    where: { id, tenantId: user.tenantId, userId: user.userId },
  });
  if (!notif) throw new AppError("NOT_FOUND", "Notification not found", 404);

  await prisma.notification.delete({ where: { id } });
}
