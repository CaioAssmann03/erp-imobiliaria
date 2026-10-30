import assert from "node:assert/strict";
import { test } from "node:test";

import { PAYABLE_WINDOWS, windowRange } from "../lib/finance/payable-windows.ts";

test("each window becomes the due date range the API receives", () => {
  assert.deepEqual(windowRange("all", "2026-10-30"), {});
  assert.deepEqual(windowRange("overdue", "2026-10-30"), { due_date_before: "2026-10-29" });
  assert.deepEqual(windowRange("today", "2026-10-30"), { due_date_after: "2026-10-30", due_date_before: "2026-10-30" });
  assert.deepEqual(windowRange("week", "2026-10-30"), { due_date_after: "2026-10-30", due_date_before: "2026-11-06" });
  assert.deepEqual(windowRange("month", "2026-10-30"), { due_date_after: "2026-10-30", due_date_before: "2026-10-31" });
});

test("the ranges cross month and year ends and leap days", () => {
  assert.deepEqual(windowRange("overdue", "2026-03-01"), { due_date_before: "2026-02-28" });
  assert.deepEqual(windowRange("week", "2026-12-28"), { due_date_after: "2026-12-28", due_date_before: "2027-01-04" });
  assert.equal(windowRange("month", "2028-02-10").due_date_before, "2028-02-29");
});

test("the windows keep their order", () => {
  assert.deepEqual(
    PAYABLE_WINDOWS.map((window) => window.id),
    ["all", "overdue", "today", "week", "month"]
  );
});
