import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** For the load balancer / Docker HEALTHCHECK: is the app up and can it reach the database? */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
