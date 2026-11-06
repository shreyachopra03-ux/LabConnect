import Link from "next/link";
import { PatientShell } from "@/components/PatientShell";
import { getLang, t } from "@/lib/i18n";
import { resolveLink } from "@/lib/links";
import { maskMobile } from "@/lib/phone";
import { linkOtpAction, openLinkAction } from "../../patient-actions";

export const dynamic = "force-dynamic";

export default async function LinkLanding(props: { params: Promise<{ token: string }>; searchParams: Promise<{ e?: string }> }) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const lang = await getLang();
  const { state, link } = await resolveLink(params.token);

  return (
    <PatientShell lang={lang}>
      {state === "valid" && (
        <>
          <h1>{t(lang, "linkReadyTitle")}</h1>
          <p className="muted">{t(lang, "linkReadyBody")}</p>
          <form action={openLinkAction} style={{ marginTop: 28 }}>
            <input type="hidden" name="token" value={params.token} />
            <button className="btn" type="submit">{t(lang, "openReport")}</button>
          </form>
        </>
      )}

      {state === "expired" && link && (
        <>
          <h1>{t(lang, "linkExpiredTitle")}</h1>
          <p className="muted">{t(lang, "linkExpiredBody", { m: maskMobile(link.mobile) })}</p>
          {searchParams.e === "rate" && <p className="error">{t(lang, "rateLimited")}</p>}
          <form action={linkOtpAction} style={{ marginTop: 28 }}>
            <input type="hidden" name="token" value={params.token} />
            <button className="btn" type="submit">{t(lang, "sendCode")}</button>
          </form>
        </>
      )}

      {(state === "invalid" || state === "revoked") && (
        <>
          <h1>{t(lang, "linkInvalidTitle")}</h1>
          <p className="muted">{t(lang, "linkInvalidBody")}</p>
          <Link className="btn" href="/login" style={{ marginTop: 28 }}>
            {t(lang, "login")}
          </Link>
        </>
      )}
    </PatientShell>
  );
}
