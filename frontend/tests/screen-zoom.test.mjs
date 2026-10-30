import assert from "node:assert/strict";
import { test } from "node:test";

import { zoomTransform } from "../lib/theme/screen-zoom.ts";

test("without a region, or with no magnification, the whole screen shows", () => {
  assert.deepEqual(zoomTransform(null), { scale: 1, x: 0, y: 0 });
  assert.deepEqual(zoomTransform({ x: 30, y: 30, zoom: 1 }), { scale: 1, x: 0, y: 0 });
});

test("the center of the region lands on the center of the frame", () => {
  const { scale, x, y } = zoomTransform({ x: 50, y: 50, zoom: 2 });
  assert.equal(scale, 2);
  assert.equal(50 * scale + x, 50);
  assert.equal(50 * scale + y, 50);
});

test("a region near an edge never shows beyond the image", () => {
  const corner = zoomTransform({ x: 5, y: 5, zoom: 2.3 });
  assert.deepEqual(corner, { scale: 2.3, x: 0, y: 0 });
  const far = zoomTransform({ x: 98, y: 98, zoom: 2 });
  assert.deepEqual(far, { scale: 2, x: -100, y: -100 });
});
