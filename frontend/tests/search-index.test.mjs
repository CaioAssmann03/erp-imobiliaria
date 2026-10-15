import assert from "node:assert/strict";
import { test } from "node:test";

import { isSearchable } from "../lib/search-index.ts";

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
