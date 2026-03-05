import { prisma } from "../../db/prisma";

interface PushPayload {
  title: string;
  body:  string;
  data?: Record<string, any>;
}

// ─── Send Expo push notification to a user ────────────────────────────────────

export async function sendExpoPush(
  userId:  string,
  payload: PushPayload
): Promise<void> {
  const tokens = await prisma.pushToken.findMany({
    where: { userId },
    select: { token: true },
  });

  if (tokens.length === 0) return;

  const messages = tokens.map((t) => ({
    to:    t.token,
    title: payload.title,
    body:  payload.body,
    data:  payload.data ?? {},
    sound: "default",
    badge: 1,
  }));

  // Expo push API — batch up to 100
  const chunks = chunkArray(messages, 100);

  for (const chunk of chunks) {
    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Accept":        "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(chunk),
      });

      const data = await res.json();

      // Handle receipts — remove invalid tokens
      if (data.data) {
        const invalid: string[] = [];

        data.data.forEach((receipt: any, idx: number) => {
          if (
            receipt.status === "error" &&
            receipt.details?.error === "DeviceNotRegistered"
          ) {
            invalid.push(chunk[idx]!.to);
          }
        });

        if (invalid.length > 0) {
          await prisma.pushToken.deleteMany({
            where: { token: { in: invalid } },
          });
          console.log(`[Push] Removed ${invalid.length} invalid token(s)`);
        }
      }
    } catch (err) {
      console.error("[Push] Failed to send:", err);
    }
  }
}

// ─── Store push token from mobile ────────────────────────────────────────────

export async function storePushToken(
  userId:   string,
  token:    string,
  platform: string
): Promise<void> {
  await prisma.pushToken.upsert({
    where:  { userId_token: { userId, token } },
    create: { userId, token, platform },
    update: { platform, updatedAt: new Date() },
  });
}

// ─── Remove push token on logout ─────────────────────────────────────────────

export async function removePushToken(
  userId: string,
  token:  string
): Promise<void> {
  await prisma.pushToken.deleteMany({
    where: { userId, token },
  });
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}