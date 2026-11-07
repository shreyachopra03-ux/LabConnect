import { explainWithAi } from "./ai";
import { directionSentence, findTest, GENERIC_MEANING, type L } from "./catalog";

export type SummaryItem = {
  parameter: string;
  valueText: string;
  unit: string | null;
  rangeText: string;
  flag: "LOW" | "HIGH";
  text: L;
  source: "TEMPLATE" | "AI" | "GENERIC";
};

export type SummaryContent = { items: SummaryItem[] };

type ResultInput = {
  parameter: string;
  valueText: string;
  unit: string | null;
  rangeText: string;
  flag: string;
};

const join = (a: L, b: L): L => ({ en: `${a.en} ${b.en}`, te: `${a.te} ${b.te}`, hi: `${a.hi} ${b.hi}` });

export async function buildSummary(results: ResultInput[]): Promise<{ source: string; content: SummaryContent }> {
  const items: SummaryItem[] = [];

  for (const r of results) {
    if (r.flag !== "LOW" && r.flag !== "HIGH") continue;
    const flag = r.flag;
    const entry = findTest(r.parameter);
    const meaning = entry?.[flag === "LOW" ? "low" : "high"];

    if (entry && meaning) {
      items.push({ ...r, flag, text: join(directionSentence(entry.name, flag), meaning), source: "TEMPLATE" });
      continue;
    }

    const name: L = entry?.name ?? { en: r.parameter, te: r.parameter, hi: r.parameter };
    const ai = await explainWithAi({ parameter: r.parameter, unit: r.unit, flag });
    items.push({
      ...r,
      flag,
      text: join(directionSentence(name, flag), ai ?? GENERIC_MEANING),
      source: ai ? "AI" : "GENERIC",
    });
  }

  const source =
    items.length === 0 ? "NONE_NORMAL" : items.every((i) => i.source === "TEMPLATE") ? "TEMPLATE" : "MIXED";

  return { source, content: { items } };
}

export function parseSummary(json: string | null | undefined): SummaryContent | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as SummaryContent;
  } catch {
    return null;
  }
}
