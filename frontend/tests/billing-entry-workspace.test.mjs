import assert from "node:assert/strict";
import { test } from "node:test";

import {
  BILLING_ENTRY_SECTIONS,
  NEW_BILLING_ENTRY_SECTIONS,
  billingEntriesFrameState,
  billingEntriesScope,
  billingEntriesUrl,
  billingEntryUrl,
  currentMonthIso,
  newBillingEntryUrl,
} from "../lib/billing-entry-workspace.ts";

const CONDOMINIUM = "3f0b1c2a-1111-4222-8333-444455556666";
const params = (query) => new URLSearchParams(query);

test("the empty screen has the frame and, on a phone, only the list", () => {
  const state = billingEntriesFrameState("/billing/entries");
  assert.deepEqual([state.hasFrame, state.entryId, state.isNew, state.showListOnPhone, state.showPageOnPhone], [true, null, false, true, false]);
});

test("a new launch and an open launch show the page on a phone", () => {
  const created = billingEntriesFrameState("/billing/entries/new");
  assert.deepEqual([created.hasFrame, created.isNew, created.entryId, created.showListOnPhone, created.showPageOnPhone], [true, true, null, false, true]);
  const open = billingEntriesFrameState("/billing/entries/e1");
  assert.deepEqual([open.hasFrame, open.isNew, open.entryId, open.showListOnPhone, open.showPageOnPhone], [true, false, "e1", false, true]);
});

test("other billing routes are not the launches workspace", () => {
  for (const path of ["/billing", "/billing/plans", "/billing/extra", "/billing/documents", "/billing/entries/e1/extra", "/finance/entries", null]) {
    assert.equal(billingEntriesFrameState(path).hasFrame, false, String(path));
  }
});

test("the scope comes from the URL and only a UUID and a first day of month are accepted", () => {
  assert.deepEqual(billingEntriesScope(params(`condominium=${CONDOMINIUM}&month=2026-09-01`)), { condominium: CONDOMINIUM, month: "2026-09-01" });
  assert.deepEqual(billingEntriesScope(params("condominium=../../x&month=2026-09-15")), { condominium: "", month: currentMonthIso() });
  assert.deepEqual(billingEntriesScope(params("month=2026-13-01")), { condominium: "", month: currentMonthIso() });
});

test("the urls carry the scope and leave out a condominium that is not chosen", () => {
  const scope = { condominium: CONDOMINIUM, month: "2026-10-01" };
  assert.equal(billingEntriesUrl(scope), `/billing/entries?condominium=${CONDOMINIUM}&month=2026-10-01`);
  assert.equal(newBillingEntryUrl(scope), `/billing/entries/new?condominium=${CONDOMINIUM}&month=2026-10-01`);
  assert.equal(billingEntryUrl("e1", scope), `/billing/entries/e1?condominium=${CONDOMINIUM}&month=2026-10-01`);
  assert.equal(billingEntriesUrl({ condominium: "", month: "2026-10-01" }), "/billing/entries?month=2026-10-01");
});

test("the sections of a new and of an open launch", () => {
  assert.deepEqual(NEW_BILLING_ENTRY_SECTIONS.map((section) => section.id), ["lancamento", "rateio", "unidades", "valores"]);
  assert.deepEqual(BILLING_ENTRY_SECTIONS.map((section) => section.id), ["lancamento", "valores"]);
});
