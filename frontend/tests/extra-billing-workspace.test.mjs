import assert from "node:assert/strict";
import { test } from "node:test";

import {
  NEW_EXTRA_BILLING_SECTIONS,
  extraBillingDocumentUrl,
  extraBillingFrameState,
  extraBillingScope,
  extraBillingUrl,
  newExtraBillingUrl,
} from "../lib/billing/extra-billing-workspace.ts";

const CONDOMINIUM = "3f0b1c2a-1111-4222-8333-444455556666";
const params = (query) => new URLSearchParams(query);

test("the empty screen has the frame and, on a phone, only the list", () => {
  const state = extraBillingFrameState("/billing/extra");
  assert.deepEqual([state.hasFrame, state.documentId, state.isNew, state.showListOnPhone, state.showPageOnPhone], [true, null, false, true, false]);
});

test("a new boleto and an open one show the page on a phone", () => {
  const created = extraBillingFrameState("/billing/extra/new");
  assert.deepEqual([created.hasFrame, created.isNew, created.documentId, created.showListOnPhone, created.showPageOnPhone], [true, true, null, false, true]);
  const open = extraBillingFrameState("/billing/extra/d1");
  assert.deepEqual([open.hasFrame, open.isNew, open.documentId, open.showListOnPhone, open.showPageOnPhone], [true, false, "d1", false, true]);
});

test("other billing routes are not the extra boleto workspace", () => {
  for (const path of ["/billing", "/billing/entries", "/billing/documents", "/billing/documents/d1", "/billing/extra/d1/more", "/finance/extra", null]) {
    assert.equal(extraBillingFrameState(path).hasFrame, false, String(path));
  }
});

test("the scope is the condominium, and only a UUID counts", () => {
  assert.deepEqual(extraBillingScope(params(`condominium=${CONDOMINIUM}`)), { condominium: CONDOMINIUM });
  assert.deepEqual(extraBillingScope(params("condominium=nao-e-uuid")), { condominium: "" });
  assert.deepEqual(extraBillingScope(params("")), { condominium: "" });
});

test("the URLs carry the condominium when there is one", () => {
  const scope = { condominium: CONDOMINIUM };
  assert.equal(extraBillingUrl(scope), `/billing/extra?condominium=${CONDOMINIUM}`);
  assert.equal(newExtraBillingUrl(scope), `/billing/extra/new?condominium=${CONDOMINIUM}`);
  assert.equal(extraBillingDocumentUrl("d1", scope), `/billing/extra/d1?condominium=${CONDOMINIUM}`);
  assert.equal(extraBillingUrl({ condominium: "" }), "/billing/extra");
});

test("the new boleto sections are the ones the form draws", () => {
  assert.deepEqual(
    NEW_EXTRA_BILLING_SECTIONS.map((section) => section.id),
    ["boleto", "unidades", "valores"]
  );
});
