import Elysia, { t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { fleetStore } from "./ws.store";
import { broadcastToManagers, sendFleetSnapshot } from "./ws.broadcast";
import { processGpsPing, registerDriverConnection } from "./ws.gps";
import { flushTripPings } from "./ws.batch";
import { Role } from "@fleet/shared";
import { wsConnectionsGauge, wsConnectionsTotal } from "../../lib/metrics";

// Heartbeat interval — 10 seconds
const HEARTBEAT_INTERVAL_MS = 10_000;

type WsAuthData = {
  userId: string;
  tenantId: string;
  role: string;
  email?: string;
};

let lastMissingAuthLogAt = 0;
const MISSING_AUTH_LOG_INTERVAL_MS = 15_000;

function getWsAuthData(ws: any): WsAuthData | null {
  const data = ws?.data as Partial<WsAuthData> | undefined;
  if (!data) return null;

  if (
    typeof data.userId !== "string" ||
    typeof data.tenantId !== "string" ||
    typeof data.role !== "string"
  ) {
    return null;
  }

  return data as WsAuthData;
}

function closeUnauthorizedSocket(ws: any) {
  try {
    ws.close(1008, "Unauthorized");
  } catch {
    try { ws.close(); } catch { /* no-op */ }
  }
}

function readAuthorizationHeader(headers: any): string {
  if (!headers) return "";
  if (typeof headers.authorization === "string") return headers.authorization;
  if (typeof headers.get === "function") {
    return headers.get("authorization") ?? "";
  }
  return "";
}

function logMissingAuthContext() {
  const now = Date.now();
  if (now - lastMissingAuthLogAt < MISSING_AUTH_LOG_INTERVAL_MS) {
    return;
  }
  lastMissingAuthLogAt = now;
  console.warn("[WS] Connection rejected: missing auth context");
}

export const wsHandler = new Elysia({ prefix: "/ws" })
  .use(
    jwt({
      name:   "accessJwt",
      secret: process.env.JWT_SECRET!,
    })
  )

  .ws("/", {
    // ── Schema ────────────────────────────────────────────────────────────────
    body: t.Object({
      type:    t.String(),
      payload: t.Optional(t.Any()),
    }),

    // ── Upgrade — validate JWT before accepting connection ────────────────────
    async upgrade({ query, headers, accessJwt, set }: any) {
      const queryToken = typeof query?.token === "string" ? query.token : "";
      const authHeader = readAuthorizationHeader(headers);
      const headerToken = authHeader.replace(/^Bearer\s+/i, "");
      const token = queryToken || headerToken;

      if (!token) {
        set.status = 401;
        return;
      }

      const payload = await accessJwt.verify(token);
      if (!payload) {
        set.status = 401;
        return;
      }

      return {
        data: {
          userId:   payload.userId as string,
          tenantId: payload.tenantId as string,
          role:     payload.role as string,
          email:    payload.email as string,
        },
      };
    },

    // ── On Open ───────────────────────────────────────────────────────────────
    async open(ws) {
      const auth = getWsAuthData(ws);
      if (!auth) {
        logMissingAuthContext();
        closeUnauthorizedSocket(ws);
        return;
      }

      const { userId, tenantId, role } = auth;

      if (
        role !== Role.DRIVER &&
        role !== Role.FLEET_MANAGER &&
        role !== Role.SUPER_ADMIN
      ) {
        console.warn(`[WS] Connection rejected: unsupported role "${role}" | User: ${userId}`);
        closeUnauthorizedSocket(ws);
        return;
      }

      const roleLabel = role === Role.DRIVER ? "driver" : "manager";

      console.log(`[WS] Connection opened | Role: ${role} | User: ${userId}`);
      wsConnectionsTotal.inc();
      wsConnectionsGauge.inc({ role: roleLabel });

      if (role === Role.FLEET_MANAGER || role === Role.SUPER_ADMIN) {
        // Register manager
        fleetStore.addManager({
          ws,
          userId,
          tenantId,
          connectedAt: new Date(),
          lastPongAt:  new Date(),
        });

        // Send current fleet snapshot immediately
        sendFleetSnapshot(tenantId, ws);

        // Send connection ack
        ws.send(JSON.stringify({
          type:    "CONNECTED",
          payload: {
            role:           "MANAGER",
            activeVehicles: fleetStore.getAllVehicleStates(tenantId).length,
            timestamp:      new Date().toISOString(),
          },
        }));

      } else if (role === Role.DRIVER) {
        // Driver must send REGISTER message first with tripId
        ws.send(JSON.stringify({
          type:    "CONNECTED",
          payload: {
            role:      "DRIVER",
            message:   "Send REGISTER with your tripId to begin GPS streaming",
            timestamp: new Date().toISOString(),
          },
        }));
      }

      // Start heartbeat
      const heartbeat = setInterval(() => {
        try {
          ws.send(JSON.stringify({ type: "PING" }));
        } catch {
          clearInterval(heartbeat);
        }
      }, HEARTBEAT_INTERVAL_MS);

      // Store heartbeat ref so we can clear it on close
      (ws as any)._heartbeat = heartbeat;
    },

    // ── On Message ────────────────────────────────────────────────────────────
    async message(ws, raw) {
      const auth = getWsAuthData(ws);
      if (!auth) {
        ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Unauthorized socket" } }));
        closeUnauthorizedSocket(ws);
        return;
      }

      const { userId, tenantId, role } = auth;

      let msg: any;
      try {
        msg = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Invalid JSON" } }));
        return;
      }

      if (!msg || typeof msg !== "object" || typeof msg.type !== "string") {
        ws.send(JSON.stringify({
          type: "ERROR",
          payload: { message: "Malformed websocket message. Expected { type, payload? }" },
        }));
        return;
      }

      // ── PONG — heartbeat response ──────────────────────────────────────────
      if (msg.type === "PONG") {
        const manager = fleetStore.getManager(userId);
        if (manager) manager.lastPongAt = new Date();
        return;
      }

      // ── PING from client ───────────────────────────────────────────────────
      if (msg.type === "PING") {
        ws.send(JSON.stringify({ type: "PONG" }));
        return;
      }

      // ── Driver: REGISTER ───────────────────────────────────────────────────
      if (msg.type === "REGISTER" && role === Role.DRIVER) {
        const { tripId } = msg.payload ?? {};

        if (!tripId) {
          ws.send(JSON.stringify({
            type:    "ERROR",
            payload: { message: "REGISTER requires tripId in payload" },
          }));
          return;
        }

        const result = await registerDriverConnection(ws, userId, tenantId, tripId);

        if (!result.ok) {
          ws.send(JSON.stringify({
            type:    "ERROR",
            payload: { message: result.error },
          }));
          return;
        }

        ws.send(JSON.stringify({
          type:    "REGISTERED",
          payload: { tripId, message: "GPS streaming active. Send GPS_PING every 3s." },
        }));

        // Notify managers that driver connected
        const driver = fleetStore.getDriver(userId);
        if (driver) {
          broadcastToManagers(tenantId, {
            type:    "TRIP_STARTED",
            payload: {
              tripId,
              vehicleId:    driver.vehicleId,
              driverName:   driver.driverName,
              licensePlate: driver.licensePlate,
              timestamp:    new Date().toISOString(),
            },
          });
        }

        return;
      }

      // ── Driver: GPS_PING ───────────────────────────────────────────────────
      if (msg.type === "GPS_PING" && role === Role.DRIVER) {
        const ping = msg.payload;

        if (!ping?.tripId || ping.lat === undefined || ping.lng === undefined) {
          ws.send(JSON.stringify({
            type:    "ERROR",
            payload: { message: "GPS_PING missing required fields: tripId, lat, lng" },
          }));
          return;
        }

        const result = await processGpsPing(
          {
            tripId:    ping.tripId,
            lat:       Number(ping.lat),
            lng:       Number(ping.lng),
            speed:     Number(ping.speed ?? 0),
            heading:   Number(ping.heading ?? 0),
            timestamp: ping.timestamp ?? new Date().toISOString(),
          },
          userId
        );

        if (!result.ok) {
          ws.send(JSON.stringify({
            type:    "ERROR",
            payload: { message: result.error },
          }));
        }

        // ACK every 10th ping to reduce noise
        const driver = fleetStore.getDriver(userId);
        if (driver && (driver as any).pingCount % 10 === 0) {
          ws.send(JSON.stringify({
            type:    "PING_ACK",
            payload: { pingCount: fleetStore.getVehicleState(driver.vehicleId)?.pingCount },
          }));
        }

        return;
      }

      // ── Unknown message ────────────────────────────────────────────────────
      ws.send(JSON.stringify({
        type:    "ERROR",
        payload: { message: `Unknown message type: ${String(msg.type)}` },
      }));
    },

    // ── On Close ──────────────────────────────────────────────────────────────
    async close(ws) {
      const auth = getWsAuthData(ws);
      if (!auth) {
        if ((ws as any)._heartbeat) {
          clearInterval((ws as any)._heartbeat);
        }
        return;
      }

      const { userId, tenantId, role } = auth;
      if (role === Role.DRIVER || role === Role.FLEET_MANAGER || role === Role.SUPER_ADMIN) {
        const roleLabel = role === Role.DRIVER ? "driver" : "manager";
        wsConnectionsGauge.dec({ role: roleLabel });
      }

      // Clear heartbeat
      if ((ws as any)._heartbeat) {
        clearInterval((ws as any)._heartbeat);
      }

      if (role === Role.DRIVER) {
        const driver = fleetStore.removeDriver(userId);

        if (driver) {
          // Flush remaining GPS pings immediately
          const flushed = await flushTripPings(driver.tripId);
          console.log(
            `[WS] Driver disconnected: ${driver.driverName} | Flushed ${flushed} pings`
          );

          // Remove from live vehicle state
          fleetStore.removeVehicleState(driver.vehicleId);

          // Notify managers
          broadcastToManagers(tenantId, {
            type:    "TRIP_ENDED",
            payload: {
              tripId:       driver.tripId,
              vehicleId:    driver.vehicleId,
              driverName:   driver.driverName,
              licensePlate: driver.licensePlate,
              timestamp:    new Date().toISOString(),
            },
          });
        }
      } else if (role === Role.FLEET_MANAGER || role === Role.SUPER_ADMIN) {
        fleetStore.removeManager(userId);
        console.log(`[WS] Manager disconnected: ${userId}`);
      }
    },

    // ── On Error ──────────────────────────────────────────────────────────────
    error( error) {
      console.error("[WS] Error:", error);
    },
  });
