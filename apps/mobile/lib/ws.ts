import * as SecureStore from "expo-secure-store";

type WSMessage = { type: string; payload?: any };
type Handler   = (msg: WSMessage) => void;

class DriverWebSocket {
  private ws:       WebSocket | null = null;
  private handlers: Set<Handler>     = new Set();
  private reconnect: ReturnType<typeof setTimeout> | null = null;
  private url:      string           = "";
  connected:        boolean          = false;
  tripId:           string | null    = null;
  registered:       boolean          = false;

  async connect() {
    const token  = await SecureStore.getItemAsync("accessToken");
    if (!token) return;

    const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:3000";
    this.url     = `${WS_URL}/ws?token=${token}`;
    this._open();
  }

  private _open() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.connected = true;
      console.log("[WS] Driver connected");
      // Re-register if we have an active trip
      if (this.tripId) this.register(this.tripId);
    };

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WSMessage;
        if (msg.type === "PING") {
          this.send({ type: "PONG" });
          return;
        }
        if (msg.type === "REGISTERED") this.registered = true;
        this.handlers.forEach((h) => h(msg));
      } catch { /* ignore */ }
    };

    this.ws.onclose = () => {
      this.connected  = false;
      this.registered = false;
      this.reconnect  = setTimeout(() => this._open(), 3000);
    };

    this.ws.onerror = () => this.ws?.close();
  }

  register(tripId: string) {
    this.tripId = tripId;
    this.send({ type: "REGISTER", payload: { tripId } });
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

  disconnect() {
    if (this.reconnect) clearTimeout(this.reconnect);
    this.tripId    = null;
    this.registered = false;
    this.ws?.close();
    this.ws = null;
  }
}

export const driverWS = new DriverWebSocket();
