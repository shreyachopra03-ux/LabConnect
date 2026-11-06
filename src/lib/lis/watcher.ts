import { config } from "../config";
import { scanInbox } from "./import";

const g = globalThis as unknown as { __lisWatcher?: NodeJS.Timeout };

export function startWatcher() {
  if (g.__lisWatcher || !config.lisWatch) return;
  const tick = () => scanInbox().catch((e) => console.error("[lis] scan failed:", e));
  g.__lisWatcher = setInterval(tick, config.lisPollSeconds * 1000);
  console.log(`[lis] watching ${config.lisDir}/inbox every ${config.lisPollSeconds}s`);
  tick();
}
