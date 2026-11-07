import { config } from "./config";
import { otpCode, safeEqualHex, sha256 } from "./crypto";
import { db } from "./db";
import { sendOtpSms } from "./messaging";

const hashCode = (mobile: string, code: string) => sha256(`${mobile}:${code}:${config.otpPepper}`);

/**
 * Sends an OTP if the number has reports. The UI response is the same either way,
 * so the form cannot be used to discover which numbers are patients.
 */
export async function requestOtp(mobile: string, audience: "patient" | "doctor" = "patient"): Promise<"sent" | "rate_limited"> {
  const since = new Date(Date.now() - 10 * 60_000);
  const recent = await db.otp.count({ where: { mobile, createdAt: { gte: since } } });
  if (recent >= config.otpMaxPer10Min) return "rate_limited";

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

/**
 * Any unexpired, unused code for the number is accepted, not only the newest one:
 * SMS often arrives late, the user taps "resend", then types the first code.
 * Safe because at most 3 codes exist (rate limit) and attempts are capped across all of them.
 */
export async function verifyOtp(mobile: string, code: string): Promise<OtpResult> {
  const now = new Date();
  const active = await db.otp.findMany({
    where: { mobile, consumedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
  });
  if (active.length === 0) return "expired";

  const attempts = active.reduce((sum, o) => sum + o.attempts, 0);
  if (attempts >= config.otpMaxAttempts) return "locked";

  const hash = hashCode(mobile, code);
  const match = /^\d{6}$/.test(code) && active.some((o) => safeEqualHex(o.codeHash, hash));
  if (!match) {
    await db.otp.update({ where: { id: active[0].id }, data: { attempts: { increment: 1 } } });
    return attempts + 1 >= config.otpMaxAttempts ? "locked" : "invalid";
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
