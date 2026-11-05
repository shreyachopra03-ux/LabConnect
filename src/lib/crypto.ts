import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

/** URL-safe random token. 24 bytes = 192 bits, unguessable. */
export const randomToken = (bytes = 24) => randomBytes(bytes).toString("base64url");

export const sha256 = (s: string | Buffer) => createHash("sha256").update(s).digest("hex");

export const otpCode = () => randomInt(0, 1_000_000).toString().padStart(6, "0");

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

export function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
}
