import Link from "next/link";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { fmtTime } from "@/lib/format";
import { DOCTOR_WINDOW_DAYS, doctorWindowStart, getDoctor } from "@/lib/session";

export default async function DoctorHome(props: { searchParams: Promise<{ q?: string; f?: string }> }) {
  const { q = "", f = "all" } = await props.searchParams;
  const doctor = await getDoctor();
  if (!doctor) redirect("/doctor/login");

  const query = q.trim();
  const orders = await db.order.findMany({
    where: {
      doctorId: doctor.id,
      createdAt: { gte: doctorWindowStart() },
      ...(query && { OR: [{ id: { contains: query.toUpperCase() } }, { patient: { name: { contains: query } } }] }),
      ...(f === "ready" && { status: "READY" }),
      ...(f === "abnormal" && { results: { some: { flag: { in: ["HIGH", "LOW"] } } } }),
      ...(f === "critical" && { isCritical: true }),
    },
    orderBy: { createdAt: "desc" },
    include: { patient: true, results: { orderBy: { position: "asc" } } },
  });
  await audit({ actorType: "DOCTOR", actorId: doctor.id, action: "DOCTOR_LIST_VIEWED", detail: query || undefined });

  const filters = [
    ["all", "All"],
    ["ready", "Ready"],
    ["abnormal", "Out of range"],
    ["critical", "Critical"],
  ] as const;

  return (
    <>
      <div className="section-head">
        <h1>Your patients’ reports</h1>
        <span className="small muted">Last {DOCTOR_WINDOW_DAYS} days</span>
      </div>

      <form className="searchbar" action="/doctor" style={{ marginBottom: 14 }}>
        <input type="hidden" name="f" value={f} />
        <input name="q" className="input" defaultValue={query} placeholder="Search patient name or order ID" aria-label="Search" />
        <button className="btn" type="submit">Search</button>
      </form>
      <div className="row small" style={{ marginBottom: 18 }}>
        {filters.map(([key, label]) => (
          <Link
            key={key}
            href={`/doctor?f=${key}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            className={`pill ${f === key ? "ready" : "processing"}`}
            style={{ textDecoration: "none" }}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Date</th><th>Patient</th><th>Order</th><th>Tests</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={6} className="empty">No reports match.</td></tr>}
            {orders.map((o) => {
              const abnormal = o.results.filter((r) => r.flag === "HIGH" || r.flag === "LOW").length;
              return (
                <tr key={o.id}>
                  <td className="mono">{fmtTime(o.signedAt ?? o.createdAt)}</td>
                  <td><strong>{o.patient.name}</strong>{o.patient.birthYear && <div className="small muted">Born {o.patient.birthYear}</div>}</td>
                  <td className="mono">{o.id}</td>
                  <td className="small">{o.results.map((r) => r.parameter).join(", ")}</td>
                  <td>
                    <div className="row">
                      <span className={`pill ${o.status === "READY" ? "ready" : "processing"}`}>{o.status === "READY" ? "ready" : "processing"}</span>
                      {o.isCritical && <span className="pill danger">critical</span>}
                      {!o.isCritical && abnormal > 0 && <span className="pill high">{abnormal} out of range</span>}
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>{o.status === "READY" && <Link href={`/doctor/reports/${o.id}`}>Open →</Link>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
