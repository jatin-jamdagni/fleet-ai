import Elysia, { t } from "elysia";
import { authMiddleware } from "../../middleware/auth.middleware";
import * as NotifService from "./notifications.service";
import { storePushToken, removePushToken } from "./push.service";
import { ok as okRes } from "../../lib/response";
import { AppError } from "../../lib/errors";

function handleError(e: unknown, set: any) {
  if (e instanceof AppError) {
    set.status = e.statusCode;
    return {
      success: false,
      error: { code: e.code, message: e.message, statusCode: e.statusCode },
    };
  }
  set.status = 500;
  return {
    success: false,
    error: { code: "INTERNAL", message: "Something went wrong", statusCode: 500 },
  };
}

export const notificationRoutes = new Elysia({ prefix: "/notifications" })
  .use(authMiddleware)

  // GET /notifications
  .get(
    "/",
    async ({ user, query, set }) => {
      try {
        const result = await NotifService.listNotifications(
          user,
          query.unread === "true",
          Number(query.pageSize ?? 30)
        );
        return okRes(result);
      } catch (e) { return handleError(e, set); }
    },
    {
      query: t.Object({
        unread:   t.Optional(t.String()),
        pageSize: t.Optional(t.String()),
      }),
      detail: {
        tags:     ["Notifications"],
        summary:  "List notifications for current user",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // PATCH /notifications/read-all
  .patch(
    "/read-all",
    async ({ user, set }) => {
      try {
        await NotifService.markAllRead(user);
        return okRes({ message: "All notifications marked as read" });
      } catch (e) { return handleError(e, set); }
    },
    {
      detail: {
        tags:     ["Notifications"],
        summary:  "Mark all notifications as read",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // PATCH /notifications/read
  .patch(
    "/read",
    async ({ user, body, set }) => {
      try {
        await NotifService.markRead(user, body.ids);
        return okRes({ message: "Notifications marked as read" });
      } catch (e) { return handleError(e, set); }
    },
    {
      body: t.Object({ ids: t.Array(t.String()) }),
      detail: {
        tags:     ["Notifications"],
        summary:  "Mark specific notifications as read",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // DELETE /notifications/:id
  .delete(
    "/:id",
    async ({ user, params, set }) => {
      try {
        await NotifService.deleteNotification(user, params.id);
        return okRes({ message: "Deleted" });
      } catch (e) { return handleError(e, set); }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags:     ["Notifications"],
        summary:  "Delete a notification",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // POST /notifications/push-token
  .post(
    "/push-token",
    async ({ user, body, set }) => {
      try {
        await storePushToken(user.userId, body.token, body.platform);
        return okRes({ message: "Push token registered" });
      } catch (e) { return handleError(e, set); }
    },
    {
      body: t.Object({
        token:    t.String(),
        platform: t.Union([t.Literal("ios"), t.Literal("android")]),
      }),
      detail: {
        tags:     ["Notifications"],
        summary:  "Register Expo push token",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // DELETE /notifications/push-token
  .delete(
    "/push-token",
    async ({ user, body, set }) => {
      try {
        await removePushToken(user.userId, body.token);
        return okRes({ message: "Push token removed" });
      } catch (e) { return handleError(e, set); }
    },
    {
      body: t.Object({ token: t.String() }),
      detail: {
        tags:     ["Notifications"],
        summary:  "Remove Expo push token on logout",
        security: [{ bearerAuth: [] }],
      },
    }
  );
