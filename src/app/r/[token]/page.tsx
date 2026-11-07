import Link from "next/link";
import { PatientShell } from "@/components/PatientShell";
import { getLang, t } from "@/lib/i18n";
import { resolveLink } from "@/lib/links";
import { maskMobile } from "@/lib/phone";
import { linkOtpAction, openLinkAction } from "../../patient-actions";

export const dynamic = "force-dynamic";

/**
 * Landing page for WhatsApp/SMS links. Rendering it has no side effects: the report is
 * unlocked only by the POST button, so link-preview bots can't use the link up.
 */
export default async function LinkLanding(props: { params: Promise<{ token: string }>; searchParams: Promise<{ e?: string }> }) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const lang = await getLang();
  const { state, link } = await resolveLink(params.token);

  return (
    <PatientShell lang={lang} variant="gate">
      <div className="seal" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="10.5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>

      {state === "valid" && (
        <>
          <span className="eyebrow" style={{ color: "var(--on-dark-muted)" }}>{t(lang, "secureAccess")}</span>
          <h1 className="reveal">{t(lang, "linkReadyTitle")}</h1>
          <p className="lede reveal d1">{t(lang, "linkReadyBody")}</p>
          <form action={openLinkAction} className="reveal d2">
            <input type="hidden" name="token" value={params.token} />
            <button className="btn light" type="submit">
              {t(lang, "openReport")} <span className="arrow" aria-hidden="true">→</span>
            </button>
          </form>
        </>
      )}

      {state === "expired" && link && (
        <>
          <span className="eyebrow" style={{ color: "var(--on-dark-muted)" }}>{t(lang, "secureAccess")}</span>
          <h1>{t(lang, "linkExpiredTitle")}</h1>
          <p className="lede">{t(lang, "linkExpiredBody", { m: maskMobile(link.mobile) })}</p>
          {searchParams.e === "rate" && <p className="error">{t(lang, "rateLimited")}</p>}
          <form action={linkOtpAction} style={{ marginTop: 8 }}>
            <input type="hidden" name="token" value={params.token} />
            <button className="btn light" type="submit">{t(lang, "sendCode")}</button>
          </form>
        </>
      )}

      {(state === "invalid" || state === "revoked") && (
        <>
          <h1>{t(lang, "linkInvalidTitle")}</h1>
          <p className="lede">{t(lang, "linkInvalidBody")}</p>
          <Link className="btn light" href="/login">
            {t(lang, "login")}
          </Link>
        </>
      )}
    </PatientShell>
  );
}
