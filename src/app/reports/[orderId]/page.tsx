import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PatientShell } from "@/components/PatientShell";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { formatDate, getLang, t, type MsgKey } from "@/lib/i18n";
import { canViewOrder, getPatientSession } from "@/lib/session";
import { parseSummary } from "@/lib/summary";
import { flagSummaryAction } from "../../patient-actions";

export default async function ReportPage(props: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ flagged?: string }>;
}) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const lang = await getLang();
  const here = `/reports/${encodeURIComponent(params.orderId)}`;
  const s = await getPatientSession();
  if (!s) redirect(`/login?next=${encodeURIComponent(here)}`);

  const order = await db.order.findUnique({
    where: { id: params.orderId },
    include: {
      patient: { include: { contact: true } },
      doctor: true,
      results: { orderBy: { position: "asc" } },
      summary: true,
    },
  });
  // Same response for "doesn't exist" and "not yours": no order-id enumeration.
  if (!order || !canViewOrder(s, order)) notFound();
  if (!order.patient.contact.consentAt) redirect(`/consent?next=${encodeURIComponent(here)}`);

  await audit({
    actorType: s.kind === "LINK" ? "LINK" : "PATIENT",
    actorId: s.mobile ?? "",
    action: "REPORT_VIEWED",
    orderId: order.id,
    patientId: order.patientId,
  });

  const ready = order.status === "READY";
  const summary = parseSummary(order.summary?.content);
  const critical = order.isCritical;

  return (
    <PatientShell lang={lang} showLogout={s.kind === "PATIENT"}>
      {s.kind === "PATIENT" && (
        <p className="small" style={{ marginTop: -12 }}>
          <Link href="/orders">← {t(lang, "allReports")}</Link>
        </p>
      )}
      <h1>{order.patient.name}</h1>
      <p className="meta">
        {order.id} · {formatDate(order.signedAt ?? order.createdAt, lang)}
        {order.doctor && (
          <>
            <br />
            {t(lang, "doctor")}: {order.doctor.name}
          </>
        )}
      </p>

      {!ready && <p className="notice">{t(lang, "processingHint")}</p>}

      {ready && critical && (
        <section className="critical" role="alert">
          <h2>{t(lang, "criticalTitle")}</h2>
          <p style={{ margin: 0 }}>{t(lang, "criticalBody")}</p>
        </section>
      )}

      {ready && !critical && summary && (
        <section className="summary" aria-labelledby="sum-h">
          <h2 id="sum-h">{t(lang, "summaryTitle")}</h2>
          {summary.items.length === 0 ? (
            <p style={{ margin: 0 }}>{t(lang, "allNormal")}</p>
          ) : (
            summary.items.map((it, i) => (
              <div key={i} className="summary-item">
                <p>{it.text[lang]}</p>
                <div className="figure mono">
                  {it.valueText} {it.unit} · {t(lang, "normalRange")} {it.rangeText}
                </div>
              </div>
            ))
          )}
          <p className="small muted" style={{ margin: "18px 0 0" }}>{t(lang, "disclaimer")}</p>

          {summary.items.length > 0 &&
            (searchParams.flagged ? (
              <p className="notice small" style={{ marginTop: 14 }}>{t(lang, "flagThanks")}</p>
            ) : (
              <details className="flag">
                <summary>{t(lang, "flagPrompt")}</summary>
                <form action={flagSummaryAction} style={{ marginTop: 10 }}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="lang" value={lang} />
                  <button className="btn secondary" type="submit">{t(lang, "flagButton")}</button>
                </form>
              </details>
            ))}
        </section>
      )}

      {ready && (
        <>
          <h2>{t(lang, "results")}</h2>
          <ul className="results">
            {order.results.map((r) => (
              <li key={r.id}>
                <div>
                  <div className="name">{r.parameter}</div>
                  <div className="range mono">
                    {t(lang, "normalRange")} {r.rangeText} {r.unit}
                  </div>
                </div>
                <div className="val">
                  {r.valueText}
                  <div>
                    <span className={`pill ${r.critical ? "danger" : r.flag.toLowerCase()}`}>
                      {t(lang, `flag${r.flag}` as MsgKey)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {order.pdfPath && (
            <a className="btn" href={`${here}/pdf`}>
              {t(lang, "downloadPdf")}
            </a>
          )}
        </>
      )}

      {s.kind === "LINK" && (
        <p style={{ marginTop: 24, textAlign: "center" }}>
          <Link href="/login?next=/orders">{t(lang, "seeAllReports")}</Link>
        </p>
      )}
    </PatientShell>
  );
}
