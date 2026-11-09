import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { redirect } from "next/navigation";
import { PatientShell } from "@/components/PatientShell";
import { config } from "@/lib/config";
import { getLang, t, type MsgKey } from "@/lib/i18n";
import { safeNext, withNext } from "@/lib/nav";
import { latestMockCode } from "@/lib/otp";
import { maskMobile } from "@/lib/phone";
import { getPendingMobile } from "@/lib/session";
import { resendOtpAction, verifyOtpAction } from "../../patient-actions";

const ERRORS: Record<string, MsgKey> = { format: "otpFormat", invalid: "otpInvalid", expired: "otpExpired", locked: "otpLocked", rate: "rateLimited" };

export default async function VerifyPage(props: { searchParams: Promise<{ e?: string; next?: string; sent?: string }> }) {
  const searchParams = await props.searchParams;
  const lang = await getLang();
  const next = safeNext(searchParams.next);
  const mobile = await getPendingMobile();
  if (!mobile) redirect(withNext("/login", next));
  const errorKey = searchParams.e ? ERRORS[searchParams.e] : undefined;
  const demoCode = await latestMockCode(mobile);

  return (
    <PatientShell lang={lang}>
      <span className="eyebrow">{t(lang, "stepOf", { n: "2" })}</span>
      <h1>{t(lang, "otpTitle")}</h1>
      <p className="lede" id="otp-hint">{t(lang, "otpSentTo", { m: maskMobile(mobile) })}</p>
      <form action={verifyOtpAction} className="stack">
        {next && <input type="hidden" name="next" value={next} />}
        <input
          name="code"
          className="input code"
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={t(lang, "otpTitle")}
          aria-describedby="otp-hint"
          title={t(lang, "otpTitle")}
          placeholder="••••••"
          required
          autoFocus
        />
        {errorKey && <p className="error" role="alert">{t(lang, errorKey)}</p>}
        <SubmitButton pendingLabel={t(lang, "pleaseWait")}>{t(lang, "continue")}</SubmitButton>
      </form>
      <div className="row" style={{ justifyContent: "space-between", marginTop: 20 }}>
        <form action={resendOtpAction}>
          {next && <input type="hidden" name="next" value={next} />}
          <SubmitButton className="linkbtn" pendingLabel={t(lang, "pleaseWait")}>{t(lang, "resend")}</SubmitButton>
        </form>
        <Link href={withNext("/login", next)}>{t(lang, "changeNumber")}</Link>
      </div>
      {config.mockMessaging && (
        <p className="demo-note">
          {demoCode ? (
            <>Demo: no real SMS is sent. The latest code for this number is <strong>{demoCode}</strong>.</>
          ) : (
            <>Demo: no real SMS is sent, and codes are only issued for numbers that have reports: 9000000001, 9000000002, 9000000099.</>
          )}
        </p>
      )}
    </PatientShell>
  );
}
