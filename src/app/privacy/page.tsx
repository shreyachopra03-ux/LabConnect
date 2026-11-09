import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { redirect } from "next/navigation";
import { PatientShell } from "@/components/PatientShell";
import { getLang, t } from "@/lib/i18n";
import { maskMobile } from "@/lib/phone";
import { getPatientSession } from "@/lib/session";
import { withdrawConsentAction } from "../patient-actions";

/** DPDP Act 2023: the patient can withdraw consent as easily as they gave it. */
export default async function PrivacyPage(props: { searchParams: Promise<{ done?: string }> }) {
  const { done } = await props.searchParams;
  const lang = await getLang();

  if (done) {
    return (
      <PatientShell lang={lang}>
        <h1>{t(lang, "withdrawnTitle")}</h1>
        <p className="muted">{t(lang, "withdrawnBody")}</p>
        <Link className="btn secondary" href="/login" style={{ marginTop: 28 }}>
          {t(lang, "login")}
        </Link>
      </PatientShell>
    );
  }

  const s = await getPatientSession();
  if (!s?.mobile) redirect("/login?next=/privacy");

  return (
    <PatientShell lang={lang}>
      <span className="eyebrow">{t(lang, "privacyLink")}</span>
      <h1>{t(lang, "privacyTitle")}</h1>
      <p style={{ fontSize: "1.08rem" }}>{t(lang, "privacyBody", { m: maskMobile(s.mobile) })}</p>
      <p className="muted">{t(lang, "privacyFamily")}</p>
      <form action={withdrawConsentAction} className="stack" style={{ marginTop: 28 }}>
        <SubmitButton className="btn secondary" style={{ color: "var(--critical)" }} pendingLabel={t(lang, "pleaseWait")}>
          {t(lang, "withdrawButton")}
        </SubmitButton>
      </form>
      <Link className="btn" href="/orders" style={{ marginTop: 14 }}>
        {t(lang, "keepSharing")}
      </Link>
    </PatientShell>
  );
}
