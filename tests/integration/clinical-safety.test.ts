import assert from "node:assert/strict";
import { after, test } from "node:test";
import { db } from "../../src/lib/db";
import { onReportSigned, releaseHeldLink } from "../../src/lib/delivery";
import { makeFixture } from "./fixtures";

after(() => db.$disconnect());

test("C011: a critical report gets no link until staff complete the callback", async () => {
  const f = await makeFixture("crit", { critical: true });
  try {
    await onReportSigned(f.orderId);
    assert.equal(await db.reportLink.count({ where: { orderId: f.orderId } }), 0, "no link on sign-off");
    assert.equal(await db.message.count({ where: { orderId: f.orderId } }), 0, "no message on sign-off");
    assert.equal(await db.callbackTask.count({ where: { orderId: f.orderId, status: "OPEN" } }), 1, "callback task open");
    assert.equal(await db.accessLog.count({ where: { orderId: f.orderId, action: "LINK_HELD_CRITICAL" } }), 1);

    const msg = await releaseHeldLink(f.orderId, "staff-test");
    assert.ok(msg, "link released after the call");
    assert.equal(await db.reportLink.count({ where: { orderId: f.orderId, revokedAt: null } }), 1);

    // Completing twice does not send a second link.
    assert.equal(await releaseHeldLink(f.orderId, "staff-test"), null);
  } finally {
    await f.cleanup();
  }
});

test("C011: a normal report is still sent straight away", async () => {
  const f = await makeFixture("normal");
  try {
    await onReportSigned(f.orderId);
    assert.equal(await db.reportLink.count({ where: { orderId: f.orderId } }), 1);
    assert.equal(await db.callbackTask.count({ where: { orderId: f.orderId } }), 0);
  } finally {
    await f.cleanup();
  }
});
