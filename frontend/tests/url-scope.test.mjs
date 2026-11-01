import assert from "node:assert/strict";
import { test } from "node:test";

import { condominiumMonthScope, condominiumScope, monthParam, monthScopeUrl, scopeUrl } from "../lib/navigation/url-scope.ts";

const CONDOMINIUM = "11111111-2222-3333-4444-555555555555";
const params = (query) => new URLSearchParams(query);

test("only a UUID is a condominium and only a first-of-month date is a month", () => {
  assert.deepEqual(condominiumScope(params(`condominium=${CONDOMINIUM}`)), { condominium: CONDOMINIUM });
  assert.deepEqual(condominiumScope(params("condominium=../../x")), { condominium: "" });
  assert.equal(monthParam("2026-10-01"), "2026-10-01");
  assert.equal(monthParam("2026-10-15"), null);
  assert.equal(monthParam("2026-13-01"), null);
  assert.equal(monthParam(null), null);
});

test("the month scope reads `reference_month` and the address brings it back", () => {
  const scope = condominiumMonthScope(params(`condominium=${CONDOMINIUM}&reference_month=2026-10-01`));
  assert.deepEqual(scope, { condominium: CONDOMINIUM, month: "2026-10-01" });
  assert.equal(monthScopeUrl("/billing/runs", scope), `/billing/runs?condominium=${CONDOMINIUM}&reference_month=2026-10-01`);
});

test("empty values stay out of the address", () => {
  assert.equal(scopeUrl("/billing/plans", { condominium: "" }), "/billing/plans");
  assert.equal(scopeUrl("/billing/plans", { condominium: CONDOMINIUM }), `/billing/plans?condominium=${CONDOMINIUM}`);
  assert.equal(monthScopeUrl("/billing/documents", { condominium: "", month: "" }), "/billing/documents");
});
