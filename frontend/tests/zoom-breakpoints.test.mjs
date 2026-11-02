import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

import zoomBreakpoints from "../lib/postcss/zoom-breakpoints.mjs";

const require = createRequire(import.meta.url);
const postcss = createRequire(require.resolve("@tailwindcss/postcss"))("postcss");

const run = async (css) => (await postcss([zoomBreakpoints]).process(css, { from: undefined })).css;

test("a width media query becomes one copy per text size, scaled and scoped without extra specificity", async () => {
  const out = await run("@media (width >= 64rem) { .lg\\:flex { display: flex; } }");
  assert.match(out, /@media \(width >= 64rem\)\s*\{\s*:where\(html:not\(\[data-text="large"\]\):not\(\[data-text="xlarge"\]\)\) \.lg\\:flex/);
  assert.match(out, /@media \(width >= 72rem\)\s*\{\s*:where\(html\[data-text="large"\]\) \.lg\\:flex/);
  assert.match(out, /@media \(width >= 80rem\)\s*\{\s*:where\(html\[data-text="xlarge"\]\) \.lg\\:flex/);
});

test("max-width, the old min-width syntax and nested queries scale too", async () => {
  const out = await run("@media (width < 48rem) { .a { color: red; } } @media (min-width: 40rem) { @media (width < 64rem) { .b { color: blue; } } }");
  assert.match(out, /@media \(width < 60rem\)/);
  assert.match(out, /@media \(min-width: 50rem\)\s*\{\s*@media \(width < 80rem\)/);
});

test("queries that are not about width in rem, and rules on html/:root, are left alone", async () => {
  const css = "@media (prefers-reduced-motion: reduce) { .a { color: red; } } @media (width >= 64rem) { html[data-x] .b { color: red; } } @media (max-width: 1023px) { :root .c { color: red; } }";
  assert.equal(await run(css), css);
});
