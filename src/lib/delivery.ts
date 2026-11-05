import { audit } from "./audit";
import { db } from "./db";
import { isLang } from "./i18n";
import { issueLink } from "./links";
import { sendReportLink, type Channel } from "./messaging";
import { buildSummary } from "./summary";

/**
 * Runs once when the pathologist signs a report (LIS status -> READY):
 *  1. Critical report  -> no summary, open a callback task for staff.
 *     Otherwise         -> plain-language summary of out-of-range values.
 *  2. Issue a 72-hour link and send it on WhatsApp (SMS fallback).
 */
export async function onReportSigned(orderId: string) {
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { results: { orderBy: { position: "asc" } }, patient: true },
  });

  if (order.isCritical) {
    await db.summary.upsert({
      where: { orderId },
      create: { orderId, source: "NONE_CRITICAL", content: JSON.stringify({ items: [] }) },
      update: { source: "NONE_CRITICAL", content: JSON.stringify({ items: [] }) },
    });
    const open = await db.callbackTask.count({ where: { orderId, status: "OPEN" } });
    if (!open) {
      const crit = order.results.filter((r) => r.critical).map((r) => `${r.parameter} ${r.valueText}`);
      await db.callbackTask.create({
        data: { orderId, reason: `Critical value: ${crit.join(", ") || "flagged critical by LIS"}` },
      });
    }
  } else {
    const { source, content } = await buildSummary(order.results);
    await db.summary.upsert({
      where: { orderId },
      create: { orderId, source, content: JSON.stringify(content) },
      update: { source, content: JSON.stringify(content), reviewedAt: null, reviewedBy: null },
    });
  }

  await sendLinkForOrder(orderId, "SYSTEM");
}

/** Issues a fresh link (revoking older ones) and sends it. Used on sign-off and by front-desk resend. */
export async function sendLinkForOrder(orderId: string, actorId: string, channel?: Channel) {
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { patient: { include: { contact: true } } },
  });
  const { link, url } = await issueLink(orderId, order.patient.mobile, actorId);
  const lang = isLang(order.patient.contact.lang) ? order.patient.contact.lang : "te";
  const msg = await sendReportLink({
    orderId,
    linkId: link.id,
    mobile: order.patient.mobile,
    lang,
    patientName: order.patient.name,
    url,
    channel,
  });
  await audit({
    actorType: actorId === "SYSTEM" ? "SYSTEM" : "STAFF",
    actorId,
    action: actorId === "SYSTEM" ? "LINK_SENT_ON_SIGNOFF" : "LINK_RESENT",
    orderId,
    patientId: order.patientId,
    detail: `${msg.channel} ${msg.status}`,
  });
  return msg;
}
