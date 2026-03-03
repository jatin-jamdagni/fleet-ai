export interface AskQuestionRequest {
  question: string;
  vehicleId: string;
}

export interface ManualChunk {
  id: string;
  vehicleId: string;
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
}

export interface AILogEntry {
  id: string;
  tenantId: string;
  driverId: string;
  vehicleId: string;
  question: string;
  answer: string;
  latencyMs: number;
  createdAt: string;
}

export interface ManualIngestionResponse {
  vehicleId: string;
  chunksCreated: number;
  processingTimeMs: number;
}