import assert from "node:assert/strict";
import { test } from "node:test";

import { retryRead } from "../lib/api/retry-read.ts";

function flaky(failures) {
  const state = { calls: 0 };
  const send = async () => {
    state.calls += 1;
    if (state.calls <= failures) throw new TypeError("fetch failed");
    return new Response("ok");
  };
  return { state, send };
}

test("a read that lost its connection is sent once more", async () => {
  const { state, send } = flaky(1);

  const response = await retryRead("GET", send);

  assert.equal(await response.text(), "ok");
  assert.equal(state.calls, 2);
});

test("a read that fails twice reports the failure", async () => {
  const { state, send } = flaky(2);

  await assert.rejects(retryRead("get", send), TypeError);
  assert.equal(state.calls, 2);
});

test("a write is never repeated", async () => {
  for (const method of ["POST", "PATCH", "PUT", "DELETE"]) {
    const { state, send } = flaky(1);

    await assert.rejects(retryRead(method, send), TypeError);
    assert.equal(state.calls, 1, `${method} must be sent once`);
  }
});

test("a healthy request is sent once", async () => {
  const { state, send } = flaky(0);

  await retryRead("GET", send);

  assert.equal(state.calls, 1);
});
