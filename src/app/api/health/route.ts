import fs from "node:fs/promises";
import path from "node:path";
import { config } from "@/lib/config";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Public health check for the load balancer / Docker (C007). Also served at /healthz.
 * 200 when the database answers and the LIS and report folders are writable, else 503.
 * The body never includes connection details.
 */
export async function GET() {
  const checks = {
    database: await db.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    lisFolder: await writable(path.join(config.lisDir, "inbox")),
    reportStorage: await writable(path.join(config.storageDir, "reports")),
  };
  const ok = Object.values(checks).every(Boolean);
  return Response.json({ status: ok ? "ok" : "degraded", ok, checks }, { status: ok ? 200 : 503 });
}

async function writable(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.access(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}
