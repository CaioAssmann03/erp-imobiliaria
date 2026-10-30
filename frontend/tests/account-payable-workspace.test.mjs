import assert from "node:assert/strict";
import { test } from "node:test";

import {
  accountPayableUrl,
  accountsPayableFrameState,
  accountsPayableUrl,
  newAccountPayableUrl,
  OPEN_SECTIONS,
  payableSections,
} from "../lib/finance/account-payable-workspace.ts";

test("the empty screen has the frame and, on a phone, only the list", () => {
  const state = accountsPayableFrameState("/finance/accounts-payable");
  assert.deepEqual([state.hasFrame, state.accountId, state.isNew, state.showListOnPhone, state.showPageOnPhone], [true, null, false, true, false]);
});

test("a new account and an open account show the page on a phone", () => {
  const created = accountsPayableFrameState("/finance/accounts-payable/new");
  assert.deepEqual([created.hasFrame, created.isNew, created.accountId, created.showListOnPhone, created.showPageOnPhone], [true, true, null, false, true]);
  const open = accountsPayableFrameState("/finance/accounts-payable/a1");
  assert.deepEqual([open.hasFrame, open.isNew, open.accountId, open.showListOnPhone, open.showPageOnPhone], [true, false, "a1", false, true]);
});

test("other finance routes are not the accounts payable workspace", () => {
  for (const path of ["/finance", "/finance/statement", "/finance/entries/new", "/finance/accounts-payable/a1/extra", "/condominiums", "/dashboard", null]) {
    assert.equal(accountsPayableFrameState(path).hasFrame, false, String(path));
  }
});

test("the urls of the accounts payable flow", () => {
  assert.equal(accountsPayableUrl(), "/finance/accounts-payable");
  assert.equal(newAccountPayableUrl(), "/finance/accounts-payable/new");
  assert.equal(accountPayableUrl("a1"), "/finance/accounts-payable/a1");
});

test("an open account has the form sections; a closed one only the summary and, if paid, the receipts", () => {
  assert.deepEqual(payableSections("open"), OPEN_SECTIONS);
  assert.deepEqual(payableSections(undefined), OPEN_SECTIONS);
  assert.deepEqual(payableSections("cancelled").map((section) => section.id), ["resumo"]);
  assert.deepEqual(payableSections("paid").map((section) => section.id), ["resumo", "comprovantes"]);
});
