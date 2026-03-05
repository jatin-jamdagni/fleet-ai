import Elysia, { t } from "elysia";
  
 
import { ok as okRes } from "../lib/response";
 
import { Role } from "@fleet/shared";
import { AppError } from "../lib/errors";
import { requireRole } from "./auth.middleware";
import * as MaintService from "../modules/maintenance/maintenance.service";
import * as DocService from "../modules/maintenance/document.service";

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

export const maintenanceRoutes = new Elysia({ prefix: "/maintenance" })
  .use(requireRole(Role.FLEET_MANAGER, Role.SUPER_ADMIN))

  // GET /maintenance/fleet — all vehicles status
  .get("/fleet", async ({ user, set }) => {
    try {
      return okRes(await MaintService.getFleetMaintenanceStatus(user));
    } catch (e) { return handleError(e, set); }
  }, {
    detail: {
      tags:     ["Maintenance"],
      summary:  "Fleet-wide maintenance status",
      security: [{ bearerAuth: [] }],
    },
  })

  // GET /maintenance/vehicles/:vehicleId
  .get("/vehicles/:vehicleId", async ({ user, params, set }) => {
    try {
      return okRes(
        await MaintService.getMaintenanceHistory(user, params.vehicleId)
      );
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ vehicleId: t.String() }),
    detail: {
      tags:     ["Maintenance"],
      summary:  "Maintenance history for a vehicle",
      security: [{ bearerAuth: [] }],
    },
  })

  // POST /maintenance/vehicles/:vehicleId
  .post("/vehicles/:vehicleId", async ({ user, params, body, set }) => {
    try {
      return okRes(
        await MaintService.logMaintenance(user, {
          vehicleId: params.vehicleId,
          ...body as any,
        })
      );
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ vehicleId: t.String() }),
    body:   t.Object({
      type:           t.String(),
      description:    t.Optional(t.String()),
      odometer:       t.Number(),
      cost:           t.Optional(t.Number()),
      performedAt:    t.String(),
      nextDueKm:      t.Optional(t.Number()),
      nextDueDateAt:  t.Optional(t.String()),
      notes:          t.Optional(t.String()),
    }),
    detail: {
      tags:     ["Maintenance"],
      summary:  "Log a maintenance record",
      security: [{ bearerAuth: [] }],
    },
  })

  // GET /maintenance/documents
  .get("/documents", async ({ user, query, set }) => {
    try {
      return okRes(
        await DocService.listDocuments(user, query.entityId, query.entityType)
      );
    } catch (e) { return handleError(e, set); }
  }, {
    query: t.Object({
      entityId:   t.Optional(t.String()),
      entityType: t.Optional(t.String()),
    }),
    detail: {
      tags:     ["Maintenance"],
      summary:  "List all documents with expiry status",
      security: [{ bearerAuth: [] }],
    },
  })

  // POST /maintenance/documents
  .post("/documents", async ({ user, body, set }) => {
    try {
      return okRes(await DocService.createDocument(user, body as any));
    } catch (e) { return handleError(e, set); }
  }, {
    body: t.Object({
      entityType: t.Union([t.Literal("vehicle"), t.Literal("driver")]),
      entityId:   t.String(),
      docType:    t.String(),
      label:      t.String(),
      expiresAt:  t.Optional(t.String()),
      fileUrl:    t.Optional(t.String()),
    }),
    detail: {
      tags:     ["Maintenance"],
      summary:  "Add a document with optional expiry",
      security: [{ bearerAuth: [] }],
    },
  })

  // DELETE /maintenance/documents/:id
  .delete("/documents/:id", async ({ user, params, set }) => {
    try {
      return okRes(await DocService.deleteDocument(user, params.id));
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ id: t.String() }),
    detail: {
      tags:     ["Maintenance"],
      summary:  "Delete a document",
      security: [{ bearerAuth: [] }],
    },
  });