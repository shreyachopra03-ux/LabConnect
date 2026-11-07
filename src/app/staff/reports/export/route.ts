import { NextResponse, type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { buildOpsReport, parseDays } from "@/lib/ops-report";
import { getStaff } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const staff = await getStaff();
  if (!staff || staff.role !== "OPS") return new NextResponse("Forbidden", { status: 403 });

  const days = parseDays(req.nextUrl.searchParams.get("days"));
  const { rows } = await buildOpsReport(days);
  const header = ["order_id", "signed_at", "critical", "delivered", "channel", "failed_messages", "resends", "first_opened_at", "hours_to_open", "pdf_downloads"];
  const lines = rows.map((r) =>
    [
      r.orderId,
      r.signedAt.toISOString(),
      r.critical,
      r.delivered,
      r.channel ?? "",
      r.failedMessages,
      r.resends,
      r.firstOpenedAt?.toISOString() ?? "",
      r.hoursToOpen?.toFixed(2) ?? "",
      r.pdfDownloads,
    ].join(","),
  );
  await audit({ actorType: "STAFF", actorId: staff.id, action: "OPS_REPORT_EXPORTED", detail: `${days}d, ${rows.length} rows` });

  return new NextResponse([header.join(","), ...lines].join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="delivery-report-${days}d.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
