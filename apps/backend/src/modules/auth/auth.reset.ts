import { prisma } from "../../db/prisma";
import { AppError } from "../../lib/errors";
import { sendPasswordResetEmail } from "../email/email.service";
import crypto from "crypto";

// Store reset tokens in memory (swap for Redis in prod)
const resetTokens = new Map<string, { userId: string; expiresAt: number }>();

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), deletedAt: null },
    select: { id: true, name: true, email: true },
  });

  // Always return success — don't reveal if email exists
  if (!user) return;

  const token    = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 3_600_000; // 1 hour

  resetTokens.set(token, { userId: user.id, expiresAt });

  const baseUrl  = process.env.FRONTEND_URL ?? "http://localhost:5173";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await sendPasswordResetEmail({
    to:       user.email,
    name:     user.name,
    resetUrl,
  });
}

export async function resetPassword(
  token:       string,
  newPassword: string
): Promise<void> {
  const entry = resetTokens.get(token);
  if (!entry || entry.expiresAt < Date.now()) {
    throw new AppError("INVALID_RESET_TOKEN", "Reset token is invalid or expired", 400);
  }

  if (newPassword.length < 8) {
    throw new AppError("WEAK_PASSWORD", "Password must be at least 8 characters", 422);
  }

  const passwordHash = await Bun.password.hash(newPassword, {
    algorithm: "bcrypt",
    cost: 12,
  });

  await prisma.user.update({
    where: { id: entry.userId },
    data:  { passwordHash },
  });

  // Revoke all refresh tokens (force re-login)
  await prisma.refreshToken.deleteMany({ where: { userId: entry.userId } });

  resetTokens.delete(token);
}
