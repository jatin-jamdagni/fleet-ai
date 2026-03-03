import Elysia from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { Errors } from "../lib/errors";
import { runWithTenant } from "../lib/async-context";
import type { Role } from "@fleet/shared";
import type { UserContext } from "../types/context";

// ─── Core Auth Plugin ─────────────────────────────────────────────────────────
// Use this on any route group that needs authentication
//
// Usage:
//   new Elysia().use(authMiddleware).get("/protected", ({ user }) => user)

export const authMiddleware = new Elysia({ name: "auth-middleware" })
  .use(
    jwt({
      name: "accessJwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .use(bearer())
  .derive({ as: "scoped" }, async ({ bearer: token, accessJwt, set, request }) => {
    if (!token) {
      set.status = 401;
      return { user: null as unknown as UserContext };
    }

    const payload = await accessJwt.verify(token);

    if (!payload || payload.type !== "access") {
      set.status = 401;
      return { user: null as unknown as UserContext };
    }

    const user: UserContext = {
      userId: payload.userId as string,
      tenantId: payload.tenantId as string,
      role: payload.role as Role,
      email: payload.email as string,
    };

    return { user };
  })
  // Guard: if user is null after derive, block the request
  .onBeforeHandle({ as: "scoped" }, ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
          statusCode: 401,
        },
      };
    }
  });

// ─── Role Guard Plugin ────────────────────────────────────────────────────────
// Usage:
//   new Elysia()
//     .use(requireRole("FLEET_MANAGER"))
//     .get("/manager-only", ({ user }) => user)

export function requireRole(...allowedRoles: Role[]) {
  return new Elysia({ name: `require-${allowedRoles.join("|")}` })
    .use(authMiddleware)
    .onBeforeHandle({ as: "scoped" }, ({ user, set }) => {
      if (!user || !allowedRoles.includes(user.role)) {
        set.status = 403;
        return {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: `This action requires one of: ${allowedRoles.join(", ")}`,
            statusCode: 403,
          },
        };
      }
    });
}

// ─── Tenant Context Injector ──────────────────────────────────────────────────
// Wraps the route handler in AsyncLocalStorage so DB queries are auto-scoped
// Usage: wrap your route handler with injectTenantContext(user, handler)

export async function injectTenantContext<T>(
  user: UserContext,
  fn: () => Promise<T>
): Promise<T> {
  return runWithTenant(
    { tenantId: user.tenantId, userId: user.userId, role: user.role },
    fn
  );
}