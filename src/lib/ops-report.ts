import { db } from "./db";

export type OrderRow = {
  orderId: string;
  signedAt: Date;
  day: string;
  critical: boolean;
  channel: string | null;
  delivered: boolean;
  failedMessages: number;
  resends: number;
  firstOpenedAt: Date | null;
  hoursToOpen: number | null;
  pdfDownloads: number;
};

const istDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

/** Delivery and access report for the operations head. No patient names: order-level only. */
export async function buildOpsReport(days: number) {
  const since = new Date(Date.now() - days * 86_400_000);
  const orders = await db.order.findMany({
    where: { signedAt: { gte: since } },
    orderBy: { signedAt: "desc" },
    select: {
      id: true,
      signedAt: true,
      isCritical: true,
      links: { select: { createdBy: true } },
      messages: { where: { kind: "REPORT_LINK" }, orderBy: { createdAt: "asc" }, select: { channel: true, status: true } },
    },
  });
  const ids = orders.map((o) => o.id);
  const logs = await db.accessLog.findMany({
    where: { orderId: { in: ids }, actorType: { in: ["PATIENT", "LINK"] }, action: { in: ["REPORT_VIEWED", "PDF_DOWNLOADED"] } },
    orderBy: { createdAt: "asc" },
    select: { orderId: true, action: true, createdAt: true },
  });

  const rows: OrderRow[] = orders.map((o) => {
    const signedAt = o.signedAt!;
    const mine = logs.filter((l) => l.orderId === o.id);
    const firstView = mine.find((l) => l.action === "REPORT_VIEWED")?.createdAt ?? null;
    const delivered = o.messages.find((m) => m.status === "DELIVERED");
    return {
      orderId: o.id,
      signedAt,
      day: istDay(signedAt),
      critical: o.isCritical,
      channel: delivered?.channel ?? null,
      delivered: !!delivered,
      failedMessages: o.messages.filter((m) => m.status === "FAILED").length,
      resends: o.links.filter((l) => l.createdBy !== "SYSTEM").length,
      firstOpenedAt: firstView,
      hoursToOpen: firstView ? Math.max(0, (firstView.getTime() - signedAt.getTime()) / 3_600_000) : null,
      pdfDownloads: mine.filter((l) => l.action === "PDF_DOWNLOADED").length,
    };
  });

  const n = rows.length;
  const delivered = rows.filter((r) => r.delivered).length;
  const opened = rows.filter((r) => r.firstOpenedAt).length;
  const hours = rows.map((r) => r.hoursToOpen).filter((h): h is number => h !== null).sort((a, b) => a - b);
  const median = hours.length ? hours[Math.floor(hours.length / 2)] : null;

  const byDay = new Map<string, { signed: number; delivered: number; opened: number; failed: number; resends: number }>();
  for (const r of rows) {
    const d = byDay.get(r.day) ?? { signed: 0, delivered: 0, opened: 0, failed: 0, resends: 0 };
    d.signed++;
    if (r.delivered) d.delivered++;
    if (r.firstOpenedAt) d.opened++;
    d.failed += r.failedMessages;
    d.resends += r.resends;
    byDay.set(r.day, d);
  }

  const [callbacksOpen, callbacksDone, summaryFlags] = await Promise.all([
    db.callbackTask.count({ where: { status: "OPEN" } }),
    db.callbackTask.count({ where: { status: "DONE", doneAt: { gte: since } } }),
    db.summaryFlag.count({ where: { createdAt: { gte: since } } }),
  ]);

  return {
    days,
    rows,
    totals: {
      signed: n,
      delivered,
      opened,
      medianHoursToOpen: median,
      viaWhatsapp: rows.filter((r) => r.channel === "WHATSAPP").length,
      viaSms: rows.filter((r) => r.channel === "SMS").length,
      failedMessages: rows.reduce((s, r) => s + r.failedMessages, 0),
      resends: rows.reduce((s, r) => s + r.resends, 0),
      pdfDownloads: rows.reduce((s, r) => s + r.pdfDownloads, 0),
      critical: rows.filter((r) => r.critical).length,
      callbacksOpen,
      callbacksDone,
      summaryFlags,
    },
    byDay: [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)),
  };
}

export const parseDays = (v: unknown) => ([7, 30, 90].includes(Number(v)) ? Number(v) : 30);
