"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { isLang } from "@/lib/i18n";
import { resolveLink } from "@/lib/links";
import { safeNext, withNext } from "@/lib/nav";
import { requestOtp, verifyOtp } from "@/lib/otp";
import { normalizeMobile } from "@/lib/phone";
import {
  canViewOrder,
  clearPendingMobile,
  endPatientSession,
  getPatientSession,
  getPendingMobile,
  setPendingMobile,
  startLinkSession,
  startPatientSession,
} from "@/lib/session";

const str = (fd: FormData, k: string) => (fd.get(k) ?? "").toString();


export async function requestOtpAction(fd: FormData) {
  const next = safeNext(str(fd, "next"));
  const mobile = normalizeMobile(str(fd, "mobile"));
  if (!mobile) redirect(withNext("/login", next, { e: "mobile" }));
  if ((await requestOtp(mobile)) === "rate_limited") redirect(withNext("/login", next, { e: "rate" }));
  await setPendingMobile(mobile);
  redirect(withNext("/login/verify", next));
}

export async function resendOtpAction(fd: FormData) {
  const next = safeNext(str(fd, "next"));
  const mobile = await getPendingMobile();
  if (!mobile) redirect(withNext("/login", next));
  const r = await requestOtp(mobile);
  redirect(withNext("/login/verify", next, r === "rate_limited" ? { e: "rate" } : { sent: "1" }));
}

export async function verifyOtpAction(fd: FormData) {
  const next = safeNext(str(fd, "next"));
  const mobile = await getPendingMobile();
  if (!mobile) redirect(withNext("/login", next));

  const raw = str(fd, "code");
  const code = raw.match(/\d{6}/)?.[0] ?? raw.replace(/\D/g, "");
  if (code.length !== 6) redirect(withNext("/login/verify", next, { e: "format" }));
  const result = await verifyOtp(mobile, code);
  if (result !== "ok") redirect(withNext("/login/verify", next, { e: result }));

  await clearPendingMobile();
  await startPatientSession(mobile);
  await audit({ actorType: "PATIENT", actorId: mobile, action: "OTP_LOGIN" });

  const contact = await db.contact.findUnique({ where: { mobile } });
  if (contact && !(await cookies()).get("lang") && isLang(contact.lang)) (await cookies()).set("lang", contact.lang, { path: "/", maxAge: 31536000 });
  if (!contact?.consentAt) redirect(withNext("/consent", next));
  redirect(next ?? "/orders");
}


export async function consentAction(fd: FormData) {
  const next = safeNext(str(fd, "next"));
  const s = await getPatientSession();
  if (!s?.mobile) redirect("/login");
  await db.contact.update({
    where: { mobile: s.mobile },
    data: { consentAt: new Date(), consentVersion: config.consentVersion, consentWithdrawnAt: null },
  });
  await audit({ actorType: s.kind === "LINK" ? "LINK" : "PATIENT", actorId: s.mobile, action: "CONSENT_GIVEN", detail: config.consentVersion });
  redirect(next ?? "/orders");
}


export async function openLinkAction(fd: FormData) {
  const token = str(fd, "token");
  const { state, link } = await resolveLink(token);
  if (state !== "valid" || !link) redirect(`/r/${encodeURIComponent(token)}`);

  const existing = await getPatientSession();
  const alreadyIn = existing?.kind === "PATIENT" && existing.mobile === link.mobile;
  if (!alreadyIn) await startLinkSession(link.mobile, link.orderId, link.expiresAt);

  await db.reportLink.update({
    where: { id: link.id },
    data: { openCount: { increment: 1 }, firstOpenedAt: link.firstOpenedAt ?? new Date() },
  });
  await audit({ actorType: "LINK", actorId: link.id, action: "LINK_OPENED", orderId: link.orderId });

  const contact = await db.contact.findUnique({ where: { mobile: link.mobile } });
  if (contact && !(await cookies()).get("lang") && isLang(contact.lang)) (await cookies()).set("lang", contact.lang, { path: "/", maxAge: 31536000 });
  redirect(`/reports/${link.orderId}`);
}

export async function linkOtpAction(fd: FormData) {
  const token = str(fd, "token");
  const { state, link } = await resolveLink(token);
  if (state !== "expired" || !link) redirect(`/r/${encodeURIComponent(token)}`);
  const next = `/reports/${link.orderId}`;
  if ((await requestOtp(link.mobile)) === "rate_limited") redirect(`/r/${encodeURIComponent(token)}?e=rate`);
  await setPendingMobile(link.mobile);
  redirect(withNext("/login/verify", next));
}


export async function flagSummaryAction(fd: FormData) {
  const orderId = str(fd, "orderId");
  const lang = str(fd, "lang");
  const s = await getPatientSession();
  const order = await db.order.findUnique({ where: { id: orderId }, include: { patient: true, summary: true } });
  if (!order || !canViewOrder(s, order) || !order.summary) redirect("/login");

  await db.$transaction([
    db.summaryFlag.create({ data: { summaryId: order.summary.id, lang: isLang(lang) ? lang : "en" } }),
    db.summary.update({ where: { id: order.summary.id }, data: { flagCount: { increment: 1 } } }),
  ]);
  await audit({ actorType: s!.kind === "LINK" ? "LINK" : "PATIENT", actorId: s!.mobile ?? "", action: "SUMMARY_FLAGGED", orderId, patientId: order.patientId });
  redirect(`/reports/${orderId}?flagged=1`);
}

/* ---------- Consent withdrawal (DPDP Act 2023) ---------- */

/** Stops all future report links to this number, revokes current ones and ends the session. */
export async function withdrawConsentAction() {
  const s = await getPatientSession();
  if (!s?.mobile) redirect("/login");
  const now = new Date();
  await db.contact.update({ where: { mobile: s.mobile }, data: { consentAt: null, consentWithdrawnAt: now } });
  await db.reportLink.updateMany({ where: { mobile: s.mobile, revokedAt: null, expiresAt: { gt: now } }, data: { revokedAt: now } });
  await audit({ actorType: s.kind === "LINK" ? "LINK" : "PATIENT", actorId: s.mobile, action: "CONSENT_WITHDRAWN" });
  await endPatientSession();
  redirect("/privacy?done=1");
}
