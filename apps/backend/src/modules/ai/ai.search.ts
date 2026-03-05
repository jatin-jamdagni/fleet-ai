import { prisma } from "../../db/prisma";
import { getAILink } from "../../services/AILink";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RetrievedChunk {
  id:         string;
  content:    string;
  chunkIndex: number;
  similarity: number;
}

// ─── Semantic Search ──────────────────────────────────────────────────────────

export async function searchManualChunks(
  question:   string,
  vehicleId:  string,
  topK:       number = 5,
  threshold:  number = 0.3   // minimum similarity score
): Promise<RetrievedChunk[]> {
  const ai = getAILink();

  // 1. Embed the question
  const questionVector = await ai.embed(question);
  const vectorLiteral  = `[${questionVector.join(",")}]`;

  // 2. Cosine similarity search via pgvector <=> operator
  // Lower <=> value = more similar (cosine distance)
  const results = await prisma.$queryRaw<Array<{
    id:          string;
    content:     string;
    chunk_index: number;
    similarity:  number;
  }>>`
    SELECT
      id,
      content,
      "chunkIndex" AS chunk_index,
      1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM manual_chunks
    WHERE
      "vehicleId" = ${vehicleId}
      AND 1 - (embedding <=> ${vectorLiteral}::vector) > ${threshold}
    ORDER BY embedding <=> ${vectorLiteral}::vector
    LIMIT ${topK}
  `;

  return results.map((r) => ({
    id:         r.id,
    content:    r.content,
    chunkIndex: r.chunk_index,
    similarity: Number(r.similarity),
  }));
}

// ─── Check if vehicle has manual ─────────────────────────────────────────────

export async function vehicleHasManual(vehicleId: string): Promise<boolean> {
  const count = await prisma.manualChunk.count({ where: { vehicleId } });
  return count > 0;
}

// ─── Build RAG Prompt ─────────────────────────────────────────────────────────

export function buildRAGPrompt(
  question: string,
  chunks:   RetrievedChunk[],
  vehicleInfo: { make: string; model: string; year: number }
): { system: string; prompt: string } {
  const context = chunks
    .map((c, i) => `--- Section ${i + 1} (relevance: ${(c.similarity * 100).toFixed(0)}%) ---\n${c.content}`)
    .join("\n\n");

  const system = `You are an expert vehicle technician assistant for a ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}.

                    Your job is to answer driver questions clearly and accurately using ONLY the vehicle manual sections provided below.

                    Rules:
                    1. Answer ONLY from the provided manual sections — do not use outside knowledge
                    2. Be concise and practical — drivers need actionable answers
                    3. Use numbered steps for procedures
                    4. If the manual sections don't contain the answer, say so clearly
                    5. Never guess or make up procedures — safety is critical
                    6. Format your response for easy reading on a mobile screen`;

  const prompt = `VEHICLE MANUAL SECTIONS:
${context}

DRIVER QUESTION: ${question}

Provide a clear, practical answer based strictly on the manual sections above.`;

  return { system, prompt };
}
