"use server";

import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { requestOtp, verifyOtp } from "@/lib/otp";
import { normalizeMobile } from "@/lib/phone";
import { clearPendingMobile, endDoctorSession, getPendingMobile, setPendingMobile, startDoctorSession } from "@/lib/session";

const str = (fd: FormData, k: string) => (fd.get(k) ?? "").toString();

export async function doctorRequestOtpAction(fd: FormData) {
  const mobile = normalizeMobile(str(fd, "mobile"));
  if (!mobile) redirect("/doctor/login?e=mobile");
  if ((await requestOtp(mobile, "doctor")) === "rate_limited") redirect("/doctor/login?e=rate");
  await setPendingMobile(mobile);
  redirect("/doctor/verify");
}

export async function doctorVerifyOtpAction(fd: FormData) {
  const mobile = await getPendingMobile();
  if (!mobile) redirect("/doctor/login");
  const raw = str(fd, "code");
  const code = raw.match(/\d{6}/)?.[0] ?? raw.replace(/\D/g, "");
  if (code.length !== 6) redirect("/doctor/verify?e=format");

  const result = await verifyOtp(mobile, code);
  if (result !== "ok") redirect(`/doctor/verify?e=${result}`);

  const doctor = await db.doctor.findUnique({ where: { mobile } });
  if (!doctor) redirect("/doctor/login?e=unknown");
  await clearPendingMobile();
  await startDoctorSession(doctor.id);
  await audit({ actorType: "DOCTOR", actorId: doctor.id, action: "DOCTOR_LOGIN" });
  redirect("/doctor");
}

export async function doctorLogoutAction() {
  await endDoctorSession();
  redirect("/doctor/login");
}
