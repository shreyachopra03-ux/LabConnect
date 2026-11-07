import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { fmtTime } from "@/lib/format";
import { getStaff } from "@/lib/session";
import { parseSummary } from "@/lib/summary";
import { approveSummaryAction, withdrawSummaryAction } from "../staff-actions";

const WEEKLY_TARGET = 50;

/**
 * Pathologist review queue. Order: flagged by patients, then AI/generic text, then
 * locked templates (sampled so the 50-a-week target also checks template output).
 */
export default async function SummaryReview(props: { searchParams: Promise<{ show?: string }> }) {
  const { show = "queue" } = await props.searchParams;
  const staff = await getStaff();
  if (!staff) redirect("/staff/login");
  if (staff.role !== "PATHOLOGIST") {
    return <p className="error">The summary review queue is for the pathologist. Sign in with the pathologist account.</p>;
  }

  const weekStart = new Date(Date.now() - 7 * 86_400_000);
  const [reviewedThisWeek, waiting] = await Promise.all([
    db.summary.count({ where: { reviewedAt: { gte: weekStart } } }),
    db.summary.count({ where: { reviewedAt: null, source: { in: ["TEMPLATE", "MIXED"] } } }),
  ]);

  const summaries = await db.summary.findMany({
    where:
      show === "done"
        ? { reviewedAt: { gte: weekStart } }
        : { reviewedAt: null, source: { in: ["TEMPLATE", "MIXED"] } },
    orderBy: show === "done" ? [{ reviewedAt: "desc" }] : [{ flagCount: "desc" }, { source: "asc" }, { createdAt: "asc" }],
    take: 25,
    include: { order: { include: { patient: true, results: { orderBy: { position: "asc" } } } } },
  });

  return (
    <>
      <div className="section-head">
        <h1>Summary review</h1>
        <div className="row small">
          <Link href="/staff/summaries" className={`pill ${show !== "done" ? "ready" : "processing"}`} style={{ textDecoration: "none" }}>
            Waiting ({waiting})
          </Link>
          <Link href="/staff/summaries?show=done" className={`pill ${show === "done" ? "ready" : "processing"}`} style={{ textDecoration: "none" }}>
            Reviewed this week
          </Link>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginTop: 16 }}>
        <div className="card stat">
          <div className="num" style={{ color: reviewedThisWeek >= WEEKLY_TARGET ? "var(--accent)" : undefined }}>
            {reviewedThisWeek} / {WEEKLY_TARGET}
          </div>
          <div className="lbl">Reviewed in the last 7 days</div>
        </div>
      </div>

      <section className="section">
        {summaries.length === 0 && <div className="card empty">Nothing here.</div>}
        {summaries.map((s) => {
          const content = parseSummary(s.content);
          return (
            <article className="card" key={s.id}>
              <div className="card-head">
                <div>
                  <strong className="mono">{s.orderId}</strong>{" "}
                  <span className="muted small">· {s.order.patient.name.split(" ")[0]} · signed {fmtTime(s.order.signedAt)}</span>
                </div>
                <div className="row">
                  {s.flagCount > 0 && <span className="pill high">Flagged by patient ×{s.flagCount}</span>}
                  {s.withdrawnAt && <span className="pill danger">Withdrawn</span>}
                  {s.reviewedAt && !s.withdrawnAt && <span className="pill ready">Approved</span>}
                  <span className="pill processing">{s.source.toLowerCase()}</span>
                </div>
              </div>

              <div className="table-wrap" style={{ margin: "12px 0" }}>
                <table>
                  <thead>
                    <tr><th>Test</th><th>Result</th><th>Range</th><th>Flag</th></tr>
                  </thead>
                  <tbody>
                    {s.order.results.map((r) => (
                      <tr key={r.id}>
                        <td>{r.parameter}</td>
                        <td className="mono">{r.valueText} {r.unit}</td>
                        <td className="mono">{r.rangeText}</td>
                        <td>{r.flag.toLowerCase()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {content?.items.map((it, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div className="small muted" style={{ marginBottom: 4 }}>
                    {it.parameter} · {it.flag.toLowerCase()} · <strong>{it.source.toLowerCase()}</strong>
                  </div>
                  <p style={{ margin: "0 0 4px" }}>{it.text.en}</p>
                  <p lang="te" style={{ margin: "0 0 4px" }}>{it.text.te}</p>
                  <p lang="hi" style={{ margin: 0 }}>{it.text.hi}</p>
                </div>
              ))}

              {s.reviewedAt ? (
                <p className="small muted" style={{ margin: 0 }}>
                  {s.withdrawnAt ? "Withdrawn" : "Approved"} by {s.reviewedBy} · {fmtTime(s.reviewedAt)}
                </p>
              ) : (
                <div className="row">
                  <form action={approveSummaryAction}>
                    <input type="hidden" name="summaryId" value={s.id} />
                    <button className="btn" type="submit">Approve</button>
                  </form>
                  <form action={withdrawSummaryAction}>
                    <input type="hidden" name="summaryId" value={s.id} />
                    <button className="btn secondary" type="submit" style={{ color: "var(--danger)" }}>
                      Withdraw from patient
                    </button>
                  </form>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </>
  );
}
