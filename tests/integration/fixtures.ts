import { db } from "../../src/lib/db";

/** Creates an isolated patient + order on a test-only number, and removes everything it touched afterwards. */
export async function makeFixture(tag: string, opts: { critical?: boolean } = {}) {
  const suffix = String(Date.now() % 1_000_000).padStart(6, "0");
  const mobile = `9999${suffix}`;
  const orderId = `TEST-${tag}-${suffix}`;
  await db.contact.create({ data: { mobile, lang: "en", consentAt: new Date() } });
  const patient = await db.patient.create({ data: { mobile, name: `Test ${tag}` } });
  await db.order.create({
    data: { id: orderId, patientId: patient.id, status: "READY", signedAt: new Date(), isCritical: !!opts.critical },
  });
  await db.result.create({
    data: {
      orderId,
      position: 0,
      parameter: "Potassium",
      unit: "mmol/L",
      valueText: opts.critical ? "6.9" : "4.2",
      value: opts.critical ? 6.9 : 4.2,
      rangeText: "3.5-5.1",
      flag: opts.critical ? "HIGH" : "NORMAL",
      critical: !!opts.critical,
    },
  });

  const cleanup = async () => {
    await db.accessLog.deleteMany({ where: { OR: [{ orderId }, { patientId: patient.id }, { actorId: mobile }] } });
    await db.message.deleteMany({ where: { mobile } });
    await db.callbackTask.deleteMany({ where: { orderId } });
    await db.summary.deleteMany({ where: { orderId } });
    await db.reportLink.deleteMany({ where: { orderId } });
    await db.otp.deleteMany({ where: { mobile } });
    await db.order.deleteMany({ where: { id: orderId } });
    await db.patient.deleteMany({ where: { id: patient.id } });
    await db.contact.deleteMany({ where: { mobile } });
  };
  return { mobile, orderId, patientId: patient.id, cleanup };
}
