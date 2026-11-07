"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { verifyPassword } from "@/lib/crypto";
import { db } from "@/lib/db";
import { releaseHeldLink, sendLinkForOrder } from "@/lib/delivery";
import { revokeActiveLinks } from "@/lib/links";
import { demoMode, dropDemoExport } from "@/lib/lis/demo";
import { scanInbox } from "@/lib/lis/import";
import { endStaffSession, getStaff, startStaffSession } from "@/lib/session";

const str = (fd: FormData, k: string) => (fd.get(k) ?? "").toString().trim();

async function requireStaff() {
  const staff = await getStaff();
  if (!staff) redirect("/staff/login");
  return staff;
}

export async function staffLoginAction(fd: FormData) {
  const user = await db.staff.findUnique({ where: { username: str(fd, "username").toLowerCase() } });
  if (!user || !verifyPassword(str(fd, "password"), user.passwordHash)) redirect("/staff/login?e=1");
  await startStaffSession(user.id);
  await audit({ actorType: "STAFF", actorId: user.id, action: "STAFF_LOGIN" });
  redirect("/staff");
}

export async function staffLogoutAction() {
  await endStaffSession();
  redirect("/staff/login");
}

export async function resendLinkAction(fd: FormData) {
  const staff = await requireStaff();
  const orderId = str(fd, "orderId");
  const channel = str(fd, "channel") === "SMS" ? "SMS" : "WHATSAPP";
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "READY") redirect(`/staff?e=notready`);
  const msg = await sendLinkForOrder(orderId, staff.id, channel);
  if (!msg) redirect(`/staff/patients/${order.patientId}?blocked=1`);
  redirect(`/staff/patients/${order.patientId}?sent=${encodeURIComponent(orderId)}`);
}

export async function completeCallbackAction(fd: FormData) {
  const staff = await requireStaff();
  const task = await db.callbackTask.update({
    where: { id: str(fd, "taskId") },
    data: { status: "DONE", doneAt: new Date(), doneBy: staff.name },
  });
  await audit({ actorType: "STAFF", actorId: staff.id, action: "CALLBACK_DONE", orderId: task.orderId });
  await releaseHeldLink(task.orderId, staff.id);
  revalidatePath("/staff");
}

export async function scanLisAction() {
  const staff = await requireStaff();
  const out = await scanInbox();
  await audit({ actorType: "STAFF", actorId: staff.id, action: "LIS_SCAN", detail: `${out.length} file(s)` });
  redirect(`/staff?scanned=${out.length}`);
}

/** Demo only: simulate the LIS dropping an export (sign-off or amendment), then import it right away. */
export async function simulateLisAction(fd: FormData) {
  const staff = await requireStaff();
  if (!demoMode()) redirect("/staff");
  const which = str(fd, "which") === "amended" ? "amended" : "signed";
  dropDemoExport(which);
  const out = await scanInbox();
  await audit({ actorType: "STAFF", actorId: staff.id, action: "LIS_DEMO_SIMULATED", detail: which });
  redirect(`/staff?scanned=${out.length}`);
}

/* ---------- Pathologist review (brief: 50 summaries a week) ---------- */

async function requirePathologist() {
  const staff = await requireStaff();
  if (staff.role !== "PATHOLOGIST") redirect("/staff");
  return staff;
}

export async function approveSummaryAction(fd: FormData) {
  const staff = await requirePathologist();
  const s = await db.summary.update({
    where: { id: str(fd, "summaryId") },
    data: { reviewedAt: new Date(), reviewedBy: staff.name, withdrawnAt: null, withdrawnBy: null },
  });
  await audit({ actorType: "STAFF", actorId: staff.id, action: "SUMMARY_APPROVED", orderId: s.orderId });
  revalidatePath("/staff/summaries");
}

/** The summary is wrong: hide it from the patient. They still see the full report and results. */
export async function withdrawSummaryAction(fd: FormData) {
  const staff = await requirePathologist();
  const now = new Date();
  const s = await db.summary.update({
    where: { id: str(fd, "summaryId") },
    data: { reviewedAt: now, reviewedBy: staff.name, withdrawnAt: now, withdrawnBy: staff.name },
  });
  await audit({ actorType: "STAFF", actorId: staff.id, action: "SUMMARY_WITHDRAWN", orderId: s.orderId });
  revalidatePath("/staff/summaries");
}

/* ---------- Consent withdrawal recorded by staff (patient asked by phone or at the desk) ---------- */

export async function recordWithdrawalAction(fd: FormData) {
  const staff = await requireStaff();
  const patient = await db.patient.findUnique({ where: { id: str(fd, "patientId") } });
  if (!patient) redirect("/staff");
  const now = new Date();
  await db.contact.update({ where: { mobile: patient.mobile }, data: { consentAt: null, consentWithdrawnAt: now } });
  await revokeActiveLinks({ mobile: patient.mobile }, staff.id, "consent withdrawal recorded by staff");
  await audit({ actorType: "STAFF", actorId: staff.id, action: "CONSENT_WITHDRAWN", patientId: patient.id, detail: "recorded by staff" });
  redirect(`/staff/patients/${patient.id}`);
}
