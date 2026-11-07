import { db } from "./db";
import { log } from "./logger";

/** Removes expired sessions and old OTPs. Access logs and messages are kept (audit trail). */
export async function purgeExpired() {
  const dayAgo = new Date(Date.now() - 86_400_000);
  const [sessions, otps] = await Promise.all([
    db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    db.otp.deleteMany({ where: { createdAt: { lt: dayAgo } } }),
  ]);
  if (sessions.count || otps.count) log.info("cleanup", { sessions: sessions.count, otps: otps.count });
}
