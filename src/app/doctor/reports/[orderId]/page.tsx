import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { findDoctorOrder } from "@/lib/doctor-access";
import { fmtTime } from "@/lib/format";
import { formatMobile } from "@/lib/phone";
import { getDoctor } from "@/lib/session";
import { parseSummary } from "@/lib/summary";

export default async function DoctorReport(props: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await props.params;
  const doctor = await getDoctor();
  if (!doctor) redirect("/doctor/login");
  const order = await findDoctorOrder(doctor.id, orderId);
  if (!order) notFound();

  await audit({ actorType: "DOCTOR", actorId: doctor.id, action: "REPORT_VIEWED", orderId: order.id, patientId: order.patientId });
  const summary = parseSummary(order.summary?.content);

  return (
    <>
      <p className="small"><Link href="/doctor">← All reports</Link></p>
      <div className="section-head">
        <div>
          <h1>{order.patient.name}</h1>
          <p className="muted" style={{ margin: 0 }}>
            <span className="mono">{order.id}</span> · Signed {fmtTime(order.signedAt)}
            {order.patient.birthYear && <> · Born {order.patient.birthYear}</>} · <span className="mono">{formatMobile(order.patient.mobile)}</span>
          </p>
        </div>
        {order.pdfPath && <a className="btn" href={`/doctor/reports/${order.id}/pdf`}>Signed PDF</a>}
      </div>

      {order.amendedAt && (
        <p className="notice small" style={{ marginTop: 16 }}>Amended report: re-signed with changed results on {fmtTime(order.amendedAt)}. This is the latest version.</p>
      )}

      {order.isCritical && (
        <p className="error" style={{ marginTop: 16 }}>
          Critical value. The patient was not sent a summary; lab staff have a callback task.
        </p>
      )}

      <div className="table-wrap section" style={{ marginTop: 20 }}>
        <table>
          <thead>
            <tr><th>Test</th><th>Result</th><th>Unit</th><th>Reference range</th><th>Flag</th></tr>
          </thead>
          <tbody>
            {order.results.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.parameter}</strong></td>
                <td className="mono"><strong>{r.valueText}</strong></td>
                <td>{r.unit ?? ""}</td>
                <td className="mono">{r.rangeText}</td>
                <td>
                  <span className={`pill ${r.critical ? "danger" : r.flag === "NORMAL" ? "normal" : r.flag === "UNKNOWN" ? "processing" : "high"}`}>
                    {r.critical ? "critical" : r.flag.toLowerCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {summary && summary.items.length > 0 && (
        <details className="card section">
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>What the patient was told (plain-language summary)</summary>
          {summary.items.map((it, i) => (
            <p key={i} className="small" style={{ margin: "12px 0 0" }}>
              {it.text.en} <span className="muted">({it.source.toLowerCase()})</span>
            </p>
          ))}
        </details>
      )}
    </>
  );
}
