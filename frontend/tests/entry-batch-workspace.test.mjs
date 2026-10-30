import assert from "node:assert/strict";
import { test } from "node:test";

import { ENTRY_BATCH_SECTIONS, entriesUrl, entryBatchFrameState, entryBatchUrl, newEntryBatchUrl } from "../lib/finance/entry-batch-workspace.ts";

test("the empty screen has the frame and, on a phone, only the list", () => {
  const state = entryBatchFrameState("/finance/entries");
  assert.deepEqual([state.hasFrame, state.batchId, state.isNew, state.showListOnPhone, state.showPageOnPhone], [true, null, false, true, false]);
});

test("a new batch and an open batch show the page on a phone", () => {
  const created = entryBatchFrameState("/finance/entries/new");
  assert.deepEqual([created.hasFrame, created.isNew, created.batchId, created.showListOnPhone, created.showPageOnPhone], [true, true, null, false, true]);
  const open = entryBatchFrameState("/finance/entries/b1");
  assert.deepEqual([open.hasFrame, open.isNew, open.batchId, open.showListOnPhone, open.showPageOnPhone], [true, false, "b1", false, true]);
});

test("other finance routes are not the manual entry workspace", () => {
  for (const path of ["/finance", "/finance/statement", "/finance/accounts-payable", "/finance/entries/b1/extra", "/billing/entries", null]) {
    assert.equal(entryBatchFrameState(path).hasFrame, false, String(path));
  }
});

test("the urls and the two sections", () => {
  assert.equal(entriesUrl(), "/finance/entries");
  assert.equal(newEntryBatchUrl(), "/finance/entries/new");
  assert.equal(entryBatchUrl("b1"), "/finance/entries/b1");
  assert.deepEqual(ENTRY_BATCH_SECTIONS.map((section) => section.id), ["lote", "lancamentos"]);
});
