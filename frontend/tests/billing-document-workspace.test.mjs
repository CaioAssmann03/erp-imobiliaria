import assert from "node:assert/strict";
import { test } from "node:test";

import {
  BILLING_DOCUMENT_SECTIONS,
  billingDocumentUrl,
  billingDocumentsFrameState,
  billingDocumentsScope,
  billingDocumentsUrl,
} from "../lib/billing/billing-document-workspace.ts";

const CONDOMINIUM = "3f0b1c2a-1111-4222-8333-444455556666";
const params = (query) => new URLSearchParams(query);

test("the empty screen has the frame and, on a phone, only the list", () => {
  const state = billingDocumentsFrameState("/billing/documents");
  assert.deepEqual([state.hasFrame, state.documentId, state.showListOnPhone, state.showPageOnPhone], [true, null, true, false]);
});

test("an open document shows the page on a phone", () => {
  const open = billingDocumentsFrameState("/billing/documents/d1");
  assert.deepEqual([open.hasFrame, open.documentId, open.showListOnPhone, open.showPageOnPhone], [true, "d1", false, true]);
});

test("other billing routes are not the documents workspace", () => {
  for (const path of ["/billing", "/billing/entries", "/billing/extra", "/billing/runs", "/billing/documents/d1/more", "/finance/documents", null]) {
    assert.equal(billingDocumentsFrameState(path).hasFrame, false, String(path));
  }
});

test("the scope is the condominium and the reference month, read with the names the issuance link already uses", () => {
  assert.deepEqual(billingDocumentsScope(params(`condominium=${CONDOMINIUM}&reference_month=2026-10-01`)), { condominium: CONDOMINIUM, month: "2026-10-01" });
  assert.deepEqual(billingDocumentsScope(params("condominium=nao-e-uuid&reference_month=2026-10-15")), { condominium: "", month: "" });
  assert.deepEqual(billingDocumentsScope(params("")), { condominium: "", month: "" });
});

test("the URLs carry only what is chosen", () => {
  const scope = { condominium: CONDOMINIUM, month: "2026-10-01" };
  assert.equal(billingDocumentsUrl(scope), `/billing/documents?condominium=${CONDOMINIUM}&reference_month=2026-10-01`);
  assert.equal(billingDocumentUrl("d1", scope), `/billing/documents/d1?condominium=${CONDOMINIUM}&reference_month=2026-10-01`);
  assert.equal(billingDocumentsUrl({ condominium: "", month: "2026-10-01" }), "/billing/documents?reference_month=2026-10-01");
  assert.equal(billingDocumentsUrl({ condominium: "", month: "" }), "/billing/documents");
});

test("the document sections are the ones the view draws", () => {
  assert.deepEqual(
    BILLING_DOCUMENT_SECTIONS.map((section) => section.id),
    ["resumo", "boleto", "itens", "condicoes"]
  );
});
