import Elysia, { t } from "elysia";
import { requireRole } from "../../middleware/auth.middleware";
import * as SettingsService   from "./settings.service";
import * as ShareLinkService  from "./sharelink.service";
import { ok as okRes }        from "../../lib/response";
import { AppError }           from "../../lib/errors";
import { Role }               from "@fleet/shared";

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

// ─── Branding / settings routes ───────────────────────────────────────────────

export const settingsRoutes = new Elysia({ prefix: "/settings" })
  .use(requireRole(Role.FLEET_MANAGER, Role.SUPER_ADMIN))

  .get("/", async ({ user, set }) => {
    try {
      return okRes(await SettingsService.getSettings(user));
    } catch (e) { return handleError(e, set); }
  }, {
    detail: {
      tags:     ["Settings"],
      summary:  "Get tenant settings & branding",
      security: [{ bearerAuth: [] }],
    },
  })

  .patch("/", async ({ user, body, set }) => {
    try {
      return okRes(await SettingsService.updateSettings(user, body as any));
    } catch (e) { return handleError(e, set); }
  }, {
    body: t.Object({
      companyName:   t.Optional(t.String()),
      logoUrl:       t.Optional(t.String()),
      primaryColor:  t.Optional(t.String()),
      accentColor:   t.Optional(t.String()),
      customDomain:  t.Optional(t.String()),
      timezone:      t.Optional(t.String()),
      currency:      t.Optional(t.String()),
      distanceUnit:  t.Optional(t.Union([t.Literal("km"), t.Literal("mi")])),
      invoicePrefix: t.Optional(t.String()),
      invoiceFooter: t.Optional(t.String()),
      vatNumber:     t.Optional(t.String()),
      address:       t.Optional(t.String()),
    }),
    detail: {
      tags:     ["Settings"],
      summary:  "Update tenant settings & branding",
      security: [{ bearerAuth: [] }],
    },
  });

// ─── Share link routes ────────────────────────────────────────────────────────

export const shareLinkRoutes = new Elysia({ prefix: "/share-links" })

  // Public resolve — no auth
  .get("/resolve/:token", async ({ params, set }) => {
    try {
      return okRes(await ShareLinkService.resolveShareLink(params.token));
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ token: t.String() }),
    detail: {
      tags:    ["ShareLinks"],
      summary: "Resolve a public share link (no auth)",
    },
  })

  // Protected routes below
  .use(requireRole(Role.FLEET_MANAGER, Role.SUPER_ADMIN))

  .get("/", async ({ user, set }) => {
    try {
      return okRes(await ShareLinkService.listShareLinks(user));
    } catch (e) { return handleError(e, set); }
  }, {
    detail: {
      tags:     ["ShareLinks"],
      summary:  "List all share links",
      security: [{ bearerAuth: [] }],
    },
  })

  .post("/", async ({ user, body, set }) => {
    try {
      return okRes(await ShareLinkService.createShareLink(user, body as any));
    } catch (e) { return handleError(e, set); }
  }, {
    body: t.Object({
      tripId:    t.String(),
      label:     t.Optional(t.String()),
      expiresIn: t.Optional(t.Number()),
    }),
    detail: {
      tags:     ["ShareLinks"],
      summary:  "Create a public share link for a trip",
      security: [{ bearerAuth: [] }],
    },
  })

  .delete("/:id", async ({ user, params, set }) => {
    try {
      return okRes(await ShareLinkService.deleteShareLink(user, params.id));
    } catch (e) { return handleError(e, set); }
  }, {
    params: t.Object({ id: t.String() }),
    detail: {
      tags:     ["ShareLinks"],
      summary:  "Delete a share link",
      security: [{ bearerAuth: [] }],
    },
  });