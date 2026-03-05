import http   from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus:      5,
  duration: "30s",
  thresholds: {
    http_req_failed:   ["rate<0.01"],   // < 1% errors
    http_req_duration: ["p(95)<500"],   // 95% under 500ms
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:3000";

export function setup() {
  const res = http.post(
    `${BASE}/api/v1/auth/login`,
    JSON.stringify({ email: "manager@demo.fleet", password: "Manager123!" }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(res, { "login ok": (r) => r.status === 200 });
  return { token: res.json("data.tokens.accessToken") };
}

export default function (data) {
  const headers = {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${data.token}`,
  };

  const endpoints = [
    `/api/v1/vehicles`,
    `/api/v1/vehicles/stats`,
    `/api/v1/invoices/summary`,
    `/api/v1/analytics/overview`,
    `/health`,
  ];

  for (const ep of endpoints) {
    const res = http.get(`${BASE}${ep}`, { headers });
    check(res, {
      [`${ep} status 200`]: (r) => r.status === 200,
    });
  }

  sleep(1);
}