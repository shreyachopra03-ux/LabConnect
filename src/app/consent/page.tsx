import { redirect } from "next/navigation";
import { PatientShell } from "@/components/PatientShell";
import { getLang, t } from "@/lib/i18n";
import { safeNext, withNext } from "@/lib/nav";
import { getPatientSession } from "@/lib/session";
import { consentAction } from "../patient-actions";

export default async function ConsentPage(props: { searchParams: Promise<{ next?: string }> }) {
  const searchParams = await props.searchParams;
  const lang = await getLang();
  const next = safeNext(searchParams.next);
  const s = await getPatientSession();
  if (!s) redirect(withNext("/login", next));

  return (
    <PatientShell lang={lang}>
      <h1>{t(lang, "consentTitle")}</h1>
      <p>{t(lang, "consentBody")}</p>
      {s.kind === "PATIENT" && <p className="muted">{t(lang, "consentFamily")}</p>}
      <form action={consentAction} style={{ marginTop: 28 }}>
        {next && <input type="hidden" name="next" value={next} />}
        <button className="btn" type="submit">{t(lang, "consentAgree")}</button>
      </form>
    </PatientShell>
  );
}
