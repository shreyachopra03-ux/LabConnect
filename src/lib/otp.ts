import { config } from "./config";
import { otpCode, safeEqualHex, sha256 } from "./crypto";
import { db } from "./db";
import { sendOtpSms } from "./messaging";

const hashCode = (mobile: string, code: string) => sha256(`${mobile}:${code}:${config.otpPepper}`);

/**
 * Sends an OTP if the number has reports. The UI response is the same either way,
 * so the form cannot be used to discover which numbers are patients.
 */
export async function requestOtp(mobile: string): Promise<"sent" | "rate_limited"> {
  const since = new Date(Date.now() - 10 * 60_000);
  const recent = await db.otp.count({ where: { mobile, createdAt: { gte: since } } });
  if (recent >= config.otpMaxPer10Min) return "rate_limited";

  const known = await db.patient.count({ where: { mobile } });
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

export async function verifyOtp(mobile: string, code: string): Promise<OtpResult> {
  const otp = await db.otp.findFirst({
    where: { mobile, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.expiresAt <= new Date()) return "expired";
  if (otp.attempts >= config.otpMaxAttempts) return "locked";

  if (!/^\d{6}$/.test(code) || !safeEqualHex(otp.codeHash, hashCode(mobile, code))) {
    await db.otp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return otp.attempts + 1 >= config.otpMaxAttempts ? "locked" : "invalid";
  }
  await db.otp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
  return "ok";
}
