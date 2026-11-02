import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { PRIVATE_PATHS, PUBLIC_PAGES, PUBLIC_PATHS } from "../lib/site/public-pages.ts";
import { absoluteUrl, mailtoHref, whatsappHref } from "../lib/site/site.ts";

test("public pages are unique, absolute paths and never overlap the private areas", () => {
  assert.equal(new Set(PUBLIC_PATHS).size, PUBLIC_PATHS.length);
  for (const { path, priority } of PUBLIC_PAGES) {
    assert.ok(path.startsWith("/"));
    assert.ok(priority > 0 && priority <= 1);
    const clash = PRIVATE_PATHS.some((prefix) => path === prefix.replace(/\/$/, "") || path.startsWith(prefix));
    assert.equal(clash, false, `${path} is both public and private`);
  }
  assert.ok(PUBLIC_PATHS.includes("/"));
});

test("absoluteUrl joins the site address without a double slash and keeps the root bare", () => {
  assert.ok(absoluteUrl("/").endsWith("/"));
  assert.ok(absoluteUrl("/contato").endsWith("/contato"));
  assert.ok(!absoluteUrl("/contato").replace("://", "").includes("//"));
});

test("whatsappHref keeps only the digits and refuses a number without country and area code", () => {
  assert.match(whatsappHref("+55 (11) 99999-9999"), /^https:\/\/wa\.me\/5511999999999\?text=/);
  assert.equal(whatsappHref("11999999999"), null);
  assert.equal(whatsappHref(""), null);
  assert.equal(whatsappHref(null), null);
});

test("mailtoHref is null without an address and encodes the subject", () => {
  assert.equal(mailtoHref(undefined), null);
  assert.equal(mailtoHref("  "), null);
  assert.match(mailtoHref("oi@exemplo.com.br"), /^mailto:oi@exemplo\.com\.br\?subject=Demonstra%C3%A7%C3%A3o/);
});

test("proxy lets robots, sitemap and the share image through and takes its public paths from the shared list", () => {
  const proxy = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
  assert.match(proxy, /robots\.txt\|sitemap\.xml\|opengraph-image/);
  assert.match(proxy, /lib\/site\/public-pages/);
});
