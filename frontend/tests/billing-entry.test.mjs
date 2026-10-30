import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildGrid,
  canPreview,
  defaultCostCenterId,
  entryColumnTitle,
  entryToPayload,
  formatCode,
} from "../lib/billing/billing-entry-payload.ts";
import { maskSignedMoney } from "../lib/format/masks.ts";

const values = (overrides = {}) => ({
  condominium: "c-1",
  event: "",
  credits_company: false,
  description: "10/2026",
  allocation: "collective",
  apportionment_criterion: "",
  recurrence: "once",
  installments_total: "",
  start_month: "2026-10-01",
  cost_center: "cc-1",
  amount: "100.00",
  units: [{ unit: "u-1", amount: undefined }],
  ...overrides,
});

test("the payload keeps only the fields of the chosen allocation and recurrence", () => {
  const payload = entryToPayload(values({ apportionment_criterion: "criterion-2", installments_total: "5" }));

  assert.equal(payload.apportionment_criterion, null);
  assert.equal(payload.installments_total, null);
  assert.equal(payload.event, null);
  assert.deepEqual(payload.units, [{ unit: "u-1", amount: null }]);
});

test("a fraction and an installment entry send their numbers; only individual keeps a unit amount", () => {
  const fraction = entryToPayload(values({ allocation: "fraction", apportionment_criterion: "criterion-2", recurrence: "installments", installments_total: "12" }));
  const individual = entryToPayload(values({ allocation: "individual", units: [{ unit: "u-1", amount: "80.00" }] }));

  assert.equal(fraction.apportionment_criterion, "criterion-2");
  assert.equal(fraction.installments_total, 12);
  assert.deepEqual(individual.units, [{ unit: "u-1", amount: "80.00" }]);
});

test("the preview waits for what it needs", () => {
  assert.equal(canPreview(values()), true);
  assert.equal(canPreview(values({ units: [] })), false);
  assert.equal(canPreview(values({ amount: "0.00" })), false);
  assert.equal(canPreview(values({ amount: "-50.00" })), true);
  assert.equal(canPreview(values({ cost_center: "" })), false);
  assert.equal(canPreview(values({ allocation: "fraction" })), false);
  assert.equal(canPreview(values({ allocation: "fraction", apportionment_criterion: "criterion-3" })), true);
  assert.equal(canPreview(values({ recurrence: "installments", installments_total: "1" })), false);
  assert.equal(canPreview(values({ recurrence: "installments", installments_total: "2" })), true);
});

test("the Conta Normal (code 0) is the default sub-account, else the first active one", () => {
  assert.equal(defaultCostCenterId([{ id: "a", code: 3 }, { id: "b", code: 0 }]), "b");
  assert.equal(defaultCostCenterId([{ id: "a", code: 3, active: false }, { id: "b", code: 5 }]), "b");
  assert.equal(defaultCostCenterId([]), "");
  assert.equal(formatCode(2), "0002");
});

test("the grid sums in cents, one row per unit in natural order, and totals every column", () => {
  const entries = [
    { id: "e1", month: { unit_amounts: [{ unit: "u10", unit_name: "10", amount: "33.33" }, { unit: "u2", unit_name: "2", amount: "33.34" }] } },
    { id: "e2", month: { unit_amounts: [{ unit: "u2", unit_name: "2", amount: "0.10" }] } },
    { id: "e3", month: null },
  ];

  const grid = buildGrid(entries);

  assert.deepEqual(grid.rows.map((row) => row.unit_name), ["2", "10"]);
  assert.equal(grid.rows[0].total, "33.44");
  assert.deepEqual(grid.rows[0].amounts, { e1: "33.34", e2: "0.10" });
  assert.deepEqual(grid.entryTotals, { e1: "66.67", e2: "0.10" });
  assert.equal(grid.grandTotal, "66.77");
});

test("a fee entry (event of the administradora) has no sub-account and always previews without one", () => {
  const fee = values({ credits_company: true, cost_center: "cc-1" });

  assert.equal(entryToPayload(fee).cost_center, null);
  assert.equal(canPreview(values({ credits_company: true, cost_center: "" })), true);
  assert.equal(canPreview(values({ credits_company: false, cost_center: "" })), false);
});

test("the column title carries the event code and the installment", () => {
  const month = { line_description: "0250-Limpeza do condomínio - 10/2026 (2/3)", installment: "2/3" };

  assert.deepEqual(entryColumnTitle({ month }), { title: "0250-Limpeza do condomínio - 10/2026 (2/3)", installment: "2/3" });
  assert.deepEqual(entryColumnTitle({ event_name: null, description: "Gás", month: null }), { title: "Gás", installment: "" });
});

test("the signed money mask keeps the minus sign in front and the cash-style digits", () => {
  assert.equal(maskSignedMoney("-"), "-");
  assert.equal(maskSignedMoney("-5"), "-0,05");
  assert.equal(maskSignedMoney("-12345"), "-123,45");
  assert.equal(maskSignedMoney("12345"), "123,45");
  assert.equal(maskSignedMoney(""), "");
});

test("the grid sums a discount as a negative value", () => {
  const grid = buildGrid([
    { id: "a", month: { unit_amounts: [{ unit: "u1", unit_name: "101", amount: "450.00" }] } },
    { id: "b", month: { unit_amounts: [{ unit: "u1", unit_name: "101", amount: "-50.00" }] } },
  ]);

  assert.equal(grid.rows[0].total, "400.00");
  assert.equal(grid.entryTotals.b, "-50.00");
  assert.equal(grid.grandTotal, "400.00");
});
