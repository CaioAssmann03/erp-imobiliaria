import assert from "node:assert/strict";
import { test } from "node:test";

import {
  addMonths,
  billingExample,
  competenceMonthOf,
  dueMonthOf,
  formatYearMonth,
} from "../lib/billing-example.ts";

const october = { year: 2026, month: 10 };

test("the due month is the reference month or the next one", () => {
  assert.deepEqual(dueMonthOf(october, "reference"), { year: 2026, month: 10 });
  assert.deepEqual(dueMonthOf(october, "following"), { year: 2026, month: 11 });
});

test("the competence is the due month or the month before it", () => {
  assert.deepEqual(competenceMonthOf(october, "following", "same_as_due"), { year: 2026, month: 11 });
  assert.deepEqual(competenceMonthOf(october, "following", "before_due"), { year: 2026, month: 10 });
  assert.deepEqual(competenceMonthOf(october, "reference", "same_as_due"), { year: 2026, month: 10 });
  assert.deepEqual(competenceMonthOf(october, "reference", "before_due"), { year: 2026, month: 9 });
});

test("months cross the year boundary in both directions", () => {
  assert.deepEqual(addMonths({ year: 2026, month: 12 }, 1), { year: 2027, month: 1 });
  assert.deepEqual(addMonths({ year: 2027, month: 1 }, -1), { year: 2026, month: 12 });
  assert.deepEqual(addMonths({ year: 2026, month: 1 }, -13), { year: 2024, month: 12 });
  assert.deepEqual(addMonths({ year: 2026, month: 6 }, 0), { year: 2026, month: 6 });
});

test("a month is written with two digits", () => {
  assert.equal(formatYearMonth({ year: 2026, month: 3 }), "03/2026");
  assert.equal(formatYearMonth({ year: 2026, month: 11 }), "11/2026");
});

test("the example is the Sami's: reference 10/2026, competence and due 11/2026", () => {
  assert.equal(
    billingExample(october, "following", "same_as_due"),
    "Exemplo: referência 10/2026 → competência 11/2026, vencimento 11/2026."
  );
});

test("the example follows the competence that is not the due month", () => {
  assert.equal(
    billingExample({ year: 2027, month: 1 }, "reference", "before_due"),
    "Exemplo: referência 01/2027 → competência 12/2026, vencimento 01/2027."
  );
});
