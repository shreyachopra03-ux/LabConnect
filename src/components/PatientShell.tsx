import Link from "next/link";
import { config } from "@/lib/config";
import { LANG_LABEL, LANGS, t, type Lang } from "@/lib/i18n";

export function PatientShell({
  lang,
  children,
  showLogout = false,
  showPrivacy = false,
}: {
  lang: Lang;
  children: React.ReactNode;
  showLogout?: boolean;
  showPrivacy?: boolean;
}) {
  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          Company <span>A</span> Diagnostics
        </Link>
        <nav className="langs" aria-label="Language">
          {LANGS.map((l) => (
            <a key={l} href={`/lang?set=${l}`} aria-current={l === lang} lang={l}>
              {LANG_LABEL[l]}
            </a>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <span>{t(lang, "help", { p: config.helpline })}</span>
        {showPrivacy && <Link href="/privacy">{t(lang, "privacyLink")}</Link>}
        {showLogout && (
          <form action="/logout" method="post">
            <button className="linkbtn" type="submit">
              {t(lang, "logout")}
            </button>
          </form>
        )}
      </footer>
    </div>
  );
}
