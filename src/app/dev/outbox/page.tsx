import { notFound } from "next/navigation";
import { DeliveryPill } from "@/components/DeliveryPill";
import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { fmtTime } from "@/lib/format";
import { formatMobile } from "@/lib/phone";

export const dynamic = "force-dynamic";

export default async function Outbox() {
  if (!config.mockMessaging) notFound();
  const messages = await db.message.findMany({ orderBy: { createdAt: "desc" }, take: 50 });

  return (
    <div className="staff">
      <div className="staff-wrap">
        <header className="staff-top">
          <span className="brand">Mock outbox <span>· demo only</span></span>
          <nav>
            <a href="/login">Patient portal</a>
            <a href="/staff">Front desk</a>
          </nav>
        </header>
        <p className="muted">
          Messages are not really sent. This page stands in for the patient’s phone. Open a report link from here, or read the OTP.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>When</th><th>To</th><th>Channel</th><th>Status</th><th>Message</th></tr>
            </thead>
            <tbody>
              {messages.length === 0 && <tr><td colSpan={5} className="empty">No messages yet. Run npm run setup.</td></tr>}
              {messages.map((m) => (
                <tr key={m.id}>
                  <td className="mono">{fmtTime(m.createdAt)}</td>
                  <td className="mono">{formatMobile(m.mobile)}</td>
                  <td>{m.channel === "WHATSAPP" ? "WhatsApp" : "SMS"}</td>
                  <td><DeliveryPill status={m.status} />{m.error && <div className="small muted">{m.error}</div>}</td>
                  <td style={{ maxWidth: 520 }}>
                    <Linkified text={m.body} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/\S+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p.replace(/^https?:\/\/[^/]+/, "")} style={{ wordBreak: "break-all" }}>{p}</a>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}
