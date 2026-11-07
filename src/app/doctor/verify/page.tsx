import Link from "next/link";
import { redirect } from "next/navigation";
import { latestMockCode } from "@/lib/otp";
import { maskMobile } from "@/lib/phone";
import { getPendingMobile } from "@/lib/session";
import { doctorVerifyOtpAction } from "../doctor-actions";

const ERRORS: Record<string, string> = {
  format: "Please enter all 6 digits of the code.",
  invalid: "That code is not correct. Please try again.",
  expired: "This code has expired. Please ask for a new one.",
  locked: "Too many tries. Please ask for a new code.",
};

export default async function DoctorVerify(props: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await props.searchParams;
  const mobile = await getPendingMobile();
  if (!mobile) redirect("/doctor/login");
  const demoCode = await latestMockCode(mobile);

  return (
    <div style={{ maxWidth: 380, margin: "48px auto" }}>
      <h1>Enter the 6-digit code</h1>
      <p className="muted">We sent a code by SMS to {maskMobile(mobile)}.</p>
      <form action={doctorVerifyOtpAction} className="stack" style={{ marginTop: 24 }}>
        <input name="code" className="input" inputMode="numeric" autoComplete="one-time-code" aria-label="Code" required autoFocus />
        {e && ERRORS[e] && <p className="error">{ERRORS[e]}</p>}
        <button className="btn" type="submit" style={{ width: "100%" }}>Continue</button>
      </form>
      {demoCode && (
        <p className="notice small" style={{ marginTop: 16 }}>
          Demo: no real SMS is sent. The latest code for this number is <strong className="mono">{demoCode}</strong>.
        </p>
      )}
      <p className="small" style={{ marginTop: 16 }}>
        <Link href="/doctor/login">Change number or resend</Link>
      </p>
    </div>
  );
}
