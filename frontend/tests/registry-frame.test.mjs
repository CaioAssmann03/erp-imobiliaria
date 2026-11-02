import assert from "node:assert/strict";
import { test } from "node:test";

import { registryFrame } from "../lib/navigation/registry-frame.ts";

const pick = (state) => [state.hasFrame, state.id, state.isNew, state.showListOnPhone, state.showPageOnPhone];

test("the empty screen has the frame and, on a phone, only the list (with or without a trailing slash)", () => {
  assert.deepEqual(pick(registryFrame("/finance/entries", "finance", "entries")), [true, null, false, true, false]);
  assert.deepEqual(pick(registryFrame("/finance/entries/", "finance", "entries")), [true, null, false, true, false]);
});

test("new and an open record show the page on a phone", () => {
  assert.deepEqual(pick(registryFrame("/finance/entries/new", "finance", "entries")), [true, null, true, false, true]);
  assert.deepEqual(pick(registryFrame("/finance/entries/b1", "finance", "entries")), [true, "b1", false, false, true]);
});

test("a module with no new screen treats `new` as an id", () => {
  assert.equal(registryFrame("/billing/documents/new", "billing", "documents", false).id, "new");
  assert.equal(registryFrame("/billing/documents/new", "billing", "documents", false).isNew, false);
});

test("other routes have no frame", () => {
  for (const path of ["/finance", "/finance/accounts-payable", "/billing/entries", "/finance/entries/b1/extra", "/finance/entries/b1/", null]) {
    assert.equal(registryFrame(path, "finance", "entries").hasFrame, false, String(path));
  }
});
