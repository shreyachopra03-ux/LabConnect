# LabConnect: Deployment and Demo Guide

- **Repository:** https://github.com/shreyachopra03-ux/LabConnect
- **Live app:** https://labconnect-production-b389.up.railway.app

---

## 1. Demo logins for the reviewer

The live app runs in **demo mode**, so no real WhatsApp or SMS messages are sent. Every message the system "sends" appears at **`/dev/outbox`**. In demo mode the one-time code is also shown on the code screen itself.

| Role | Where | Login |
|---|---|---|
| Patient (Lakshmi, plus her mother Kamala on the same number) | `/login` | Mobile `9000000001`. The code is shown on the next screen. |
| Patient (Venkata, report still "being tested") | `/login` | Mobile `9000000002` |
| Patient (Farzana, critical potassium) | `/login` | Mobile `9000000099` |
| Front desk | `/staff/login` | `frontdesk` / `frontdesk123` |
| Operations head | `/staff/login`, then **Reports** | `ops` / `frontdesk123` |
| Pathologist | `/staff/login`, then **Summary review** | `pathologist` / `frontdesk123` |
| Referring doctor | `/doctor/login` | Mobile `9100000001` (Dr. S. Ramanaiah). The code is shown on the next screen. |
| Mock phone | `/dev/outbox` | No login. Shows every OTP and report link. |

All names and numbers are invented sample data based on the brief. None of it is real personal data.

### A 5-minute walkthrough

1. **A patient opens their link.** Go to `/dev/outbox` and open Lakshmi's WhatsApp link, then tap **Open report** and accept consent. You will see the plain-language summary, and you can switch it to తెలుగు or हिंदी. Below it are the signed results and the PDF download.
2. **Sign-off triggers delivery.** Sign in as `frontdesk` and press **Simulate sign-off** under *LIS import*. This drops an LIS export in which the pathologist signs Venkata's ORD-71219. The system imports it, writes the summary and sends the link without anyone doing anything else. You can see the new message in `/dev/outbox`.
3. **A critical value goes to a person first.** In the front-desk console, Farzana's potassium 6.8 shows under *Callbacks*. Her link is held back. Pressing **Called · send report link** releases it.
4. **A family shares one number.** At `/login`, sign in with `9000000001`. Lakshmi's and Kamala's reports are listed separately.
5. **An amended report.** Press **Simulate amendment**. Lakshmi's haemoglobin is corrected and re-signed: the old link stops working and an "updated report" message is sent.
6. **Other roles.** The doctor sees only their own patients from the last 90 days. The ops head sees delivery rates and can download a CSV. The pathologist reviews summaries and can approve or withdraw them.

The demo links expire 72 hours after they are sent. When a link has expired, the page offers a code sent to the registered number, which is the intended behaviour. To get a fresh link, use **Resend link** on a patient's page in the front-desk console.

---

## 2. Run it locally

**Requirements:** Node.js 20 or newer, and Docker Desktop (it runs PostgreSQL).

```bash
# 1. Get the code
git clone https://github.com/shreyachopra03-ux/LabConnect.git
cd LabConnect
npm install

# 2. Environment
cp .env.example .env
# Set OTP_PEPPER in .env to a random value:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Database: PostgreSQL 16 and a database viewer (Adminer) in Docker
npm run db:up

# 4. Apply migrations and load the sample data (through the real LIS import)
npm run setup

# 5. Start the app
npm run dev
```

Open http://localhost:3000. `npm run setup` prints the demo logins and an already-expired link, so you can test the "expired, send a code" path.

| Command | What it does |
|---|---|
| `npm run lis:drop-sample` | Simulates the LIS exporting a newly signed report (ORD-71219). The watcher imports it within 15 seconds. |
| `npm run lis:drop-amendment` | Simulates a corrected, re-signed report (ORD-71204). |
| `npm test` | Unit tests: ranges, flags, critical values, CSV parsing, templates, token size, log redaction, CSRF check. |
| `npm run test:integration` | Integration tests against the local PostgreSQL database: links, OTP limits and lockout, import lock, message retries, health check, critical-value hold. |
| `npm run typecheck` | TypeScript check. |
| http://localhost:8080 | Adminer database viewer. System: PostgreSQL, server: `db`, user: `lab`, password: `lab_dev_password`, database: `reports`. These are local development values only. |

