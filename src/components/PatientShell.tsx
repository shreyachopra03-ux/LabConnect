import Link from "next/link";
import { Brand } from "@/components/BrandMark";
import { config } from "@/lib/config";
import { LANG_LABEL, LANGS, t, type Lang } from "@/lib/i18n";

/**
 * Patient pages: a dark editorial header, then a single light reading column.
 * `variant="gate"` is the full-dark screen used when a patient arrives from WhatsApp.
 */
export function PatientShell({
  lang,
  children,
  showLogout = false,
  showPrivacy = false,
  variant = "page",
}: {
  lang: Lang;
  children: React.ReactNode;
  showLogout?: boolean;
  showPrivacy?: boolean;
  variant?: "page" | "gate";
}) {
  const header = (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="brand" aria-label="Company A Diagnostics, home">
          <Brand />
        </Link>
        <nav className="langs" aria-label="Language">
          {LANGS.map((l) => (
            <a key={l} href={`/lang?set=${l}`} aria-current={l === lang} lang={l}>
              {LANG_LABEL[l]}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );

  const footer = (
    <footer className="footer">
      <span>{t(lang, "help", { p: config.helpline })}</span>
      <span className="row" style={{ gap: 18 }}>
        {showPrivacy && <Link href="/privacy">{t(lang, "privacyLink")}</Link>}
        {showLogout && (
          <form action="/logout" method="post">
            <button className="linkbtn" type="submit">
              {t(lang, "logout")}
            </button>
          </form>
        )}
      </span>
    </footer>
  );

  if (variant === "gate") {
    return (
      <div className="gate">
        {header}
        <div className="gate-body">
          <main className="shell">{children}</main>
        </div>
        {footer}
      </div>
    );
  }

  return (
    <>
      {header}
      <main className="shell">{children}</main>
      {footer}
    </>
  );
}
