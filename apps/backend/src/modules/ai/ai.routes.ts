import Elysia, { t } from "elysia";
import { requireRole, authMiddleware } from "../../middleware/auth.middleware";
import * as AIService from "./ai.service";
import { AppError } from "../../lib/errors";
import { ok as okRes } from "../../lib/response";
import {
  AskQuestionBody,
  AILogListQuery,
  VehicleManualParam,
} from "./ai.schema";
import { Role } from "@fleet/shared";

function handleError(e: unknown, set: any) {
  if (e instanceof AppError) {
    set.status = e.statusCode;
    return {
      success: false,
      error: { code: e.code, message: e.message, statusCode: e.statusCode },
    };
  }
  console.error("[AIRoute]", e);
  set.status = 500;
  return {
    success: false,
    error: { code: "INTERNAL", message: "Something went wrong", statusCode: 500 },
  };
}

// ─── Health Route (public) ────────────────────────────────────────────────────

export const aiHealthRoutes = new Elysia({ prefix: "/ai" })
  .get(
    "/health",
    async () => {
      const health = await AIService.checkAIHealth();
      return okRes(health);
    },
    {
      detail: {
        tags:    ["AI"],
        summary: "Check AI service availability (Ollama/Vertex)",
      },
    }
  );

// ─── Driver Routes ────────────────────────────────────────────────────────────

export const aiDriverRoutes = new Elysia({ prefix: "/ai" })
  .use(authMiddleware)  // both DRIVER and FLEET_MANAGER can ask questions

  // POST /ai/ask — SSE streaming response
  .post(
    "/ask",
    async ({ user, body, set }) => {
      // Set SSE headers
      set.headers["Content-Type"]  = "text/event-stream";
      set.headers["Cache-Control"] = "no-cache";
      set.headers["Connection"]    = "keep-alive";
      set.headers["X-Accel-Buffering"] = "no"; // disable nginx buffering

      // Return a ReadableStream for SSE
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          function send(data: string) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ token: data })}\n\n`)
            );
          }

          function sendEvent(event: string, data: object) {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          }

          try {
            // Send start event
            sendEvent("start", {
              vehicleId: body.vehicleId,
              question:  body.question,
            });

            // Stream tokens
            for await (const token of AIService.askQuestion(
              user,
              body.question,
              body.vehicleId
            )) {
              send(token);
            }

            // Send done event
            sendEvent("done", { finished: true });
          } catch (err) {
            const msg = err instanceof AppError
              ? err.message
              : "An error occurred while generating the answer";

            sendEvent("error", { message: msg });
          } finally {
            controller.close();
          }
        },
      });

      return stream;
    },
    {
      body:   AskQuestionBody,
      detail: {
        tags:    ["AI"],
        summary: "Ask a question about vehicle manual — streams answer via SSE",
        description: `
SSE stream format:
- event: start  → { vehicleId, question }
- data: ...     → { token: "..." } (streamed tokens)
- event: done   → { finished: true }
- event: error  → { message: "..." }
        `,
        security: [{ bearerAuth: [] }],
      },
    }
  );

// ─── Fleet Manager Routes ─────────────────────────────────────────────────────

export const aiManagerRoutes = new Elysia({ prefix: "/ai" })
  .use(requireRole(Role.FLEET_MANAGER, Role.SUPER_ADMIN))

  // GET /ai/logs — AI interaction history
  .get(
    "/logs",
    async ({ user, query, set }) => {
      try {
        return await AIService.listAILogs(user, query);
      } catch (e) { return handleError(e, set); }
    },
    {
      query:  AILogListQuery,
      detail: {
        tags:    ["AI"],
        summary: "List AI interaction logs",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // POST /ai/vehicles/:vehicleId/manual — Upload PDF manual
  .post(
    "/vehicles/:vehicleId/manual",
    async ({ user, params, request, set }) => {
      try {
        const formData = await request.formData();
        const file     = formData.get("manual") as File | null;

        if (!file) {
          set.status = 422;
          return {
            success: false,
            error: {
              code:       "MISSING_FILE",
              message:    "No file uploaded. Send a PDF as 'manual' in multipart form.",
              statusCode: 422,
            },
          };
        }

        if (!file.name.toLowerCase().endsWith(".pdf")) {
          set.status = 422;
          return {
            success: false,
            error: {
              code:       "INVALID_FILE_TYPE",
              message:    "Only PDF files are supported.",
              statusCode: 422,
            },
          };
        }

        // 50MB max
        const MAX_SIZE = 50 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
          set.status = 422;
          return {
            success: false,
            error: {
              code:       "FILE_TOO_LARGE",
              message:    "PDF must be under 50MB.",
              statusCode: 422,
            },
          };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await AIService.uploadManual(
          user,
          params.vehicleId,
          buffer,
          file.name
        );

        set.status = 201;
        return okRes(result);
      } catch (e) { return handleError(e, set); }
    },
    {
      params: VehicleManualParam,
      detail: {
        tags:    ["AI"],
        summary: "Upload vehicle manual PDF — triggers chunking + embedding",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // DELETE /ai/vehicles/:vehicleId/manual — Remove manual
  .delete(
    "/vehicles/:vehicleId/manual",
    async ({ user, params, set }) => {
      try {
        const result = await AIService.deleteManual(user, params.vehicleId);
        return okRes(result);
      } catch (e) { return handleError(e, set); }
    },
    {
      params: VehicleManualParam,
      detail: {
        tags:    ["AI"],
        summary: "Delete vehicle manual and all embeddings",
        security: [{ bearerAuth: [] }],
      },
    }
  );