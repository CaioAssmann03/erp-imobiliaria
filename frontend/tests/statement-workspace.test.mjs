import assert from "node:assert/strict";
import { test } from "node:test";

import { STATEMENT_SECTIONS, statementFrameState, statementUrl } from "../lib/finance/statement-workspace.ts";

test("the empty screen has the frame and, on a phone, only the list", () => {
  const state = statementFrameState("/finance/statement");
  assert.deepEqual([state.hasFrame, state.condominiumId, state.showListOnPhone, state.showPageOnPhone], [true, null, true, false]);
});

test("a condominium's statement shows the page on a phone", () => {
  const open = statementFrameState("/finance/statement/c1");
  assert.deepEqual([open.hasFrame, open.condominiumId, open.showListOnPhone, open.showPageOnPhone], [true, "c1", false, true]);
});

test("other finance routes are not the statement workspace", () => {
  for (const path of ["/finance", "/finance/accounts-payable", "/finance/entries/new", "/finance/statement/c1/extra", "/condominiums", null]) {
    assert.equal(statementFrameState(path).hasFrame, false, String(path));
  }
});

test("the urls and the two sections", () => {
  assert.equal(statementUrl(), "/finance/statement");
  assert.equal(statementUrl("c1"), "/finance/statement/c1");
  assert.deepEqual(STATEMENT_SECTIONS.map((section) => section.id), ["saldo", "subcontas", "lancamentos"]);
});
