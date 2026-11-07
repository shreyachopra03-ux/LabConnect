/**
 * Seeds the demo by going through the REAL pipeline: it writes a LIS export CSV and
 * signed PDFs into lis-export/, then runs the importer, which triggers summaries,
 * links and (mock) WhatsApp messages exactly as in production.
 */
import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { config } from "../src/lib/config";
import { hashPassword, randomToken, sha256 } from "../src/lib/crypto";
import { db } from "../src/lib/db";
import { scanInbox } from "../src/lib/lis/import";

type Row = {
  order_id: string;
  patient_name: string;
  mobile: string;
  birth_year: string;
  language: string;
  parameter: string;
  unit: string;
  result: string;
  reference_range: string;
  status: string;
  referring_doctor: string;
};

const COLS: (keyof Row)[] = [
  "order_id", "patient_name", "mobile", "birth_year", "language", "parameter", "unit", "result", "reference_range", "status", "referring_doctor",
];

// The three rows from the brief, plus a family member on Lakshmi's number and a few normal values.
const ROWS: Row[] = [
  r("ORD-71204", "Lakshmi Prasanna K", "9000000001", "1968", "te", "Haemoglobin", "g/dL", "10.2", "12.0-15.5", "Ready", "Dr. S. Ramanaiah"),
  r("ORD-71204", "Lakshmi Prasanna K", "9000000001", "1968", "te", "Total WBC count", "10^3/uL", "7.2", "4.0-11.0", "Ready", "Dr. S. Ramanaiah"),
  r("ORD-71204", "Lakshmi Prasanna K", "9000000001", "1968", "te", "Platelets", "10^3/uL", "245", "150-450", "Ready", "Dr. S. Ramanaiah"),

  r("ORD-71219", "Venkata Rao M", "9000000002", "1955", "te", "LDL cholesterol", "mg/dL", "142", "0-100", "Processing", "Dr. P. Anitha"),
  r("ORD-71219", "Venkata Rao M", "9000000002", "1955", "te", "Total cholesterol", "mg/dL", "228", "0-200", "Processing", "Dr. P. Anitha"),

  r("ORD-71233", "Farzana Begum", "9000000099", "1972", "hi", "Potassium", "mmol/L", "6.8", "3.5-5.1", "Ready (critical)", "Dr. K. Suresh"),
  r("ORD-71233", "Farzana Begum", "9000000099", "1972", "hi", "Sodium", "mmol/L", "138", "135-145", "Ready (critical)", "Dr. K. Suresh"),

  r("ORD-71240", "Kamala Devi K", "9000000001", "1946", "te", "Glucose fasting", "mg/dL", "132", "70-100", "Ready", "Dr. S. Ramanaiah"),
  r("ORD-71240", "Kamala Devi K", "9000000001", "1946", "te", "HbA1c", "%", "7.4", "4.0-5.6", "Ready", "Dr. S. Ramanaiah"),
  r("ORD-71240", "Kamala Devi K", "9000000001", "1946", "te", "Vitamin B12", "pg/mL", "160", "200-900", "Ready", "Dr. S. Ramanaiah"),
  r("ORD-71240", "Kamala Devi K", "9000000001", "1946", "te", "Magnesium", "mg/dL", "1.4", "1.7-2.2", "Ready", "Dr. S. Ramanaiah"),
];

function r(...v: string[]): Row {
  return Object.fromEntries(COLS.map((c, i) => [c, v[i]])) as Row;
}

