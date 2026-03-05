import Elysia, { t } from "elysia";
import { requireRole } from "../../middleware/auth.middleware";
import * as ScheduleService from "./schedule.service";
import { ok as okRes } from "../../lib/response";
import { AppError } from "../../lib/errors";
import { Role } from "@fleet/shared";

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

export const scheduleRoutes = new Elysia({ prefix: "/schedules" })
  .use(requireRole(Role.FLEET_MANAGER, Role.SUPER_ADMIN))

  // GET /schedules
  .get("/", async ({ user, query, set }) => {
    try {
      return okRes(await ScheduleService.listSchedules(
        user,
        query.from,
        query.to,
        query.status
      ));
    } catch (e) { return handleError(e, set); }
  }, {
    query: t.Object({
      from:   t.Optional(t.String()),
      to:     t.Optional(t.String()),
      status: t.Optional(t.String()),
    }),
    detail: {
      tags:     ["Schedules"],
      summary:  "List scheduled trips",
      security: [{ bearerAuth: [] }],
    },
  })

  // POST /schedules (manager only)
  .post("/", async ({ user, body, set }) => {
    try {
      if (user.role === "DRIVER") {
        set.status = 403;
        return {
          success: false,
          error: { code: "FORBIDDEN", message: "Drivers cannot create schedules" },
        };
      }
      return okRes(await ScheduleService.createSchedule(user, body as any));
    } catch (e) { return handleError(e, set); }
  }, {
    body: t.Object({
      vehicleId:   t.String(),
      driverId:    t.String(),
      title:       t.String({ minLength: 1 }),
      notes:       t.Optional(t.String()),
      scheduledAt: t.String(),
    }),
    detail: {
      tags:     ["Schedules"],
      summary:  "Create a scheduled trip",
      security: [{ bearerAuth: [] }],
    },
  })

  // PATCH /schedules/:id/status
  .patch("/:id/status", async ({ user, params, body, set }) => {
    try {
      return okRes(
        await ScheduleService.updateScheduleStatus(user, params.id, body.status)
      );
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ id: t.String() }),
    body:   t.Object({
      status: t.Union([
        t.Literal("PENDING"),
        t.Literal("NOTIFIED"),
        t.Literal("STARTED"),
        t.Literal("COMPLETED"),
        t.Literal("CANCELED"),
      ]),
    }),
    detail: {
      tags:     ["Schedules"],
      summary:  "Update schedule status",
      security: [{ bearerAuth: [] }],
    },
  })

  // DELETE /schedules/:id
  .delete("/:id", async ({ user, params, set }) => {
    try {
      return okRes(await ScheduleService.deleteSchedule(user, params.id));
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ id: t.String() }),
    detail: {
      tags:     ["Schedules"],
      summary:  "Delete a scheduled trip",
      security: [{ bearerAuth: [] }],
    },
  });