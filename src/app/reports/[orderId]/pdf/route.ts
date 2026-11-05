import fs from "node:fs/promises";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { canViewOrder, getPatientSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const params = await ctx.params;
  const s = await getPatientSession();
  const order = await db.order.findUnique({ where: { id: params.orderId }, include: { patient: { include: { contact: true } } } });
  if (!order || !canViewOrder(s, order) || order.status !== "READY" || !order.pdfPath || !order.patient.contact.consentAt) {
    return new Response("Not found", { status: 404 });
  }

  const file = await fs.readFile(order.pdfPath).catch(() => null);
  if (!file) return new Response("Not found", { status: 404 });

  await audit({
    actorType: s!.kind === "LINK" ? "LINK" : "PATIENT",
    actorId: s!.mobile ?? "",
    action: "PDF_DOWNLOADED",
    orderId: order.id,
    patientId: order.patientId,
  });

  return new Response(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${order.id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
