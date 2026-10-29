import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_FORM_SECTION, FORM_SECTIONS, formSectionHref, parseFormSection } from "../lib/condominium-sections.ts";

test("a known section in the URL is used, anything else falls back to the first", () => {
  assert.equal(parseFormSection("address"), "address");
  assert.equal(parseFormSection("nope"), DEFAULT_FORM_SECTION);
  assert.equal(parseFormSection(null), DEFAULT_FORM_SECTION);
});

test("the default section has a clean URL and the others carry ?section=", () => {
  assert.equal(formSectionHref("/condominiums/c-1", DEFAULT_FORM_SECTION), "/condominiums/c-1");
  assert.equal(formSectionHref("/condominiums/c-1", "billing"), "/condominiums/c-1?section=billing");
});

test("every section has a label", () => {
  for (const section of FORM_SECTIONS) assert.ok(section.label.length > 0);
});
