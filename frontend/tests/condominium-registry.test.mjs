import assert from "node:assert/strict";
import { test } from "node:test";

import {
  condominiumUrl,
  isRegistryPath,
  REGISTRY_SECTIONS,
  selectedCondominiumId,
} from "../lib/condominium-registry.ts";

test("the registry frame wraps the empty screen, the new form and one condominium", () => {
  assert.equal(isRegistryPath("/condominiums"), true);
  assert.equal(isRegistryPath("/condominiums/new"), true);
  assert.equal(isRegistryPath("/condominiums/0a1b"), true);
});

test("the other condominium screens have no list column", () => {
  assert.equal(isRegistryPath("/condominiums/units"), false);
  assert.equal(isRegistryPath("/condominiums/units/new"), false);
  assert.equal(isRegistryPath("/condominiums/blocks/9"), false);
  assert.equal(isRegistryPath("/condominiums/cost-centers/new"), false);
  assert.equal(isRegistryPath("/condominiums/0a1b/units/new"), false);
  assert.equal(isRegistryPath("/condominiums/0a1b/blocks/new"), false);
  assert.equal(isRegistryPath("/persons"), false);
  assert.equal(isRegistryPath(null), false);
});

test("the selected condominium is the id in the URL", () => {
  assert.equal(selectedCondominiumId("/condominiums/0a1b"), "0a1b");
  assert.equal(selectedCondominiumId("/condominiums"), null);
  assert.equal(selectedCondominiumId("/condominiums/new"), null);
  assert.equal(selectedCondominiumId("/condominiums/units"), null);
});

test("a condominium URL can point at a section", () => {
  assert.equal(condominiumUrl("x"), "/condominiums/x");
  assert.equal(condominiumUrl("x", "sub-contas"), "/condominiums/x#sub-contas");
  assert.deepEqual(REGISTRY_SECTIONS.map((section) => section.id), [
    "dados-gerais",
    "taxa-e-cobranca",
    "blocos-e-unidades",
    "sub-contas",
  ]);
});
