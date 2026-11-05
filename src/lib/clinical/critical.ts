/**
 * Critical (panic) limits. A critical value gets NO patient summary and creates a
 * staff callback task. These limits are illustrative and must be signed off by the
 * lab's pathologist before go-live. The LIS can also mark a report critical itself.
 */
const CRITICAL: Record<string, { low?: number; high?: number }> = {
  potassium: { low: 2.8, high: 6.2 },
  sodium: { low: 120, high: 160 },
  haemoglobin: { low: 7 },
  glucose_fasting: { low: 50, high: 400 },
  glucose_random: { low: 50, high: 400 },
  platelets: { low: 20 },
  creatinine: { high: 7 },
};

export function isCriticalValue(testKey: string | null, value: number | null): boolean {
  if (!testKey || value === null) return false;
  const c = CRITICAL[testKey];
  if (!c) return false;
  return (c.low !== undefined && value < c.low) || (c.high !== undefined && value > c.high);
}
