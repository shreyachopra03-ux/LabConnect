export type Range = { low: number | null; high: number | null };
export type Flag = "NORMAL" | "LOW" | "HIGH" | "UNKNOWN";

const NUM = String.raw`(-?\d+(?:\.\d+)?)`;

export function parseRange(text: string): Range | null {
  const t = text.trim().replace(/[–—]/g, "-").replace(/\s+/g, " ");
  let m = t.match(new RegExp(`^${NUM}\\s*-\\s*${NUM}$`));
  if (m) return { low: Number(m[1]), high: Number(m[2]) };
  m = t.match(new RegExp(`^(?:<|<=|≤|up ?to)\\s*${NUM}$`, "i"));
  if (m) return { low: null, high: Number(m[1]) };
  m = t.match(new RegExp(`^(?:>|>=|≥)\\s*${NUM}$`));
  if (m) return { low: Number(m[1]), high: null };
  return null;
}

export function parseValue(text: string): number | null {
  const m = text.trim().match(/^[<>]?\s*(-?\d+(?:\.\d+)?)$/);
  return m ? Number(m[1]) : null;
}

export function flagValue(value: number | null, range: Range | null): Flag {
  if (value === null || range === null) return "UNKNOWN";
  if (range.low !== null && value < range.low) return "LOW";
  if (range.high !== null && value > range.high) return "HIGH";
  return "NORMAL";
}
