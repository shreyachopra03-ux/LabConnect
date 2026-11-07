import { config } from "./config";
import { otpCode, safeEqualHex, sha256 } from "./crypto";
import { db } from "./db";
import { sendOtpSms } from "./messaging";

const hashCode = (mobile: string, code: string) => sha256(`${mobile}:${code}:${config.otpPepper}`);
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

/** Failed verifications for this number inside the lockout window, across all its codes. */
async function recentFailures(mobile: string): Promise<number> {
  const rows = await db.otp.findMany({
    where: { mobile, lastFailedAt: { gt: minutesAgo(config.otpLockMinutes) } },
    select: { attempts: true },
  });
  return rows.reduce((sum, o) => sum + o.attempts, 0);
}

export const isLocked = async (mobile: string) => (await recentFailures(mobile)) >= config.otpMaxAttempts;

/**
 * Sends an OTP if the number is known. The UI response is the same either way, so the
 * form cannot be used to discover which numbers are patients.
 * Limits (C002): 3 per 10 minutes, a daily cap, and no new codes while locked out.
 */
export async function requestOtp(mobile: string, audience: "patient" | "doctor" = "patient"): Promise<"sent" | "rate_limited"> {
  const [last10, lastDay] = await Promise.all([
    db.otp.count({ where: { mobile, createdAt: { gte: minutesAgo(10) } } }),
    db.otp.count({ where: { mobile, createdAt: { gte: minutesAgo(24 * 60) } } }),
  ]);
  if (last10 >= config.otpMaxPer10Min || lastDay >= config.otpMaxPerDay) return "rate_limited";
  if (await isLocked(mobile)) return "rate_limited";

  const known =
    audience === "doctor" ? await db.doctor.count({ where: { mobile } }) : await db.patient.count({ where: { mobile } });
  if (!known) return "sent";

  const code = otpCode();
  await db.otp.create({
    data: {
      mobile,
      codeHash: hashCode(mobile, code),
      expiresAt: new Date(Date.now() + config.otpTtlMinutes * 60_000),
    },
  });
  await sendOtpSms(mobile, code);
  return "sent";
}

export type OtpResult = "ok" | "invalid" | "expired" | "locked";

/** Small server-side delay that doubles with each recent failure (0.25s, 0.5s … max 4s). Slows guessing without bothering real users. */
export const backoffMs = (failures: number) => (failures <= 0 ? 0 : Math.min(4000, 250 * 2 ** (failures - 1)));

/**
 * Accepts any unexpired, unused code for the number (SMS can arrive late after a resend).
 * After otpMaxAttempts failures in the lockout window the number is locked for otpLockMinutes,
 * even if a new code is requested.
 */
export async function verifyOtp(mobile: string, code: string): Promise<OtpResult> {
  const failures = await recentFailures(mobile);
  if (failures >= config.otpMaxAttempts) return "locked";
  const wait = backoffMs(failures);
  if (wait) await new Promise((r) => setTimeout(r, wait));

  const now = new Date();
  const active = await db.otp.findMany({
    where: { mobile, consumedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
  });
  if (active.length === 0) return "expired";

  const hash = hashCode(mobile, code);
  const match = /^\d{6}$/.test(code) && active.some((o) => safeEqualHex(o.codeHash, hash));
  if (!match) {
    await db.otp.update({ where: { id: active[0].id }, data: { attempts: { increment: 1 }, lastFailedAt: now } });
    return failures + 1 >= config.otpMaxAttempts ? "locked" : "invalid";
  }
  await db.otp.updateMany({ where: { id: { in: active.map((o) => o.id) } }, data: { consumedAt: now } });
  return "ok";
}

/** Demo only (mock messaging): the newest code sent to this number, shown on the verify screen. */
export async function latestMockCode(mobile: string): Promise<string | null> {
  if (!config.mockMessaging) return null;
  const msg = await db.message.findFirst({ where: { mobile, kind: "OTP" }, orderBy: { createdAt: "desc" } });
  return msg?.body.match(/^\d{6}/)?.[0] ?? null;
}
