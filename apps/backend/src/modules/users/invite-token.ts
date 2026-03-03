// Simple signed invite token system
// Token = base64(payload) + "." + base64(hmac signature)
// Expires in 48 hours

const INVITE_SECRET = process.env.JWT_SECRET ?? "fallback-secret";

export interface InvitePayload {
  email:    string;
  tenantId: string;
  role:     string;
  exp:      number; // unix timestamp
}

// ─── Sign ─────────────────────────────────────────────────────────────────────

export async function signInviteToken(payload: Omit<InvitePayload, "exp">): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 48; // 48h
  const full: InvitePayload = { ...payload, exp };

  const data    = Buffer.from(JSON.stringify(full)).toString("base64url");
  const key     = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(INVITE_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf  = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const sig     = Buffer.from(sigBuf).toString("base64url");

  return `${data}.${sig}`;
}

// ─── Verify ───────────────────────────────────────────────────────────────────

export async function verifyInviteToken(token: string): Promise<InvitePayload | null> {
  try {
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;

    // Verify signature
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(INVITE_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBuf = Buffer.from(sig, "base64url");
    const valid  = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBuf,
      new TextEncoder().encode(data)
    );
    if (!valid) return null;

    // Decode payload
    const payload: InvitePayload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    );

    // Check expiry
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}