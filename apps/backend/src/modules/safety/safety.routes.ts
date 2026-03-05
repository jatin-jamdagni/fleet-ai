import Elysia, { t } from "elysia";
import {  requireRole } from "../../middleware/auth.middleware";
import { getDriverScoreSummary, getDriverLeaderboard } from "./safety.scoring";
import { getHosSummary, getAllDriversHos } from "./safety.hos";
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

export const safetyRoutes = new Elysia({ prefix: "/safety" })
  .use(requireRole(Role.DRIVER, Role.FLEET_MANAGER, Role.SUPER_ADMIN))

  // GET /safety/scores — leaderboard (manager only)
  .get("/scores", async ({ user, query, set }) => {
    try {
      if (user.role === "DRIVER") {
        set.status = 403;
        return {
          success: false,
          error: { code: "FORBIDDEN", message: "Access denied" },
        };
      }
      return okRes(
        await getDriverLeaderboard(user.tenantId, Number(query.days ?? 30))
      );
    } catch (e) { return handleError(e, set); }
  }, {
    query: t.Object({ days: t.Optional(t.String()) }),
    detail: {
      tags:     ["Safety"],
      summary:  "Driver safety score leaderboard",
      security: [{ bearerAuth: [] }],
    },
  })

  // GET /safety/scores/:driverId — individual score
  .get("/scores/:driverId", async ({ user, params, query, set }) => {
    try {
      // Drivers can only see their own score
      const driverId = user.role === "DRIVER" ? user.userId : params.driverId;
      return okRes(
        await getDriverScoreSummary(
          user.tenantId,
          driverId,
          Number(query.days ?? 30)
        )
      );
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ driverId: t.String() }),
    query:  t.Object({ days: t.Optional(t.String()) }),
    detail: {
      tags:     ["Safety"],
      summary:  "Individual driver safety score + history",
      security: [{ bearerAuth: [] }],
    },
  })

  // GET /safety/hos — all drivers HOS today (manager)
  .get("/hos", async ({ user, set }) => {
    try {
      if (user.role === "DRIVER") {
        set.status = 403;
        return {
          success: false,
          error: { code: "FORBIDDEN", message: "Access denied" },
        };
      }
      return okRes(await getAllDriversHos(user.tenantId));
    } catch (e) { return handleError(e, set); }
  }, {
    detail: {
      tags:     ["Safety"],
      summary:  "All drivers hours-of-service today",
      security: [{ bearerAuth: [] }],
    },
  })

  // GET /safety/hos/:driverId — individual HOS
  .get("/hos/:driverId", async ({ user, params, query, set }) => {
    try {
      const driverId = user.role === "DRIVER" ? user.userId : params.driverId;
      return okRes(
        await getHosSummary(
          user.tenantId,
          driverId,
          Number(query.days ?? 7)
        )
      );
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ driverId: t.String() }),
    query:  t.Object({ days: t.Optional(t.String()) }),
    detail: {
      tags:     ["Safety"],
      summary:  "Driver hours-of-service summary",
      security: [{ bearerAuth: [] }],
    },
  });