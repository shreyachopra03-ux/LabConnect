import assert from "node:assert/strict";
import { after, test } from "node:test";
import { GET as health } from "../../src/app/api/health/route";
import { db } from "../../src/lib/db";
import { acquireLease, releaseLease } from "../../src/lib/lease";
import { MAX_ATTEMPTS, sendMessage, setProvider } from "../../src/lib/messaging";

after(async () => {
  setProvider(null);
  await db.workerLock.deleteMany({ where: { name: { startsWith: "test-" } } });
  await db.$disconnect();
});

test("C005: only one of many concurrent workers gets the lease", async () => {
  const name = `test-lease-${Date.now()}`;
  const results = await Promise.all(Array.from({ length: 10 }, (_, i) => acquireLease(name, 60_000, `worker-${i}`)));
  assert.equal(results.filter(Boolean).length, 1);

  const winner = `worker-${results.indexOf(true)}`;
  assert.equal(await acquireLease(name, 60_000, "late-worker"), false);
  await releaseLease(name, winner);
  assert.equal(await acquireLease(name, 60_000, "late-worker"), true);
});

test("C005: an expired lease can be taken over (crashed instance)", async () => {
  const name = `test-expired-${Date.now()}`;
  assert.equal(await acquireLease(name, 1, "crashed"), true);
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(await acquireLease(name, 60_000, "survivor"), true);
});

const mobile = "9999123456";
after(() => db.message.deleteMany({ where: { mobile } }));

test("C006: transient failures are retried, then delivered", async () => {
  let calls = 0;
  setProvider(async () => (++calls < 3 ? { ok: false, error: "timeout", retryable: true } : { ok: true }));
  const msg = await sendMessage({ mobile, channel: "SMS", kind: "OTP", body: "test" });
  assert.equal(msg.status, "DELIVERED");
  assert.equal(msg.attempts, 3);
});

test("C006: gives up after MAX_ATTEMPTS and records the error", async () => {
  setProvider(async () => ({ ok: false, error: "gateway down", retryable: true }));
  const msg = await sendMessage({ mobile, channel: "SMS", kind: "OTP", body: "test" });
  assert.equal(msg.status, "FAILED");
  assert.equal(msg.attempts, MAX_ATTEMPTS);
  assert.equal(msg.error, "gateway down");
});

test("C006: permanent failures are not retried", async () => {
  setProvider(async () => ({ ok: false, error: "not on WhatsApp", retryable: false }));
  const msg = await sendMessage({ mobile, channel: "WHATSAPP", kind: "OTP", body: "test" });
  assert.equal(msg.attempts, 1);
  setProvider(null);
});

test("C007: health check reports database and folders", async () => {
  const res = await health();
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.deepEqual(body.checks, { database: true, lisFolder: true, reportStorage: true });
});
