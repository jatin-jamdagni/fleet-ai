import Elysia, { t } from "elysia";
import { requireRole }      from "../../middleware/auth.middleware";
import * as LogisticsService from "./trips.logistics";
import { ok as okRes }      from "../../lib/response";
import { AppError }         from "../../lib/errors";
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

export const tripLogisticsRoutes = new Elysia({ prefix: "/trips" })
.use(requireRole(Role.SUPER_ADMIN, Role.FLEET_MANAGER, Role.DRIVER))

  // GET/PUT manifest
  .get("/:id/manifest", async ({ user, params, set }) => {
    try {
      return okRes(await LogisticsService.getManifest(user, params.id));
    } catch (e) { return handleError(e, set); }
  }, { params: t.Object({ id: t.String() }) })

  .put("/:id/manifest", async ({ user, params, body, set }) => {
    try {
      return okRes(
        await LogisticsService.upsertManifest(user, params.id, body as any)
      );
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      cargoDescription:    t.Optional(t.String()),
      cargoType:           t.Optional(t.String()),
      weightKg:            t.Optional(t.Number()),
      volumeM3:            t.Optional(t.Number()),
      pallets:             t.Optional(t.Number()),
      temperatureMin:      t.Optional(t.Number()),
      temperatureMax:      t.Optional(t.Number()),
      bolNumber:           t.Optional(t.String()),
      poNumber:            t.Optional(t.String()),
      waybillNumber:       t.Optional(t.String()),
      sealNumber:          t.Optional(t.String()),
      receiverName:        t.Optional(t.String()),
      receiverPhone:       t.Optional(t.String()),
      receiverAddress:     t.Optional(t.String()),
      deliveryNotes:       t.Optional(t.String()),
      customsDeclaration:  t.Optional(t.String()),
      hsCode:              t.Optional(t.String()),
      originCountry:       t.Optional(t.String()),
      destinationCountry:  t.Optional(t.String()),
    }),
  })

  // POST POD
  .post("/:id/pod", async ({ user, params, body, set }) => {
    try {
      return okRes(
        await LogisticsService.recordPOD(user, params.id, body as any)
      );
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      podSignedBy:  t.String(),
      podImageUrl:  t.Optional(t.String()),
    }),
  })

  // GET/PUT waypoints
  .get("/:id/waypoints", async ({ user, params, set }) => {
    try {
      return okRes(await LogisticsService.getWaypoints(user, params.id));
    } catch (e) { return handleError(e, set); }
  }, { params: t.Object({ id: t.String() }) })

  .put("/:id/waypoints", async ({ user, params, body, set }) => {
    try {
      return okRes(
        await LogisticsService.setWaypoints(user, params.id, (body as any).waypoints)
      );
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      waypoints: t.Array(t.Object({
        sequence: t.Number(),
        label:    t.String(),
        address:  t.Optional(t.String()),
        lat:      t.Optional(t.Number()),
        lng:      t.Optional(t.Number()),
        notes:    t.Optional(t.String()),
      })),
    }),
  })

  // PATCH waypoint status
  .patch("/:id/waypoints/:wpId", async ({ user, params, body, set }) => {
    try {
      return okRes(
        await LogisticsService.updateWaypointStatus(
          user, params.id, params.wpId, (body as any).status
        )
      );
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ id: t.String(), wpId: t.String() }),
    body:   t.Object({
      status: t.Union([
        t.Literal("ARRIVED"),
        t.Literal("COMPLETED"),
        t.Literal("SKIPPED"),
      ]),
    }),
  });