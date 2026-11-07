import fs from "node:fs/promises";
import { audit } from "@/lib/audit";
import { findDoctorOrder } from "@/lib/doctor-access";
import { getDoctor } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  const doctor = await getDoctor();
  const order = doctor ? await findDoctorOrder(doctor.id, orderId) : null;
  const file = order?.pdfPath ? await fs.readFile(order.pdfPath).catch(() => null) : null;
  if (!doctor || !order || !file) return new Response("Not found", { status: 404 });

  await audit({ actorType: "DOCTOR", actorId: doctor.id, action: "PDF_DOWNLOADED", orderId: order.id, patientId: order.patientId });
  return new Response(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${order.id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
