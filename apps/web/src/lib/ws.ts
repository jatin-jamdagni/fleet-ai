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
  private manuallyDisconnected = false;

  connect(token: string) {
    if (!token) return;

    const baseUrl = (import.meta.env.VITE_WS_URL ?? "ws://localhost:3000").replace(/\/+$/, "");
    const wsBase = baseUrl.endsWith("/ws") ? baseUrl : `${baseUrl}/ws`;

    this.url = `${wsBase}?token=${encodeURIComponent(token)}`;
    this.manuallyDisconnected = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this._connect();
  }

  private _connect() {
    if (!this.url || this.manuallyDisconnected) return;
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

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

    this.ws.onclose = (event) => {
      this.connected = false;
      this._stopHeartbeat();

      if (this.manuallyDisconnected) return;

      if (event.code === 1008) {
        console.warn("[WS] Unauthorized connection rejected. Reconnect paused until next login.");
        return;
      }

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
    this.manuallyDisconnected = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
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
