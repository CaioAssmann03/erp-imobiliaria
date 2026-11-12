import assert from "node:assert/strict";
import { test } from "node:test";

import { backTargetOf, pageKeepingOrigin, withFrom, withParams } from "../lib/navigation/back-target.ts";

const C = "1b7ab73b-092f-4514-8532-573173c2bd73";
const U = "1a99554a-29a7-49fa-94f0-d231ff41b7dd";

test("the back goes to the screen it came from, one action before", () => {
  assert.deepEqual(backTargetOf(`/condominiums/${C}`), { href: `/condominiums/${C}`, label: "Condomínio" });
  assert.deepEqual(backTargetOf(`/condominiums/${C}/units/${U}`), { href: `/condominiums/${C}/units/${U}`, label: "Unidade" });
  assert.equal(backTargetOf(`/condominiums/${C}/persons`)?.label, "Pessoas do condomínio");
  assert.equal(backTargetOf(`/condominiums/${C}/units/${U}/persons`)?.label, "Pessoas da unidade");
  assert.deepEqual(backTargetOf(`/condominiums/blocks/${U}/units`), { href: `/condominiums/blocks/${U}/units`, label: "Unidades do bloco" });
  assert.equal(backTargetOf(`/condominiums/${C}/blocks`)?.label, "Blocos");
  assert.equal(backTargetOf(`/condominiums/${C}/cost-centers`)?.label, "Sub-contas");
});

test("anything that is not one of those screens is ignored", () => {
  for (const value of [null, "", "/", "/dashboard", "https://evil.example/x", `//evil.example/${C}`, `/condominiums/${C}/../admin`, `/condominiums/${C}/units/${U}/extra`, "/condominiums/not-a-uuid", `javascript:alert(1)`]) {
    assert.equal(backTargetOf(value), null, String(value));
  }
});

const B = "5db54ad5-19fe-4eda-91df-318dbb419cbb";

test("the origin carries the whole path taken, as a stack", () => {
  const blocks = `/condominiums/${C}/blocks`;
  const block = withFrom(`/condominiums/blocks/${B}`, blocks);
  const blockUnits = withFrom(`/condominiums/blocks/${B}/units`, block);
  const unit = withFrom(`/condominiums/${C}/units/${U}`, blockUnits);
  // Each level goes back one step and keeps what it carried, so going back again goes on back.
  const step1 = backTargetOf(new URLSearchParams(unit.split("?")[1]).get("from"));
  assert.equal(step1?.label, "Unidades do bloco");
  const step2 = backTargetOf(new URLSearchParams(step1.href.split("?")[1]).get("from"));
  assert.equal(step2?.label, "Bloco");
  const step3 = backTargetOf(new URLSearchParams(step2.href.split("?")[1]).get("from"));
  assert.deepEqual(step3, { href: blocks, label: "Blocos" });
});

test("a context param and a nested origin are kept, anything else is refused", () => {
  assert.equal(backTargetOf(`/condominiums/blocks/${B}?block=${B}`)?.href, `/condominiums/blocks/${B}?block=${B}`);
  for (const value of [`/condominiums/${C}?x=1`, `/condominiums/${C}?unit=nope`, `/condominiums/${C}?from=/dashboard`, `/condominiums/${C}#section`, `/condominiums/blocks/${B}/other`]) {
    assert.equal(backTargetOf(value), null, value);
  }
});

test("the page of a record keeps the origin when you come back to it from its sub-screen", () => {
  const page = `/condominiums/blocks/${B}`;
  const origin = withFrom(page, `/condominiums/${C}/blocks`);
  assert.equal(pageKeepingOrigin(page, origin), origin); // the sub-screen came from the page itself
  assert.equal(pageKeepingOrigin(page, `/condominiums/${C}/blocks`), withFrom(page, `/condominiums/${C}/blocks`));
  assert.equal(pageKeepingOrigin(page, null), page);
});

test("withParams adds only the filled params and keeps the rest of the address", () => {
  assert.equal(withParams("/a/b", { block: B, from: null, unit: undefined }), `/a/b?block=${B}`);
  assert.equal(withParams(`/a/b?x=1#s`, { block: B }), `/a/b?x=1&block=${B}#s`);
  assert.equal(withParams("/a/b", {}), "/a/b");
});
