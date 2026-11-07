import { purgeExpired } from "../cleanup";
import { config } from "../config";
import { scanInbox } from "./import";

const g = globalThis as unknown as { __lisWatcher?: NodeJS.Timeout; __lastCleanup?: number };

/**
 * Polls the LIS export folder. Run it on ONE instance only (LIS_WATCH=true there,
 * false elsewhere) so two servers never import the same file.
 */
export function startWatcher() {
  if (g.__lisWatcher || !config.lisWatch) return;
  const tick = async () => {
    await scanInbox().catch((e) => console.error("[lis] scan failed:", e));
    if (Date.now() - (g.__lastCleanup ?? 0) > 3_600_000) {
      g.__lastCleanup = Date.now();
      await purgeExpired().catch((e) => console.error("[cleanup] failed:", e));
    }
  };
  g.__lisWatcher = setInterval(tick, config.lisPollSeconds * 1000);
  console.log(`[lis] watching ${config.lisDir}/inbox every ${config.lisPollSeconds}s`);
  void tick();
}
