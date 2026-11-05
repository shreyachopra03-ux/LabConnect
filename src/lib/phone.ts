/** Normalise an Indian mobile number to 10 digits, or null if invalid. */
export function normalizeMobile(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let d = input.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

/** "9000000001" -> "••••••0001" */
export const maskMobile = (m: string) => `••••••${m.slice(-4)}`;

export const formatMobile = (m: string) => `${m.slice(0, 5)} ${m.slice(5)}`;
