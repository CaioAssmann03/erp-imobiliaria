import assert from "node:assert/strict";
import { test } from "node:test";

import { nextSort, orderingOf } from "../lib/list-sort.ts";

// A configuração de uma tabela: abre por nome crescente (a ordem padrão do servidor); em Status, crescente põe os ativos primeiro.
const CONFIG = {
  initial: { column: "name", direction: "asc" },
  orderings: { code: ["code", "-code"], name: ["name", "-name"], status: ["-active", "active"] },
};

const initial = CONFIG.initial;

test("the list opens sorted by name, ascending, and that order is not sent to the API", () => {
  assert.deepEqual(initial, { column: "name", direction: "asc" });
  assert.equal(orderingOf(CONFIG, initial), undefined);
});

test("a click on another column starts it ascending", () => {
  assert.deepEqual(nextSort(initial, "code"), { column: "code", direction: "asc" });
  assert.deepEqual(nextSort({ column: "code", direction: "desc" }, "status"), { column: "status", direction: "asc" });
});

test("a second click on the same column reverses it, and a third goes back", () => {
  const first = nextSort(initial, "code");
  const second = nextSort(first, "code");
  const third = nextSort(second, "code");

  assert.equal(second.direction, "desc");
  assert.deepEqual(third, first);
});

test("the sorted-by-default column reverses on its first click", () => {
  const reversed = nextSort(initial, "name");

  assert.deepEqual(reversed, { column: "name", direction: "desc" });
  assert.equal(orderingOf(CONFIG, reversed), "-name");
  assert.equal(orderingOf(CONFIG, nextSort(reversed, "name")), undefined);
});

test("each column asks the API for its own order, descending with a minus", () => {
  const ordering = (column, direction) => orderingOf(CONFIG, { column, direction });

  assert.equal(ordering("code", "asc"), "code");
  assert.equal(ordering("code", "desc"), "-code");
  assert.equal(ordering("name", "desc"), "-name");
});

test("status ascending lists the active first, like the alphabetical order of its labels", () => {
  const ordering = (direction) => orderingOf(CONFIG, { column: "status", direction });

  assert.equal(ordering("asc"), "-active");
  assert.equal(ordering("desc"), "active");
});
