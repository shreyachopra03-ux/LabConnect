import { db } from "./db";
import { doctorWindowStart } from "./session";

/** A referring doctor may open an order only if it is theirs, signed, and within the 90-day window. */
export async function findDoctorOrder(doctorId: string, orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { patient: true, results: { orderBy: { position: "asc" } }, summary: true },
  });
  if (!order || order.doctorId !== doctorId || order.status !== "READY" || order.createdAt < doctorWindowStart()) return null;
  return order;
}
