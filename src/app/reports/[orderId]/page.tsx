import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { notFound, redirect } from "next/navigation";
import { PatientShell } from "@/components/PatientShell";
import { audit } from "@/lib/audit";
import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { formatDate, getLang, t, type MsgKey } from "@/lib/i18n";
import { canViewOrder, getPatientSession } from "@/lib/session";
import { parseSummary, type SummaryItem } from "@/lib/summary";
import { directionSentence, findTest, GENERIC_MEANING } from "@/lib/summary/catalog";
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
  const summaryWithdrawn = !!order.summary?.withdrawnAt;
  const summary = summaryWithdrawn ? null : parseSummary(order.summary?.content);
  const critical = order.isCritical;
  const reviewed = !!order.summary?.reviewedAt;

  /**
   * AI review gate (C013, adapted): an AI-written sentence is shown only after the
   * pathologist has reviewed the summary. Until then the patient sees the rule-based
   * direction plus "ask your doctor". The report itself is never held back.
   */
  const explain = (it: SummaryItem) => {
    if (it.source === "AI" && !reviewed && config.requireAiReview) {
      const fallbackName = { en: it.parameter, te: it.parameter, hi: it.parameter };
      const direction = directionSentence(findTest(it.parameter)?.name ?? fallbackName, it.flag);
      return { text: `${direction[lang]} ${GENERIC_MEANING[lang]}`, tag: t(lang, "srcGeneric"), ai: false };
    }
    if (it.source === "AI") return { text: it.text[lang], tag: t(lang, "srcAiReviewed"), ai: true };
    return { text: it.text[lang], tag: t(lang, it.source === "TEMPLATE" ? "srcTemplate" : "srcGeneric"), ai: false };
  };

  return (
    <PatientShell lang={lang} showLogout={s.kind === "PATIENT"} showPrivacy>
      {s.kind === "PATIENT" && (
        <Link href="/orders" className="back">
          ← {t(lang, "allReports")}
        </Link>
      )}

      <header className="doc-cover">
        <span className="eyebrow">{order.results.map((r) => r.parameter).join(" · ")}</span>
        <h1>{order.patient.name}</h1>
        <dl className="doc-meta">
          <dt>{t(lang, "orderLabel")}</dt>
          <dd className="mono">{order.id}</dd>
          <dt>{t(lang, "signedOn")}</dt>
          <dd>{formatDate(order.signedAt ?? order.createdAt, lang)}</dd>
          {order.doctor && (
            <>
              <dt>{t(lang, "referredBy")}</dt>
              <dd>{order.doctor.name}</dd>
            </>
          )}
        </dl>
      </header>

      {!ready && <p className="notice">{t(lang, "processingHint")}</p>}

      {ready && order.amendedAt && (
        <p className="notice" style={{ marginBottom: 24 }}>
          {t(lang, "amendedNotice", { d: formatDate(order.amendedAt, lang) })}
        </p>
      )}

      {ready && critical && (
        <section className="critical" role="alert">
          <h2>{t(lang, "criticalTitle")}</h2>
          <p style={{ margin: 0 }}>{t(lang, "criticalBody")}</p>
        </section>
      )}

      {ready && !critical && summaryWithdrawn && (
        <section className="summary">
          <p style={{ margin: 0 }}>{t(lang, "summaryWithdrawn")}</p>
        </section>
      )}

      {ready && !critical && summary && (
        <section className="summary" aria-labelledby="sum-h">
          <h2 id="sum-h">{t(lang, "summaryTitle")}</h2>
          {summary.items.length === 0 ? (
            <p style={{ margin: "12px 0 0", fontSize: "1.08rem" }}>{t(lang, "allNormal")}</p>
          ) : (
            <>
              <p className="small muted" style={{ margin: 0 }}>{t(lang, "summaryNote")}</p>
              {summary.items.map((it, i) => {
                const e = explain(it);
                return (
                  <div key={i} className="summary-item">
                    <p>{e.text}</p>
                    <div className="figure">
                      <span className="mono">
                        {it.valueText} {it.unit}
                      </span>{" "}
                      · {t(lang, "normalRange")} <span className="mono">{it.rangeText}</span>
                    </div>
                    <span className={`source-tag${e.ai ? " ai" : ""}`}>{e.tag}</span>
                  </div>
                );
              })}
            </>
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
                  <SubmitButton className="btn secondary" pendingLabel={t(lang, "pleaseWait")}>{t(lang, "flagButton")}</SubmitButton>
                </form>
              </details>
            ))}
        </section>
      )}

      {ready && (
        <section className="doc-section" aria-labelledby="res-h">
          <h2 id="res-h" style={{ marginBottom: 2 }}>{t(lang, "results")}</h2>
          <p className="section-note">{t(lang, "resultsNote")}</p>
          <ul className="results">
            {order.results.map((r) => (
              <li key={r.id}>
                <div>
                  <div className="name">{r.parameter}</div>
                  <div className="range">
                    {t(lang, "normalRange")} <span className="mono">{r.rangeText}</span>
                  </div>
                </div>
                <div className="val">
                  <span className="num">
                    <span className="sr-only">{t(lang, "yourResult")}: </span>
                    {r.valueText}
                  </span>
                  {r.unit && <span className="unit">{r.unit}</span>}
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
              {t(lang, "downloadPdf")} <span aria-hidden="true">↓</span>
            </a>
          )}
        </section>
      )}

      {s.kind === "LINK" && (
        <p style={{ marginTop: 24, textAlign: "center" }}>
          <Link href="/login?next=/orders">{t(lang, "seeAllReports")}</Link>
        </p>
      )}
    </PatientShell>
  );
}
