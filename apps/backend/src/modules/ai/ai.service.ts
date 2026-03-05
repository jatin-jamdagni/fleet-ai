import { prisma } from "../../db/prisma";
import { Errors, AppError } from "../../lib/errors";
import { injectTenantContext } from "../../middleware/auth.middleware";
import { paginate } from "../../lib/response";
import { getAILink } from "../../services/AILink";
import { searchManualChunks, vehicleHasManual, buildRAGPrompt } from "./ai.search";
import { ingestVehicleManual, deleteVehicleManual } from "./ai.ingest";
import type { UserContext } from "../../types/context";
import { Role } from "@fleet/shared";
import { enforceLimit, incrementUsage } from "../saas/saas.usage";

// ─── Ask Question — Full RAG Pipeline ────────────────────────────────────────

export async function* askQuestion(
  user: UserContext,
  question: string,
  vehicleId: string
): AsyncGenerator<string, void, unknown> {

  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
  await enforceLimit(user.tenantId, (tenant?.plan ?? "TRIAL") as any, "ai_query");


  const startTime = Date.now();
  const ai = getAILink();

  // 1. Verify driver is assigned to this vehicle
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      tenantId: user.tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      hasManual: true,
      assignedDriverId: true,
    },
  });

  if (!vehicle) throw Errors.NOT_FOUND("Vehicle");

  // Drivers can only ask about their assigned vehicle
  if (user.role === Role.DRIVER && vehicle.assignedDriverId !== user.userId) {
    throw new AppError(
      "VEHICLE_NOT_ASSIGNED",
      "You can only ask questions about your assigned vehicle.",
      403
    );
  }

  // 2. Check AI availability
  const available = await ai.isAvailable();
  if (!available) {
    yield "⚠️ AI assistant is currently unavailable. Please try again in a moment.";
    return;
  }

  // 3. Check if manual exists
  const hasManual = await vehicleHasManual(vehicleId);

  if (!hasManual) {
    yield `No vehicle manual has been uploaded for your ${vehicle.year} ${vehicle.make} ${vehicle.model}. `;
    yield "Please contact your Fleet Manager to upload the vehicle manual.";
    return;
  }

  // 4. Semantic search — find relevant manual sections
  let chunks;
  try {
    chunks = await searchManualChunks(question, vehicleId, 5, 0.3);
  } catch (err) {
    console.error("[AI] Search failed:", err);
    yield "Failed to search the vehicle manual. Please try again.";
    return;
  }

  if (chunks.length === 0) {
    yield `I couldn't find relevant information in the ${vehicle.make} ${vehicle.model} manual for your question. `;
    yield "Try rephrasing your question or contact your Fleet Manager for assistance.";

    // Log the failed search
    await prisma.aILog.create({
      data: {
        tenantId: user.tenantId,
        driverId: user.userId,
        vehicleId,
        question,
        retrievedChunks: [],
        answer: "No relevant chunks found",
        latencyMs: Date.now() - startTime,
      },
    });

    return;
  }

  // 5. Build RAG prompt
  const { system, prompt } = buildRAGPrompt(question, chunks, {
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
  });

  // 6. Stream answer
  let fullAnswer = "";

  try {
    for await (const token of ai.chat(prompt, system)) {
      fullAnswer += token;
      yield token;
    }
  } catch (err) {
    console.error("[AI] Streaming failed:", err);
    yield "\n\n⚠️ Response was interrupted. Please try again.";
  }

  // 7. Log interaction asynchronously
  const latencyMs = Date.now() - startTime;

  prisma.aILog.create({
    data: {
      tenantId: user.tenantId,
      driverId: user.userId,
      vehicleId,
      question,
      retrievedChunks: chunks.map((c) => ({
        id: c.id,
        chunkIndex: c.chunkIndex,
        similarity: c.similarity,
        preview: c.content.slice(0, 100),
      })),
      answer: fullAnswer,
      latencyMs,
    },
  }).catch((err) => console.error("[AI] Failed to log interaction:", err));

  console.log(
    `[AI] Question answered | Vehicle: ${vehicleId} | Chunks: ${chunks.length} | Latency: ${latencyMs}ms`
  );
}

// ─── Upload Vehicle Manual ────────────────────────────────────────────────────

export async function uploadManual(
  user: UserContext,
  vehicleId: string,
  pdfBuffer: Buffer,
  fileName: string
) {
  return injectTenantContext(user, async () => {
    // Verify vehicle belongs to tenant
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!vehicle) throw Errors.NOT_FOUND("Vehicle");

    return ingestVehicleManual(vehicleId, user.tenantId, pdfBuffer, fileName);
  });
}

// ─── Delete Vehicle Manual ────────────────────────────────────────────────────

export async function deleteManual(user: UserContext, vehicleId: string) {
  return injectTenantContext(user, async () => {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!vehicle) throw Errors.NOT_FOUND("Vehicle");

    return deleteVehicleManual(vehicleId);
  });
}

// ─── List AI Logs ─────────────────────────────────────────────────────────────

export async function listAILogs(
  user: UserContext,
  input: {
    page?: number;
    pageSize?: number;
    vehicleId?: string;
    driverId?: string;
    from?: string;
    to?: string;
  }
) {
  return injectTenantContext(user, async () => {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, input.pageSize ?? 20);
    const skip = (page - 1) * pageSize;

    const where: any = { tenantId: user.tenantId };

    if (input.vehicleId) where.vehicleId = input.vehicleId;
    if (input.driverId) where.driverId = input.driverId;

    if (input.from || input.to) {
      where.createdAt = {};
      if (input.from) where.createdAt.gte = new Date(input.from);
      if (input.to) where.createdAt.lte = new Date(input.to);
    }

    const [logs, total] = await Promise.all([
      prisma.aILog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          vehicleId: true,
          driverId: true,
          question: true,
          answer: true,
          latencyMs: true,
          createdAt: true,
          driver: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.aILog.count({ where }),
    ]);

    return paginate(logs, total, page, pageSize);
  });
}

// ─── AI Health Check ──────────────────────────────────────────────────────────

export async function checkAIHealth() {
  const ai = getAILink();
  const available = await ai.isAvailable();

  let embedTest = false;
  let chatTest = false;

  if (available) {
    try {
      const vec = await ai.embed("test");
      embedTest = vec.length > 0;
    } catch { /* noop */ }

    try {
      const gen = ai.chat("Say OK");
      const { value } = await gen.next();
      chatTest = Boolean(value);
    } catch { /* noop */ }
  }

  return {
    provider: process.env.AI_PROVIDER ?? "ollama",
    available,
    embedTest,
    chatTest,
  };
}