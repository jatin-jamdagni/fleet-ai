import Elysia, { t } from "elysia";
import { requireRole } from "../../middleware/auth.middleware";
import * as GeofenceService from "./geofence.service";
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

const PolygonSchema = t.Object({
  type:        t.Literal("Polygon"),
  coordinates: t.Array(t.Array(t.Array(t.Number()))),
});

export const geofenceRoutes = new Elysia({ prefix: "/geofences" })
  .use(requireRole(Role.FLEET_MANAGER, Role.SUPER_ADMIN))

  // GET /geofences
  .get("/", async ({ user, set }) => {
    try {
      return okRes(await GeofenceService.listGeofences(user));
    } catch (e) { return handleError(e, set); }
  }, {
    detail: {
      tags:     ["Geofences"],
      summary:  "List all geofences",
      security: [{ bearerAuth: [] }],
    },
  })

  // POST /geofences
  .post("/", async ({ user, body, set }) => {
    try {
      return okRes(await GeofenceService.createGeofence(user, body as any));
    } catch (e) { return handleError(e, set); }
  }, {
    body: t.Object({
      name:         t.String({ minLength: 1 }),
      description:  t.Optional(t.String()),
      color:        t.Optional(t.String()),
      polygon:      PolygonSchema,
      alertOnEnter: t.Optional(t.Boolean()),
      alertOnExit:  t.Optional(t.Boolean()),
    }),
    detail: {
      tags:     ["Geofences"],
      summary:  "Create a geofence zone",
      security: [{ bearerAuth: [] }],
    },
  })

  // DELETE /geofences/:id
  .delete("/:id", async ({ user, params, set }) => {
    try {
      return okRes(await GeofenceService.deleteGeofence(user, params.id));
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ id: t.String() }),
    detail: {
      tags:     ["Geofences"],
      summary:  "Delete a geofence",
      security: [{ bearerAuth: [] }],
    },
  })

  // GET /geofences/events
  .get("/events", async ({ user, query, set }) => {
    try {
      return okRes(await GeofenceService.listGeofenceEvents(
        user,
        query.tripId,
        Number(query.limit ?? 50)
      ));
    } catch (e) { return handleError(e, set); }
  }, {
    query: t.Object({
      tripId: t.Optional(t.String()),
      limit:  t.Optional(t.String()),
    }),
    detail: {
      tags:     ["Geofences"],
      summary:  "List geofence enter/exit events",
      security: [{ bearerAuth: [] }],
    },
  });