import Elysia from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { Errors } from "../lib/errors";
import type { Role } from "@fleet/shared";

// Reusable auth plugin — inject into any route group that needs protection
export const authMiddleware = new Elysia({ name: "auth-middleware" })
  .use(
    jwt({
      name: "accessJwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .use(bearer())
  .derive({ as: "scoped" }, async ({ bearer: token, accessJwt, set }) => {
    if (!token) {
      set.status = 401;
      throw Errors.UNAUTHORIZED;
    }

    const payload = await accessJwt.verify(token);

    if (!payload || payload.type !== "access") {
      set.status = 401;
      throw Errors.TOKEN_INVALID;
    }

    return {
      user: {
        userId: payload.userId as string,
        tenantId: payload.tenantId as string,
        role: payload.role as Role,
        email: payload.email as string,
      },
    };
  });

// Role guard helper
export function requireRole(...roles: Role[]) {
  return new Elysia({ name: `require-role-${roles.join("-")}` })
    .use(authMiddleware)
    .derive({ as: "scoped" }, ({ user, set }) => {
      if (!roles.includes(user?.role!)) {
        set.status = 403;
        throw Errors.FORBIDDEN;
      }
      return {};
    });
}