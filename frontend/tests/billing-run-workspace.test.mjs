import assert from "node:assert/strict";
import { test } from "node:test";

import {
  BILLING_RUN_SECTIONS,
  billingRunUrl,
  billingRunsFrameState,
  billingRunsScope,
  billingRunsUrl,
} from "../lib/billing/billing-run-workspace.ts";

const CONDOMINIUM = "3f0b1c2a-1111-4222-8333-444455556666";
const params = (query) => new URLSearchParams(query);

test("the empty screen has the frame and, on a phone, only the list", () => {
  const state = billingRunsFrameState("/billing/runs");
  assert.deepEqual([state.hasFrame, state.runId, state.showListOnPhone, state.showPageOnPhone], [true, null, true, false]);
});

test("an open run shows the page on a phone", () => {
  const open = billingRunsFrameState("/billing/runs/r1");
  assert.deepEqual([open.hasFrame, open.runId, open.showListOnPhone, open.showPageOnPhone], [true, "r1", false, true]);
});

test("other billing routes are not the runs workspace", () => {
  for (const path of ["/billing", "/billing/entries", "/billing/documents", "/billing/plans", "/billing/runs/r1/more", "/finance/runs", null]) {
    assert.equal(billingRunsFrameState(path).hasFrame, false, String(path));
  }
});

test("the scope is the condominium and the reference month, and only valid values count", () => {
  assert.deepEqual(billingRunsScope(params(`condominium=${CONDOMINIUM}&reference_month=2026-10-01`)), { condominium: CONDOMINIUM, month: "2026-10-01" });
  assert.deepEqual(billingRunsScope(params("condominium=nao-e-uuid&reference_month=2026-10-15")), { condominium: "", month: "" });
  assert.deepEqual(billingRunsScope(params("")), { condominium: "", month: "" });
});

test("the URLs carry only what is chosen", () => {
  const scope = { condominium: CONDOMINIUM, month: "2026-10-01" };
  assert.equal(billingRunsUrl(scope), `/billing/runs?condominium=${CONDOMINIUM}&reference_month=2026-10-01`);
  assert.equal(billingRunUrl("r1", scope), `/billing/runs/r1?condominium=${CONDOMINIUM}&reference_month=2026-10-01`);
  assert.equal(billingRunsUrl({ condominium: CONDOMINIUM, month: "" }), `/billing/runs?condominium=${CONDOMINIUM}`);
  assert.equal(billingRunsUrl({ condominium: "", month: "" }), "/billing/runs");
});

test("the run sections are the ones the page draws", () => {
  assert.deepEqual(
    BILLING_RUN_SECTIONS.map((section) => section.id),
    ["resumo", "problemas"]
  );
});
