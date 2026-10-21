import assert from "node:assert/strict";
import { test } from "node:test";

import {
  currentMonthTyped,
  itemToPayload,
  maskMonthYear,
  monthFromApi,
  monthToApi,
  needsAmount,
  planErrorPath,
  planToPayload,
} from "../lib/billing-plan-payload.ts";

const item = (overrides = {}) => ({
  description: "Taxa condominial",
  cost_center: "cc-1",
  entry_template: "tpl-1",
  calculation_kind: "fixed_amount",
  amount: "450.00",
  ideal_fraction_number: "",
  unit_value_field: "",
  ...overrides,
});

test("a typed month becomes the first day of the month", () => {
  assert.equal(monthToApi("03/2026"), "2026-03-01");
  assert.equal(monthToApi("12/2026"), "2026-12-01");
  assert.equal(monthToApi("2026-03"), "2026-03-01");
  assert.equal(monthToApi(""), undefined);
  assert.equal(monthToApi("13/2026"), undefined);
  assert.equal(monthToApi("00/2026"), undefined);
  assert.equal(monthToApi("3/2026"), undefined);
  assert.equal(monthToApi("03/26"), undefined);
});

test("the month mask adds the slash by itself and keeps digits only", () => {
  assert.equal(maskMonthYear("0"), "0");
  assert.equal(maskMonthYear("03"), "03");
  assert.equal(maskMonthYear("032"), "03/2");
  assert.equal(maskMonthYear("032026"), "03/2026");
  assert.equal(maskMonthYear("03/2026"), "03/2026");
  assert.equal(maskMonthYear("03/20269999"), "03/2026");
  assert.equal(maskMonthYear("ab"), "");
});

test("the current month is typed as month/year", () => {
  assert.equal(currentMonthTyped(new Date(2026, 9, 21)), "10/2026");
  assert.equal(currentMonthTyped(new Date(2027, 0, 5)), "01/2027");
});

test("an API date becomes the month the user types", () => {
  assert.equal(monthFromApi("2026-03-01"), "03/2026");
  assert.equal(monthFromApi(null), "");
  assert.equal(monthFromApi(undefined), "");
});

test("fixed and share items need an amount, the unit value item does not", () => {
  assert.equal(needsAmount("fixed_amount"), true);
  assert.equal(needsAmount("ideal_fraction_share"), true);
  assert.equal(needsAmount("unit_registered_value"), false);
});

test("a fixed item sends only its amount", () => {
  assert.deepEqual(itemToPayload(item()), {
    description: "Taxa condominial",
    cost_center: "cc-1",
    entry_template: "tpl-1",
    calculation_kind: "fixed_amount",
    amount: "450.00",
    ideal_fraction_number: null,
    unit_value_field: null,
  });
});

test("a share item sends the total and the fraction number as a number", () => {
  const payload = itemToPayload(item({ calculation_kind: "ideal_fraction_share", amount: "9000.00", ideal_fraction_number: "2" }));

  assert.equal(payload.amount, "9000.00");
  assert.equal(payload.ideal_fraction_number, 2);
  assert.equal(payload.unit_value_field, null);
});

test("a unit value item sends the field and no amount, even if one was typed before", () => {
  const payload = itemToPayload(item({ calculation_kind: "unit_registered_value", amount: "10.00", unit_value_field: "gas" }));

  assert.equal(payload.amount, null);
  assert.equal(payload.ideal_fraction_number, null);
  assert.equal(payload.unit_value_field, "gas");
});

test("the items keep the order they were typed in", () => {
  const body = planToPayload(
    {
      condominium: "c-1",
      name: "Ordinária",
      active: true,
      start_month: undefined,
      end_month: undefined,
      items: [item({ description: "Primeiro" }), item({ description: "Segundo" })],
    },
    false
  );

  assert.deepEqual(body.items.map((entry) => entry.description), ["Primeiro", "Segundo"]);
});

test("creating sends the condominium, editing does not", () => {
  const values = { condominium: "c-1", name: "Ordinária", active: true, start_month: "2026-03-01", end_month: undefined, items: [item()] };

  assert.equal(planToPayload(values, false).condominium, "c-1");
  assert.equal("condominium" in planToPayload(values, true), false);
});

test("an empty month is sent as null so editing can clear it", () => {
  const body = planToPayload({ condominium: "c-1", name: "x", active: false, start_month: undefined, end_month: undefined, items: [item()] }, true);

  assert.equal(body.start_month, null);
  assert.equal(body.end_month, null);
  assert.equal(body.active, false);
});

test("a nested API error path keeps its item index, a flat one keeps its last name", () => {
  assert.equal(planErrorPath("items.2.amount"), "items.2.amount");
  assert.equal(planErrorPath("items.0.cost_center"), "items.0.cost_center");
  assert.equal(planErrorPath("name"), "name");
  assert.equal(planErrorPath("items"), "items");
});

test("the validity is described from its months", async () => {
  const { describeValidity } = await import("../lib/billing-plan-payload.ts");

  assert.equal(describeValidity(null, null), "Sem prazo");
  assert.equal(describeValidity("2026-03-01", null), "a partir de mar/2026");
  assert.equal(describeValidity(undefined, "2026-12-01"), "até dez/2026");
  assert.equal(describeValidity("2026-03-01", "2026-12-01"), "mar/2026 a dez/2026");
});
