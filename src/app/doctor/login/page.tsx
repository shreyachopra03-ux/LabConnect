import { config } from "@/lib/config";
import { doctorRequestOtpAction } from "../doctor-actions";

const ERRORS: Record<string, string> = {
  mobile: "Please enter a valid 10-digit mobile number.",
  rate: "Too many codes requested. Please wait 10 minutes.",
  unknown: "This number is not registered as a referring doctor.",
};

export default async function DoctorLogin(props: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await props.searchParams;
  return (
    <div style={{ maxWidth: 380, margin: "48px auto" }}>
      <span className="eyebrow">Referring doctors</span>
      <h1>Doctor sign in</h1>
      <p className="muted">Your patients’ reports from the last 90 days, in one place.</p>
      <form action={doctorRequestOtpAction} className="stack" style={{ marginTop: 24 }}>
        <div>
          <label htmlFor="m">Registered mobile number</label>
          <input id="m" name="mobile" className="input" type="tel" inputMode="numeric" autoComplete="tel-national" required autoFocus />
        </div>
        {e && ERRORS[e] && <p className="error">{ERRORS[e]}</p>}
        <button className="btn" type="submit" style={{ width: "100%" }}>Send code</button>
      </form>
      {config.mockMessaging && (
        <p className="small muted" style={{ marginTop: 24 }}>
          Demo: try 9100000001 (Dr. S. Ramanaiah). The code appears in the <a href="/dev/outbox" target="_blank">mock outbox</a>.
        </p>
      )}
    </div>
  );
}
