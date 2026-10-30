import assert from "node:assert/strict";
import { test } from "node:test";

import { newPersonUrl, originCondominium, PERSON_SECTIONS, personsFrameState, personsUrl, personUrl } from "../lib/persons/person-workspace.ts";

test("the empty screen has the frame and, on a phone, only the list", () => {
  const state = personsFrameState("/condominiums/persons");
  assert.equal(state.hasFrame, true);
  assert.equal(state.personId, null);
  assert.equal(state.showListOnPhone, true);
  assert.equal(state.showPageOnPhone, false);
});

test("a new person and an open person show the page on a phone", () => {
  const created = personsFrameState("/condominiums/persons/new");
  assert.deepEqual([created.hasFrame, created.isNew, created.personId, created.showListOnPhone, created.showPageOnPhone], [true, true, null, false, true]);
  const open = personsFrameState("/condominiums/persons/p1");
  assert.deepEqual([open.hasFrame, open.isNew, open.personId, open.showListOnPhone, open.showPageOnPhone], [true, false, "p1", false, true]);
});

test("other routes are not the persons workspace", () => {
  for (const path of ["/persons", "/condominiums", "/condominiums/c1", "/condominiums/units", "/condominiums/persons/p1/extra", "/dashboard", null]) {
    assert.equal(personsFrameState(path).hasFrame, false, String(path));
  }
});

test("the urls of the persons flow and the two sections", () => {
  assert.equal(personsUrl(), "/condominiums/persons");
  assert.equal(newPersonUrl(), "/condominiums/persons/new");
  assert.equal(personUrl("p1"), "/condominiums/persons/p1");
  assert.deepEqual(PERSON_SECTIONS.map((section) => section.id), ["identificacao", "contato"]);
});

test("a person opened from somewhere carries the context, and only a UUID is accepted back", () => {
  const condominium = "1b7ab73b-092f-4514-8532-573173c2bd73";
  const unit = "1a99554a-29a7-49fa-94f0-d231ff41b7dd";
  const from = `/condominiums/${condominium}/units/${unit}`;
  assert.equal(personUrl("p1"), "/condominiums/persons/p1");
  assert.equal(personUrl("p1", { condominium }), `/condominiums/persons/p1?condominium=${condominium}`);
  assert.equal(
    personUrl("p1", { condominium, unit, from }),
    `/condominiums/persons/p1?condominium=${condominium}&unit=${unit}&from=${encodeURIComponent(from)}`
  );
  assert.equal(personsUrl({ unit }), `/condominiums/persons?unit=${unit}`);
  assert.equal(originCondominium(condominium), condominium);
  for (const value of [null, "", "abc", "../admin", "1b7ab73b-092f-4514-8532-573173c2bd73/../x"]) {
    assert.equal(originCondominium(value), null, String(value));
  }
});
