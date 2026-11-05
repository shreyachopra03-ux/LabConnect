import { headers } from "next/headers";
import { db } from "./db";

export type ActorType = "PATIENT" | "LINK" | "STAFF" | "SYSTEM";

/** Append-only access log (DPDP: who saw which health record, when, from where). */
export async function audit(e: {
  actorType: ActorType;
  actorId: string;
  action: string;
  orderId?: string | null;
  patientId?: string | null;
  detail?: string;
}) {
  let ip: string | undefined;
  let userAgent: string | undefined;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "local";
    userAgent = h.get("user-agent")?.slice(0, 200) ?? undefined;
  } catch {
    // Outside a request (LIS watcher, seed): no request context.
  }
  await db.accessLog.create({
    data: {
      actorType: e.actorType,
      actorId: e.actorId,
      action: e.action,
      orderId: e.orderId ?? null,
      patientId: e.patientId ?? null,
      detail: e.detail,
      ip,
      userAgent,
    },
  });
}
