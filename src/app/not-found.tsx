import Link from "next/link";
import { PatientShell } from "@/components/PatientShell";
import { getLang, t } from "@/lib/i18n";

/** Used for unknown pages and for reports that don't exist or aren't yours (same answer on purpose). */
export default async function NotFound() {
  const lang = await getLang();
  return (
    <PatientShell lang={lang}>
      <span className="eyebrow">404</span>
      <h1>{t(lang, "notFoundTitle")}</h1>
      <p className="lede">{t(lang, "notFoundBody")}</p>
      <Link href="/orders" className="btn">
        {t(lang, "allReports")}
      </Link>
    </PatientShell>
  );
}
