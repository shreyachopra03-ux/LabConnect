import path from "node:path";

export const config = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  // Runtime data folders, not source: tell the bundler not to trace them.
  lisDir: path.resolve(/*turbopackIgnore: true*/ process.env.LIS_EXPORT_DIR ?? "./lis-export"),
  storageDir: path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_DIR ?? "./storage"),
  lisPollSeconds: Number(process.env.LIS_POLL_SECONDS ?? 15),
  lisWatch: process.env.LIS_WATCH !== "false",

  linkTtlHours: 72,
  linkSessionMinutes: 60,
  patientSessionMinutes: 30,
  staffSessionHours: 10,

  otpTtlMinutes: 5,
  otpMaxAttempts: 5,
  otpMaxPer10Min: 3,
  otpPepper: process.env.OTP_PEPPER ?? "dev-pepper",

  mockMessaging: process.env.MOCK_MESSAGING !== "false",
  mockFailWhatsappSuffix: process.env.MOCK_FAIL_WHATSAPP_SUFFIX ?? "99",

  anthropicKey: process.env.ANTHROPIC_API_KEY || undefined,
  summaryModel: process.env.SUMMARY_MODEL ?? "claude-haiku-5-5",

  consentVersion: "2026-11-v1",
  helpline: "0866 000 0000",
};
