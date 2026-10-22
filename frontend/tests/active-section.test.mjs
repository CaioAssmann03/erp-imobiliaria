import assert from "node:assert/strict";
import { test } from "node:test";

import { activeSectionId } from "../lib/active-section.ts";

const page = [
  { id: "general", top: -320 },
  { id: "fee", top: 40 },
  { id: "billing", top: 520 },
];

test("the section in view is the last one whose top reached the reading line", () => {
  assert.equal(activeSectionId(page, 80), "fee");
  assert.equal(activeSectionId([{ id: "general", top: -10 }, { id: "fee", top: 600 }], 80), "general");
});

test("before any section reaches the line, the first one counts", () => {
  assert.equal(activeSectionId([{ id: "general", top: 200 }, { id: "fee", top: 700 }], 80), "general");
});

test("at the end of the page the last section counts, even if it never reached the line", () => {
  assert.equal(activeSectionId(page, 80, true), "billing");
});

test("with no section there is nothing in view", () => {
  assert.equal(activeSectionId([], 80), undefined);
  assert.equal(activeSectionId([], 80, true), undefined);
});
