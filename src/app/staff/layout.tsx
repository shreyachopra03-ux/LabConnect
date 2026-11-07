import Link from "next/link";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getStaff } from "@/lib/session";
import { staffLogoutAction } from "./staff-actions";

export const dynamic = "force-dynamic";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const staff = await getStaff();
  return (
    <WorkspaceShell
      area={staff?.role === "OPS" ? "Operations" : staff?.role === "PATHOLOGIST" ? "Pathology" : "Front desk"}
      home="/staff"
      user={staff?.name}
      logout={staff ? staffLogoutAction : undefined}
      nav={
        staff && (
          <>
            <Link href="/staff">Console</Link>
            {staff.role === "OPS" && <Link href="/staff/reports">Reports</Link>}
            {staff.role === "PATHOLOGIST" && <Link href="/staff/summaries">Summary review</Link>}
            <Link href="/dev/outbox">Outbox</Link>
          </>
        )
      }
    >
      {children}
    </WorkspaceShell>
  );
}
