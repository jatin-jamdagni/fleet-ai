import { prisma } from "../../db/prisma";
import { getAILink } from "../../services/AILink";
import { AppError } from "../../lib/errors";

// ─── Config ───────────────────────────────────────────────────────────────────

const CHUNK_SIZE     = 512;   // tokens approx (we use chars / 4 as proxy)
const CHUNK_OVERLAP  = 50;
const CHARS_PER_TOK  = 4;     // rough approximation
const CHUNK_CHARS    = CHUNK_SIZE   * CHARS_PER_TOK;  // 2048 chars
const OVERLAP_CHARS  = CHUNK_OVERLAP * CHARS_PER_TOK; // 200 chars
const BATCH_SIZE     = 5;     // embed N chunks in parallel

// ─── Text Extraction ──────────────────────────────────────────────────────────

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    await parser.destroy();
    return data.text;
  } catch (err) {
    throw new AppError(
      "PDF_PARSE_ERROR",
      "Failed to extract text from PDF. Ensure the file is a valid, text-based PDF.",
      422
    );
  }
}

// ─── Text Chunker ─────────────────────────────────────────────────────────────

export function chunkText(text: string): string[] {
  // Normalize whitespace
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")  // max double newline
    .replace(/\t/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();

  if (normalized.length === 0) return [];

  const chunks: string[] = [];
  let   start = 0;

  while (start < normalized.length) {
    let end = start + CHUNK_CHARS;

    if (end >= normalized.length) {
      // Last chunk
      chunks.push(normalized.slice(start).trim());
      break;
    }

    // Try to break at paragraph boundary
    let breakAt = normalized.lastIndexOf("\n\n", end);
    if (breakAt <= start + CHUNK_CHARS * 0.5) {
      // No paragraph break found — try sentence boundary
      breakAt = normalized.lastIndexOf(". ", end);
    }
    if (breakAt <= start + CHUNK_CHARS * 0.5) {
      // No sentence break — hard cut
      breakAt = end;
    }

    chunks.push(normalized.slice(start, breakAt).trim());
    start = breakAt - OVERLAP_CHARS; // overlap for context continuity
  }

  return chunks.filter((c) => c.length > 50); // skip tiny chunks
}

// ─── Ingestion Pipeline ───────────────────────────────────────────────────────

export interface IngestionResult {
  vehicleId:        string;
  chunksCreated:    number;
  processingTimeMs: number;
  textLength:       number;
  pageCount?:       number;
}

export async function ingestVehicleManual(
  vehicleId: string,
  tenantId:  string,
  pdfBuffer: Buffer,
  fileName:  string
): Promise<IngestionResult> {
  const startTime = Date.now();
  const ai        = getAILink();

  console.log(`[Ingest] Starting manual ingestion for vehicle ${vehicleId} — ${fileName}`);

  // 1. Check AI is available
  const available = await ai.isAvailable();
  if (!available) {
    throw new AppError(
      "AI_UNAVAILABLE",
      "AI service is not available. Ensure Ollama is running (dev) or Vertex is configured (prod).",
      503
    );
  }

  // 2. Extract text from PDF
  const rawText = await extractTextFromPDF(pdfBuffer);

  if (rawText.trim().length < 100) {
    throw new AppError(
      "PDF_TOO_SHORT",
      "PDF appears to be empty or image-based (scanned). Only text-based PDFs are supported.",
      422
    );
  }

  // 3. Delete existing chunks for this vehicle (re-ingest)
  const deleted = await prisma.manualChunk.deleteMany({ where: { vehicleId } });
  if (deleted.count > 0) {
    console.log(`[Ingest] Deleted ${deleted.count} existing chunks for vehicle ${vehicleId}`);
  }

  // 4. Chunk the text
  const chunks = chunkText(rawText);
  console.log(`[Ingest] Text length: ${rawText.length} chars → ${chunks.length} chunks`);

  if (chunks.length === 0) {
    throw new AppError("PDF_NO_CONTENT", "No usable text content found in PDF.", 422);
  }

  // 5. Embed + store in batches
  let chunksCreated = 0;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    // Embed all chunks in batch concurrently
    const embeddings = await Promise.all(
      batch.map((chunk) => ai.embed(chunk))
    );

    // Store each chunk with its embedding via raw SQL
    // (Prisma doesn't support vector type natively)
    for (const [j, content] of batch.entries()) {
      const chunkIndex = i + j;
      const embedding = embeddings[j];
      if (!embedding) {
        throw new AppError(
          "EMBEDDING_MISSING",
          `Missing embedding for chunk index ${chunkIndex}.`,
          500
        );
      }

      // Format as PostgreSQL vector literal
      const vectorLiteral = `[${embedding.join(",")}]`;

      await prisma.$executeRaw`
        INSERT INTO manual_chunks
          (id, "vehicleId", "tenantId", content, embedding, "chunkIndex", "createdAt")
        VALUES (
          ${crypto.randomUUID()},
          ${vehicleId},
          ${tenantId},
          ${content},
          ${vectorLiteral}::vector,
          ${chunkIndex},
          NOW()
        )
      `;

      chunksCreated++;
    }

    console.log(
      `[Ingest] Progress: ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length} chunks`
    );
  }

  // 6. Mark vehicle as having a manual
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data:  { hasManual: true },
  });

  const processingTimeMs = Date.now() - startTime;

  console.log(
    `[Ingest] ✅ Complete — ${chunksCreated} chunks in ${processingTimeMs}ms`
  );

  return {
    vehicleId,
    chunksCreated,
    processingTimeMs,
    textLength: rawText.length,
  };
}

// ─── Delete Manual ────────────────────────────────────────────────────────────

export async function deleteVehicleManual(
  vehicleId: string
): Promise<{ deleted: number }> {
  const result = await prisma.manualChunk.deleteMany({ where: { vehicleId } });

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data:  { hasManual: false },
  });

  return { deleted: result.count };
}
