export const JWT_ACCESS_EXPIRY = "15m";
export const JWT_REFRESH_EXPIRY = "7d";
export const GPS_PING_INTERVAL_MS = 3000;
export const GPS_BATCH_INTERVAL_MS = 30000;
export const WS_HEARTBEAT_INTERVAL_MS = 10000;
export const WS_RECONNECT_MAX_MS = 30000;
export const VECTOR_DIMENSIONS = 768;
export const CHUNK_SIZE_TOKENS = 512;
export const CHUNK_OVERLAP_TOKENS = 50;
export const MAX_RAG_CHUNKS = 5;

export const API_BASE = "/api/v1";

export const PLAN_LIMITS = {
  STARTER: { vehicles: 10, drivers: 20 },
  PROFESSIONAL: { vehicles: 50, drivers: 100 },
  ENTERPRISE: { vehicles: Infinity, drivers: Infinity },
} as const;