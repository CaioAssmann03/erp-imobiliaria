import assert from "node:assert/strict";
import { test } from "node:test";

import { canCancelDocument, documentStatusLabel, runStatusLabel } from "../lib/billing-documents.ts";
import { describeProblem, problemFix } from "../lib/billing-run-problems.ts";

const CODES = [
  "no_billing_rules",
  "no_plan_in_force",
  "inconsistent_apportionment",
  "unit_billing_blocked",
  "manager_unit_exempt",
  "no_current_payer",
  "nothing_to_bill",
  "document_invalid",
];

test("every code the API can send has a Portuguese sentence", () => {
  for (const code of CODES) assert.notEqual(describeProblem(code), code, code);
});

test("an unknown code is shown as it is", () => {
  assert.equal(describeProblem("something_new"), "something_new");
  assert.equal(problemFix("something_new", { condominiumId: "c", unitId: null }), null);
});

test("a condominium problem links to the condominium, the plans or the units", () => {
  const target = { condominiumId: "c-1", unitId: null };

  assert.deepEqual(problemFix("no_billing_rules", target), { href: "/condominiums/c-1", label: "Abrir o condomínio" });
  assert.deepEqual(problemFix("no_plan_in_force", target), { href: "/billing/plans?condominium=c-1", label: "Ver os planos" });
  assert.deepEqual(problemFix("inconsistent_apportionment", target), { href: "/condominiums/units?condominium=c-1", label: "Ver as unidades" });
});

test("a unit problem links to the unit's page", () => {
  const target = { condominiumId: "c-1", unitId: "u-9" };

  assert.deepEqual(problemFix("no_current_payer", target), { href: "/condominiums/c-1/units/u-9", label: "Abrir a unidade" });
  assert.deepEqual(problemFix("unit_billing_blocked", target), { href: "/condominiums/c-1/units/u-9", label: "Abrir a unidade" });
});

test("an informational problem and a unit link without a unit have no link", () => {
  assert.equal(problemFix("manager_unit_exempt", { condominiumId: "c-1", unitId: "u-9" }), null);
  assert.equal(problemFix("no_current_payer", { condominiumId: "c-1", unitId: null }), null);
});

test("overdue wins over the stored status", () => {
  assert.equal(documentStatusLabel("issued"), "Emitido");
  assert.equal(documentStatusLabel("issued", true), "Vencido");
  assert.equal(documentStatusLabel("paid"), "Pago");
  assert.equal(documentStatusLabel("cancelled"), "Cancelado");
});

test("only an issued or registered document can be cancelled", () => {
  assert.equal(canCancelDocument("issued"), true);
  assert.equal(canCancelDocument("registered"), true);
  assert.equal(canCancelDocument("paid"), false);
  assert.equal(canCancelDocument("cancelled"), false);
});

test("run statuses have a label", () => {
  assert.equal(runStatusLabel("partial"), "Parcial");
  assert.equal(runStatusLabel("failed"), "Falhou");
});
