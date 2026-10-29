import assert from "node:assert/strict";
import test from "node:test";

import { extraErrorPath, extraToPayload, feeLine, newLine } from "../lib/extra-billing-payload.ts";

const base = {
  condominium: "c1",
  competence_month: "2026-10-01",
  due_date: "2026-11-10",
  units: ["u1", "u2"],
};

test("a new line is collective and empty", () => {
  assert.deepEqual(newLine(), {
    event: "",
    credits_company: false,
    description: "",
    allocation: "collective",
    apportionment_criterion: "",
    cost_center: "",
    amount: "",
  });
});

test("the fee line is individual, from the company event and has no sub-conta", () => {
  assert.deepEqual(feeLine("e5", "3.90"), {
    event: "e5",
    credits_company: true,
    description: "",
    allocation: "individual",
    apportionment_criterion: "",
    cost_center: "",
    amount: "3.90",
  });
});

test("the payload sends the criterion only for a fraction and no sub-conta for the company's line", () => {
  const payload = extraToPayload({
    ...base,
    lines: [
      { ...newLine(), description: "Portão", cost_center: "k1", amount: "300.00", apportionment_criterion: "stale" },
      { ...newLine(), allocation: "fraction", apportionment_criterion: "ac1", cost_center: "k1", amount: "90.00" },
      feeLine("e5", "3.90"),
    ],
  });
  assert.deepEqual(payload, {
    ...base,
    lines: [
      { event: null, description: "Portão", allocation: "collective", apportionment_criterion: null, cost_center: "k1", amount: "300.00" },
      { event: null, description: "", allocation: "fraction", apportionment_criterion: "ac1", cost_center: "k1", amount: "90.00" },
      { event: "e5", description: "", allocation: "individual", apportionment_criterion: null, cost_center: null, amount: "3.90" },
    ],
  });
});

test("server errors keep the line path and gather the units", () => {
  assert.equal(extraErrorPath("lines.1.cost_center"), "lines.1.cost_center");
  assert.equal(extraErrorPath("units"), "units");
  assert.equal(extraErrorPath("units.0"), "units");
  assert.equal(extraErrorPath("due_date"), "due_date");
});
