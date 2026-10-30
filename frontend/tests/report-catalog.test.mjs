import assert from "node:assert/strict";
import { test } from "node:test";

import { REPORTS, reportsFrameState } from "../lib/reports/report-catalog.ts";

test("the hub is the list on a phone and has no open report", () => {
  const state = reportsFrameState("/reports");
  assert.equal(state.hasFrame, true);
  assert.equal(state.openHref, null);
  assert.equal(state.showListOnPhone, true);
  assert.equal(state.showPageOnPhone, false);
});

test("a report keeps the list on the left and is marked in it", () => {
  const state = reportsFrameState("/reports/delinquency");
  assert.equal(state.hasFrame, true);
  assert.equal(state.openHref, "/reports/delinquency");
  assert.equal(state.showListOnPhone, false);
  assert.equal(state.showPageOnPhone, true);
});

test("other routes are not the reports frame", () => {
  for (const path of ["/dashboard", "/condominiums/reports", "/reports/delinquency/extra", null]) {
    assert.equal(reportsFrameState(path).hasFrame, false, String(path));
  }
});

test("every report with an address is listed once", () => {
  const hrefs = REPORTS.flatMap((report) => (report.href ? [report.href] : []));
  assert.equal(new Set(hrefs).size, hrefs.length);
  assert.ok(hrefs.includes("/reports/delinquency") && hrefs.includes("/reports/accountability"));
});
