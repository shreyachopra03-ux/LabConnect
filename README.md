# Company A: Report Delivery

When the pathologist signs a report, the patient automatically gets a secure link on WhatsApp. The link opens the report with a short explanation in English, Telugu or Hindi. Patients should never have to call the lab to ask if a report is ready.

This repo covers the **core slice** from the brief end to end, plus all of the optional "must have" depth:

| # | Brief requirement | Where |
|---|---|---|
| 1 | LIS CSV import, fed by the export folder | `src/lib/lis/` (folder watcher + importer) |
| 2 | Automatic report link on sign-off | `src/lib/delivery.ts`, `src/lib/links.ts` |
| 3 | Patient OTP portal: orders, status, PDF | `/login`, `/orders`, `/reports/[id]` |
| 4 | Plain-language summary of out-of-range values (EN / TE / HI) | `src/lib/summary/` |
| 5 | Front-desk console: find patient, resend, delivery status, access log | `/staff` |
| 6 | Referring-doctor view: last 90 days of their patients' reports | `/doctor` |
| 7 | Delivery and access report for the operations head, with CSV export | `/staff/reports` |
| 8 | Pathologist review of summaries (50 a week): approve or withdraw | `/staff/summaries` |
| + | Amended reports re-sent, consent withdrawal, critical-value callbacks, 30 locked templates | `src/lib/lis/import.ts`, `/privacy` |

Messaging, the LIS and the AI are mocked behind small interfaces. The demo is seeded from the sample data in the brief.

---

## Run it

Needs Node 20+ and Docker (for PostgreSQL).

```bash
npm install
cp .env.example .env      # then set OTP_PEPPER (command is in the file)
npm run db:up             # starts PostgreSQL in Docker
npm run setup             # applies migrations and seeds through the real import pipeline
npm run dev               # http://localhost:3000
```

Or run the whole stack in Docker (database, migrations, production build):

```bash
docker compose --profile app up --build   # http://localhost:3000
```

`npm run setup` prints the demo logins and an already-expired link.

| Who | Where | Login |
|---|---|---|
| Patient | `/login` | `9000000001` (Lakshmi and her mother, Kamala, on one number), `9000000002` (Venkata), `9000000099` (Farzana) |
| Mock phone | `/dev/outbox` | Shows every OTP and WhatsApp/SMS message the system "sent" |
| Front desk | `/staff` | `frontdesk` / `frontdesk123` |
| Operations head | `/staff/reports` | `ops` / `frontdesk123` |
| Pathologist | `/staff/summaries` | `pathologist` / `frontdesk123` |
| Referring doctor | `/doctor` | `9100000001` (Dr. S. Ramanaiah), `9100000002`, `9100000003`, OTP from the outbox |

### Demo script (5 minutes)

