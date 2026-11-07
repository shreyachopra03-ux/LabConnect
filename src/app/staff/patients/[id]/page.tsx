import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeliveryPill } from "@/components/DeliveryPill";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { fmtTime } from "@/lib/format";
import { linkStatus } from "@/lib/links";
import { formatMobile } from "@/lib/phone";
import { getStaff } from "@/lib/session";
import { recordWithdrawalAction, resendLinkAction } from "../../staff-actions";

export default async function StaffPatient(props: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string; blocked?: string }> }) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const staff = await getStaff();
  if (!staff) redirect("/staff/login");

  const patient = await db.patient.findUnique({
    where: { id: params.id },
    include: {
      contact: { include: { patients: { select: { id: true, name: true } } } },
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          doctor: true,
          results: { select: { parameter: true } },
          links: { orderBy: { createdAt: "desc" }, take: 1 },
          messages: { where: { kind: "REPORT_LINK" }, orderBy: { createdAt: "desc" }, take: 4 },
          callbacks: { where: { status: "OPEN" } },
        },
      },
    },
  });
  if (!patient) notFound();

  const orderIds = patient.orders.map((o) => o.id);
  const log = await db.accessLog.findMany({
    where: { OR: [{ patientId: patient.id }, { orderId: { in: orderIds } }] },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  await audit({ actorType: "STAFF", actorId: staff.id, action: "PATIENT_VIEWED", patientId: patient.id });

  const family = patient.contact.patients.filter((p) => p.id !== patient.id);

  return (
    <>
      <p className="small"><Link href="/staff">← Console</Link></p>
      <h1>{patient.name}</h1>
      <p className="muted">
        <span className="mono">{formatMobile(patient.mobile)}</span>
        {patient.birthYear && <> · Born {patient.birthYear}</>} · Language {patient.contact.lang.toUpperCase()} ·{" "}
        {patient.contact.consentAt ? (
          <>Consent given {fmtTime(patient.contact.consentAt)}</>
        ) : patient.contact.consentWithdrawnAt ? (
          <strong style={{ color: "var(--danger)" }}>Consent withdrawn {fmtTime(patient.contact.consentWithdrawnAt)}: no links are sent</strong>
        ) : (
          <strong>No consent yet</strong>
        )}
      </p>
      {family.length > 0 && (
        <p className="small">
          Same number:{" "}
          {family.map((f, i) => (
            <span key={f.id}>
              {i > 0 && ", "}
              <Link href={`/staff/patients/${f.id}`}>{f.name}</Link>
            </span>
          ))}
        </p>
      )}
      {searchParams.blocked && (
        <p className="error small">Not sent: this number has withdrawn consent. The patient can collect the report at the lab, or log in and give consent again.</p>
      )}
      {!patient.contact.consentWithdrawnAt && (
        <form action={recordWithdrawalAction} style={{ marginBottom: 12 }}>
          <input type="hidden" name="patientId" value={patient.id} />
          <button className="linkbtn small" type="submit">Record consent withdrawal (patient asked by phone or at the desk)</button>
        </form>
      )}
      {searchParams.sent && <p className="notice small">New link sent for {searchParams.sent}. Older links for that order no longer work.</p>}

      <section className="section">
        <h2>Orders</h2>
        {patient.orders.map((o) => {
          const link = o.links[0];
          return (
            <div className="card" key={o.id}>
              <div className="card-head">
                <div>
                  <strong className="mono">{o.id}</strong>{" "}
                  <span className="muted small">· {o.results.map((r) => r.parameter).join(", ")}</span>
                  <div className="small muted">
                    {o.doctor?.name ?? "No referring doctor"} · Signed {fmtTime(o.signedAt)}
                    {o.amendedAt && <> · <strong>Amended {fmtTime(o.amendedAt)}</strong></>}
                  </div>
                </div>
                <div className="row">
                  {o.isCritical && <span className="pill danger">Critical</span>}
                  {o.callbacks.length > 0 && <span className="pill danger">Callback open</span>}
                  <span className={`pill ${o.status === "READY" ? "ready" : "processing"}`}>{o.status.toLowerCase()}</span>
                </div>
              </div>

              {o.status === "READY" && (
                <div className="grid cols-2" style={{ marginTop: 14, alignItems: "start" }}>
                  <div className="small">
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Current link</div>
                    {link ? (
                      <>
                        {linkStatus(link)} · expires {fmtTime(link.expiresAt)}
                        <br />
                        Opened {link.openCount}× {link.firstOpenedAt && <>(first {fmtTime(link.firstOpenedAt)})</>}
                      </>
                    ) : (
                      "No link issued"
                    )}
                    <div style={{ fontWeight: 600, margin: "12px 0 6px" }}>Messages</div>
                    {o.messages.length === 0 && <span className="muted">None</span>}
                    {o.messages.map((m) => (
                      <div key={m.id} style={{ marginBottom: 4 }}>
                        <span className="mono">{fmtTime(m.createdAt)}</span> · {m.channel === "WHATSAPP" ? "WhatsApp" : "SMS"}{" "}
                        <DeliveryPill status={m.status} />
                      </div>
                    ))}
                  </div>
                  <form action={resendLinkAction} className="row" style={{ justifyContent: "flex-end" }}>
                    <input type="hidden" name="orderId" value={o.id} />
                    <select name="channel" className="input" aria-label="Channel" defaultValue="WHATSAPP">
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="SMS">SMS</option>
                    </select>
                    <button className="btn" type="submit">Resend link</button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Access log</h2>
          <span className="small muted">Every view, download, link and staff action</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>When</th><th>Who</th><th>Action</th><th>Order</th><th>Detail</th><th>IP</th></tr>
            </thead>
            <tbody>
              {log.length === 0 && <tr><td colSpan={6} className="empty">No entries.</td></tr>}
              {log.map((l) => (
                <tr key={l.id}>
                  <td className="mono">{fmtTime(l.createdAt)}</td>
                  <td>{l.actorType.toLowerCase()}</td>
                  <td>{l.action.replace(/_/g, " ").toLowerCase()}</td>
                  <td className="mono">{l.orderId ?? "—"}</td>
                  <td className="small muted">{l.detail ?? ""}</td>
                  <td className="mono small muted">{l.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
