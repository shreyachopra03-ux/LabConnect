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
export async function onReportSigned(orderId: string, opts: { amended?: boolean } = {}) {
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
      update: { source, content: JSON.stringify(content), reviewedAt: null, reviewedBy: null, withdrawnAt: null, withdrawnBy: null },
    });
  }

  if (order.isCritical) {
    // C011: a person calls first. The link is sent when staff complete the callback task.
    await audit({ actorType: "SYSTEM", actorId: "SYSTEM", action: "LINK_HELD_CRITICAL", orderId, patientId: order.patientId });
    return;
  }
  await sendLinkForOrder(orderId, "SYSTEM", undefined, opts.amended);
}

/** After the critical-value call: release the report link held back on sign-off (C011). */
export async function releaseHeldLink(orderId: string, staffId: string) {
  const live = await db.reportLink.count({ where: { orderId, revokedAt: null, expiresAt: { gt: new Date() } } });
  if (live > 0) return null;
  return sendLinkForOrder(orderId, staffId);
}

/**
 * The pathologist re-signed a report with changed results. Summary and critical
 * checks are rebuilt from the new results, older links are revoked, and the patient
 * gets an "updated report" message.
 */
export const onReportAmended = (orderId: string) => onReportSigned(orderId, { amended: true });

export const consentWithdrawn = (c: { consentAt: Date | null; consentWithdrawnAt: Date | null }) =>
  !!c.consentWithdrawnAt && !c.consentAt;

/** Issues a fresh link (revoking older ones) and sends it. Used on sign-off and by front-desk resend. */
export async function sendLinkForOrder(orderId: string, actorId: string, channel?: Channel, amended = false) {
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { patient: { include: { contact: true } } },
  });
  if (consentWithdrawn(order.patient.contact)) {
    // DPDP: the patient withdrew consent, so nothing is sent to this number.
    await audit({ actorType: actorId === "SYSTEM" ? "SYSTEM" : "STAFF", actorId, action: "LINK_SKIPPED_NO_CONSENT", orderId, patientId: order.patientId });
    return null;
  }
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
    amended,
  });
  await audit({
    actorType: actorId === "SYSTEM" ? "SYSTEM" : "STAFF",
    actorId,
    action: actorId !== "SYSTEM" ? "LINK_RESENT" : amended ? "LINK_SENT_ON_AMENDMENT" : "LINK_SENT_ON_SIGNOFF",
    orderId,
    patientId: order.patientId,
    detail: `${msg.channel} ${msg.status}`,
  });
  return msg;
}
