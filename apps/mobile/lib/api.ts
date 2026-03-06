import axios from "axios";
import * as SecureStore from "expo-secure-store";

const rawApiUrl = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api/v1").replace(/\/+$/, "");
const API_URL = rawApiUrl.endsWith("/api/v1") ? rawApiUrl : `${rawApiUrl}/api/v1`;

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
});

// Auto-attach stored token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = await SecureStore.getItemAsync("refreshToken");
        if (!refresh) throw new Error("No refresh token");

        const res = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: refresh,
        });
        const { accessToken, refreshToken } = res.data.data;

        await SecureStore.setItemAsync("accessToken",  accessToken);
        await SecureStore.setItemAsync("refreshToken", refreshToken);

        original.headers.Authorization = `Bearer ${accessToken}`;
        return axios(original);
      } catch {
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        // Navigation handled by auth store listener
      }
    }
    return Promise.reject(err);
  }
);

// ─── API Methods ──────────────────────────────────────────────────────────────

export const authApi = {
  login: (d: { email: string; password: string }) =>
    api.post("/auth/login", d),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

export const tripsApi = {
  myTrips: (params?: any) => api.get("/trips", { params }),
  get:     (id: string)   => api.get(`/trips/${id}`),
  start:   (vehicleId: string) =>
    api.post("/trips/start", { vehicleId }),
  end: (id: string) => api.post(`/trips/${id}/end`),
};

export const vehiclesApi = {
  myVehicle: () => api.get("/vehicles/mine"),
};

export const aiApi = {
  askSSE: (
    question:  string,
    vehicleId: string,
    onToken:   (t: string) => void,
    onDone:    () => void,
    onError:   (e: string) => void
  ) => streamAsk(question, vehicleId, onToken, onDone, onError),
};

// ─── SSE streaming for AI ask ─────────────────────────────────────────────────

async function streamAsk(
  question:  string,
  vehicleId: string,
  onToken:   (t: string) => void,
  onDone:    () => void,
  onError:   (e: string) => void
) {
  const token = await SecureStore.getItemAsync("accessToken");

  try {
    const res = await fetch(`${API_URL}/ai/ask`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ question, vehicleId }),
    });

    if (!res.ok) {
      let message = `AI request failed (${res.status})`;
      try {
        const raw = await res.text();
        if (raw) {
          const parsed = JSON.parse(raw) as {
            error?: { message?: string };
            message?: string;
          };
          message = parsed.error?.message ?? parsed.message ?? message;
        }
      } catch {
        // ignore parse issues and keep status-based message
      }
      onError(message);
      return;
    }

    if (!res.body) {
      onError("AI response stream unavailable");
      return;
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = "";
    let   currentEvent = "message";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
          continue;
        }

        if (line.startsWith("data: ")) {
          try {
            const json = JSON.parse(line.slice(6));

            if (currentEvent === "error") {
              onError(json.message ?? "AI error");
              return;
            }
            if (currentEvent === "done") {
              onDone();
              return;
            }
            if (json.token) {
              onToken(json.token);
            }
          } catch { /* skip */ }
        }
      }
    }

    onDone();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    onError(message);
  }
}
