import { config } from "./config";
import { randomToken, sha256 } from "./crypto";
import { db } from "./db";

export async function issueLink(orderId: string, mobile: string, createdBy: string) {
  const now = new Date();
  await db.reportLink.updateMany({
    where: { orderId, revokedAt: null, expiresAt: { gt: now } },
    data: { revokedAt: now },
  });
  
  const raw = randomToken(24);
  const link = await db.reportLink.create({
    data: {
      tokenHash: sha256(raw),
      orderId,
      mobile,
      createdBy,
      expiresAt: new Date(now.getTime() + config.linkTtlHours * 3_600_000),
    },
  });
  return { link, url: `${config.appUrl}/r/${raw}` };
}

export type LinkState = "valid" | "expired" | "revoked" | "invalid";

export async function resolveLink(raw: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(raw)) return { state: "invalid" as LinkState, link: null };
  const link = await db.reportLink.findUnique({ where: { tokenHash: sha256(raw) } });
  if (!link) return { state: "invalid" as LinkState, link: null };
  if (link.revokedAt) return { state: "revoked" as LinkState, link };
  if (link.expiresAt <= new Date()) return { state: "expired" as LinkState, link };
  return { state: "valid" as LinkState, link };
}

export function linkStatus(l: { revokedAt: Date | null; expiresAt: Date }) {
  if (l.revokedAt) return "Replaced";
  return l.expiresAt > new Date() ? "Active" : "Expired";
}
