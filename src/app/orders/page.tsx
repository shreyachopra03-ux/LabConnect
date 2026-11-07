import Link from "next/link";
import { redirect } from "next/navigation";
import { PatientShell } from "@/components/PatientShell";
import { db } from "@/lib/db";
import { formatDate, getLang, t } from "@/lib/i18n";
import { getPatientSession } from "@/lib/session";

export default async function OrdersPage() {
  const lang = await getLang();
  const s = await getPatientSession();
  if (!s?.mobile) redirect("/login");
  if (s.kind === "LINK") redirect(`/login?next=/orders`); // a link only unlocks one report

  const contact = await db.contact.findUnique({ where: { mobile: s.mobile } });
  if (!contact?.consentAt) redirect("/consent?next=/orders");

  const patients = await db.patient.findMany({
    where: { mobile: s.mobile },
    orderBy: { name: "asc" },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { results: { orderBy: { position: "asc" }, select: { parameter: true } } },
      },
    },
  });
  const family = patients.length > 1;
  const empty = patients.every((p) => p.orders.length === 0);

  return (
    <PatientShell lang={lang} showLogout showPrivacy>
      <span className="eyebrow">{t(lang, "secureAccess")}</span>
      <h1>{t(lang, "reportsTitle")}</h1>
      {empty && <p className="lede">{t(lang, "noReports")}</p>}

      {patients.map((p) => (
        <section key={p.id}>
          {family && <h2 className="person">{p.name}</h2>}
          <ul className="report-list" style={!family ? { marginTop: 24 } : undefined}>
            {p.orders.map((o) => {
              const ready = o.status === "READY";
              return (
                <li key={o.id} className="report-item">
                  <div className="card-head">
                    <h3>{o.results.map((r) => r.parameter).join(", ")}</h3>
                    <span className={`pill ${ready ? "ready" : "processing"}`}>
                      {t(lang, ready ? "statusReady" : "statusProcessing")}
                    </span>
                  </div>
                  <div className="meta-line">
                    <span className="mono">{o.id}</span> · {formatDate(o.signedAt ?? o.createdAt, lang)}
                  </div>
                  {ready ? (
                    <Link href={`/reports/${o.id}`} className="btn">
                      {t(lang, "viewReport")} <span className="arrow" aria-hidden="true">→</span>
                    </Link>
                  ) : (
                    <p className="muted small" style={{ margin: 0 }}>{t(lang, "processingHint")}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </PatientShell>
  );
}
