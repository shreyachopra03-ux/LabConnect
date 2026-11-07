import Link from "next/link";
import { getStaff } from "@/lib/session";
import { staffLogoutAction } from "./staff-actions";

export const dynamic = "force-dynamic";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const staff = await getStaff();
  return (
    <div className="staff">
      <div className="staff-wrap">
        <header className="staff-top">
          <Link href="/staff" className="brand">
            Company <span>A</span> · Front desk
          </Link>
          {staff && (
            <nav>
              <Link href="/staff">Console</Link>
              {staff.role === "OPS" && <Link href="/staff/reports">Reports</Link>}
              {staff.role === "PATHOLOGIST" && <Link href="/staff/summaries">Summary review</Link>}
              <Link href="/dev/outbox">Outbox</Link>
              <span className="muted">{staff.name}</span>
              <form action={staffLogoutAction}>
                <button className="linkbtn" type="submit">Log out</button>
              </form>
            </nav>
          )}
        </header>
        {children}
      </div>
    </div>
  );
}
