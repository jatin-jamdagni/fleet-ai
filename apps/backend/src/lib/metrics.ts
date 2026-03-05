import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from "prom-client";

// ─── Registry ─────────────────────────────────────────────────────────────────

export const register = new Registry();
register.setDefaultLabels({ app: "fleet-ai" });
collectDefaultMetrics({ register });

// ─── Counters ─────────────────────────────────────────────────────────────────

export const httpRequestsTotal = new Counter({
  name:       "fleet_http_requests_total",
  help:       "Total HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers:  [register],
});

export const wsConnectionsTotal = new Counter({
  name:      "fleet_ws_connections_total",
  help:      "Total WebSocket connections established",
  registers: [register],
});

export const gpsPingsTotal = new Counter({
  name:      "fleet_gps_pings_total",
  help:      "Total GPS pings received",
  registers: [register],
});

export const tripsStartedTotal = new Counter({
  name:      "fleet_trips_started_total",
  help:      "Total trips started",
  registers: [register],
});

export const tripsEndedTotal = new Counter({
  name:       "fleet_trips_ended_total",
  help:       "Total trips ended",
  labelNames: ["reason"],  // completed | force_ended
  registers:  [register],
});

export const invoicesGeneratedTotal = new Counter({
  name:      "fleet_invoices_generated_total",
  help:      "Total invoices auto-generated",
  registers: [register],
});

export const aiQueriesTotal = new Counter({
  name:       "fleet_ai_queries_total",
  help:       "Total AI queries processed",
  labelNames: ["status"],  // success | error
  registers:  [register],
});

// ─── Gauges ───────────────────────────────────────────────────────────────────

export const activeTripsGauge = new Gauge({
  name:      "fleet_active_trips",
  help:      "Currently active trips",
  registers: [register],
});

export const wsConnectionsGauge = new Gauge({
  name:       "fleet_ws_connections_active",
  help:       "Active WebSocket connections",
  labelNames: ["role"],  // driver | manager
  registers:  [register],
});

// ─── Histograms ───────────────────────────────────────────────────────────────

export const httpDurationHistogram = new Histogram({
  name:       "fleet_http_duration_seconds",
  help:       "HTTP request duration in seconds",
  labelNames: ["method", "route"],
  buckets:    [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers:  [register],
});

export const gpsPingBatchDuration = new Histogram({
  name:    "fleet_gps_batch_write_seconds",
  help:    "Duration of GPS ping batch writes to PostgreSQL",
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register],
});

export const aiQueryDuration = new Histogram({
  name:    "fleet_ai_query_duration_seconds",
  help:    "Time to first token from AI provider",
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

// ─── Middleware helper ────────────────────────────────────────────────────────

export function recordHttpRequest(
  method:     string,
  route:      string,
  statusCode: number,
  durationMs: number
) {
  httpRequestsTotal.inc({ method, route, status_code: statusCode });
  httpDurationHistogram.observe(
    { method, route },
    durationMs / 1000
  );
}