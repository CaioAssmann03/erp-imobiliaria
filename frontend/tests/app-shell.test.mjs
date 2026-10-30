import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

import { APPEARANCE_INIT_SCRIPT, DEFAULT_APPEARANCE } from "../lib/theme/appearance.ts";
import { APP_MODULES } from "../lib/navigation/module-menu.ts";

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
  for (const route of ["condominiums/(condominium)/[id]/blocks", "condominiums/(condominium)/[id]/units", "condominiums/(condominium)/[id]/cost-centers", "condominiums/(condominium)/[id]/persons"]) {
    const page = readFileSync(join(DASHBOARD, ...route.split("/"), "page.tsx"), "utf8");
    assert.doesNotMatch(page, /redirect\(/, route);
  }
});

test("the whole finance module is in the 3 columns: no sub-header with tabs is left", () => {
  assert.equal(existsSync(join(DASHBOARD, "finance", "layout.tsx")), false);
  for (const route of ["accounts-payable", "statement", "entries", "company-account", "cost-center-catalog"]) {
    const layout = readFileSync(join(DASHBOARD, "finance", route, "layout.tsx"), "utf8");
    assert.match(layout, /Frame/, route);
  }
});

test("the billing launches (Inclusão de valores) are in the 3 columns, with the frame as the layout", () => {
  const layout = readFileSync(join(DASHBOARD, "billing", "entries", "layout.tsx"), "utf8");
  assert.match(layout, /BillingEntriesFrame/);
  for (const route of ["page.tsx", join("new", "page.tsx"), join("[id]", "page.tsx")]) {
    assert.equal(existsSync(join(DASHBOARD, "billing", "entries", route)), true, route);
  }
});

test("the right-hand menu is drawn by the layout frames, never by the pages, so it stays mounted between screens", () => {
  const frames = {
    "condominiums/_components/condominium/CondominiumsFrame.tsx": /CondominiumSideMenu/,
    "condominiums/_components/blocks/BlocksFrame.tsx": /BlockSideMenu/,
    "condominiums/_components/cost-centers/CostCentersFrame.tsx": /CostCenterSideMenu/,
    "condominiums/persons/_components/PersonsFrame.tsx": /SectionIndex/,
    "condominiums/(condominium)/[id]/units/_components/UnitsFrame.tsx": /UnitSideMenu/,
    "condominiums/events/_components/BillingEventsFrame.tsx": /SectionIndex/,
    "finance/accounts-payable/_components/AccountsPayableFrame.tsx": /AccountPayableSideMenu/,
    "finance/statement/_components/StatementFrame.tsx": /StatementSideMenu/,
    "finance/entries/_components/EntriesFrame.tsx": /SectionIndex/,
    "finance/company-account/_components/CompanyAccountFrame.tsx": /SectionIndex/,
    "finance/cost-center-catalog/_components/CatalogFrame.tsx": /SectionIndex/,
    "billing/entries/_components/BillingEntriesFrame.tsx": /SectionIndex/,
    "billing/extra/_components/ExtraBillingFrame.tsx": /SectionIndex/,
    "billing/plans/_components/BillingPlansFrame.tsx": /SectionIndex/,
    "billing/documents/_components/list/BillingDocumentsFrame.tsx": /SectionIndex/,
    "billing/runs/_components/BillingRunsFrame.tsx": /SectionIndex/,
  };
  for (const [file, menu] of Object.entries(frames)) {
    assert.match(readFileSync(join(DASHBOARD, ...file.split("/")), "utf8"), menu, file);
  }
  const pages = [
    ...sourceFiles(join(DASHBOARD, "condominiums")),
    ...sourceFiles(join(DASHBOARD, "finance", "accounts-payable")),
    ...sourceFiles(join(DASHBOARD, "finance", "statement")),
    ...sourceFiles(join(DASHBOARD, "finance", "entries")),
    ...sourceFiles(join(DASHBOARD, "finance", "company-account")),
    ...sourceFiles(join(DASHBOARD, "finance", "cost-center-catalog")),
    ...sourceFiles(join(DASHBOARD, "billing", "entries")),
    ...sourceFiles(join(DASHBOARD, "billing", "extra")),
    ...sourceFiles(join(DASHBOARD, "billing", "plans")),
    ...sourceFiles(join(DASHBOARD, "billing", "documents")),
    ...sourceFiles(join(DASHBOARD, "billing", "runs")),
  ].filter((file) => /[\\/]page\.tsx$/.test(file));
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
      /(CondominiumsList|CondominiumsFrame|CondominiumHeader|CondominiumSideMenu|SectionIndex|CondominiumDeleteButton)\.tsx$/.test(file)
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

test("the extra boleto is in the 3 columns, with the frame as the layout", () => {
  const layout = readFileSync(join(DASHBOARD, "billing", "extra", "layout.tsx"), "utf8");
  assert.match(layout, /ExtraBillingFrame/);
  for (const route of ["page.tsx", join("new", "page.tsx"), join("[id]", "page.tsx")]) {
    assert.equal(existsSync(join(DASHBOARD, "billing", "extra", route)), true, route);
  }
});

test("the billing plans are in the 3 columns, with the frame as the layout", () => {
  const layout = readFileSync(join(DASHBOARD, "billing", "plans", "layout.tsx"), "utf8");
  assert.match(layout, /BillingPlansFrame/);
  for (const route of ["page.tsx", join("new", "page.tsx"), join("[id]", "page.tsx")]) {
    assert.equal(existsSync(join(DASHBOARD, "billing", "plans", route)), true, route);
  }
});

test("the billing documents are in the 3 columns, with the frame as the layout", () => {
  const layout = readFileSync(join(DASHBOARD, "billing", "documents", "layout.tsx"), "utf8");
  assert.match(layout, /BillingDocumentsFrame/);
  for (const route of ["page.tsx", join("[id]", "page.tsx")]) {
    assert.equal(existsSync(join(DASHBOARD, "billing", "documents", route)), true, route);
  }
});

test("the billing runs are in the 3 columns, with the frame as the layout", () => {
  const layout = readFileSync(join(DASHBOARD, "billing", "runs", "layout.tsx"), "utf8");
  assert.match(layout, /BillingRunsFrame/);
  for (const route of ["page.tsx", join("[id]", "page.tsx")]) {
    assert.equal(existsSync(join(DASHBOARD, "billing", "runs", route)), true, route);
  }
});
