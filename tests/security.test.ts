import assert from "node:assert/strict";
import { test } from "node:test";
import { isSameOrigin } from "../src/lib/csrf";
import { randomToken } from "../src/lib/crypto";
import { formatLine, redact } from "../src/lib/logger";
import { backoffMs } from "../src/lib/otp";

test("C001: link tokens are 32 random bytes (43 base64url chars)", () => {
  const t = randomToken(32);
  assert.equal(t.length, 43);
  assert.match(t, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(randomToken(32), t);
});

test("C004: logs never contain links, codes or full mobile numbers", () => {
  const body =
    "Company A: report ready. Open https://lab.example/r/AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcde for 9000000001. 482913 is your code";
  const line = formatLine("info", "mock message " + body, { mobile: "9000000001", body, channel: "SMS" });
  assert.doesNotMatch(line, /AbCdEfGhIjKlMnOp/);
  assert.doesNotMatch(line, /482913/);
  assert.doesNotMatch(line, /9000000001/);
  assert.match(line, /"body":"\[redacted\]"/);
  assert.match(line, /"mobile":"\*\*\*\*\*\*0001"/);
  assert.equal(JSON.parse(line).channel, "SMS");
  assert.equal(redact("/r/AbCdEfGhIjKlMnOpQrSt"), "/r/[redacted]");
});

test("C002: verification back-off doubles and is capped", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 9].map(backoffMs), [0, 250, 500, 1000, 2000, 4000]);
});

test("C003: route handlers reject cross-origin POSTs", () => {
  const req = (h: Record<string, string>) => new Request("http://app.example/logout", { method: "POST", headers: h });
  assert.equal(isSameOrigin(req({ host: "app.example", origin: "http://app.example" })), true);
  assert.equal(isSameOrigin(req({ host: "app.example", origin: "https://evil.example" })), false);
  assert.equal(isSameOrigin(req({ host: "app.example", referer: "http://app.example/orders" })), true);
  assert.equal(isSameOrigin(req({ host: "app.example" })), false);
});
