// Simulates the LIS writing a new export into its folder. The running app's watcher
// picks it up within LIS_POLL_SECONDS (or press "Scan" in the front-desk console).
//   node scripts/drop-sample.mjs signed    -> pathologist signs ORD-71219
//   node scripts/drop-sample.mjs amended   -> pathologist corrects and re-signs ORD-71204
import fs from "node:fs";
import path from "node:path";

const which = process.argv[2] ?? "signed";
const lis = path.resolve(process.env.LIS_EXPORT_DIR ?? "./lis-export");
const samples = path.join(lis, "samples");
if (!fs.existsSync(samples)) {
  console.error("No samples found. Run `npm run setup` first.");
  process.exit(1);
}

const all = fs.readdirSync(samples);
const csvs = all.filter((f) => f.endsWith(".csv") && f.includes(which));
if (csvs.length === 0) {
  console.error(`No sample export matching "${which}".`);
  process.exit(1);
}
// The LIS writes the signed PDF first, then the export row that points to it.
for (const f of all.filter((f) => f.endsWith(".pdf"))) fs.copyFileSync(path.join(samples, f), path.join(lis, "reports", f));
for (const f of csvs) {
  fs.copyFileSync(path.join(samples, f), path.join(lis, "inbox", f));
  console.log(`Dropped ${f} into ${path.join(lis, "inbox")}`);
}
