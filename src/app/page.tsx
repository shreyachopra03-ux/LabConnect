import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand, BrandMark } from "@/components/BrandMark";
import { config } from "@/lib/config";
import { getPatientSession } from "@/lib/session";
import { directionSentence, findTest } from "@/lib/summary/catalog";

/**
 * Public landing page. The example explanation is generated from the same locked
 * templates patients receive, so the page never promises text the product doesn't produce.
 */
export default async function Home() {
  const s = await getPatientSession();
  if (s?.kind === "LINK" && s.orderId) redirect(`/reports/${s.orderId}`);
  const signedIn = s?.kind === "PATIENT";

  const hb = findTest("Haemoglobin")!;
  const example = {
    en: `${directionSentence(hb.name, "LOW").en} ${hb.low!.en}`,
    te: `${directionSentence(hb.name, "LOW").te} ${hb.low!.te}`,
    hi: `${directionSentence(hb.name, "LOW").hi} ${hb.low!.hi}`,
  };

  return (
    <div className="lp">
      {/* ---------- Hero ---------- */}
      <section className="lp-dark lp-hero">
        <div className="lp-wrap">
          <header className="lp-nav">
            <Link href="/" className="brand">
              <Brand />
            </Link>
            <nav aria-label="Main">
              <a href="#how" className="hide-sm">How it works</a>
              <a href="#safety" className="hide-sm">Safety</a>
              <Link href="/doctor/login" className="hide-sm">Doctors</Link>
              <Link href="/staff/login">Staff</Link>
            </nav>
          </header>

          <div className="lp-hero-grid">
            <div>
              <span className="eyebrow reveal" style={{ color: "var(--on-dark-muted)" }}>
                Vijayawada · 6 labs · 38 collection centres
              </span>
              <h1 className="reveal d1">
                Your results,
                <br />
                in <em>words</em> you
                <br />
                know.
              </h1>
              <p className="lede reveal d2">
                The moment your report is signed, a safe link reaches your phone. Open it, read what
                your numbers mean in English, Telugu or Hindi, and take the full report to your doctor.
                No calls, no queues.
              </p>
              <div className="cta reveal d3">
                <Link href={signedIn ? "/orders" : "/login"} className="btn light">
                  {signedIn ? "Go to my reports" : "See my reports"} <span className="arrow" aria-hidden="true">→</span>
                </Link>
                <Link href="/doctor/login" className="btn ghost-light">
                  I am a referring doctor
                </Link>
              </div>
              <div className="lp-scripts reveal d3" aria-hidden="true">
                <span>Your results</span>
                <span lang="te">మీ ఫలితాలు</span>
                <span lang="hi">आपके परिणाम</span>
              </div>
            </div>

            <aside className="specimen reveal d2" aria-label="Example of a report as patients see it">
              <span className="eyebrow">
                <span>Example report</span>
                <span className="pill ready">Ready</span>
              </span>
              <h3>Haemoglobin</h3>
              <div className="line">
                <span className="muted">Your result</span>
                <b>10.2 <small className="muted" style={{ fontSize: "0.8rem" }}>g/dL</small></b>
              </div>
              <div className="line">
                <span className="muted">Normal range</span>
                <span className="mono">12.0 – 15.5</span>
              </div>
              <div className="line">
                <span className="muted">Flag</span>
                <span className="pill low">Low</span>
              </div>
              <div className="explain">
                <p>{example.en}</p>
                <p lang="te">{example.te}</p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ---------- Statement ---------- */}
      <section className="lp-statement">
        <div className="lp-wrap">
          <BrandMark className="mark" />
          <p style={{ width: "100%" }}>
            Every signed report reaches the right person, on their own phone, the same hour.
          </p>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="lp-section" id="how">
        <div className="lp-wrap">
          <div className="lp-section-head">
            <h2>From the lab bench to your hand.</h2>
            <p>
              Nothing new to install, and the lab system is not touched. We read what it already
              produces and take it the last mile.
            </p>
          </div>
          <div className="steps">
            <article className="step">
              <div className="n">01</div>
              <h3>Signed by the pathologist</h3>
              <p>The lab system exports the signed report. We pick it up within seconds and check every value against its own reference range.</p>
            </article>
            <article className="step">
              <div className="n">02</div>
              <h3>Explained in plain words</h3>
              <p>Values outside the range get a short, approved explanation in three languages. Critical values never do: a person calls you first.</p>
            </article>
            <article className="step">
              <div className="n">03</div>
              <h3>Delivered, safely</h3>
              <p>A link arrives on WhatsApp, or by SMS if WhatsApp fails. It opens one report, for 72 hours. After that, a code sent to your number reopens it.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ---------- Languages ---------- */}
      <section className="lp-dark lp-section">
        <div className="lp-wrap">
          <div className="lp-section-head">
            <h2>Read it the way you speak.</h2>
            <p>
              Many of our patients are elderly and read Telugu first. The same explanation, written
              once and checked by a pathologist, in all three languages.
            </p>
          </div>
          <div className="langs-show">
            <figure>
              <figcaption>English</figcaption>
              <blockquote lang="en">{example.en}</blockquote>
            </figure>
            <figure>
              <figcaption>తెలుగు · Telugu</figcaption>
              <blockquote lang="te">{example.te}</blockquote>
            </figure>
            <figure>
              <figcaption>हिंदी · Hindi</figcaption>
              <blockquote lang="hi">{example.hi}</blockquote>
            </figure>
          </div>
          <p className="lp-footnote">
            An explanation is a guide, not a diagnosis. Every explanation links to the full signed report,
            and patients can tell us if one reads wrong.
          </p>
        </div>
      </section>

      {/* ---------- Safety ---------- */}
      <section className="lp-section" id="safety">
        <div className="lp-wrap safety">
          <div>
            <span className="eyebrow">Health data is personal</span>
            <h2>Built so the wrong person never opens a report.</h2>
          </div>
          <ul>
            <li><b>72-hour links</b><span>Each link opens one report and expires. A code sent to the registered number is needed after that.</span></li>
            <li><b>Nothing in the message</b><span>WhatsApp and SMS carry only a first name and a link: never a result.</span></li>
            <li><b>Critical first</b><span>A dangerous value starts a phone call from our team before any link is sent.</span></li>
            <li><b>Every view logged</b><span>Who opened which report, when and from where, kept as required by the DPDP Act 2023.</span></li>
            <li><b>Your consent</b><span>Given once, withdrawn with one tap. Built to run on servers in India.</span></li>
          </ul>
        </div>
      </section>

      {/* ---------- Doors ---------- */}
      <section className="lp-section" style={{ paddingTop: 0 }}>
        <div className="lp-wrap">
          <div className="doors">
            <Link className="door" href={signedIn ? "/orders" : "/login"}>
              <span className="eyebrow">Patients and families</span>
              <h3>Your reports</h3>
              <p>Sign in with your mobile number. Everyone registered on one number appears together.</p>
              <span className="go">Open <span className="arrow" aria-hidden="true">→</span></span>
            </Link>
            <Link className="door" href="/doctor/login">
              <span className="eyebrow">Referring doctors</span>
              <h3>Your patients</h3>
              <p>Ninety days of your patients’ reports in one list, with out-of-range and critical filters.</p>
              <span className="go">Open <span className="arrow" aria-hidden="true">→</span></span>
            </Link>
            <Link className="door" href="/staff/login">
              <span className="eyebrow">Lab team</span>
              <h3>Front desk</h3>
              <p>Find a patient, resend a link, follow up critical values and see every delivery.</p>
              <span className="go">Open <span className="arrow" aria-hidden="true">→</span></span>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="lp-dark lp-footer">
        <div className="lp-wrap">
          <p className="big">Results, made human.</p>
          <div className="cols">
            <span>Company A Diagnostics · Vijayawada · Help: {config.helpline}</span>
            <span>
              <Link href="/login">Patients</Link>
              <Link href="/doctor/login">Doctors</Link>
              <Link href="/staff/login">Staff</Link>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
