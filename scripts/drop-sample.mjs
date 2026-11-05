// Simulates the LIS writing a new export after the pathologist signs ORD-71219.
// The running app's watcher picks it up within LIS_POLL_SECONDS (or press "Scan" in the console).
import fs from "node:fs";
import path from "node:path";

const lis = path.resolve(process.env.LIS_EXPORT_DIR ?? "./lis-export");
const samples = path.join(lis, "samples");
const files = fs.existsSync(samples) ? fs.readdirSync(samples).filter((f) => f.endsWith(".csv")) : [];
if (files.length === 0) {
  console.error("No sample exports found. Run `npm run setup` first.");
  process.exit(1);
}
for (const f of files) {
  fs.copyFileSync(path.join(samples, f), path.join(lis, "inbox", f));
  console.log(`Dropped ${f} into ${path.join(lis, "inbox")}`);
}
