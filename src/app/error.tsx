"use client";

/** Unexpected errors: calm message, a retry, and no technical details shown to patients. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="shell" style={{ paddingTop: 72 }}>
      <span className="eyebrow">Something went wrong</span>
      <h1>We couldn’t load this page.</h1>
      <p className="lede">Your reports are safe. Please try again in a moment, or call 0866 000 0000.</p>
      <p lang="te" className="muted">ఈ పేజీని తెరవలేకపోయాము. కొద్దిసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి.</p>
      <p lang="hi" className="muted">यह पेज नहीं खुल सका। कृपया थोड़ी देर बाद फिर से कोशिश करें।</p>
      <button className="btn" type="button" onClick={reset} style={{ marginTop: 16 }}>
        Try again
      </button>
    </main>
  );
}
