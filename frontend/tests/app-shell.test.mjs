import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

import { APPEARANCE_INIT_SCRIPT, DEFAULT_APPEARANCE } from "../lib/appearance.ts";
import { APP_MODULES } from "../lib/module-menu.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const DASHBOARD = join(ROOT, "app", "(dashboard)");

/** Run the inline <head> script against a fake document, like the browser does before the first paint. */
function runInitScript(cookie) {
  const dataset = {};
  const style = { props: {}, setProperty(name, value) { this.props[name] = value; } };
  const fakeDocument = { cookie, documentElement: { dataset, style } };
  new Function("document", APPEARANCE_INIT_SCRIPT)(fakeDocument);
  dataset.__style = style.props;
  return dataset;
}

function sourceFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx|ts)$/.test(name) ? [path] : [];
  });
}

/** Is there a page that serves this URL? Dynamic segments (`[id]`) match any value. */
function hasPage(href) {
  const segments = href.split("/").filter(Boolean);
  const walk = (directory, rest) => {
    if (rest.length === 0 && existsSync(join(directory, "page.tsx"))) return true;
    return readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .some((entry) => {
        const isGroup = /^\(.*\)$/.test(entry.name);
        const isDynamic = /^\[.*\]$/.test(entry.name);
        if (isGroup) return walk(join(directory, entry.name), rest);
        if (rest.length > 0 && (entry.name === rest[0] || isDynamic)) return walk(join(directory, entry.name), rest.slice(1));
        return false;
      });
  };
  return walk(join(ROOT, "app"), segments);
}

test("every link of the module menu opens an existing page", () => {
  const hrefs = APP_MODULES.flatMap((appModule) => [
    ...(appModule.href ? [appModule.href] : []),
    ...appModule.groups.flatMap((group) => group.items.flatMap((item) => (item.href ? [item.href] : []))),
  ]);
  assert.ok(hrefs.length >= 10);
  for (const href of hrefs) assert.ok(hasPage(href), `no page for ${href}`);
});

test("no module menu label is repeated inside one module", () => {
  for (const appModule of APP_MODULES) {
    const labels = appModule.groups.flatMap((group) => group.items.map((item) => item.label));
    assert.equal(new Set(labels).size, labels.length, appModule.key);
  }
});

test("the old list routes still exist, as redirects", () => {
  for (const route of ["condominiums/blocks", "condominiums/cost-centers", "condominiums/units/new"]) {
    const page = readFileSync(join(DASHBOARD, ...route.split("/"), "page.tsx"), "utf8");
    assert.match(page, /redirect\(/, route);
  }
});

test("the blocks, the units, the cost centers and the people of a condominium are screens of their own", () => {
  for (const route of ["condominiums/[id]/blocks", "condominiums/[id]/units", "condominiums/[id]/cost-centers", "condominiums/[id]/persons"]) {
    const page = readFileSync(join(DASHBOARD, ...route.split("/"), "page.tsx"), "utf8");
    assert.doesNotMatch(page, /redirect\(/, route);
  }
});

test("the right-hand menu is drawn by the layout frames, never by the pages, so it stays mounted between screens", () => {
  const frames = {
    "condominiums/_components/CondominiumsFrame.tsx": /CondominiumSideMenu/,
    "condominiums/_components/BlocksFrame.tsx": /BlockSideMenu/,
    "condominiums/_components/CostCentersFrame.tsx": /CostCenterSideMenu/,
    "condominiums/persons/_components/PersonsFrame.tsx": /SectionIndex/,
    "condominiums/[id]/units/_components/UnitsFrame.tsx": /UnitSideMenu/,
    "condominiums/events/_components/BillingEventsFrame.tsx": /SectionIndex/,
  };
  for (const [file, menu] of Object.entries(frames)) {
    assert.match(readFileSync(join(DASHBOARD, ...file.split("/")), "utf8"), menu, file);
  }
  const pages = sourceFiles(join(DASHBOARD, "condominiums")).filter((file) => /[\\/]page\.tsx$/.test(file));
  assert.ok(pages.length > 10);
  for (const page of pages) {
    assert.doesNotMatch(readFileSync(page, "utf8"), /\baside=/, relative(ROOT, page));
  }
});

test("the shell and the registry use design tokens, never a hard-coded color", () => {
  const files = [
    // The settings folder is exempt (it may paint literal colors, e.g. the accent dots).
    ...sourceFiles(join(DASHBOARD, "_components", "shell")).filter((file) => !file.includes(`${"settings"}/`)),
    ...sourceFiles(join(DASHBOARD, "condominiums", "_components")).filter((file) =>
      /(CondominiumsList|CondominiumsFrame|CondominiumHeader|CondominiumSideMenu|RegistrySection|SectionIndex|CondominiumDeleteButton)\.tsx$/.test(file)
    ),
  ];
  assert.ok(files.length > 10);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /#[0-9a-fA-F]{3,8}\b/, relative(ROOT, file));
    assert.doesNotMatch(source, /\b(?:bg|text|border|ring)-\[#/, relative(ROOT, file));
  }
});

test("the head script applies the saved mode, accent and font, and falls back to the defaults", () => {
  const saved = runInitScript("ui_mode=light; ui_accent=custom; ui_accent_custom=%232f6bff; ui_font=dm-sans");
  assert.equal(saved.mode, "light");
  assert.equal(saved.accent, "custom");

  const tampered = runInitScript("ui_mode=neon; ui_accent=<script>");
  assert.equal(tampered.mode, DEFAULT_APPEARANCE.mode);
  assert.equal(tampered.accent, DEFAULT_APPEARANCE.accent);
  assert.equal(tampered.font, DEFAULT_APPEARANCE.font);
});

test("the head script applies a custom accent only when the color is a valid #rrggbb", () => {
  const custom = runInitScript("ui_accent=custom; ui_accent_custom=%2300aa55");
  assert.equal(custom.accent, "custom");
  assert.equal(custom.accentCustom, "#00aa55");
  assert.equal(custom.__style["--accent-custom"], "#00aa55");
  assert.equal(custom.__style["--accent-foreground"], "#ffffff");
  assert.equal(runInitScript("ui_accent=custom; ui_accent_custom=%23ffe066").__style["--accent-foreground"], "#1c1b19");

  const invalid = runInitScript("ui_accent=custom; ui_accent_custom=red");
  assert.equal(invalid.accent, DEFAULT_APPEARANCE.accent);
  assert.equal(invalid.accentCustom, "");
  assert.deepEqual(invalid.__style, {});
});

test("the head script also applies the text size and the reduced motion, and ignores invalid values", () => {
  const saved = runInitScript("ui_text=large; ui_motion=reduced");
  assert.equal(saved.text, "large");
  assert.equal(saved.motion, "reduced");

  const tampered = runInitScript("ui_text=huge; ui_motion=<b>");
  assert.equal(tampered.text, DEFAULT_APPEARANCE.text);
  assert.equal(tampered.motion, DEFAULT_APPEARANCE.motion);
});

// The rail expands and collapses (click on the logo), but the choice lives only in the browser (`localStorage`): the server renders the
// same HTML for everyone, so there is no <html> attribute, no cookie and no CSS variant for it.
test("the rail state is not on <html>: no attribute, cookie or variant", () => {
  assert.equal(Object.hasOwn(runInitScript(""), "sidebar"), false);
  const css = readFileSync(join(ROOT, "app", "globals.css"), "utf8");
  assert.doesNotMatch(css, /sidebar-closed/);
});
