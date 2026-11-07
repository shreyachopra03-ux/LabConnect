import assert from "node:assert/strict";
import { after, test } from "node:test";
import { config } from "../../src/lib/config";
import { db } from "../../src/lib/db";
import { issueLink, resolveLink } from "../../src/lib/links";
import { requestOtp, verifyOtp } from "../../src/lib/otp";
import { makeFixture } from "./fixtures";

after(() => db.$disconnect());

test("C001 + C010: 43-char token, hash only, and every revocation is audited", async () => {
  const f = await makeFixture("link");
  try {
    const first = await issueLink(f.orderId, f.mobile, "SYSTEM");
    const token = first.url.split("/r/")[1];
    assert.equal(token.length, 43);
    const stored = await db.reportLink.findUnique({ where: { id: first.link.id } });
    assert.notEqual(stored!.tokenHash, token);
    assert.equal((await resolveLink(token)).state, "valid");

    await issueLink(f.orderId, f.mobile, "SYSTEM");
    assert.equal((await resolveLink(token)).state, "revoked");
    const audits = await db.accessLog.count({ where: { orderId: f.orderId, action: "LINK_REVOKED" } });
    assert.equal(audits, 1);
  } finally {
    await f.cleanup();
  }
});

test("C002: daily OTP cap returns rate_limited", async () => {
  const f = await makeFixture("daily");
  try {
    const old = new Date(Date.now() - 60 * 60_000); // an hour ago: outside the 10-minute window
    for (let i = 0; i < config.otpMaxPerDay; i++) {
      await db.otp.create({ data: { mobile: f.mobile, codeHash: "x", expiresAt: old, createdAt: old } });
    }
    assert.equal(await requestOtp(f.mobile), "rate_limited");
  } finally {
    await f.cleanup();
  }
});

test("C002: lockout after max failures, even with a fresh code", async () => {
  const f = await makeFixture("lock");
  try {
    assert.equal(await requestOtp(f.mobile), "sent");
    const results: string[] = [];
    for (let i = 0; i < config.otpMaxAttempts; i++) results.push(await verifyOtp(f.mobile, "000000"));
    assert.deepEqual(results.slice(0, -1), Array(config.otpMaxAttempts - 1).fill("invalid"));
    assert.equal(results.at(-1), "locked");

    // Still locked, and no new code can be requested during the lock window.
    assert.equal(await verifyOtp(f.mobile, "123456"), "locked");
    assert.equal(await requestOtp(f.mobile), "rate_limited");
  } finally {
    await f.cleanup();
  }
});
