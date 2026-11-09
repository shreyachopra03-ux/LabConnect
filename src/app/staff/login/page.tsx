import { staffLoginAction } from "../staff-actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function StaffLogin(props: { searchParams: Promise<{ e?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <div style={{ maxWidth: 380, margin: "48px auto" }}>
      <span className="eyebrow">Lab team</span>
      <h1>Staff sign in</h1>
      <p className="muted">Front-desk console for report delivery.</p>
      <form action={staffLoginAction} className="stack" style={{ marginTop: 24 }}>
        <div>
          <label htmlFor="u">Username</label>
          <input id="u" name="username" className="input" autoComplete="username" required autoFocus />
        </div>
        <div>
          <label htmlFor="p">Password</label>
          <input id="p" name="password" type="password" className="input" autoComplete="current-password" required />
        </div>
        {searchParams.e && <p className="error">Wrong username or password.</p>}
        <SubmitButton style={{ width: "100%" }} pendingLabel="Signing in…">Sign in</SubmitButton>
      </form>
    </div>
  );
}