**Windows note:** stop `npm run dev` before running `npm run setup` or `npx prisma generate`. A running server locks the Prisma engine file.

### Run the production build locally

```bash
docker compose --profile app up --build    # http://localhost:3000
```

This builds the same image that is deployed. It starts PostgreSQL, applies migrations and starts the app.

---

## 3. How it is deployed

| Part | Where |
|---|---|
| App | **Railway**, built from the repository's `Dockerfile` and deployed automatically on every push to `main` |
| Database | Railway PostgreSQL |
| PDFs and the LIS folder | A Railway volume mounted at `/app/data` |
| Region | Southeast Asia (Singapore), the closest available to Andhra Pradesh. *See the hosting note below.* |

**Why a container and not a serverless host:** the app runs a background watcher that checks the LIS export folder every 15 seconds, and it stores PDFs on disk. Both need a long-running server and a persistent volume.

On every start, `scripts/start.sh`:

1. Applies pending database migrations (`prisma migrate deploy`). It never resets data.
2. If `DEMO_MODE=true` and the database is empty, loads the sample data once (`scripts/seed-if-empty.mjs`). Later redeploys keep existing data.
3. Starts the app.

Railway restarts the container if **`/api/health`** fails. The health check confirms that the database answers and that the LIS and report folders are writable. The same check is available at `/healthz`.

In production the app **refuses to start with unsafe settings** (`src/lib/env-check.ts`):

- a missing or weak `OTP_PEPPER`
- a database that is not PostgreSQL
- a non-HTTPS `APP_URL`
- mock messaging without `DEMO_MODE=true`

**Hosting note:** the DPDP Act 2023 requires India hosting for the real service. Railway has no India region, so the demo runs in Singapore. For the client, the same Docker image would run on AWS Mumbai (ap-south-1) with managed PostgreSQL and encrypted object storage.

### Environment variables

These are names only, never values. `.env` is git-ignored, and no secrets are committed to the repository.

| Name | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string. On Railway: `${{Postgres.DATABASE_URL}}` |
| `APP_URL` | yes | Public base URL put inside report links (must be `https://` in production) |
| `OTP_PEPPER` | yes | Secret mixed into OTP hashes. 32 or more random characters. |
| `DEMO_MODE` | demo only | `true` allows mock messaging in production and loads the sample data once |
| `MOCK_MESSAGING` | yes | `true` while no real WhatsApp/SMS provider is connected |
| `MOCK_FAIL_WHATSAPP_SUFFIX` | no | Numbers ending with this "fail" on WhatsApp, to show the SMS fallback (demo uses `99`) |
| `SEED_STAFF_PASSWORD` | demo only | Password given to the demo staff accounts when the sample data is loaded |
| `LIS_WATCH` | no | `true` on exactly one instance: the one that imports from the LIS folder |
| `LIS_POLL_SECONDS` | no | How often the LIS folder is checked (default 15) |
| `LIS_EXPORT_DIR`, `STORAGE_DIR` | no | Folders for LIS exports and stored PDFs. The Docker image sets them to `/app/data/...`. |
| `OTP_MAX_PER_DAY`, `OTP_LOCK_MINUTES` | no | OTP daily cap (default 10) and lockout length (default 15 minutes) |
| `REQUIRE_AI_REVIEW` | no | Hides AI-written sentences from patients until a pathologist reviews them (default on) |
| `ANTHROPIC_API_KEY` | no | Turns on AI explanations for tests without a template. Without it, a safe "ask your doctor" sentence is used. |
| `SUMMARY_MODEL` | no | Model used for those explanations |
| `PORT` | Railway | Port the app listens on (set to `3000`) |
| `RAILWAY_RUN_UID` | Railway | Set to `0` so the container can write to the attached volume |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | local only | Credentials for the Docker PostgreSQL in `docker-compose.yml` |

### Deploying a copy on Railway

1. **New Project → Deploy from GitHub repo**, and choose this repository.
2. **+ Add → Database → PostgreSQL**.
3. On the app service, **Settings → Networking → Generate Domain**. Use port `3000`.
4. **Variables**: set the variables marked *yes*, plus `DEMO_MODE`, `SEED_STAFF_PASSWORD`, `PORT=3000` and `RAILWAY_RUN_UID=0`.
5. **Attach a volume** to the app service at `/app/data`.
6. Deploy. The deploy log shows `[start] applying database migrations`, then `Seed complete.` (first deploy only), then `Ready`.
