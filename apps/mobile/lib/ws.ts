import * as SecureStore from "expo-secure-store";

type WSMessage = { type: string; payload?: any };
type Handler   = (msg: WSMessage) => void;
type StateHandler = (state: DriverWsState) => void;

export interface DriverWsState {
  connected: boolean;
  connecting: boolean;
  registered: boolean;
  tripId: string | null;
}

class DriverWebSocket {
  private ws:       WebSocket | null = null;
  private handlers: Set<Handler>     = new Set();
  private stateHandlers: Set<StateHandler> = new Set();
  private reconnect: ReturnType<typeof setTimeout> | null = null;
  private url:      string           = "";
  private manuallyDisconnected = false;
  private connecting = false;
  connected:        boolean          = false;
  tripId:           string | null    = null;
  registered:       boolean          = false;

  getState(): DriverWsState {
    return {
      connected: this.connected,
      connecting: this.connecting,
      registered: this.registered,
      tripId: this.tripId,
    };
  }

  private emitState() {
    const state = this.getState();
    this.stateHandlers.forEach((h) => h(state));
  }

  async connect() {
    const token  = await SecureStore.getItemAsync("accessToken");
    if (!token) return;

    const baseUrl = (process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:3000").replace(/\/+$/, "");
    const wsBase = baseUrl.endsWith("/ws") ? baseUrl : `${baseUrl}/ws`;

    this.manuallyDisconnected = false;
    this.url = `${wsBase}?token=${encodeURIComponent(token)}`;
    this._open();
  }

  private _open() {
    if (!this.url || this.manuallyDisconnected) return;
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    if (this.reconnect) {
      clearTimeout(this.reconnect);
      this.reconnect = null;
    }

    this.connecting = true;
    this.emitState();

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.connected = true;
      this.connecting = false;
      this.emitState();
      console.log("[WS] Driver connected");
      // Re-register if we have an active trip
      if (this.tripId) this.register(this.tripId);
    };

    this.ws.onmessage = (e) => {
      try {
        const msg = (
          typeof e.data === "string"
            ? JSON.parse(e.data)
            : e.data
        ) as WSMessage;
        if (!msg || typeof msg.type !== "string") return;

        if (msg.type === "PING") {
          this.send({ type: "PONG" });
          return;
        }
        if (msg.type === "REGISTERED") {
          this.registered = true;
          this.emitState();
        }
        this.handlers.forEach((h) => h(msg));
      } catch { /* ignore */ }
    };

    this.ws.onclose = (event) => {
      this.ws = null;
      this.connected = false;
      this.connecting = false;
      this.registered = false;
      this.emitState();

      if (!this.manuallyDisconnected) {
        if (event.code === 1008) {
          console.warn("[WS] Unauthorized connection rejected. Reconnect paused until next login.");
          return;
        }
        this.reconnect = setTimeout(() => this._open(), 3000);
      }
    };

    this.ws.onerror = () => this.ws?.close();
  }

  register(tripId: string) {
    const tripChanged = this.tripId !== tripId;
    this.tripId = tripId;
    if (tripChanged) {
      this.registered = false;
    }
    this.emitState();

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: "REGISTER", payload: { tripId } });
      return;
    }

    this._open();
  }

  sendGpsPing(payload: {
    tripId:    string;
    lat:       number;
    lng:       number;
    speed:     number;
    heading:   number;
    timestamp: string;
  }) {
    this.send({ type: "GPS_PING", payload });
  }

  send(msg: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  on(handler: Handler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  onState(handler: StateHandler) {
    this.stateHandlers.add(handler);
    handler(this.getState());
    return () => {
      this.stateHandlers.delete(handler);
    };
  }

  disconnect() {
    this.manuallyDisconnected = true;
    if (this.reconnect) {
      clearTimeout(this.reconnect);
      this.reconnect = null;
    }

    this.tripId = null;
    this.connected = false;
    this.connecting = false;
    this.registered = false;
    this.emitState();

    this.ws?.close();
    this.ws = null;
  }
}

export const driverWS = new DriverWebSocket();
