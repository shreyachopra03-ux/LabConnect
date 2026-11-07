export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Refuse to start in production with unsafe settings (weak secrets, mock messaging…).
    const { assertProductionConfig } = await import("./lib/env-check");
    assertProductionConfig();

    const { startWatcher } = await import("./lib/lis/watcher");
    startWatcher();
  }
}
