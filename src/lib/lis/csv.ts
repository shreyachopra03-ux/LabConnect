/** Minimal RFC 4180 CSV parser (quotes, escaped quotes, CRLF, BOM). Returns rows keyed by snake_case header. */
export function parseCsv(text: string): Record<string, string>[] {
  const src = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }

  const nonEmpty = rows.filter((r) => r.some((f) => f.trim() !== ""));
  if (nonEmpty.length === 0) return [];
  const header = nonEmpty[0].map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
  return nonEmpty.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

/** "Haemoglobin g/dL" -> { parameter: "Haemoglobin", unit: "g/dL" } when the LIS has no unit column. */
export function splitParameterUnit(raw: string): { parameter: string; unit: string | null } {
  const m = raw.trim().match(/^(.*\S)\s+(\S*(?:\/|%)\S*)$/);
  return m ? { parameter: m[1], unit: m[2] } : { parameter: raw.trim(), unit: null };
}

/** LIS status text -> our status. "Ready (critical)" is READY + critical. */
export function mapStatus(raw: string): { status: "READY" | "PROCESSING"; critical: boolean } {
  const s = raw.trim().toLowerCase();
  const critical = s.includes("critical");
  const ready = critical || /^(ready|signed|final|authori[sz]ed|approved)/.test(s);
  return { status: ready ? "READY" : "PROCESSING", critical };
}
