import assert from "node:assert/strict";
import { test } from "node:test";

import {
  accountabilityPdfName,
  daysLateLabel,
  defaultAccountabilityMonth,
  delinquencyPdfName,
  monthIso,
  reportMonths,
} from "../lib/reports/reports.ts";

test("a month is written as its first day", () => {
  assert.equal(monthIso(2026, 3), "2026-03-01");
  assert.equal(monthIso(2025, 12), "2025-12-01");
});

test("the month filter starts at the current month and walks back across the year", () => {
  assert.deepEqual(reportMonths("2026-02-15", 4), ["2026-02-01", "2026-01-01", "2025-12-01", "2025-11-01"]);
  assert.equal(reportMonths("2026-10-29", 1)[0], "2026-10-01");
});

test("the accountability opens on the previous month", () => {
  assert.equal(defaultAccountabilityMonth("2026-10-29"), "2026-09-01");
  assert.equal(defaultAccountabilityMonth("2026-01-03"), "2025-12-01");
});

test("the downloaded files are named like the server names them", () => {
  assert.equal(delinquencyPdfName("2026-10-29"), "inadimplencia-2026-10-29.pdf");
  assert.equal(accountabilityPdfName(4, "2026-10-01"), "prestacao-de-contas-0004-2026-10.pdf");
});

test("days late is singular for one day", () => {
  assert.equal(daysLateLabel(1), "1 dia");
  assert.equal(daysLateLabel(12), "12 dias");
});
