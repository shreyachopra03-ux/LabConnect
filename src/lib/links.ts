import { audit } from "./audit";
import { config } from "./config";
import { randomToken, sha256 } from "./crypto";
import { db } from "./db";

/** 32 random bytes = 256 bits, 43 base64url characters. Only the SHA-256 hash is stored; the raw token is never logged. */
export const LINK_TOKEN_BYTES = 32;

export async function issueLink(orderId: string, mobile: string, createdBy: string) {
  const now = new Date();
  await revokeActiveLinks({ orderId }, createdBy, "replaced by a new link");

  const raw = randomToken(LINK_TOKEN_BYTES);
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

/** Revokes every live link matching the filter and writes one audit row per link (C010). */
export async function revokeActiveLinks(where: { orderId?: string; mobile?: string }, actorId: string, reason: string) {
  const now = new Date();
  const live = await db.reportLink.findMany({
    where: { ...where, revokedAt: null, expiresAt: { gt: now } },
    select: { id: true, orderId: true },
  });
  if (live.length === 0) return 0;
  await db.reportLink.updateMany({ where: { id: { in: live.map((l) => l.id) } }, data: { revokedAt: now } });
  for (const l of live) {
    await audit({
      actorType: actorId === "SYSTEM" ? "SYSTEM" : actorId.startsWith("patient:") ? "PATIENT" : "STAFF",
      actorId: actorId.replace(/^patient:/, ""),
      action: "LINK_REVOKED",
      orderId: l.orderId,
      detail: reason,
    });
  }
  return live.length;
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
