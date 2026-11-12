import assert from "node:assert/strict";
import { test } from "node:test";

import { isSearchable, searchStatic } from "../lib/navigation/search-index.ts";

test("a term of only digits is an ID, searchable from the first digit", () => {
  assert.equal(isSearchable("7"), true);
  assert.equal(isSearchable("42"), true);
  assert.equal(isSearchable(" 7 "), true);
});

test("text needs three characters", () => {
  assert.equal(isSearchable("ma"), false);
  assert.equal(isSearchable("mar"), true);
});

test("a document-like term (with punctuation) needs two digits", () => {
  assert.equal(isSearchable("1."), false);
  assert.equal(isSearchable("12."), true);
  assert.equal(isSearchable("529.982.247-25"), true);
});

test("an empty term is not searchable", () => {
  assert.equal(isSearchable(""), false);
  assert.equal(isSearchable("   "), false);
});

test("every section of the site is reachable from the static pages", () => {
  const titles = (term) => searchStatic(term).map((item) => item.title);

  assert.ok(titles("torre").includes("Blocos"));
  assert.ok(titles("centro de custo").includes("Sub-contas"));
  assert.ok(titles("apartamento").includes("Unidades"));
  assert.ok(titles("boleto").includes("Documentos de cobrança"));
  assert.ok(titles("emissao").includes("Execuções da emissão"));
  assert.ok(titles("plano").includes("Planos de cobrança"));
  assert.ok(titles("despesa").includes("Contas a pagar"));
});
