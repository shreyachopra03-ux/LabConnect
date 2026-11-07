/**
 * Structured JSON logger with PHI redaction (C004).
 * Never logs message bodies, OTP codes, link tokens or full mobile numbers.
 */
type Level = "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const DROP_KEYS = new Set(["body", "token", "code", "otp", "password", "url"]);

/** Removes link tokens, report URLs and 6-digit codes from free text. */
export function redact(text: string): string {
  return text
    .replace(/https?:\/\/\S*\/r\/[A-Za-z0-9_-]+/g, "[link]")
    .replace(/\/r\/[A-Za-z0-9_-]{16,}/g, "/r/[redacted]")
    .replace(/(?<!\d)\d{6}(?!\d)/g, "[code]")
    .replace(/(?<!\d)[6-9]\d{9}(?!\d)/g, (m) => `******${m.slice(-4)}`);
}

function clean(fields: Fields): Fields {
  const out: Fields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (DROP_KEYS.has(k)) {
      out[k] = "[redacted]";
    } else if (k === "mobile" && typeof v === "string") {
      out[k] = `******${v.slice(-4)}`;
    } else if (v instanceof Error) {
      out[k] = redact(v.message);
    } else if (typeof v === "string") {
      out[k] = redact(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function formatLine(level: Level, msg: string, fields: Fields = {}): string {
  return JSON.stringify({ ts: new Date().toISOString(), level, msg: redact(msg), ...clean(fields) });
}

function write(level: Level, msg: string, fields?: Fields) {
  const line = formatLine(level, msg, fields);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info: (msg: string, fields?: Fields) => write("info", msg, fields),
  warn: (msg: string, fields?: Fields) => write("warn", msg, fields),
  error: (msg: string, fields?: Fields) => write("error", msg, fields),
};
