const API = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:3000/api/v1";

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API}/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return data.data?.tokens?.accessToken as string;
}

export async function apiGet(path: string, token: string) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function apiPost(path: string, body: unknown, token: string) {
  const res = await fetch(`${API}${path}`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiPatch(path: string, body: unknown, token: string) {
  const res = await fetch(`${API}${path}`, {
    method:  "PATCH",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}
