// Demo deployments only: seed once, when the database has no staff accounts yet.
// Never wipes an existing database, so redeploys keep their data.
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
try {
  const staff = await db.staff.count();
  if (staff > 0) {
    console.log("[seed] database already has data, skipping demo seed");
  } else {
    console.log("[seed] empty database, loading demo data");
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
  }
} finally {
  await db.$disconnect();
}
