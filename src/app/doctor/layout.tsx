import Link from "next/link";
import { getDoctor } from "@/lib/session";
import { doctorLogoutAction } from "./doctor-actions";

export const dynamic = "force-dynamic";

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const doctor = await getDoctor();
  return (
    <div className="staff">
      <div className="staff-wrap">
        <header className="staff-top">
          <Link href="/doctor" className="brand">
            Company <span>A</span> · Doctors
          </Link>
          {doctor && (
            <nav>
              <span className="muted">{doctor.name}</span>
              <form action={doctorLogoutAction}>
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
