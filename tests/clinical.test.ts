import assert from "node:assert/strict";
import { test } from "node:test";
import { isCriticalValue } from "../src/lib/clinical/critical";
import { flagValue, parseRange, parseValue } from "../src/lib/clinical/ranges";
import { mapStatus, parseCsv, splitParameterUnit } from "../src/lib/lis/csv";
import { normalizeMobile } from "../src/lib/phone";
import { buildSummary } from "../src/lib/summary";
import { findTest } from "../src/lib/summary/catalog";

test("parses reference ranges from the LIS", () => {
  assert.deepEqual(parseRange("12.0-15.5"), { low: 12, high: 15.5 });
  assert.deepEqual(parseRange("0 - 100"), { low: 0, high: 100 });
  assert.deepEqual(parseRange("<200"), { low: null, high: 200 });
  assert.deepEqual(parseRange(">= 40"), { low: 40, high: null });
  assert.equal(parseRange("Negative"), null);
});

test("flags come from rules, using the sample data", () => {
  assert.equal(flagValue(10.2, parseRange("12.0-15.5")), "LOW"); // Lakshmi, Hb
  assert.equal(flagValue(142, parseRange("0-100")), "HIGH"); // Venkata Rao, LDL
  assert.equal(flagValue(6.8, parseRange("3.5-5.1")), "HIGH"); // Farzana, K+
  assert.equal(flagValue(parseValue("Positive"), parseRange("Negative")), "UNKNOWN");
});

test("critical potassium is detected", () => {
  assert.equal(isCriticalValue("potassium", 6.8), true);
  assert.equal(isCriticalValue("potassium", 5.4), false);
  assert.equal(isCriticalValue(null, 6.8), false);
});

test("LIS status mapping", () => {
  assert.deepEqual(mapStatus("Ready (critical)"), { status: "READY", critical: true });
  assert.deepEqual(mapStatus("Ready"), { status: "READY", critical: false });
  assert.deepEqual(mapStatus("Processing"), { status: "PROCESSING", critical: false });
});

test("CSV parser handles quotes and the brief's combined parameter+unit column", () => {
  const rows = parseCsv('Order ID,Patient,Parameter\r\nORD-1,"K, Lakshmi","Haemoglobin g/dL"\r\n');
  assert.equal(rows[0].patient, "K, Lakshmi");
  assert.deepEqual(splitParameterUnit(rows[0].parameter), { parameter: "Haemoglobin", unit: "g/dL" });
});

test("mobile normalisation", () => {
  assert.equal(normalizeMobile("+91 98765 43210"), "9876543210");
  assert.equal(normalizeMobile("09876543210"), "9876543210");
  assert.equal(normalizeMobile("12345"), null);
});

test("summary uses locked templates in all three languages", async () => {
  assert.equal(findTest("LDL cholesterol")?.key, "ldl");
  const { source, content } = await buildSummary([
    { parameter: "Haemoglobin", valueText: "10.2", unit: "g/dL", rangeText: "12.0-15.5", flag: "LOW" },
    { parameter: "Platelets", valueText: "245", unit: null, rangeText: "150-450", flag: "NORMAL" },
  ]);
  assert.equal(source, "TEMPLATE");
  assert.equal(content.items.length, 1);
  assert.match(content.items[0].text.en, /lower than normal/);
  assert.match(content.items[0].text.te, /తక్కువగా/);
  assert.match(content.items[0].text.hi, /कम/);
});
