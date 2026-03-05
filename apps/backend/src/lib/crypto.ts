import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt);

export async function hash(value: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(value, salt, 64)) as Buffer;
  return `${salt.toString("base64")}:${derived.toString("base64")}`;
}

export async function compare(value: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(":");
  if (!saltB64 || !hashB64) return false;

  const salt = Buffer.from(saltB64, "base64");
  const derived = (await scrypt(value, salt, 64)) as Buffer;
  const storedHash = Buffer.from(hashB64, "base64");

  if (storedHash.length !== derived.length) return false;
  return timingSafeEqual(storedHash, derived);
}
