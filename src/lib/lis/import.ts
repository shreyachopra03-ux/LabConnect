import fs from "node:fs";
import path from "node:path";
import { isCriticalValue } from "../clinical/critical";
import { flagValue, parseRange, parseValue } from "../clinical/ranges";
import { config } from "../config";
import { sha256 } from "../crypto";
import { db } from "../db";
import { onReportSigned } from "../delivery";
import { isLang } from "../i18n";
import { normalizeMobile } from "../phone";
import { findTest } from "../summary/catalog";
import { mapStatus, parseCsv, splitParameterUnit } from "./csv";

const REQUIRED = ["order_id", "patient_name", "mobile", "parameter", "result", "reference_range", "status"];

export type ImportOutcome = { file: string; rows: number; orders: number; signed: string[]; errors: string[]; skipped?: boolean };

const inboxDir = () => path.join(config.lisDir, "inbox");
const processedDir = () => path.join(config.lisDir, "processed");

let running = false;

export async function scanInbox(): Promise<ImportOutcome[]> {
  if (running) return [];
  running = true;
  try {
    fs.mkdirSync(inboxDir(), { recursive: true });
    const files = fs.readdirSync(inboxDir()).filter((f) => f.toLowerCase().endsWith(".csv")).sort();
    const out: ImportOutcome[] = [];
    for (const f of files) out.push(await importFile(path.join(inboxDir(), f)));
    return out;
  } finally {
    running = false;
  }
}

function moveToProcessed(file: string) {
  fs.mkdirSync(processedDir(), { recursive: true });
  const dest = path.join(processedDir(), `${Date.now()}_${path.basename(file)}`);
  fs.renameSync(file, dest);
}

export async function importFile(file: string): Promise<ImportOutcome> {
  const name = path.basename(file);
  const text = fs.readFileSync(file, "utf8");
  const fileHash = sha256(text);

  if (await db.importRun.findUnique({ where: { fileHash } })) {
    moveToProcessed(file);
    return { file: name, rows: 0, orders: 0, signed: [], errors: [], skipped: true };
  }

  const rows = parseCsv(text);
  const errors: string[] = [];
  const missing = rows.length ? REQUIRED.filter((c) => !(c in rows[0])) : [];
  if (missing.length) errors.push(`Missing columns: ${missing.join(", ")}`);

  const byOrder = new Map<string, Record<string, string>[]>();
  if (!missing.length) {
    for (const r of rows) {
      if (!r.order_id) continue;
      byOrder.set(r.order_id, [...(byOrder.get(r.order_id) ?? []), r]);
    }
  }

  const signed: string[] = [];
  let upserted = 0;
  for (const [orderId, rs] of byOrder) {
    try {
      if (await upsertOrder(orderId, rs)) signed.push(orderId);
      upserted++;
    } catch (e) {
      errors.push(`${orderId}: ${(e as Error).message}`);
    }
  }

  await db.importRun.create({
    data: {
      fileName: name,
      fileHash,
      rows: rows.length,
      ordersUpserted: upserted,
      ordersSigned: signed.length,
      errors: errors.length ? errors.join("\n") : null,
    },
  });
  moveToProcessed(file);

  for (const id of signed) {
    await onReportSigned(id).catch((e) => console.error(`[delivery] ${id}:`, e));
  }
  console.log(`[lis] ${name}: ${rows.length} rows, ${byOrder.size} orders, ${signed.length} newly signed, ${errors.length} errors`);
  return { file: name, rows: rows.length, orders: byOrder.size, signed, errors };
}

async function upsertOrder(orderId: string, rs: Record<string, string>[]): Promise<boolean> {
  const head = rs[0];
  const mobile = normalizeMobile(head.mobile);
  if (!mobile) throw new Error(`invalid mobile "${head.mobile}"`);
  const patientName = head.patient_name.trim();
  if (!patientName) throw new Error("missing patient name");

  const lang = isLang(head.language) ? head.language : undefined;
  await db.contact.upsert({ where: { mobile }, create: { mobile, ...(lang && { lang }) }, update: {} });

  const birthYear = Number(head.birth_year) || null;
  const patient = await db.patient.upsert({
    where: { mobile_name: { mobile, name: patientName } },
    create: { mobile, name: patientName, birthYear },
    update: birthYear ? { birthYear } : {},
  });

  const doctorName = head.referring_doctor?.trim();
  const doctor = doctorName
    ? await db.doctor.upsert({ where: { name: doctorName }, create: { name: doctorName }, update: {} })
    : null;

  const statuses = rs.map((r) => mapStatus(r.status));
  const status = statuses.some((s) => s.status === "READY") ? "READY" : "PROCESSING";
  const lisCritical = statuses.some((s) => s.critical);

  const results = rs.map((r, i) => {
    const { parameter, unit } = r.unit ? { parameter: r.parameter, unit: r.unit } : splitParameterUnit(r.parameter);
    const value = parseValue(r.result);
    const flag = flagValue(value, parseRange(r.reference_range));
    const critical =
      isCriticalValue(findTest(parameter)?.key ?? null, value) || (lisCritical && (flag === "HIGH" || flag === "LOW"));
    return { position: i, parameter, unit, valueText: r.result, value, rangeText: r.reference_range, flag, critical };
  });
  const isCritical = lisCritical || results.some((r) => r.critical);

  const prev = await db.order.findUnique({ where: { id: orderId }, select: { status: true, signedAt: true, patientId: true } });
  if (prev && prev.patientId !== patient.id) throw new Error("order already belongs to a different patient");

  let pdfPath: string | null = null;
  if (status === "READY") {
    const src = path.join(config.lisDir, "reports", head.pdf_file || `${orderId}.pdf`);
    if (!fs.existsSync(src)) throw new Error(`signed PDF not found: ${path.basename(src)}`);
    const destDir = path.join(config.storageDir, "reports");
    fs.mkdirSync(destDir, { recursive: true });
    pdfPath = path.join(destDir, `${orderId}.pdf`);
    fs.copyFileSync(src, pdfPath);
  }

  const signedAt =
    status === "READY" ? (head.signed_at ? new Date(head.signed_at) : prev?.signedAt ?? new Date()) : null;

  await db.$transaction([
    db.order.upsert({
      where: { id: orderId },
      create: { id: orderId, patientId: patient.id, doctorId: doctor?.id, status, isCritical, signedAt, pdfPath },
      update: { doctorId: doctor?.id, status, isCritical, signedAt, ...(pdfPath && { pdfPath }) },
    }),
    db.result.deleteMany({ where: { orderId } }),
    ...results.map((r) => db.result.create({ data: { ...r, orderId } })),
  ]);

  return status === "READY" && prev?.status !== "READY";
}
