import Elysia, { t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import * as AuthService from "./auth.service";
import { RegisterBody, LoginBody, RefreshBody } from "./auth.schema";
import { ok as okRes } from "../../lib/response";
import { AppError } from "../../lib/errors";
import { checkRateLimit, AUTH_RATE_LIMIT } from "../../lib/rate-limit";
import { Prisma } from "../../generated/prisma/client";

const REGISTER_RATE_LIMIT = { ...AUTH_RATE_LIMIT, keyPrefix: "auth-register" };
const LOGIN_RATE_LIMIT = { ...AUTH_RATE_LIMIT, max: 5, keyPrefix: "auth-login" };

function isDbUnavailableError(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P1001" || error.code === "P1002" || error.code === "ECONNREFUSED";
  }

  if (error instanceof Error) {
    return /ECONNREFUSED|Can't reach database server|timed out|P1001|P1002/i.test(
      error.message
    );
  }

  return false;
}

export const accessJwtPlugin = jwt({
  name: "accessJwt",
  secret: process.env.JWT_SECRET!,
  exp: "15m",
});

export const refreshJwtPlugin = jwt({
  name: "refreshJwt",
  secret: process.env.JWT_REFRESH_SECRET!,
  exp: "7d",
});

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(accessJwtPlugin)
  .use(refreshJwtPlugin)
  .use(bearer())

  // ── POST /auth/register ─────────────────────────────────────────────────────
  .post(
    "/register",
    async ({ body, accessJwt, refreshJwt, set, request }) => {
      // Rate limit by IP
      const ip = request.headers.get("x-forwarded-for") ?? "unknown";
      const rl = checkRateLimit(ip, REGISTER_RATE_LIMIT);
      if (!rl.allowed) {
        set.status = 429;
        return {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please wait a minute and try again.",
            statusCode: 429,
          },
        };
      }

      try {
        const result = await AuthService.register(body, accessJwt, refreshJwt);
        set.status = 201;
        return okRes(result);
      } catch (e) {
        if (e instanceof AppError) {
          set.status = e.statusCode;
          return {
            success: false,
            error: { code: e.code, message: e.message, statusCode: e.statusCode },
          };
        }
        console.error("[Auth.register] Unexpected error:", e);
        if (isDbUnavailableError(e)) {
          set.status = 503;
          return {
            success: false,
            error: {
              code: "DATABASE_UNAVAILABLE",
              message: "Database connection failed. Please try again.",
              statusCode: 503,
            },
          };
        }
        set.status = 500;
        return {
          success: false,
          error: { code: "INTERNAL", message: "Registration failed", statusCode: 500 },
        };
      }
    },
    {
      body: RegisterBody,
      detail: { tags: ["Auth"], summary: "Register new organisation + Fleet Manager" },
    }
  )

  // ── POST /auth/login ────────────────────────────────────────────────────────
  .post(
    "/login",
    async ({ body, accessJwt, refreshJwt, set, request }) => {
      // Rate limit by IP — stricter on login (brute force protection)
      const ip = request.headers.get("x-forwarded-for") ?? "unknown";
      const rl = checkRateLimit(ip, LOGIN_RATE_LIMIT);
      if (!rl.allowed) {
        set.status = 429;
        return {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many login attempts. Please wait a minute.",
            statusCode: 429,
          },
        };
      }

      try {
        const result = await AuthService.login(body, accessJwt, refreshJwt);
        return okRes(result);
      } catch (e) {
        if (e instanceof AppError) {
          set.status = e.statusCode;
          return {
            success: false,
            error: { code: e.code, message: e.message, statusCode: e.statusCode },
          };
        }
        console.error("[Auth.login] Unexpected error:", e);
        if (isDbUnavailableError(e)) {
          set.status = 503;
          return {
            success: false,
            error: {
              code: "DATABASE_UNAVAILABLE",
              message: "Database connection failed. Please try again.",
              statusCode: 503,
            },
          };
        }
        set.status = 500;
        return {
          success: false,
          error: { code: "INTERNAL", message: "Login failed", statusCode: 500 },
        };
      }
    },
    {
      body: LoginBody,
      detail: { tags: ["Auth"], summary: "Login — returns JWT pair" },
    }
  )

  // ── POST /auth/refresh ──────────────────────────────────────────────────────
  .post(
    "/refresh",
    async ({ body, accessJwt, refreshJwt, set }) => {
      try {
        const tokens = await AuthService.refreshTokens(
          body.refreshToken,
          accessJwt,
          refreshJwt
        );
        return okRes(tokens);
      } catch (e) {
        if (e instanceof AppError) {
          set.status = e.statusCode;
          return {
            success: false,
            error: { code: e.code, message: e.message, statusCode: e.statusCode },
          };
        }
        set.status = 401;
        return {
          success: false,
          error: { code: "TOKEN_INVALID", message: "Invalid refresh token", statusCode: 401 },
        };
      }
    },
    {
      body: RefreshBody,
      detail: { tags: ["Auth"], summary: "Refresh access token" },
    }
  )

  // ── POST /auth/logout ───────────────────────────────────────────────────────
  .post(
    "/logout",
    async ({ bearer: token, accessJwt, set }) => {
      try {
        if (!token) {
          set.status = 401;
          return {
            success: false,
            error: { code: "UNAUTHORIZED", message: "No token", statusCode: 401 },
          };
        }
        const payload = await accessJwt.verify(token);
        if (!payload) {
          set.status = 401;
          return {
            success: false,
            error: { code: "TOKEN_INVALID", message: "Invalid token", statusCode: 401 },
          };
        }
        await AuthService.logout(payload.userId as string);
        return okRes({ message: "Logged out successfully" });
      } catch {
        set.status = 500;
        return {
          success: false,
          error: { code: "INTERNAL", message: "Logout failed", statusCode: 500 },
        };
      }
    },
    {
      detail: { tags: ["Auth"], summary: "Logout — revokes all sessions" },
    }
  )

  // ── GET /auth/me ────────────────────────────────────────────────────────────
  .get(
    "/me",
    async ({ bearer: token, accessJwt, set }) => {
      try {
        if (!token) {
          set.status = 401;
          return {
            success: false,
            error: { code: "UNAUTHORIZED", message: "No token", statusCode: 401 },
          };
        }
        const payload = await accessJwt.verify(token);
        if (!payload) {
          set.status = 401;
          return {
            success: false,
            error: { code: "TOKEN_INVALID", message: "Invalid token", statusCode: 401 },
          };
        }
        const user = await AuthService.getMe(payload.userId as string);
        return okRes(user);
      } catch (e) {
        if (e instanceof AppError) {
          set.status = e.statusCode;
          return {
            success: false,
            error: { code: e.code, message: e.message, statusCode: e.statusCode },
          };
        }
        console.error("[Auth.me] Unexpected error:", e);
        set.status = 500;
        return {
          success: false,
          error: { code: "INTERNAL", message: "Failed to fetch user", statusCode: 500 },
        };
      }
    },
    {
      detail: { tags: ["Auth"], summary: "Get current user" },
    }
  );
