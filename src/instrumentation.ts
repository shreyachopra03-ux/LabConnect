export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startWatcher } = await import("./lib/lis/watcher");
    startWatcher();
  }
}
