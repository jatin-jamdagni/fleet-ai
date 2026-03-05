import ws     from "k6/ws";
import http   from "k6/http";
import { check, fail } from "k6";
import { Counter } from "k6/metrics";

const pingsSent     = new Counter("gps_pings_sent");
const pingsReceived = new Counter("gps_pings_received");

export const options = {
  vus:      100,
  duration: "2m",
  thresholds: {
    gps_pings_sent:     ["count>1000"],
    gps_pings_received: ["count>500"],
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:3000";
const WS_BASE = (__ENV.WS_URL || BASE).replace(/^http/, "ws");

const MANAGER_EMAIL = __ENV.MANAGER_EMAIL || "manager@demo.fleet";
const MANAGER_PASSWORD = __ENV.MANAGER_PASSWORD || "Manager123!";
const DRIVER_EMAIL = __ENV.DRIVER_EMAIL || "driver@demo.fleet";
const DRIVER_PASSWORD = __ENV.DRIVER_PASSWORD || "Driver123!";

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function login(email, password) {
  const res = http.post(
    `${BASE}/api/v1/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { "Content-Type": "application/json" } }
  );

  if (!check(res, { [`login ${email} status 200`]: (r) => r.status === 200 })) {
    fail(`Login failed for ${email}. status=${res.status} body=${res.body}`);
  }

  const token = res.json("data.tokens.accessToken");
  if (!token) {
    fail(`No access token for ${email}. body=${res.body}`);
  }
  return token;
}

export function setup() {
  const managerToken = login(MANAGER_EMAIL, MANAGER_PASSWORD);
  const driverToken = login(DRIVER_EMAIL, DRIVER_PASSWORD);

  const meRes = http.get(`${BASE}/api/v1/auth/me`, { headers: authHeaders(driverToken) });
  if (!check(meRes, { "driver /auth/me status 200": (r) => r.status === 200 })) {
    fail(`Driver /auth/me failed. status=${meRes.status} body=${meRes.body}`);
  }
  const driverId = meRes.json("data.id");
  if (!driverId) {
    fail(`Missing driver id in /auth/me response. body=${meRes.body}`);
  }

  const vehiclesRes = http.get(`${BASE}/api/v1/vehicles`, {
    headers: authHeaders(managerToken),
  });
  if (!check(vehiclesRes, { "manager /vehicles status 200": (r) => r.status === 200 })) {
    fail(`Vehicle list failed. status=${vehiclesRes.status} body=${vehiclesRes.body}`);
  }
  const vehicles = vehiclesRes.json("data") || [];
  const driverAssignedVehicle = vehicles.find(
    (v) => v.assignedDriver && v.assignedDriver.id === driverId && v.status === "ACTIVE"
  );
  const selectedVehicle = driverAssignedVehicle || vehicles.find(
    (v) => v.status === "ACTIVE" && !v.assignedDriver
  );
  const vehicleId = selectedVehicle?.id;
  if (!vehicleId) {
    fail("No ACTIVE vehicle available (already assigned to driver or unassigned) for websocket load test.");
  }

  if (!driverAssignedVehicle) {
    const assignRes = http.post(
      `${BASE}/api/v1/vehicles/${vehicleId}/assign`,
      JSON.stringify({ driverId }),
      { headers: authHeaders(managerToken) }
    );
    if (!check(assignRes, { "assign driver status 200": (r) => r.status === 200 })) {
      fail(`Driver assign failed. status=${assignRes.status} body=${assignRes.body}`);
    }
  }

  let tripId = null;
  const tripRes = http.post(
    `${BASE}/api/v1/trips/start`,
    JSON.stringify({ vehicleId }),
    { headers: authHeaders(driverToken) }
  );

  if (tripRes.status === 200 || tripRes.status === 201) {
    tripId = tripRes.json("data.id");
  } else if (tripRes.status === 409) {
    // Reuse an already-active trip for this driver if one exists.
    const activeTripsRes = http.get(
      `${BASE}/api/v1/trips?status=ACTIVE&page=1&pageSize=1`,
      { headers: authHeaders(driverToken) }
    );
    if (!check(activeTripsRes, { "driver active trips status 200": (r) => r.status === 200 })) {
      fail(`Failed to fetch active trips. status=${activeTripsRes.status} body=${activeTripsRes.body}`);
    }
    tripId = activeTripsRes.json("data.0.id");
  } else {
    fail(`Trip start failed. status=${tripRes.status} body=${tripRes.body}`);
  }

  if (!tripId) {
    fail(`No active trip ID available for websocket load test. start response body=${tripRes.body}`);
  }

  return { managerToken, driverToken, tripId };
}

export default function (data) {
  if (!data?.tripId || !data?.driverToken) {
    fail("Missing setup data (tripId/driverToken).");
  }

  const url = `${WS_BASE}/ws?token=${encodeURIComponent(data.driverToken)}`;

  const res = ws.connect(url, {}, (socket) => {
    let sent = 0;

    socket.on("open", () => {
      socket.send(JSON.stringify({
        type:    "REGISTER",
        payload: { tripId: data.tripId },
      }));
    });

    socket.on("message", (msg) => {
      let parsed;
      try {
        parsed = JSON.parse(msg);
      } catch {
        return;
      }

      if (parsed.type === "REGISTERED") {
        pingsReceived.add(1);

        const sendLoop = socket.setInterval(() => {
          if (sent >= 10) {
            socket.clearInterval(sendLoop);
            socket.close();
            return;
          }

          socket.send(JSON.stringify({
            type: "GPS_PING",
            payload: {
              tripId:    data.tripId,
              lat:       28.6139 + (Math.random() - 0.5) * 0.1,
              lng:       77.2090 + (Math.random() - 0.5) * 0.1,
              speed:     30 + Math.random() * 60,
              heading:   Math.floor(Math.random() * 360),
              timestamp: new Date().toISOString(),
            },
          }));
          pingsSent.add(1);
          sent += 1;
        }, 100);
      }
    });

    socket.setTimeout(() => socket.close(), 15_000);
  });

  check(res, { "WS connected": (r) => r && r.status === 101 });
}

export function teardown(data) {
  if (!data?.tripId || !data?.managerToken) return;

  const res = http.post(
    `${BASE}/api/v1/trips/${data.tripId}/force-end`,
    null,
    { headers: authHeaders(data.managerToken) }
  );
  check(res, { "trip force-ended": (r) => r.status === 200 || r.status === 404 });
}
