import assert from "node:assert/strict";
import { test } from "node:test";

import { sectionPosition } from "../lib/condominium-registry.ts";
import {
  newUnitUrl,
  UNIT_SECTIONS,
  unitListLabel,
  unitsFrameState,
  unitsUrl,
  unitUrl,
} from "../lib/unit-workspace.ts";

test("the unit screen without a condominium asks for one, on its own screen on a phone", () => {
  const state = unitsFrameState("/condominiums/units", {});
  assert.equal(state.hasFrame, true);
  assert.equal(state.condominiumId, null);
  assert.equal(state.unitId, null);
  assert.equal(state.showListOnPhone, true);
  assert.equal(state.showPageOnPhone, false);
});

test("the condominium comes from the query or from the path", () => {
  assert.equal(unitsFrameState("/condominiums/units", { condominium: "c1" }).condominiumId, "c1");
  const open = unitsFrameState("/condominiums/c1/units/u9");
  assert.deepEqual(
    { hasFrame: open.hasFrame, condominiumId: open.condominiumId, unitId: open.unitId, isNew: open.isNew },
    { hasFrame: true, condominiumId: "c1", unitId: "u9", isNew: false }
  );
  assert.equal(open.showListOnPhone, false);
  assert.equal(open.showPageOnPhone, true);
});

test("a new unit opens inside the frame, with no unit selected", () => {
  const state = unitsFrameState("/condominiums/c1/units/new");
  assert.equal(state.hasFrame, true);
  assert.equal(state.isNew, true);
  assert.equal(state.unitId, null);
  assert.equal(state.condominiumId, "c1");
});

test("a pendency shortcut (?pending=) keeps the frame, with no condominium chosen", () => {
  const state = unitsFrameState("/condominiums/units");
  assert.equal(state.hasFrame, true);
  assert.equal(state.condominiumId, null);
  assert.equal(state.showListOnPhone, true);
});

test("other routes are not the unit workspace", () => {
  for (const path of ["/condominiums", "/condominiums/c1", "/condominiums/blocks", "/condominiums/c1/blocks/new", "/condominiums/c1/units", "/persons", "/condominiums/c1/units/u9/extra"]) {
    assert.equal(unitsFrameState(path).hasFrame, false, path);
  }
  assert.equal(unitsFrameState(null).hasFrame, false);
});

test("the urls of the unit flow", () => {
  assert.equal(unitsUrl(), "/condominiums/units");
  assert.equal(unitsUrl("c1"), "/condominiums/units?condominium=c1");
  assert.equal(unitUrl("c1", "u9"), "/condominiums/c1/units/u9");
  assert.equal(newUnitUrl("c1"), "/condominiums/c1/units/new");
});

test("the list shows the type and the name of the unit", () => {
  assert.equal(unitListLabel("Apartamento", "101"), "Apartamento 101");
  assert.equal(unitListLabel("", "A3"), "A3");
});

test("the unit page has the four sections and the index marker follows the reading line", () => {
  assert.deepEqual(UNIT_SECTIONS.map((section) => section.id), ["dados-gerais", "proprietario", "inquilino", "cobranca"]);
  // the owner section started above the line and the tenant one is on it: the marker is on the tenant item
  assert.equal(sectionPosition([-600, -250, 300, 700], 300), 2);
  assert.equal(sectionPosition([500, 900, 1200, 1500], 300), 0);
});

test("the people of a unit are a sub-screen of the open unit, inside the same frame", () => {
  const screen = unitsFrameState("/condominiums/c1/units/u1/persons", {});
  assert.deepEqual([screen.hasFrame, screen.condominiumId, screen.unitId, screen.subScreen, screen.isNew], [true, "c1", "u1", "persons", false]);
  const page = unitsFrameState("/condominiums/c1/units/u1", {});
  assert.deepEqual([page.unitId, page.subScreen], ["u1", null]);
  for (const path of ["/condominiums/c1/units/new/persons", "/condominiums/c1/units/u1/persons/x", "/condominiums/c1/units/u1/other"]) {
    assert.equal(unitsFrameState(path, {}).hasFrame, false, path);
  }
});
