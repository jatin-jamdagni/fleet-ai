import Elysia, { t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import * as AuthService from "./auth.service";
import { RegisterBody, LoginBody, RefreshBody } from "./auth.schema";
import { ok as okRes } from "../../lib/response";
import { AppError } from "../../lib/errors";

// ─── JWT Plugin ──────────────────────────────────────────────────────────────

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

// ─── Auth Routes ─────────────────────────────────────────────────────────────

export const authRoutes = new Elysia({ prefix: "/auth" })
    .use(accessJwtPlugin)
    .use(refreshJwtPlugin)
    .use(bearer())

    // ── POST /auth/register ─────────────────────────────────────────────────────
    .post(
        "/register",
        async ({ body, accessJwt, refreshJwt, set }) => {
            try {
                const result = await AuthService.register(body, accessJwt, refreshJwt);
                set.status = 201;
                return okRes(result);
            } catch (e) {
                if (e instanceof AppError) {
                    set.status = e.statusCode;
                    return { success: false, error: { code: e.code, message: e.message, statusCode: e.statusCode } };
                }
                set.status = 500;
                return { success: false, error: { code: "INTERNAL", message: "Registration failed", statusCode: 500 } };
            }
        },
        {
            body: RegisterBody,
            detail: {
                tags: ["Auth"],
                summary: "Register new organisation + Fleet Manager",
            },
        }
    )

    // ── POST /auth/login ────────────────────────────────────────────────────────
    .post(
        "/login",
        async ({ body, accessJwt, refreshJwt, set }) => {
            try {
                const result = await AuthService.login(body, accessJwt, refreshJwt);
                return okRes(result);
            } catch (e) {
                if (e instanceof AppError) {
                    set.status = e.statusCode;
                    return { success: false, error: { code: e.code, message: e.message, statusCode: e.statusCode } };
                }
                set.status = 500;
                return { success: false, error: { code: "INTERNAL", message: "Login failed", statusCode: 500 } };
            }
        },
        {
            body: LoginBody,
            detail: {
                tags: ["Auth"],
                summary: "Login with email + password",
            },
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
                    return { success: false, error: { code: e.code, message: e.message, statusCode: e.statusCode } };
                }
                set.status = 401;
                return { success: false, error: { code: "TOKEN_INVALID", message: "Invalid refresh token", statusCode: 401 } };
            }
        },
        {
            body: RefreshBody,
            detail: {
                tags: ["Auth"],
                summary: "Refresh access token using refresh token",
            },
        }
    )

    // ── POST /auth/logout ───────────────────────────────────────────────────────
    .post(
        "/logout",
        async ({ bearer: token, accessJwt, set }) => {
            try {
                if (!token) {
                    set.status = 401;
                    return { success: false, error: { code: "UNAUTHORIZED", message: "No token provided", statusCode: 401 } };
                }
                const payload = await accessJwt.verify(token);
                if (!payload) {
                    set.status = 401;
                    return { success: false, error: { code: "TOKEN_INVALID", message: "Invalid token", statusCode: 401 } };
                }
                await AuthService.logout(payload.userId as string);
                return okRes({ message: "Logged out successfully" });
            } catch (e) {
                set.status = 500;
                return { success: false, error: { code: "INTERNAL", message: "Logout failed", statusCode: 500 } };
            }
        },
        {
            detail: {
                tags: ["Auth"],
                summary: "Logout — revokes all refresh tokens",
                security: [{ bearerAuth: [] }],
            },
        }
    )

    // ── GET /auth/me ────────────────────────────────────────────────────────────
    .get(
        "/me",
        async ({ bearer: token, accessJwt, set }) => {
            try {
                if (!token) {
                    set.status = 401;
                    return { success: false, error: { code: "UNAUTHORIZED", message: "No token provided", statusCode: 401 } };
                }
                const payload = await accessJwt.verify(token);
                if (!payload) {
                    set.status = 401;
                    return { success: false, error: { code: "TOKEN_INVALID", message: "Invalid token", statusCode: 401 } };
                }
                const user = await AuthService.getMe(payload.userId as string);
                return okRes(user);
            } catch (e) {
                if (e instanceof AppError) {
                    set.status = e.statusCode;
                    return { success: false, error: { code: e.code, message: e.message, statusCode: e.statusCode } };
                }
                set.status = 500;
                return { success: false, error: { code: "INTERNAL", message: "Failed to fetch user", statusCode: 500 } };
            }
        },
        {
            detail: {
                tags: ["Auth"],
                summary: "Get current authenticated user",
                security: [{ bearerAuth: [] }],
            },
        }
    );