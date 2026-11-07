import Link from "next/link";
import { Brand } from "@/components/BrandMark";

/** Shared frame for the staff, doctor and ops workspaces: dark bar, light working surface. */
export function WorkspaceShell({
  area,
  home,
  nav,
  user,
  logout,
  children,
}: {
  area: string;
  home: string;
  nav?: React.ReactNode;
  user?: string | null;
  logout?: () => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <div className="staff">
      <div className="staff-bar">
        <header className="staff-top">
          <Link href={home} className="brand">
            <Brand suffix={area} />
          </Link>
          {(nav || user) && (
            <nav aria-label={`${area} navigation`}>
              {nav}
              {user && <span className="who">{user}</span>}
              {logout && (
                <form action={logout}>
                  <button className="linkbtn" type="submit">Log out</button>
                </form>
              )}
            </nav>
          )}
        </header>
      </div>
      <main className="staff-wrap">{children}</main>
    </div>
  );
}
