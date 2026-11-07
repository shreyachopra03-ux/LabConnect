import { PatientShell } from "@/components/PatientShell";
import { config } from "@/lib/config";
import { getLang, t } from "@/lib/i18n";
import { safeNext } from "@/lib/nav";
import { requestOtpAction } from "../patient-actions";

export default async function LoginPage(props: { searchParams: Promise<{ e?: string; next?: string }> }) {
  const searchParams = await props.searchParams;
  const lang = await getLang();
  const next = safeNext(searchParams.next);
  const error = searchParams.e === "mobile" ? t(lang, "invalidMobile") : searchParams.e === "rate" ? t(lang, "rateLimited") : null;

  return (
    <PatientShell lang={lang}>
      <span className="eyebrow">{t(lang, "stepOf", { n: "1" })}</span>
      <h1>{t(lang, "loginTitle")}</h1>
      <p className="lede">{t(lang, "loginHint")}</p>
      <form action={requestOtpAction} className="stack">
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <label htmlFor="mobile">{t(lang, "mobileLabel")}</label>
          <input
            id="mobile"
            name="mobile"
            className="input"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={14}
            placeholder="98765 43210"
            required
            autoFocus
          />
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" type="submit">{t(lang, "sendCode")}</button>
      </form>
      {config.mockMessaging && (
        <p className="demo-note">
          Demo: try 9000000001. Codes and WhatsApp messages also appear in the <a href="/dev/outbox">mock outbox</a>.
        </p>
      )}
    </PatientShell>
  );
}
