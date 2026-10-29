import assert from "node:assert/strict";
import { test } from "node:test";

import { activeModule, APP_MODULES, isItemActive } from "../lib/module-menu.ts";

test("the active module follows the URL", () => {
  assert.equal(activeModule("/dashboard"), "home");
  assert.equal(activeModule("/"), null);
  assert.equal(activeModule("/condominiums/abc"), "condominiums");
  assert.equal(activeModule("/finance/statement"), "finance");
  assert.equal(activeModule("/billing/entries"), "billing");
  assert.equal(activeModule("/condominiums/persons/new"), "condominiums");
  assert.equal(activeModule("/persons"), null);
  assert.equal(activeModule("/login"), null);
  assert.equal(activeModule(null), null);
});

test("an item without a screen has no link, and every linked item is absolute", () => {
  const items = APP_MODULES.flatMap((appModule) => appModule.groups.flatMap((group) => group.items));
  const soon = items.filter((item) => !item.href).map((item) => item.label);
  assert.deepEqual(soon, [
    "Áreas",
    "Ficha da unidade",
    "Taxa de administração",
  ]);
  for (const item of items) if (item.href) assert.ok(item.href.startsWith("/"));
});

test("the most specific item is the active one", () => {
  const group = APP_MODULES.find((appModule) => appModule.key === "condominiums").groups[0].items;
  const [condominiums, units] = group;
  assert.equal(isItemActive(condominiums, group, "/condominiums/units"), false);
  assert.equal(isItemActive(units, group, "/condominiums/units/new"), true);
  assert.equal(isItemActive(condominiums, group, "/condominiums/123"), true);
  assert.equal(isItemActive(condominiums, group, "/persons"), false);
});

test("a module with groups has no direct link, one without groups has", () => {
  for (const appModule of APP_MODULES) {
    assert.equal(appModule.groups.length === 0, appModule.href !== undefined);
  }
});