const toCsv = (rows: Row[]) =>
  [COLS.join(","), ...rows.map((row) => COLS.map((c) => (/[",]/.test(row[c]) ? `"${row[c].replace(/"/g, '""')}"` : row[c])).join(","))].join("\n") + "\n";

async function makePdf(orderId: string, rows: Row[]) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.09, 0.1, 0.11);
  const muted = rgb(0.4, 0.43, 0.46);
  let y = 790;
  const text = (s: string, x: number, size = 10, f = font, color = ink) => page.drawText(s, { x, y, size, font: f, color });

  text("Company A Diagnostics", 50, 18, bold);
  y -= 18;
  text("Vijayawada  |  NABL-style sample report (demo data)", 50, 9, font, muted);
  y -= 36;
  const h = rows[0];
  text(`Patient: ${h.patient_name}`, 50, 11, bold);
  text(`Order: ${orderId}`, 380, 11, bold);
  y -= 16;
  text(`Referred by: ${h.referring_doctor}`, 50);
  text(`Year of birth: ${h.birth_year}`, 380);
  y -= 34;
  text("Test", 50, 9, bold, muted);
  text("Result", 260, 9, bold, muted);
  text("Unit", 340, 9, bold, muted);
  text("Reference range", 430, 9, bold, muted);
  y -= 8;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: muted });
  for (const row of rows) {
    y -= 20;
    text(row.parameter, 50);
    text(row.result, 260, 10, bold);
    text(row.unit, 340);
    text(row.reference_range, 430);
  }
  y -= 60;
  text("Electronically signed by Dr. A. Pathologist, MD (Pathology)", 50, 10, bold);
  y -= 14;
  text("This report is for the referring doctor's interpretation.", 50, 9, font, muted);
  return pdf.save();
}

function cleanDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) if (f !== ".gitkeep") fs.rmSync(path.join(dir, f), { force: true });
}

async function main() {
  for (const d of ["inbox", "processed", "reports", "samples"]) cleanDir(path.join(config.lisDir, d));
  cleanDir(path.join(config.storageDir, "reports"));

  const password = process.env.SEED_STAFF_PASSWORD || "frontdesk123";
  await db.staff.create({ data: { name: "Priya (Front desk)", username: "frontdesk", passwordHash: hashPassword(password), role: "FRONT_DESK" } });
  await db.staff.create({ data: { name: "Ravi (Operations)", username: "ops", passwordHash: hashPassword(password), role: "OPS" } });

  // Signed PDFs, as the LIS would drop them.
  const byOrder = new Map<string, Row[]>();
  for (const row of ROWS) byOrder.set(row.order_id, [...(byOrder.get(row.order_id) ?? []), row]);
  for (const [id, rows] of byOrder) {
    fs.writeFileSync(path.join(config.lisDir, "reports", `${id}.pdf`), await makePdf(id, rows));
  }

  // Morning export from the LIS.
  fs.writeFileSync(path.join(config.lisDir, "inbox", "LIS_EXPORT_0900.csv"), toCsv(ROWS));

  // Later export where the pathologist signs ORD-71219. Drop it in with `npm run lis:drop-sample`.
  const signedLater = ROWS.filter((x) => x.order_id === "ORD-71219").map((x) => ({ ...x, status: "Ready" }));
  fs.writeFileSync(path.join(config.lisDir, "samples", "LIS_EXPORT_1130_ORD-71219_signed.csv"), toCsv(signedLater));

  const out = await scanInbox();

  // Referring doctors log in with their registered mobile + OTP.
  const doctorMobiles: Record<string, string> = {
    "Dr. S. Ramanaiah": "9100000001",
    "Dr. P. Anitha": "9100000002",
    "Dr. K. Suresh": "9100000003",
  };
  for (const [name, mobile] of Object.entries(doctorMobiles)) {
    await db.doctor.update({ where: { name }, data: { mobile } });
  }

  // An already-expired link, to demo the "expired -> OTP" path.
  const expiredRaw = randomToken(24);
  await db.reportLink.create({
    data: {
      tokenHash: sha256(expiredRaw),
      orderId: "ORD-71240",
      mobile: "9000000001",
      createdBy: "SYSTEM",
      createdAt: new Date(Date.now() - 80 * 3_600_000),
      expiresAt: new Date(Date.now() - 8 * 3_600_000),
    },
  });

  console.log("\nSeed complete.");
  for (const o of out) console.log(`  imported ${o.file}: ${o.orders} orders, signed ${o.signed.join(", ") || "none"}${o.errors.length ? `, errors: ${o.errors.join("; ")}` : ""}`);
  console.log(`
  Patient portal   ${config.appUrl}/login        mobiles 9000000001 (Lakshmi + mother), 9000000002, 9000000099
  Mock outbox      ${config.appUrl}/dev/outbox   (OTP codes and WhatsApp links appear here)
  Front desk       ${config.appUrl}/staff        frontdesk / ${password}
  Ops head         ${config.appUrl}/staff/reports  ops / ${password}
  Doctor           ${config.appUrl}/doctor       9100000001 (Dr. S. Ramanaiah), 9100000002, 9100000003
  Expired link     ${config.appUrl}/r/${expiredRaw}
  Sign-off demo    npm run lis:drop-sample        (signs ORD-71219; watcher sends the link)
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
