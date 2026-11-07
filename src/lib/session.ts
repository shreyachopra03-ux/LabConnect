import { cookies } from "next/headers";
import type { Session } from "@prisma/client";
import { config } from "./config";
import { randomToken, sha256 } from "./crypto";
import { db } from "./db";

const PATIENT_COOKIE = "cl_pt";
const STAFF_COOKIE = "cl_staff";
const DOCTOR_COOKIE = "cl_dr";
const OTP_PENDING_COOKIE = "cl_otp";

const minutes = (n: number) => new Date(Date.now() + n * 60_000);

async function create(cookie: string, data: Partial<Session> & { kind: string }, expiresAt: Date) {
  const raw = randomToken(32);
  await db.session.create({ data: { ...data, tokenHash: sha256(raw), expiresAt } });
  (await cookies()).set(cookie, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

async function read(cookie: string): Promise<Session | null> {
  const raw = (await cookies()).get(cookie)?.value;
  if (!raw) return null;
  const s = await db.session.findUnique({ where: { tokenHash: sha256(raw) } });
  return s && s.expiresAt > new Date() ? s : null;
}

async function end(cookie: string) {
  const raw = (await cookies()).get(cookie)?.value;
  if (raw) await db.session.deleteMany({ where: { tokenHash: sha256(raw) } });
  (await cookies()).delete(cookie);
}

export const startPatientSession = (mobile: string) =>
  create(PATIENT_COOKIE, { kind: "PATIENT", mobile }, minutes(config.patientSessionMinutes));

export function startLinkSession(mobile: string, orderId: string, linkExpiresAt: Date) {
  const cap = minutes(config.linkSessionMinutes);
  return create(PATIENT_COOKIE, { kind: "LINK", mobile, orderId }, cap < linkExpiresAt ? cap : linkExpiresAt);
}

export const getPatientSession = () => read(PATIENT_COOKIE);
export const endPatientSession = () => end(PATIENT_COOKIE);

export function canViewOrder(s: Session | null, order: { id: string; patient: { mobile: string } }): boolean {
  if (!s) return false;
  if (s.kind === "PATIENT") return s.mobile === order.patient.mobile;
  if (s.kind === "LINK") return s.orderId === order.id && s.mobile === order.patient.mobile;
  return false;
}

export async function setPendingMobile(mobile: string) {
  (await cookies()).set(OTP_PENDING_COOKIE, mobile, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
}
export const getPendingMobile = async () => (await cookies()).get(OTP_PENDING_COOKIE)?.value ?? null;
export const clearPendingMobile = async () => (await cookies()).delete(OTP_PENDING_COOKIE);

export const startStaffSession = (staffId: string) =>
  create(STAFF_COOKIE, { kind: "STAFF", staffId }, minutes(config.staffSessionHours * 60));

export async function getStaff() {
  const s = await read(STAFF_COOKIE);
  if (!s?.staffId) return null;
  return db.staff.findUnique({ where: { id: s.staffId }, select: { id: true, name: true, role: true } });
}

export const endStaffSession = () => end(STAFF_COOKIE);

export const startDoctorSession = (doctorId: string) =>
  create(DOCTOR_COOKIE, { kind: "DOCTOR", doctorId }, minutes(config.staffSessionHours * 60));

export async function getDoctor() {
  const s = await read(DOCTOR_COOKIE);
  if (!s?.doctorId) return null;
  return db.doctor.findUnique({ where: { id: s.doctorId }, select: { id: true, name: true } });
}

export const endDoctorSession = () => end(DOCTOR_COOKIE);

export const DOCTOR_WINDOW_DAYS = 90;
export const doctorWindowStart = () => new Date(Date.now() - DOCTOR_WINDOW_DAYS * 86_400_000);
