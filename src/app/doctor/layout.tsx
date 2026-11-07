import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getDoctor } from "@/lib/session";
import { doctorLogoutAction } from "./doctor-actions";

export const dynamic = "force-dynamic";

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const doctor = await getDoctor();
  return (
    <WorkspaceShell area="Doctors" home="/doctor" user={doctor?.name} logout={doctor ? doctorLogoutAction : undefined}>
      {children}
    </WorkspaceShell>
  );
}
