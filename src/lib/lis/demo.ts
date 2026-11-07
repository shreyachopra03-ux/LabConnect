import fs from "node:fs";
import path from "node:path";
import { config } from "../config";

export const demoMode = () => process.env.DEMO_MODE === "true" && config.mockMessaging;

/**
 * Demo only: does what the LIS would do on the lab's machine — writes the signed PDF
 * and an export CSV into the watched folder. Used by the console's "Simulate" buttons
 * so a hosted demo works without a terminal. Same files as `npm run lis:drop-sample`.
 */
export function dropDemoExport(which: "signed" | "amended"): string[] {
  const samples = path.join(config.lisDir, "samples");
  if (!fs.existsSync(samples)) return [];
  const all = fs.readdirSync(samples);
  const csvs = all.filter((f) => f.endsWith(".csv") && f.includes(which));
  fs.mkdirSync(path.join(config.lisDir, "reports"), { recursive: true });
  fs.mkdirSync(path.join(config.lisDir, "inbox"), { recursive: true });
  for (const f of all.filter((f) => f.endsWith(".pdf"))) {
    fs.copyFileSync(path.join(samples, f), path.join(config.lisDir, "reports", f));
  }
  // A fresh name each time, so the import is not skipped as a duplicate file name.
  for (const f of csvs) fs.copyFileSync(path.join(samples, f), path.join(config.lisDir, "inbox", `${Date.now()}_${f}`));
  return csvs;
}
