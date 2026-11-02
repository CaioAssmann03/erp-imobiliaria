import assert from "node:assert/strict";
import { test } from "node:test";

import { costCenterUrl, costCentersFrameState, newCostCenterUrl } from "../lib/condominiums/cost-center-workspace.ts";

test("the empty screen has the frame and, on a phone, only the list", () => {
  const state = costCentersFrameState("/condominiums/cost-centers");
  assert.deepEqual([state.hasFrame, state.condominiumId, state.costCenterId, state.showListOnPhone, state.showPageOnPhone], [true, null, null, true, false]);
});

test("the empty screen starts on the condominium of ?condominium=", () => {
  assert.equal(costCentersFrameState("/condominiums/cost-centers", { condominium: "c1" }).condominiumId, "c1");
});

test("a new and an open sub-conta show the page on a phone", () => {
  const created = costCentersFrameState("/condominiums/c1/cost-centers/new");
  assert.deepEqual([created.hasFrame, created.condominiumId, created.costCenterId, created.showListOnPhone, created.showPageOnPhone], [true, "c1", null, false, true]);
  const open = costCentersFrameState("/condominiums/cost-centers/k1");
  assert.deepEqual([open.hasFrame, open.condominiumId, open.costCenterId, open.showListOnPhone, open.showPageOnPhone], [true, null, "k1", false, true]);
});

test("other routes are not the sub-contas workspace", () => {
  for (const path of ["/condominiums", "/condominiums/c1", "/condominiums/c1/cost-centers", "/condominiums/units", "/condominiums/cost-centers/k1/extra", "/finance/cost-center-catalog", null]) {
    assert.equal(costCentersFrameState(path).hasFrame, false, String(path));
  }
});

test("a new sub-conta, with or without a condominium, has the frame", () => {
  const without = costCentersFrameState("/condominiums/cost-centers/new");
  assert.deepEqual([without.hasFrame, without.condominiumId, without.costCenterId, without.isNew, without.showListOnPhone, without.showPageOnPhone], [true, null, null, true, false, true]);
  const withCondominium = costCentersFrameState("/condominiums/c1/cost-centers/new");
  assert.deepEqual([withCondominium.condominiumId, withCondominium.isNew], ["c1", true]);
  assert.equal(costCentersFrameState("/condominiums/cost-centers/k1").isNew, false);
  assert.equal(costCentersFrameState("/condominiums/cost-centers/new/extra").hasFrame, false);
});

test("the urls", () => {
  assert.equal(newCostCenterUrl(), "/condominiums/cost-centers/new");
  assert.equal(newCostCenterUrl("c1"), "/condominiums/c1/cost-centers/new");
  assert.equal(costCenterUrl("k1"), "/condominiums/cost-centers/k1");
});
