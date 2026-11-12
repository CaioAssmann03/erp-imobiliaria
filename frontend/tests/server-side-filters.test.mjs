import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

/** Spec 064: the API filters, searches and paginates; no component does it with what a list returned. */
const ROOT = join(import.meta.dirname, "..");
const FOLDERS = ["app", "components", "hooks"];

/** The dropdown that narrows the few options of a closed select as you type: it filters a field's options, not the records of a list (spec 064, decision 2). */
const DROPDOWNS = new Set(["components/filters/ScopeSelect.tsx", "components/filters/FilterMenu.tsx"]);

function sourceFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx|ts)$/.test(name) ? [path] : [];
  });
}

/** What a client-side filter of API data looks like. Each pattern is a thing a screen did before the API had the param. */
const FORBIDDEN = [
  { pattern: /\.results(?:\s*\?\?\s*\[\])?\)?\s*\.filter\(/, why: "filters the `results` of a list" },
  { pattern: /\bmatches\.slice\(/, why: "pages a client-side search result" },
  { pattern: /\.filter\([^)]*\.includes\((?:term|query|search)\)/, why: "searches a list by typed text" },
  { pattern: /search\.trim\(\)\.toLowerCase\(\)/, why: "lowercases a typed search to match it in the browser" },
];

test("no list component filters, searches or pages the API results on the client", () => {
  const offenders = [];
  for (const folder of FOLDERS) {
    for (const file of sourceFiles(join(ROOT, folder))) {
      if (DROPDOWNS.has(relative(ROOT, file))) continue;
      const text = readFileSync(file, "utf8");
      for (const { pattern, why } of FORBIDDEN) {
        if (pattern.test(text)) offenders.push(`${relative(ROOT, file)}: ${why}`);
      }
    }
  }
  assert.deepEqual(offenders, [], "send the criterion to the API (add the param to the backend if it is missing) instead");
});
