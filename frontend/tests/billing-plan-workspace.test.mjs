import assert from "node:assert/strict";
import { test } from "node:test";

import {
  BILLING_PLAN_SECTIONS,
  billingPlanUrl,
  billingPlansFrameState,
  billingPlansScope,
  billingPlansUrl,
  newBillingPlanUrl,
} from "../lib/billing/billing-plan-workspace.ts";

const CONDOMINIUM = "3f0b1c2a-1111-4222-8333-444455556666";
const params = (query) => new URLSearchParams(query);

test("the empty screen has the frame and, on a phone, only the list", () => {
  const state = billingPlansFrameState("/billing/plans");
  assert.deepEqual([state.hasFrame, state.planId, state.isNew, state.showListOnPhone, state.showPageOnPhone], [true, null, false, true, false]);
});

test("a new plan and an open plan show the page on a phone", () => {
  const created = billingPlansFrameState("/billing/plans/new");
  assert.deepEqual([created.hasFrame, created.isNew, created.planId, created.showListOnPhone, created.showPageOnPhone], [true, true, null, false, true]);
  const open = billingPlansFrameState("/billing/plans/p1");
  assert.deepEqual([open.hasFrame, open.isNew, open.planId, open.showListOnPhone, open.showPageOnPhone], [true, false, "p1", false, true]);
});

test("other billing routes are not the plans workspace", () => {
  for (const path of ["/billing", "/billing/entries", "/billing/extra", "/billing/documents", "/billing/plans/p1/more", "/finance/plans", null]) {
    assert.equal(billingPlansFrameState(path).hasFrame, false, String(path));
  }
});

test("the scope is the condominium, and only a UUID counts", () => {
  assert.deepEqual(billingPlansScope(params(`condominium=${CONDOMINIUM}`)), { condominium: CONDOMINIUM });
  assert.deepEqual(billingPlansScope(params("condominium=nao-e-uuid")), { condominium: "" });
  assert.deepEqual(billingPlansScope(params("")), { condominium: "" });
});

test("the URLs carry the condominium when there is one (the link of the issuance problems keeps working)", () => {
  const scope = { condominium: CONDOMINIUM };
  assert.equal(billingPlansUrl(scope), `/billing/plans?condominium=${CONDOMINIUM}`);
  assert.equal(newBillingPlanUrl(scope), `/billing/plans/new?condominium=${CONDOMINIUM}`);
  assert.equal(billingPlanUrl("p1", scope), `/billing/plans/p1?condominium=${CONDOMINIUM}`);
  assert.equal(billingPlansUrl({ condominium: "" }), "/billing/plans");
});

test("the plan sections are the ones the form draws", () => {
  assert.deepEqual(
    BILLING_PLAN_SECTIONS.map((section) => section.id),
    ["plano", "itens"]
  );
});
