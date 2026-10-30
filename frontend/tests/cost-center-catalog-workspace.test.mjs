import assert from "node:assert/strict";
import { test } from "node:test";

import { CATALOG_SECTIONS, catalogFrameState, catalogSections, catalogItemUrl, catalogUrl, newCatalogItemUrl } from "../lib/finance/cost-center-catalog-workspace.ts";

test("the empty screen has the frame and, on a phone, only the list", () => {
  const state = catalogFrameState("/finance/cost-center-catalog");
  assert.deepEqual([state.hasFrame, state.itemId, state.isNew, state.showListOnPhone, state.showPageOnPhone], [true, null, false, true, false]);
});

test("a new item and an open item show the page on a phone", () => {
  const created = catalogFrameState("/finance/cost-center-catalog/new");
  assert.deepEqual([created.hasFrame, created.isNew, created.itemId, created.showListOnPhone, created.showPageOnPhone], [true, true, null, false, true]);
  const open = catalogFrameState("/finance/cost-center-catalog/i1");
  assert.deepEqual([open.hasFrame, open.isNew, open.itemId, open.showListOnPhone, open.showPageOnPhone], [true, false, "i1", false, true]);
});

test("other routes are not the catalog workspace", () => {
  for (const path of ["/finance", "/finance/statement", "/finance/cost-center-catalog/i1/extra", "/condominiums/cost-centers", null]) {
    assert.equal(catalogFrameState(path).hasFrame, false, String(path));
  }
});

test("the urls and the sections", () => {
  assert.equal(catalogUrl(), "/finance/cost-center-catalog");
  assert.equal(newCatalogItemUrl(), "/finance/cost-center-catalog/new");
  assert.equal(catalogItemUrl("i1"), "/finance/cost-center-catalog/i1");
  assert.deepEqual(CATALOG_SECTIONS.map((section) => section.id), ["identificacao", "condominios"]);
  assert.deepEqual(catalogSections(true).map((section) => section.id), ["identificacao"]);
  assert.deepEqual(catalogSections(false).map((section) => section.id), ["identificacao", "condominios"]);
});
