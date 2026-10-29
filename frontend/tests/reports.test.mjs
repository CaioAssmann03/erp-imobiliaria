import assert from "node:assert/strict";
import { test } from "node:test";

import {
  accountabilityPdfName,
  daysLateLabel,
  defaultAccountabilityMonth,
  delinquencyPdfName,
  reportMonths,
} from "../lib/reports.ts";

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

import { administrationFeePdfName, feeRuleLabel, feeStatusNote } from "../lib/reports.ts";

test("the administration fee PDF is named after the month", () => {
  assert.equal(administrationFeePdfName("2026-10-01"), "taxa-de-administracao-2026-10.pdf");
});

test("the fee rule reads as the contract says it", () => {
  const base = { fee_type: "variable", fee_basis: "revenue", fee_percentage: "10.00", fee_floor: null, fee_ceiling: null };

  assert.equal(feeRuleLabel({ ...base, fee_type: "fixed" }), "Valor fixo");
  assert.equal(feeRuleLabel(base), "10% da receita");
  assert.equal(feeRuleLabel({ ...base, fee_basis: "expense", fee_percentage: "2.50" }), "2,5% da despesa");
  assert.match(feeRuleLabel({ ...base, fee_floor: "300.00", fee_ceiling: "800.00" }), /mínimo .*300,00 · máximo .*800,00/);
  assert.equal(feeRuleLabel({ ...base, fee_type: null }), "—");
});

test("a fee that is not due says why", () => {
  assert.equal(feeStatusNote("not_started"), "Contrato ainda não iniciado");
  assert.equal(feeStatusNote("no_contract"), "Sem contrato cadastrado");
  assert.equal(feeStatusNote("due"), "");
});

import { boletoNote, defaultSheetPeriod, unitSheetPdfName, unitSheetUrl } from "../lib/reports.ts";

test("the unit sheet opens with the condominium and the unit chosen", () => {
  assert.equal(unitSheetUrl("c1", "u1"), "/reports/unit-sheet?condominium=c1&unit=u1");
});

test("the sheet's default period is the last 12 months through this one", () => {
  assert.deepEqual(defaultSheetPeriod("2026-10-29"), { from: "2025-11-01", to: "2026-10-01" });
  assert.deepEqual(defaultSheetPeriod("2026-03-05"), { from: "2025-04-01", to: "2026-03-01" });
});

test("the sheet's PDF name keeps only safe characters", () => {
  assert.equal(unitSheetPdfName(4, "101"), "ficha-0004-101.pdf");
  assert.equal(unitSheetPdfName(12, "A/2 ç"), "ficha-0012-A2c.pdf");
  assert.equal(unitSheetPdfName(1, "///"), "ficha-0001-unidade.pdf");
});

test("a boleto note says how late or when it was paid", () => {
  assert.equal(boletoNote({ is_overdue: true, days_overdue: 10, status: "issued", paid_on: null }), "há 10 dias");
  assert.equal(boletoNote({ is_overdue: true, days_overdue: 1, status: "issued", paid_on: null }), "há 1 dia");
  assert.equal(boletoNote({ is_overdue: false, days_overdue: 0, status: "paid", paid_on: "2026-10-05" }), "pago em 05/10/2026");
  assert.equal(boletoNote({ is_overdue: false, days_overdue: 0, status: "issued", paid_on: null }), "");
});
