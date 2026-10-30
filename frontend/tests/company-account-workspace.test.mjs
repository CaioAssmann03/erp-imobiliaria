import assert from "node:assert/strict";
import { test } from "node:test";

import { COMPANY_ENTRY_SECTIONS, companyAccountFrameState, companyAccountUrl, companyEntryUrl } from "../lib/finance/company-account-workspace.ts";

test("the empty screen has the frame and, on a phone, only the list", () => {
  const state = companyAccountFrameState("/finance/company-account");
  assert.deepEqual([state.hasFrame, state.entryId, state.showListOnPhone, state.showPageOnPhone], [true, null, true, false]);
});

test("an open entry shows the page on a phone", () => {
  const open = companyAccountFrameState("/finance/company-account/e1");
  assert.deepEqual([open.hasFrame, open.entryId, open.showListOnPhone, open.showPageOnPhone], [true, "e1", false, true]);
});

test("other finance routes are not the company account workspace", () => {
  for (const path of ["/finance", "/finance/statement", "/finance/company-account/e1/extra", "/condominiums", null]) {
    assert.equal(companyAccountFrameState(path).hasFrame, false, String(path));
  }
});

test("the urls and the one section", () => {
  assert.equal(companyAccountUrl(), "/finance/company-account");
  assert.equal(companyEntryUrl("e1"), "/finance/company-account/e1");
  assert.deepEqual(COMPANY_ENTRY_SECTIONS.map((section) => section.id), ["lancamento"]);
});
