import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CONDOMINIUM_PAGES,
  condominiumPageUrl,
  condominiumUrl,
  isRegistryPath,
  REGISTRY_SECTIONS,
  markerSpan,
  pageSmallness,
  condominiumPendingParam,
  CONDOMINIUM_PENDING_OPTIONS,
  readingLine,
  registryLayout,
  sectionPosition,
  selectedCondominiumId,
  selectedCondominiumPage,
} from "../lib/condominiums/condominium-registry.ts";

test("the registry frame wraps the empty screen, the new form, one condominium and its lists of blocks and cost centers", () => {
  assert.equal(isRegistryPath("/condominiums"), true);
  assert.equal(isRegistryPath("/condominiums/new"), true);
  assert.equal(isRegistryPath("/condominiums/0a1b"), true);
  assert.equal(isRegistryPath("/condominiums/0a1b/blocks"), true);
  assert.equal(isRegistryPath("/condominiums/0a1b/units"), true);
  assert.equal(isRegistryPath("/condominiums/0a1b/cost-centers"), true);
  assert.equal(isRegistryPath("/condominiums/0a1b/persons"), true);
});

test("the other condominium screens have no list column", () => {
  assert.equal(isRegistryPath("/condominiums/units"), false);
  assert.equal(isRegistryPath("/condominiums/units/new"), false);
  assert.equal(isRegistryPath("/condominiums/blocks/9"), false);
  assert.equal(isRegistryPath("/condominiums/cost-centers/new"), false);
  assert.equal(isRegistryPath("/condominiums/0a1b/units/new"), false);
  assert.equal(isRegistryPath("/condominiums/0a1b/blocks/new"), false);
  assert.equal(isRegistryPath("/condominiums/0a1b/cost-centers/new"), false);
  assert.equal(isRegistryPath("/persons"), false);
  assert.equal(isRegistryPath("/condominiums/persons"), false);
  assert.equal(isRegistryPath("/condominiums/events"), false);
  assert.equal(isRegistryPath("/condominiums/events/9"), false);
  assert.equal(isRegistryPath("/condominiums/persons/9"), false);
  assert.equal(isRegistryPath(null), false);
});

test("the selected condominium is the id in the URL", () => {
  assert.equal(selectedCondominiumId("/condominiums/0a1b"), "0a1b");
  assert.equal(selectedCondominiumId("/condominiums/0a1b/blocks"), "0a1b");
  assert.equal(selectedCondominiumId("/condominiums"), null);
  assert.equal(selectedCondominiumId("/condominiums/new"), null);
  assert.equal(selectedCondominiumId("/condominiums/units"), null);
});

test("a condominium URL can point at a section, and the page has only what is the condominium's own", () => {
  assert.equal(condominiumUrl("x"), "/condominiums/x");
  assert.equal(condominiumUrl("x", "taxa-e-cobranca"), "/condominiums/x#taxa-e-cobranca");
  assert.deepEqual(REGISTRY_SECTIONS.map((section) => section.id), ["dados-gerais", "taxa-e-cobranca"]);
});

test("blocks, units, cost centers and people are screens of their own, opened from the side menu", () => {
  assert.deepEqual(CONDOMINIUM_PAGES.map((page) => page.label), ["Blocos", "Unidades", "Sub-contas", "Pessoas"]);
  assert.equal(condominiumPageUrl("x", "persons"), "/condominiums/x/persons");
  assert.equal(condominiumPageUrl("x", "blocks"), "/condominiums/x/blocks");
  assert.equal(condominiumPageUrl("x", "cost-centers"), "/condominiums/x/cost-centers");
  assert.equal(condominiumPageUrl("x", "units"), "/condominiums/x/units");
});

test("the index marker moves with the scroll: a section's top reaches the line, then it walks to the next one", () => {
  assert.equal(sectionPosition([], 300), 0);
  // nothing reached the line yet: stays on the first item
  assert.equal(sectionPosition([500, 900], 300), 0);
  // the top of the second section is exactly on the line
  assert.equal(sectionPosition([-400, 300, 800], 300), 1);
  // half way between the first top (100) and the second (500)
  assert.equal(sectionPosition([100, 500], 300), 0.5);
  // past the last top it stays on the last item
  assert.equal(sectionPosition([-900, -500, -100], 300), 2);
  // a section that does not exist yet (Infinity) does not pull the marker
  assert.equal(sectionPosition([100, Infinity], 300), 0);
});

