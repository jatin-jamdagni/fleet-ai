import {
  gpsPingsTotal,
  gpsPingBatchDuration,
  activeTripsGauge,
} from "../../lib/metrics";

export function recordGpsBatchWrite(pingsCount: number, elapsedMs: number) {
  gpsPingsTotal.inc(pingsCount);
  gpsPingBatchDuration.observe(elapsedMs / 1000);
}

export function onTripStarted() {
  activeTripsGauge.inc();
}

export function onTripEnded() {
  // Avoid hard failures if the gauge would otherwise underflow during dev resets.
  try {
    activeTripsGauge.dec();
  } catch {
    // no-op
  }
}
