import { prisma } from "../../db/prisma";
import { fleetStore } from "./ws.store";
import type { GpsPingPayload } from "@fleet/shared";

// ─── Write a batch of pings for a single trip ─────────────────────────────────

export async function writePingBatch(
  tripId: string,
  pings: GpsPingPayload[]
): Promise<number> {
  if (pings.length === 0) return 0;

  try {
    // Bulk insert — PostGIS trigger auto-populates the geometry column
    await prisma.gpsPing.createMany({
      data: pings.map((p) => ({
        tripId:    p.tripId,
        lat:       p.lat,
        lng:       p.lng,
        speed:     p.speed,
        heading:   p.heading,
        timestamp: new Date(p.timestamp),
      })),
      skipDuplicates: true,
    });

    return pings.length;
  } catch (err) {
    console.error(`[BatchWriter] Failed to write ${pings.length} pings for trip ${tripId}:`, err);
    return 0;
  }
}

// ─── Flush ALL pending pings to DB ────────────────────────────────────────────

export async function flushAllPendingPings(): Promise<void> {
  const allPings = fleetStore.flushAllPings();

  if (allPings.size === 0) return;

  let totalWritten = 0;
  const promises   = [];

  for (const [tripId, pings] of allPings.entries()) {
    promises.push(
      writePingBatch(tripId, pings).then((n) => {
        totalWritten += n;
      })
    );
  }

  await Promise.all(promises);

  if (totalWritten > 0) {
    console.log(
      `[BatchWriter] Flushed ${totalWritten} pings across ${allPings.size} trips`
    );
  }
}

// ─── Flush pings for a single trip (called on trip end) ───────────────────────

export async function flushTripPings(tripId: string): Promise<number> {
  const pings = fleetStore.flushPings(tripId);
  return writePingBatch(tripId, pings);
}

// ─── Start the 30-second batch interval ──────────────────────────────────────

let batchInterval: ReturnType<typeof setInterval> | null = null;

export function startBatchWriter() {
  if (batchInterval) return; // already running

  batchInterval = setInterval(async () => {
    await flushAllPendingPings();
  }, 30_000); // every 30 seconds

  console.log("✅ GPS batch writer started (30s interval)");
}

export function stopBatchWriter() {
  if (batchInterval) {
    clearInterval(batchInterval);
    batchInterval = null;
  }
}