import { config } from "../config";
import { db } from "../db";
import type { Lang } from "../i18n";

export type Channel = "WHATSAPP" | "SMS";

async function deliver(channel: Channel, mobile: string, body: string): Promise<{ ok: boolean; error?: string }> {
  if (!config.mockMessaging) throw new Error("No real messaging provider configured");
  if (channel === "WHATSAPP" && mobile.endsWith(config.mockFailWhatsappSuffix)) {
    return { ok: false, error: "Mock: number is not on WhatsApp" };
  }
  console.log(`[mock ${channel}] -> ${mobile}: ${body}`);
  return { ok: true };
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
  const r = await deliver(m.channel, m.mobile, m.body).catch((e) => ({ ok: false, error: String(e) }));
  return db.message.update({
    where: { id: msg.id },
    data: { status: r.ok ? "DELIVERED" : "FAILED", error: r.ok ? null : r.error },
  });
}

function reportLinkText(lang: Lang, firstName: string, orderId: string, url: string) {
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
}) {
  const body = reportLinkText(p.lang, p.patientName.split(" ")[0], p.orderId, p.url);
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
