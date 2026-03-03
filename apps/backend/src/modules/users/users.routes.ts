import Elysia from "elysia";
import { requireRole, authMiddleware } from "../../middleware/auth.middleware";
import * as UserService from "./users.service";
import { AppError } from "../../lib/errors";
import { ok as okRes } from "../../lib/response";
import {
  InviteUserBody,
  UpdateUserBody,
  ChangeRoleBody,
  AcceptInviteBody,
  ChangePasswordBody,
  UserListQuery,
  UserIdParam,
} from "./users.schema";
import { Role } from "@fleet/shared";
import { t } from "elysia";

// ─── Error handler ────────────────────────────────────────────────────────────

function handleError(e: unknown, set: any) {
  if (e instanceof AppError) {
    set.status = e.statusCode;
    return {
      success: false,
      error: { code: e.code, message: e.message, statusCode: e.statusCode },
    };
  }
  console.error("[UserRoute]", e);
  set.status = 500;
  return {
    success: false,
    error: { code: "INTERNAL", message: "Something went wrong", statusCode: 500 },
  };
}

// ─── Public routes (no auth) ──────────────────────────────────────────────────

export const userPublicRoutes = new Elysia({ prefix: "/users" })

  // POST /users/accept-invite — driver sets their password from invite link
  .post(
    "/accept-invite",
    async ({ body, set }) => {
      try {
        const user = await UserService.acceptInvite(body);
        return okRes(user);
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      body:   AcceptInviteBody,
      detail: {
        tags:    ["Users"],
        summary: "Accept invite and set password (public — no auth required)",
      },
    }
  );

// ─── Protected routes (Fleet Manager only) ────────────────────────────────────

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(requireRole(Role.FLEET_MANAGER, Role.SUPER_ADMIN))

  // GET /users/stats
  .get(
    "/stats",
    async ({ user, set }) => {
      try {
        const stats = await UserService.getTeamStats(user);
        return okRes(stats);
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      detail: {
        tags:    ["Users"],
        summary: "Get team stats (total, managers, drivers, active)",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // GET /users
  .get(
    "/",
    async ({ user, query, set }) => {
      try {
        return await UserService.listUsers(user, {
          page:     query.page,
          pageSize: query.pageSize,
          search:   query.search,
          role:     query.role as Role | undefined,
        });
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      query:  UserListQuery,
      detail: {
        tags:    ["Users"],
        summary: "List all team members",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // GET /users/:id
  .get(
    "/:id",
    async ({ user, params, set }) => {
      try {
        const found = await UserService.getUser(user, params.id);
        return okRes(found);
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      params: UserIdParam,
      detail: {
        tags:    ["Users"],
        summary: "Get user detail",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // POST /users/invite
  .post(
    "/invite",
    async ({ user, body, set }) => {
      try {
        const result = await UserService.inviteUser(user, {
          name:  body.name,
          email: body.email,
          role:  body.role as Role,
        });
        set.status = 201;
        return okRes(result);
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      body:   InviteUserBody,
      detail: {
        tags:    ["Users"],
        summary: "Invite a new team member (Fleet Manager or Driver)",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // PATCH /users/:id
  .patch(
    "/:id",
    async ({ user, params, body, set }) => {
      try {
        const updated = await UserService.updateUser(user, params.id, body);
        return okRes(updated);
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      params: UserIdParam,
      body:   UpdateUserBody,
      detail: {
        tags:    ["Users"],
        summary: "Update user name",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // PATCH /users/:id/role
  .patch(
    "/:id/role",
    async ({ user, params, body, set }) => {
      try {
        const updated = await UserService.changeRole(
          user,
          params.id,
          body.role as Role
        );
        return okRes(updated);
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      params: UserIdParam,
      body:   ChangeRoleBody,
      detail: {
        tags:    ["Users"],
        summary: "Change a user's role",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // DELETE /users/:id
  .delete(
    "/:id",
    async ({ user, params, set }) => {
      try {
        const result = await UserService.deleteUser(user, params.id);
        return okRes(result);
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      params: UserIdParam,
      detail: {
        tags:    ["Users"],
        summary: "Soft-delete a user (preserves trip history)",
        security: [{ bearerAuth: [] }],
      },
    }
  );

// ─── Self-service routes (any authenticated user) ─────────────────────────────

export const userSelfRoutes = new Elysia({ prefix: "/users" })
  .use(authMiddleware)

  // POST /users/me/change-password
  .post(
    "/me/change-password",
    async ({ user, body, set }) => {
      try {
        const result = await UserService.changePassword(user, body);
        return okRes(result);
      } catch (e) {
        return handleError(e, set);
      }
    },
    {
      body:   ChangePasswordBody,
      detail: {
        tags:    ["Users"],
        summary: "Change own password (any authenticated user)",
        security: [{ bearerAuth: [] }],
      },
    }
  );