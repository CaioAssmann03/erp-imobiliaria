import assert from "node:assert/strict";
import { test } from "node:test";

import { EVENT_SECTIONS, eventsFrameState, eventsUrl, eventUrl, newEventUrl } from "../lib/billing-event-workspace.ts";

test("the empty screen has the frame and, on a phone, only the list", () => {
  const state = eventsFrameState("/condominiums/events");
  assert.deepEqual([state.hasFrame, state.eventId, state.isNew, state.showListOnPhone, state.showPageOnPhone], [true, null, false, true, false]);
});

test("a new event and an open event show the page on a phone", () => {
  const created = eventsFrameState("/condominiums/events/new");
  assert.deepEqual([created.hasFrame, created.isNew, created.eventId, created.showListOnPhone, created.showPageOnPhone], [true, true, null, false, true]);
  const open = eventsFrameState("/condominiums/events/e1");
  assert.deepEqual([open.hasFrame, open.isNew, open.eventId, open.showListOnPhone, open.showPageOnPhone], [true, false, "e1", false, true]);
});

test("other routes are not the events workspace (the old billing address only redirects)", () => {
  for (const path of ["/billing", "/billing/entries", "/billing/events", "/billing/events/e1", "/condominiums", "/condominiums/events/e1/extra", "/dashboard", null]) {
    assert.equal(eventsFrameState(path).hasFrame, false, String(path));
  }
});

test("the urls of the events flow and the one section", () => {
  assert.equal(eventsUrl(), "/condominiums/events");
  assert.equal(newEventUrl(), "/condominiums/events/new");
  assert.equal(eventUrl("e1"), "/condominiums/events/e1");
  assert.deepEqual(EVENT_SECTIONS.map((section) => section.id), ["identificacao"]);
});
