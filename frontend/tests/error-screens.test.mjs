import assert from "node:assert/strict";
import { test } from "node:test";

import { AxiosError } from "axios";

import { ERROR_SCREENS, errorScreenCodeOf, resolveErrorScreen } from "../lib/error-screens.ts";

test("every cataloged code is an HTTP error, unique, and offers a way out", () => {
  const codes = ERROR_SCREENS.map((screen) => screen.code);
  assert.equal(new Set(codes).size, codes.length);
  for (const screen of ERROR_SCREENS) {
    assert.ok(screen.code >= 400 && screen.code <= 599, String(screen.code));
    assert.ok(screen.actions.length > 0, String(screen.code));
  }
});

test("a retry wait only exists on screens that offer retry", () => {
  for (const screen of ERROR_SCREENS.filter((item) => item.retryAfter)) {
    assert.ok(screen.actions.includes("retry"), String(screen.code));
  }
});

test("a code outside the catalog falls back to its range, and non-errors have no screen", () => {
  assert.equal(resolveErrorScreen(404)?.title, "Página não encontrada");
  assert.equal(resolveErrorScreen(418)?.actions[0], "back");
  assert.equal(resolveErrorScreen(599)?.actions[0], "retry");
  assert.equal(resolveErrorScreen(200), undefined);
  assert.equal(resolveErrorScreen(Number.NaN), undefined);
});

const failure = (status) => new AxiosError("falha", "ERR_BAD_RESPONSE", undefined, undefined, { status, data: {}, statusText: "", headers: {}, config: {} });

test("the screen of a failed load follows the response status", () => {
  assert.equal(errorScreenCodeOf(failure(403)), 403);
  assert.equal(errorScreenCodeOf(failure(503)), 503);
  assert.equal(errorScreenCodeOf(failure(599)), 599);
  assert.equal(errorScreenCodeOf(new AxiosError("sem resposta", "ERR_NETWORK")), 502);
  assert.equal(errorScreenCodeOf(new AxiosError("tempo", "ECONNABORTED")), 408);
  assert.equal(errorScreenCodeOf(new Error("render")), 500);
});
