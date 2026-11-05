/** Only allow same-site relative redirects (prevents open redirects via ?next=). */
export function safeNext(v: unknown): string | null {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : null;
}

export const withNext = (path: string, next: string | null, extra?: Record<string, string>) => {
  const p = new URLSearchParams(extra);
  if (next) p.set("next", next);
  const q = p.toString();
  return q ? `${path}?${q}` : path;
};
