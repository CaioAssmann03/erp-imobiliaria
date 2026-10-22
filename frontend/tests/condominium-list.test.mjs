import assert from "node:assert/strict";
import { test } from "node:test";

import {
  codeFromInput,
  condominiumTotalLabel,
  formatCondominiumCode,
  pendingFromParam,
  unitCountLabel,
} from "../lib/condominium-list.ts";

test("the code shows with four digits, and a longer one stays as it is", () => {
  assert.equal(formatCondominiumCode(3), "0003");
  assert.equal(formatCondominiumCode(124), "0124");
  assert.equal(formatCondominiumCode(12345), "12345");
});

test("the units read in the singular for one and in the plural otherwise", () => {
  assert.equal(unitCountLabel(0), "0 unidades");
  assert.equal(unitCountLabel(1), "1 unidade");
  assert.equal(unitCountLabel(17), "17 unidades");
});

test("the footer says active while the inactive are hidden", () => {
  assert.equal(condominiumTotalLabel(124, true), "124 condomínios ativos");
  assert.equal(condominiumTotalLabel(1, true), "1 condomínio ativo");
  assert.equal(condominiumTotalLabel(130, false), "130 condomínios");
  assert.equal(condominiumTotalLabel(1, false), "1 condomínio");
});

test("the typed code accepts digits with leading zeros and nothing else", () => {
  assert.equal(codeFromInput("0003"), 3);
  assert.equal(codeFromInput(" 42 "), 42);
  assert.equal(codeFromInput(""), null);
  assert.equal(codeFromInput("3a"), null);
  assert.equal(codeFromInput("1234567890"), null);
});

test("a pendency from the address counts only when it is a known one", () => {
  assert.equal(pendingFromParam("overdue_adjustment"), "overdue_adjustment");
  assert.equal(pendingFromParam("nope"), "");
  assert.equal(pendingFromParam(null), "");
  assert.equal(pendingFromParam(undefined), "");
});
