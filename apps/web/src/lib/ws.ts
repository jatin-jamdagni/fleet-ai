// Fleet WebSocket manager — singleton

import type { ManagerWsMessage } from "@fleet/shared";

type ConnectedMessage = {
  type: "CONNECTED";
  payload: {
    role: "MANAGER" | "DRIVER";
    activeVehicles?: number;
    message?: string;
    timestamp: string;
  };
};

type PingMessage = { type: "PING" };

type ErrorMessage = {
  type: "ERROR";
  payload: { message: string };
};

type RegisteredMessage = {
  type: "REGISTERED";
  payload: { tripId: string; message: string };
};

type PingAckMessage = {
  type: "PING_ACK";
  payload: { pingCount?: number };
};

type NotificationMessage = {
  type: "NOTIFICATION";
  payload: {
    id: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    createdAt: string;
  };
};

export type FleetInboundMessage =
  | ManagerWsMessage
  | NotificationMessage
  | ConnectedMessage
  | PingMessage
  | ErrorMessage
  | RegisteredMessage
  | PingAckMessage;

type MessageHandler = (msg: FleetInboundMessage) => void;

function isFleetInboundMessage(value: unknown): value is FleetInboundMessage {
  if (!value || typeof value !== "object") return false;
  return "type" in value && typeof (value as { type?: unknown }).type === "string";
}

class FleetWebSocket {
  private ws:        WebSocket | null = null;
  private handlers:  Set<MessageHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private url:       string = "";
  private connected: boolean = false;

  connect(token: string) {
    const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:3000";
    this.url     = `${WS_URL}/ws?token=${token}`;
    this._connect();
  }

  private _connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.connected = true;
      console.log("[WS] Connected");
      this._startHeartbeat();
    };

    this.ws.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data) as unknown;
        if (!isFleetInboundMessage(parsed)) return;

        const msg = parsed;
        if (msg.type === "PING") {
          this.ws?.send(JSON.stringify({ type: "PONG" }));
          return;
        }
        this.handlers.forEach((h) => h(msg));
      } catch { /* ignore */ }
    };

    this.ws.onclose = () => {
      this.connected = false;
      this._stopHeartbeat();
      console.log("[WS] Disconnected — reconnecting in 3s");
      this.reconnectTimer = setTimeout(() => this._connect(), 3000);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private _startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "PING" }));
      }
    }, 15_000);
  }

  private _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this._stopHeartbeat();
    this.ws?.close();
    this.ws        = null;
    this.connected = false;
  }

  on(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  isConnected() { return this.connected; }
}

export const fleetWS = new FleetWebSocket();
