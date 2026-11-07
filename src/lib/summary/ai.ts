import { config } from "../config";
import type { L } from "./catalog";

export async function explainWithAi(p: {
  parameter: string;
  unit: string | null;
  flag: "LOW" | "HIGH";
}): Promise<L | null> {
  if (!config.anthropicKey) return null;

  const system =
    "You write one short, calm sentence explaining what a lab value being higher or lower than normal " +
    "can commonly mean, for an elderly patient in Andhra Pradesh, India. Rules: no diagnosis, no medicine " +
    "names or doses, do not say it is dangerous or harmless, under 160 characters per language. " +
    'Reply with JSON only: {"en": "...", "te": "...", "hi": "..."} (English, Telugu, Hindi).';
  const user = `Test: ${p.parameter}${p.unit ? ` (${p.unit})` : ""}. The result is ${p.flag === "HIGH" ? "higher" : "lower"} than the normal range.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": config.anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.summaryModel,
        max_tokens: 400,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return null;
    const out = JSON.parse(json) as Partial<L>;
    const ok = (s: unknown): s is string => typeof s === "string" && s.length > 0 && s.length <= 300;
    return ok(out.en) && ok(out.te) && ok(out.hi) ? { en: out.en, te: out.te, hi: out.hi } : null;
  } catch {
    return null;
  }
}