test("the reading line goes down to the bottom edge at the end of the page so a short last section is reached", () => {
  assert.equal(readingLine(1000, 0, 5000), 300);
  assert.equal(readingLine(1000, 4400, 5000), 300); // 600px left: still the base line
  assert.equal(readingLine(1000, 4700, 5000), 650); // half way through the last stretch
  assert.equal(readingLine(1000, 5000, 5000), 1000); // at the bottom: the edge of the screen
  assert.equal(readingLine(300, 0, 5000), 120); // never above 120px (the header), even on a short window
  assert.equal(readingLine(300, 0, 0), 300); // a page that does not scroll is already at its end
  // at the top the line starts at the first section's top (the marker rests on the first item) and rises to the normal line while scrolling
  assert.equal(readingLine(1000, 0, 5000, 140), 140);
  assert.equal(readingLine(1000, 80, 5000, 140), 220);
  assert.equal(readingLine(1000, 160, 5000, 140), 300);
  assert.equal(readingLine(1000, 2000, 5000, 140), 300);
});

test("on a page that scrolls little the marker still rests on the first section at the top and reaches the last at the bottom", () => {
  // 400px of scroll, 900px window, first section at 130px, second at 320px: the stretch toward the bottom edge is already running at the top
  const line = (scrolled) => readingLine(900, scrolled, 400, 130);
  assert.equal(line(0), 130);
  assert.equal(sectionPosition([130, 320], line(0)), 0);
  assert.equal(line(400), 900);
  assert.equal(sectionPosition([130 - 400, 320 - 400], line(400)), 1);
  // it never goes backwards while scrolling down
  let previous = -Infinity;
  for (let scrolled = 0; scrolled <= 400; scrolled += 20) {
    const position = sectionPosition([130 - scrolled, 320 - scrolled], line(scrolled));
    assert.ok(position >= previous, `at ${scrolled}`);
    previous = position;
  }
});

test("on a phone the list and the open page are separate screens", () => {
  assert.deepEqual(registryLayout("/condominiums"), { hasFrame: true, showListOnPhone: true, showPageOnPhone: false });
  assert.deepEqual(registryLayout("/condominiums/0a1b"), { hasFrame: true, showListOnPhone: false, showPageOnPhone: true });
  assert.deepEqual(registryLayout("/condominiums/new"), { hasFrame: true, showListOnPhone: false, showPageOnPhone: true });
  assert.deepEqual(registryLayout("/condominiums/units"), { hasFrame: false, showListOnPhone: false, showPageOnPhone: true });
});

test("the open screen of a condominium is kept when another one is picked", () => {
  assert.equal(selectedCondominiumPage("/condominiums/0a1b/blocks"), "blocks");
  assert.equal(selectedCondominiumPage("/condominiums/0a1b/persons"), "persons");
  assert.equal(selectedCondominiumPage("/condominiums/0a1b"), null);
  assert.equal(selectedCondominiumPage("/condominiums"), null);
  assert.equal(selectedCondominiumPage("/condominiums/persons"), null);
});

test("a page that does not scroll is small; one that scrolls enough is not; in between it is proportional", () => {
  assert.equal(pageSmallness(1000, 0), 1);
  assert.equal(pageSmallness(1000, 600), 0);
  assert.equal(pageSmallness(1000, 5000), 0);
  assert.equal(pageSmallness(1000, 300), 0.5);
  assert.equal(pageSmallness(1000, -20), 1);
});

test("the marker follows one item on a long page and covers every item on a short one", () => {
  assert.deepEqual(markerSpan(1.5, 0, 3), { start: 1.5, end: 2.5 });
  assert.deepEqual(markerSpan(1.5, 1, 3), { start: 0, end: 3 });
  assert.deepEqual(markerSpan(1, 0.5, 3), { start: 0.5, end: 2.5 });
  assert.deepEqual(markerSpan(0, 1, 2), { start: 0, end: 2 });
});

test("the pending of the condominium list comes from ?pending= and only a known one is kept", () => {
  assert.deepEqual(CONDOMINIUM_PENDING_OPTIONS.map((option) => option.value), [
    "inconsistent_apportionment",
    "overdue_adjustment",
    "upcoming_adjustment",
    "without_cost_centers",
  ]);
  assert.equal(condominiumPendingParam("inconsistent_apportionment"), "inconsistent_apportionment");
  assert.equal(condominiumPendingParam("evil"), "");
  assert.equal(condominiumPendingParam(null), "");
});
