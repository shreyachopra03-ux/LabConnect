import { config } from "../config";
import { db } from "../db";
import type { Lang } from "../i18n";
import { log } from "../logger";

export type Channel = "WHATSAPP" | "SMS";

/**
 * Provider result. `retryable: false` = a permanent failure (e.g. number not on WhatsApp),
 * so we go straight to the SMS fallback instead of retrying.
 */
export type DeliveryResult = { ok: boolean; error?: string; retryable?: boolean };
export type Provider = (channel: Channel, mobile: string, body: string) => Promise<DeliveryResult>;

/** Mock provider. A real WhatsApp Business / DLT SMS gateway plugs in here. */
const mockProvider: Provider = async (channel, mobile, body) => {
  if (!config.mockMessaging) return { ok: false, error: "No real messaging provider configured", retryable: false };
  if (channel === "WHATSAPP" && mobile.endsWith(config.mockFailWhatsappSuffix)) {
    return { ok: false, error: "Mock: number is not on WhatsApp", retryable: false };
  }
  log.info("mock message delivered", { channel, mobile, chars: body.length });
  return { ok: true };
};

let provider: Provider = mockProvider;
/** Tests swap the provider to simulate outages. */
export const setProvider = (p: Provider | null) => {
  provider = p ?? mockProvider;
};

export const MAX_ATTEMPTS = 3;
export const retryDelayMs = (attempt: number) => 200 * 2 ** (attempt - 1); // 200ms, 400ms

/** Calls the provider up to MAX_ATTEMPTS times with exponential back-off (C006). */
async function deliverWithRetry(channel: Channel, mobile: string, body: string) {
  let last: DeliveryResult = { ok: false, error: "not attempted" };
  let attempts = 0;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    attempts = attempt;
    last = await provider(channel, mobile, body).catch((e) => ({ ok: false, error: String(e), retryable: true }));
    if (last.ok || last.retryable === false) break;
    if (attempt < MAX_ATTEMPTS) {
      log.warn("message delivery failed, retrying", { channel, mobile, attempt, error: last.error });
      await new Promise((r) => setTimeout(r, retryDelayMs(attempt)));
    }
  }
  return { ...last, attempts };
}

export async function sendMessage(m: {
  mobile: string;
  channel: Channel;
  kind: "REPORT_LINK" | "OTP";
  body: string;
  orderId?: string;
  linkId?: string;
}) {
  const msg = await db.message.create({ data: { ...m, status: "QUEUED" } });
  const r = await deliverWithRetry(m.channel, m.mobile, m.body);
  if (!r.ok) log.error("message delivery failed", { channel: m.channel, mobile: m.mobile, attempts: r.attempts, error: r.error });
  return db.message.update({
    where: { id: msg.id },
    data: { status: r.ok ? "DELIVERED" : "FAILED", error: r.ok ? null : r.error, attempts: r.attempts },
  });
}

function reportLinkText(lang: Lang, firstName: string, orderId: string, url: string, amended: boolean) {
  if (amended) {
    switch (lang) {
      case "te":
        return `Company A Diagnostics: ${firstName} గారి రిపోర్ట్ (${orderId}) నవీకరించబడింది. తాజా వెర్షన్ ఇక్కడ తెరవండి: ${url} — ఈ లింక్ 72 గంటలు పనిచేస్తుంది.`;
      case "hi":
        return `Company A Diagnostics: ${firstName} की रिपोर्ट (${orderId}) अपडेट की गई है। नया संस्करण यहाँ खोलें: ${url} — यह लिंक 72 घंटे तक चलेगा।`;
      default:
        return `Company A Diagnostics: The report for ${firstName} (${orderId}) has been updated. Open the latest version here: ${url} — the link works for 72 hours.`;
    }
  }
  switch (lang) {
    case "te":
      return `Company A Diagnostics: ${firstName} గారి రిపోర్ట్ (${orderId}) సిద్ధంగా ఉంది. ఇక్కడ తెరవండి: ${url} — ఈ లింక్ 72 గంటలు పనిచేస్తుంది.`;
    case "hi":
      return `Company A Diagnostics: ${firstName} की रिपोर्ट (${orderId}) तैयार है। यहाँ खोलें: ${url} — यह लिंक 72 घंटे तक चलेगा।`;
    default:
      return `Company A Diagnostics: The report for ${firstName} (${orderId}) is ready. Open it here: ${url} — the link works for 72 hours.`;
  }
}

export async function sendReportLink(p: {
  orderId: string;
  linkId: string;
  mobile: string;
  lang: Lang;
  patientName: string;
  url: string;
  channel?: Channel;
  amended?: boolean;
}) {
  const body = reportLinkText(p.lang, p.patientName.split(" ")[0], p.orderId, p.url, !!p.amended);
  const first = p.channel ?? "WHATSAPP";
  let msg = await sendMessage({ mobile: p.mobile, channel: first, kind: "REPORT_LINK", body, orderId: p.orderId, linkId: p.linkId });
  if (msg.status === "FAILED" && first === "WHATSAPP") {
    msg = await sendMessage({ mobile: p.mobile, channel: "SMS", kind: "REPORT_LINK", body, orderId: p.orderId, linkId: p.linkId });
  }
  return msg;
}

export const sendOtpSms = (mobile: string, code: string) =>
  sendMessage({
    mobile,
    channel: "SMS",
    kind: "OTP",
    body: `${code} is your Company A Diagnostics code to open your report. It expires in ${config.otpTtlMinutes} minutes. Do not share it with anyone.`,
  });
