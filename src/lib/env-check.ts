import { config } from "./config";
import { log } from "./logger";

/**
 * Fail fast instead of running a health-data service with unsafe settings.
 * Only enforced when NODE_ENV=production. DEMO_MODE=true allows mock messaging
 * (for a demo deployment) but never weak secrets.
 */
export function assertProductionConfig() {
  if (process.env.NODE_ENV !== "production") return;
  const problems: string[] = [];
  const pepper = process.env.OTP_PEPPER ?? "";
  const demo = process.env.DEMO_MODE === "true";

  if (!process.env.DATABASE_URL?.startsWith("postgres")) problems.push("DATABASE_URL must point to PostgreSQL");
  if (pepper.length < 32 || /change-me|dev/i.test(pepper)) problems.push("OTP_PEPPER must be a random secret of at least 32 characters");
  if (!config.appUrl.startsWith("https://") && !demo) problems.push("APP_URL must use https:// (links are sent to patients)");
  if (config.mockMessaging && !demo) problems.push("MOCK_MESSAGING is on: configure a real WhatsApp/SMS provider, or set DEMO_MODE=true for a demo");

  if (problems.length) {
    throw new Error(`Unsafe production configuration:\n - ${problems.join("\n - ")}`);
  }
  if (demo) log.warn("DEMO_MODE is on: mock messaging and the /dev/outbox page are enabled");
}
