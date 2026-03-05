import http   from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 10  },  // warm up
    { duration: "1m",  target: 50  },  // ramp to 50 VUs
    { duration: "2m",  target: 100 },  // hold at 100
    { duration: "1m",  target: 200 },  // ramp to 200
    { duration: "30s", target: 0   },  // ramp down
  ],
  thresholds: {
    http_req_failed:   ["rate<0.05"],   // < 5% errors under stress
    http_req_duration: ["p(99)<2000"],  // 99% under 2s
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:3000";

export function setup() {
  const res = http.post(
    `${BASE}/api/v1/auth/login`,
    JSON.stringify({ email: "manager@demo.fleet", password: "Manager123!" }),
    { headers: { "Content-Type": "application/json" } }
  );
  return { token: res.json("data.tokens.accessToken") };
}

export default function (data) {
  const headers = {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${data.token}`,
  };

  const r = http.get(`${BASE}/api/v1/analytics/overview`, { headers });
  check(r, { "overview 200": (rr) => rr.status === 200 });

  const r2 = http.get(`${BASE}/api/v1/vehicles`, { headers });
  check(r2, { "vehicles 200": (rr) => rr.status === 200 });

  sleep(Math.random() * 2 + 0.5);
}