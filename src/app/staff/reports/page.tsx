import Link from "next/link";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { pct } from "@/lib/format";
import { buildOpsReport, parseDays } from "@/lib/ops-report";
import { getStaff } from "@/lib/session";

const TARGET_DIGITAL = 0.8;

export default async function OpsReport(props: { searchParams: Promise<{ days?: string }> }) {
  const staff = await getStaff();
  if (!staff) redirect("/staff/login");
  if (staff.role !== "OPS") {
    return <p className="error">This report is for the operations head. Sign in with the ops account.</p>;
  }

  const days = parseDays((await props.searchParams).days);
  const { totals: t, byDay } = await buildOpsReport(days);
  await audit({ actorType: "STAFF", actorId: staff.id, action: "OPS_REPORT_VIEWED", detail: `${days}d` });
  const digitalRate = t.signed ? t.delivered / t.signed : 0;

  return (
    <>
      <div className="section-head">
        <h1>Delivery and access</h1>
        <div className="row small">
          {[7, 30, 90].map((d) => (
            <Link key={d} href={`/staff/reports?days=${d}`} className={`pill ${d === days ? "ready" : "processing"}`} style={{ textDecoration: "none" }}>
              {d} days
            </Link>
          ))}
          <a className="btn secondary" href={`/staff/reports/export?days=${days}`}>Download CSV</a>
        </div>
      </div>

      <div className="grid cols-4 section" style={{ marginTop: 16 }}>
        <Stat num={t.signed} label="Reports signed" />
        <Stat
          num={pct(t.delivered, t.signed)}
          label={`Delivered digitally · target ${TARGET_DIGITAL * 100}%`}
          tone={t.signed ? (digitalRate >= TARGET_DIGITAL ? "ok" : "warn") : undefined}
        />
        <Stat num={pct(t.opened, t.signed)} label="Opened by patient" />
        <Stat num={t.medianHoursToOpen === null ? "—" : `${t.medianHoursToOpen.toFixed(1)} h`} label="Median time to open" />
        <Stat num={`${t.viaWhatsapp} / ${t.viaSms}`} label="WhatsApp / SMS delivered" />
        <Stat num={t.failedMessages} label="Failed messages" />
        <Stat num={t.resends} label="Front-desk resends" />
        <Stat num={t.pdfDownloads} label="PDF downloads" />
      </div>

      <div className="grid cols-4 section">
        <Stat num={t.critical} label="Critical reports" />
        <Stat num={t.callbacksDone} label="Callbacks completed" />
        <Stat num={t.callbacksOpen} label="Callbacks open now" tone={t.callbacksOpen ? "warn" : undefined} />
        <Stat num={t.summaryFlags} label="Summaries flagged by patients" />
      </div>

      <section className="section">
        <div className="section-head">
          <h2>By day</h2>
          <span className="small muted">Order level only, no patient names</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Day</th><th>Signed</th><th>Delivered</th><th>Opened</th><th>Failed msgs</th><th>Resends</th></tr>
            </thead>
            <tbody>
              {byDay.length === 0 && <tr><td colSpan={6} className="empty">No signed reports in this period.</td></tr>}
              {byDay.map(([day, d]) => (
                <tr key={day} className="mono">
                  <td>{day}</td>
                  <td>{d.signed}</td>
                  <td>{d.delivered} <span className="muted">({pct(d.delivered, d.signed)})</span></td>
                  <td>{d.opened} <span className="muted">({pct(d.opened, d.signed)})</span></td>
                  <td>{d.failed}</td>
                  <td>{d.resends}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Stat({ num, label, tone }: { num: number | string; label: string; tone?: "ok" | "warn" }) {
  const color = tone === "ok" ? "var(--forest)" : tone === "warn" ? "var(--flag)" : undefined;
  return (
    <div className="card stat">
      <div className="num" style={{ color }}>{num}</div>
      <div className="lbl">{label}</div>
    </div>
  );
}
