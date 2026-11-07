import Link from "next/link";
import { redirect } from "next/navigation";
import { DeliveryPill } from "@/components/DeliveryPill";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { fmtTime, pct } from "@/lib/format";
import { formatMobile, normalizeMobile } from "@/lib/phone";
import { getStaff } from "@/lib/session";
import { demoMode } from "@/lib/lis/demo";
import { completeCallbackAction, scanLisAction, simulateLisAction } from "./staff-actions";

export default async function StaffConsole(props: { searchParams: Promise<{ q?: string; scanned?: string }> }) {
  const searchParams = await props.searchParams;
  const staff = await getStaff();
  if (!staff) redirect("/staff/login");

  const q = (searchParams.q ?? "").trim();
  const since = new Date(Date.now() - 7 * 86_400_000);

  const [results, signed, delivered, opened, failed, callbacks, toReview, runs, recent] = await Promise.all([
    q ? searchPatients(q) : Promise.resolve(null),
    db.order.count({ where: { signedAt: { gte: since } } }),
    db.order.count({ where: { signedAt: { gte: since }, messages: { some: { kind: "REPORT_LINK", status: "DELIVERED" } } } }),
    db.order.count({ where: { signedAt: { gte: since }, links: { some: { openCount: { gt: 0 } } } } }),
    db.message.count({ where: { createdAt: { gte: since }, status: "FAILED" } }),
    db.callbackTask.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "asc" },
      include: { order: { include: { patient: true } } },
    }),
    db.summary.findMany({
      where: { reviewedAt: null, OR: [{ flagCount: { gt: 0 } }, { source: "MIXED" }] },
      orderBy: [{ flagCount: "desc" }, { createdAt: "asc" }],
      take: 10,
      include: { order: { include: { patient: true } } },
    }),
    db.importRun.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.message.findMany({
      where: { kind: "REPORT_LINK" },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { order: { include: { patient: true } } },
    }),
  ]);

  if (q) await audit({ actorType: "STAFF", actorId: staff.id, action: "PATIENT_SEARCH", detail: q.slice(0, 60) });

  return (
    <>
      <form className="searchbar" action="/staff">
        <input
          name="q"
          className="input"
          defaultValue={q}
          placeholder="Search by name, mobile number or order ID"
          aria-label="Search patients"
          autoFocus
        />
        <button className="btn" type="submit">Search</button>
      </form>

      {results && (
        <section className="section">
          <div className="section-head">
            <h2>Results for “{q}”</h2>
            <Link href="/staff" className="small">Clear</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Patient</th><th>Mobile</th><th>Orders</th><th></th></tr>
              </thead>
              <tbody>
                {results.length === 0 && (
                  <tr><td colSpan={4} className="empty">No patients found.</td></tr>
                )}
                {results.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td className="mono">{formatMobile(p.mobile)}</td>
                    <td className="mono">{p.orders.map((o) => o.id).join(", ")}</td>
                    <td style={{ textAlign: "right" }}><Link href={`/staff/patients/${p.id}`}>Open →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>Last 7 days</h2>
          <span className="small muted">Delivery and access</span>
        </div>
        <div className="grid cols-4">
          <Stat num={signed} label="Reports signed" />
          <Stat num={pct(delivered, signed)} label="Delivered digitally" />
          <Stat num={pct(opened, signed)} label="Opened by patient" />
          <Stat num={failed} label="Failed messages" />
        </div>
      </section>

      <div className="grid cols-2 section">
        <section>
          <div className="section-head">
            <h2>Callbacks — critical values</h2>
            <span className="pill danger">{callbacks.length} open</span>
          </div>
          {callbacks.length === 0 && <div className="card empty">No open callbacks.</div>}
          {callbacks.map((c) => (
            <div className="card" key={c.id}>
              <div className="card-head">
                <div>
                  <Link href={`/staff/patients/${c.order.patientId}`}><strong>{c.order.patient.name}</strong></Link>
                  <div className="small muted mono">{c.orderId} · {formatMobile(c.order.patient.mobile)}</div>
                </div>
                <span className="small muted">{fmtTime(c.createdAt)}</span>
              </div>
              <p className="small" style={{ margin: "6px 0 12px" }}>{c.reason}. No summary was sent to the patient.</p>
              <form action={completeCallbackAction}>
                <input type="hidden" name="taskId" value={c.id} />
                <button className="btn secondary" type="submit">Mark as called</button>
              </form>
            </div>
          ))}
        </section>

        <section>
          <div className="section-head">
            <h2>Waiting for pathologist</h2>
            <span className="small muted">Flagged or AI-written summaries</span>
          </div>
          {toReview.length === 0 && <div className="card empty">Nothing waiting for review.</div>}
          {toReview.map((s) => (
            <div className="card" key={s.id}>
              <div className="card-head">
                <div>
                  <strong>{s.order.patient.name}</strong>
                  <div className="small muted mono">{s.orderId} · {s.source.toLowerCase()}</div>
                </div>
                {s.flagCount > 0 && <span className="pill high">Flagged ×{s.flagCount}</span>}
              </div>
            </div>
          ))}
          {staff.role === "PATHOLOGIST" && (
            <p className="small" style={{ marginTop: 10 }}><Link href="/staff/summaries">Open review queue →</Link></p>
          )}
        </section>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Recent report links</h2>
          <span className="small muted">Sent automatically on sign-off</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>When</th><th>Patient</th><th>Order</th><th>Channel</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recent.length === 0 && <tr><td colSpan={5} className="empty">No messages yet.</td></tr>}
              {recent.map((m) => (
                <tr key={m.id}>
                  <td className="mono">{fmtTime(m.createdAt)}</td>
                  <td>
                    {m.order ? <Link href={`/staff/patients/${m.order.patientId}`}>{m.order.patient.name}</Link> : "—"}
                  </td>
                  <td className="mono">{m.orderId}</td>
                  <td>{m.channel === "WHATSAPP" ? "WhatsApp" : "SMS"}</td>
                  <td><DeliveryPill status={m.status} />{m.error && <div className="small muted">{m.error}</div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>LIS import</h2>
          <div className="row">
            {demoMode() && (
              <>
                <form action={simulateLisAction}>
                  <input type="hidden" name="which" value="signed" />
                  <button className="btn secondary" type="submit" title="Demo: the pathologist signs ORD-71219">Simulate sign-off</button>
                </form>
                <form action={simulateLisAction}>
                  <input type="hidden" name="which" value="amended" />
                  <button className="btn secondary" type="submit" title="Demo: ORD-71204 is corrected and re-signed">Simulate amendment</button>
                </form>
              </>
            )}
            <form action={scanLisAction}>
              <button className="btn secondary" type="submit">Scan export folder now</button>
            </form>
          </div>
        </div>
        {searchParams.scanned && (
          <p className="notice small">Scan finished: {searchParams.scanned} new file(s) imported.</p>
        )}
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>When</th><th>File</th><th>Rows</th><th>Orders</th><th>Newly signed</th><th>Errors</th></tr>
            </thead>
            <tbody>
              {runs.length === 0 && <tr><td colSpan={6} className="empty">No imports yet.</td></tr>}
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{fmtTime(r.createdAt)}</td>
                  <td className="mono">{r.fileName}</td>
                  <td className="mono">{r.rows}</td>
                  <td className="mono">{r.ordersUpserted}</td>
                  <td className="mono">{r.ordersSigned}</td>
                  <td className="small" style={{ whiteSpace: "pre-line", color: r.errors ? "var(--danger)" : undefined }}>
                    {r.errors ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Stat({ num, label }: { num: number | string; label: string }) {
  return (
    <div className="card stat">
      <div className="num">{num}</div>
      <div className="lbl">{label}</div>
    </div>
  );
}

async function searchPatients(q: string) {
  const mobile = q.replace(/\D/g, "");
  const full = normalizeMobile(q);
  return db.patient.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        ...(full ? [{ mobile: full }] : mobile.length >= 4 ? [{ mobile: { contains: mobile } }] : []),
        { orders: { some: { id: { contains: q.toUpperCase() } } } },
      ],
    },
    take: 20,
    orderBy: { name: "asc" },
    include: { orders: { select: { id: true }, orderBy: { createdAt: "desc" } } },
  });
}
