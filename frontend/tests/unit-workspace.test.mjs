import assert from "node:assert/strict";
import { test } from "node:test";

import { currentSection } from "../lib/condominium-registry.ts";
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

test("the pendency table has no frame", () => {
  assert.equal(unitsFrameState("/condominiums/units", { pending: "without_responsible" }).hasFrame, false);
  assert.equal(unitsFrameState("/condominiums/units", { pending: "" }).hasFrame, true);
});

test("other routes are not the unit workspace", () => {
  for (const path of ["/condominiums", "/condominiums/c1", "/condominiums/blocks", "/condominiums/c1/blocks/new", "/persons", "/condominiums/c1/units/u9/extra"]) {
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

test("the unit page has the four sections and the index follows the reading band", () => {
  assert.deepEqual(UNIT_SECTIONS.map((section) => section.id), ["dados-gerais", "proprietario", "inquilino", "cobranca"]);
  assert.equal(currentSection(new Set(["proprietario", "inquilino"]), UNIT_SECTIONS), "inquilino");
  assert.equal(currentSection(new Set(), UNIT_SECTIONS), null);
});
