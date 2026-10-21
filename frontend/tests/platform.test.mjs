import assert from "node:assert/strict";
import { test } from "node:test";

import { isApplePlatform, matchesSearchShortcut, searchShortcutLabel } from "../lib/platform.ts";

const key = (overrides = {}) => ({ key: "k", code: "KeyK", metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...overrides });

test("Apple devices are told apart from Windows and Linux", () => {
  for (const platform of ["MacIntel", "macOS", "iPhone", "iPad", "iPod"]) assert.equal(isApplePlatform(platform), true, platform);
  for (const platform of ["Win32", "Windows", "Linux x86_64", "Linux armv8l", "", "Android"]) assert.equal(isApplePlatform(platform), false, platform);
});

test("the label shows the key of the platform", () => {
  assert.equal(searchShortcutLabel(true), "⌘K");
  assert.equal(searchShortcutLabel(false), "Ctrl K");
});

test("Ctrl+K opens the search on Windows and Linux", () => {
  assert.equal(matchesSearchShortcut(key({ ctrlKey: true }), false), true);
  assert.equal(matchesSearchShortcut(key({ ctrlKey: true, key: "K" }), false), true);
});

test("the Windows key does not count, it belongs to the system", () => {
  assert.equal(matchesSearchShortcut(key({ metaKey: true }), false), false);
});

test("Command+K opens the search on Apple devices and Ctrl+K does not", () => {
  assert.equal(matchesSearchShortcut(key({ metaKey: true }), true), true);
  assert.equal(matchesSearchShortcut(key({ ctrlKey: true }), true), false);
});

test("the physical K key works on another keyboard layout", () => {
  assert.equal(matchesSearchShortcut(key({ ctrlKey: true, key: "л", code: "KeyK" }), false), true);
});

test("other combinations and keys are left alone", () => {
  assert.equal(matchesSearchShortcut(key(), false), false);
  assert.equal(matchesSearchShortcut(key({ ctrlKey: true, key: "j", code: "KeyJ" }), false), false);
  assert.equal(matchesSearchShortcut(key({ ctrlKey: true, shiftKey: true }), false), false);
  assert.equal(matchesSearchShortcut(key({ ctrlKey: true, altKey: true }), false), false);
});
