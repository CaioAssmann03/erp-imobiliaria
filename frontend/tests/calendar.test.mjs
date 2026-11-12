import assert from "node:assert/strict";
import { test } from "node:test";

import { isoDate, monthLayout, shiftMonth } from "../lib/format/calendar.ts";

test("a month starts on its weekday (Sunday = 0) and has its number of days", () => {
  assert.deepEqual(monthLayout(2026, 10), { offset: 4, days: 31 }); // 1 Oct 2026 is a Thursday
  assert.deepEqual(monthLayout(2026, 2), { offset: 0, days: 28 }); // 1 Feb 2026 is a Sunday
  assert.deepEqual(monthLayout(2028, 2), { offset: 2, days: 29 }); // leap year, a Tuesday
});

test("a day is written as ISO", () => {
  assert.equal(isoDate(2026, 3, 7), "2026-03-07");
  assert.equal(isoDate(2026, 12, 31), "2026-12-31");
});

test("moving a month rolls the year over", () => {
  assert.deepEqual(shiftMonth(2026, 12, 1), { year: 2027, month: 1 });
  assert.deepEqual(shiftMonth(2026, 1, -1), { year: 2025, month: 12 });
  assert.deepEqual(shiftMonth(2026, 6, 0), { year: 2026, month: 6 });
});