1. **Open the link a patient received.** Go to `/dev/outbox` and open Lakshmi's WhatsApp link. Tap **Open report**, accept consent, and read the haemoglobin summary. Switch to తెలుగు, then download the PDF.
2. **Critical value.** Open Farzana's link: potassium is 6.8. There is no summary, only "our team will call you". Her number is not on WhatsApp in the mock, so the outbox shows the SMS fallback.
3. **Family on one number.** Log in at `/login` with `9000000001` and use the OTP from the outbox. Both Lakshmi's and Kamala's reports are listed. Kamala's Magnesium has no locked template, so it gets an AI sentence when `ANTHROPIC_API_KEY` is set, or a safe generic sentence when it isn't.
4. **Sign-off triggers delivery.** Venkata's ORD-71219 is still "Being tested". Run `npm run lis:drop-sample`. This drops a new LIS export in which the pathologist signed it. Within about 15 seconds the watcher imports it and his WhatsApp link appears in the outbox. No one presses anything.
5. **Expired link.** Open the expired link printed by `setup`. It offers to send a code to `••••••0001`, and after the OTP the report opens.
6. **Front desk.** At `/staff`, review the 7-day delivery stats, the open callback for Farzana and the import history. Search `lakshmi`, then **Resend link** by SMS: the old link stops working. The access log shows every view, download, resend and staff action.
7. **Referring doctor.** At `/doctor`, log in with `9100000001`. Dr. Ramanaiah sees Lakshmi's and Kamala's reports (not Farzana's, who has a different doctor), can filter by out-of-range or critical, open the results table, download the signed PDF and see what the patient was told.
8. **Operations head.** Sign in to `/staff` as `ops`, then open **Reports**. It shows digital delivery against the 80% target, open rate, median time to open, WhatsApp vs SMS, failures, resends and callbacks for 7, 30 or 90 days, with a CSV download. The front-desk account can't open it.
9. **Pathologist review.** Sign in as `pathologist` and open **Summary review**. Each summary is shown with its results and the exact English, Telugu and Hindi text the patient saw. **Approve** it, or **Withdraw from patient**: the patient then sees only the full report and "please show your doctor". A counter tracks the 50-a-week target.
10. **Amended report.** Run `npm run lis:drop-amendment`. The pathologist has corrected Lakshmi's haemoglobin and re-signed. The importer notices the results changed, rebuilds the summary, revokes the old link and sends an "updated report" message. The report page says it was updated.
11. **Withdraw consent.** Logged in as a patient, tap **Privacy and consent** in the footer, then **Withdraw consent**. All links for the number stop working, the session ends, and no new links are sent. A front-desk resend is blocked and logged. Logging in again and accepting consent restores sharing. Staff can also record a withdrawal made by phone.

### Tests

```bash
npm test         
npm run typecheck
npm run build
```

---

## How it works

```
LIS (unchanged) ── writes CSV + signed PDF ──▶ lis-export/inbox, lis-export/reports
                                                    │  polled every 15s (src/instrumentation.ts)
                                                    ▼
                                  importer: upsert patient / order / results
                                  flags from reference ranges (rules, not AI)
                                                    │  status became READY?
                                                    ▼
                         ┌──────────── critical? ────────────┐
                        yes                                   no
              no summary, callback task             summary: locked template → AI → generic
                         └──────────────┬─────────────────────┘
                                        ▼
                   72h link (token hash stored) → WhatsApp, SMS fallback
                                        ▼
            /r/<token> → tap "Open report" → session for that ONE order
            after 72h → OTP to the registered number → full portal
```

**Stack:** Next.js 16 (App Router, server components, server actions), TypeScript, Prisma, PostgreSQL 16, Docker.
Every page renders on the server and every form also works with JavaScript off. That matters for low-end phones on weak data: the login page is about 9 KB of HTML and uses no web fonts.

### The hard part: secure expiring links with OTP

- **Tokens.** 192-bit random tokens. Only a SHA-256 hash is stored, so a database leak exposes no working links.
- **Scope.** A link unlocks **one order** for at most 60 minutes, and never beyond the link's own 72-hour expiry. Seeing every report on the number needs an OTP.
- **Link previews.** Opening the link page does nothing by itself. The report unlocks only on a POST from the "Open report" button, so WhatsApp link previews and URL scanners can't consume or log a view.
- **Resend.** A front-desk resend revokes every older link for that order.
- **Expiry.** After 72 hours the page offers an OTP to the *registered* number. The number is shown masked and the user cannot type a different one.
- **OTP limits.** 6 digits, 5-minute expiry, 5 attempts, at most 3 codes per number per 10 minutes. Codes are stored hashed with a pepper. The login form behaves the same for unknown numbers, so it can't be used to discover patients.
- **No enumeration.** Another patient's order ID returns a 404, exactly like one that doesn't exist.
- **Doctors.** Referring doctors log in with their registered mobile and an OTP. They can open only orders they referred, only once signed, and only within 90 days. Everything else returns a 404.
- **Roles.** The operations report and its CSV are limited to the ops role. The CSV is order-level only, with no patient names.
- **Headers.** HttpOnly SameSite cookies, `Referrer-Policy: same-origin` so tokens never leak to other sites, `X-Frame-Options: DENY` and `noindex`.

### The AI summary and its guardrails

- **Flags come from rules.** Whether a value is high or low is decided only by the report's own reference range (`src/lib/clinical/ranges.ts`).
- **Locked templates.** The common tests use pathologist-approved sentences in three languages (`src/lib/summary/catalog.ts`). 30 tests are covered, as the brief asks.
- **AI fallback.** Tests without a template use Claude, which only explains a direction that the rules already decided. Output is validated JSON with a length cap and an 8-second timeout. On any failure it falls back to "please ask your doctor".
- **Critical values** get no summary and create a callback task for staff.
- **Review loop.** Every summary links to the full report, carries a "not a diagnosis" note, and has a **Tell us** button for patients to flag it. Flagged and AI-written summaries go first in the pathologist's queue, followed by template summaries, so the 50-a-week review also samples locked text. A withdrawn summary is hidden from the patient immediately.

### DPDP Act 2023

- **Consent** is recorded per mobile number with a version, before any report is shown.
- **Withdrawal** is as easy as giving consent: one button for the patient, or recorded by staff. It revokes live links and stops all future messages to the number; reports stay with the lab as medical records.
- **Access log.** An append-only log records who did what, on which order, when and from which IP: patient views, PDF downloads, link opens, staff searches, views and resends.
- **No health data in messages.** WhatsApp and SMS carry only a first name, the order ID and the link.
- **Hosting in India.** Postgres and object storage run in an Indian region (for example AWS Mumbai, ap-south-1).

### Design

The design uses one accent colour, white space, a 19px base font and 58px tap targets, with one main action per screen. Telugu and Hindi get extra line height and rely on the phone's own system fonts. Results appear as a short list with plain High/Low labels instead of a dense table. The staff console uses the same visual language at a denser size.

---

## Mocked vs. real

| Here | In production |
|---|---|
| `MOCK_MESSAGING=true`: messages stored and shown at `/dev/outbox` | WhatsApp Business API (approved templates) and a DLT-registered SMS gateway, with delivery receipts by webhook |
| LIS export simulated by the seed and `lis:drop-sample` | The LIS's real export folder or share. The CSV contract is documented in `src/lib/lis/import.ts` |
| Postgres in Docker, PDFs on a local volume | Managed Postgres and encrypted object storage in an Indian region |
| Seeded staff passwords | SSO or per-staff accounts with role-based access |

## Production readiness

Already in place:

- **PostgreSQL with versioned migrations** (`prisma/migrations`). Deploys run `npm run db:migrate`, never a reset.
- **Docker image**: multi-stage build, standalone server, non-root user, health check. `docker compose --profile app up` runs database, migrations and app.
- **Fail-fast config check** (`src/lib/env-check.ts`). In production the app refuses to start with a weak `OTP_PEPPER`, a non-HTTPS `APP_URL`, a non-Postgres database, or mock messaging (unless `DEMO_MODE=true`).
- **`/api/health`** checks the app and the database for the load balancer.
- **Cleanup**: expired sessions and old OTPs are purged hourly. Access logs are kept.
- **Security headers**: HSTS, no framing, no referrer to other sites, `noindex`.

Still needed before real patients use it:

- A real WhatsApp Business API and DLT-registered SMS provider in `src/lib/messaging/` (the only mocked boundary left).
- PDFs in encrypted object storage (S3 Mumbai) instead of a local volume.
- HTTPS in front of the app (load balancer or reverse proxy), backups, and monitoring.
- Run the LIS watcher on one instance only (`LIS_WATCH=true` there, `false` on the others).

## Next steps

- **Per-centre breakdown** in the operations report, once the LIS export includes the collection centre.
- **Before go-live:** pathologist sign-off on the critical limits and the 30 templates, plus native-speaker review of the Telugu and Hindi copy.

## Project layout

```
prisma/schema.prisma      data model (contacts, patients, orders, results, links, messages, audit…)
prisma/seed.ts            sample data → CSV + PDFs → real import pipeline
src/lib/lis/              CSV parser, importer, folder watcher
src/lib/clinical/         reference-range rules, critical limits
src/lib/summary/          locked templates (EN/TE/HI), AI fallback, summary builder
src/lib/links.ts          expiring link tokens
src/lib/otp.ts            OTP issue / verify with limits
src/lib/session.ts        patient, link-scoped and staff sessions
src/lib/delivery.ts       on sign-off: summary/callback → link → WhatsApp/SMS
src/app/                  patient screens, /r/[token], /doctor, /staff console + reports, /dev/outbox
src/lib/ops-report.ts     delivery and access report for the operations head
tests/                    unit tests
```
