import assert from "node:assert/strict";
import { test } from "node:test";

import { BLOCK_SECTIONS, blocksFrameState, blockUnitsUrl, blockUrl, newBlockUrl } from "../lib/block-workspace.ts";

test("a new block is inside the frame, with the condominium from the URL", () => {
  const state = blocksFrameState("/condominiums/c1/blocks/new");
  assert.deepEqual([state.hasFrame, state.condominiumId, state.blockId, state.subScreen], [true, "c1", null, null]);
});

test("an open block is inside the frame, and its units are a sub-screen of it", () => {
  const page = blocksFrameState("/condominiums/blocks/b1");
  assert.deepEqual([page.hasFrame, page.blockId, page.subScreen], [true, "b1", null]);
  const units = blocksFrameState("/condominiums/blocks/b1/units");
  assert.deepEqual([units.hasFrame, units.blockId, units.subScreen], [true, "b1", "units"]);
});

test("other routes are not the blocks frame", () => {
  for (const path of ["/condominiums", "/condominiums/c1", "/condominiums/c1/blocks", "/condominiums/blocks/new", "/condominiums/blocks/b1/other", "/condominiums/blocks/b1/units/x", null]) {
    assert.equal(blocksFrameState(path).hasFrame, false, String(path));
  }
});

test("the urls of the block flow and its one section", () => {
  assert.equal(newBlockUrl("c1"), "/condominiums/c1/blocks/new");
  assert.equal(blockUrl("b1"), "/condominiums/blocks/b1");
  assert.equal(blockUnitsUrl("b1"), "/condominiums/blocks/b1/units");
  assert.deepEqual(BLOCK_SECTIONS.map((section) => section.id), ["dados-gerais"]);
});
