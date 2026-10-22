import assert from "node:assert/strict";
import test from "node:test";

import { boletoState, canReissueDocument, deliveryFailureLabel, deliveryStatusLabel } from "../lib/billing-documents.ts";

test("the boleto state follows the status and the registration", () => {
  assert.equal(boletoState({ status: "issued", hasRegistration: false }), "waiting");
  assert.equal(boletoState({ status: "registered", hasRegistration: true }), "active");
  assert.equal(boletoState({ status: "registered", hasRegistration: false }), "cancelled");
  assert.equal(boletoState({ status: "paid", hasRegistration: true }), "paid");
  assert.equal(boletoState({ status: "cancelled", hasRegistration: false }), "none");
});

test("only a registered document can be reissued", () => {
  assert.equal(canReissueDocument("registered"), true);
  for (const status of ["issued", "paid", "cancelled"]) assert.equal(canReissueDocument(status), false);
});

test("delivery labels are in Portuguese and unknown codes show as they are", () => {
  assert.equal(deliveryStatusLabel("delivered"), "Entregue");
  assert.equal(deliveryFailureLabel("payer_without_email"), "o pagador não tem e-mail cadastrado");
  assert.equal(deliveryFailureLabel("something_else"), "something_else");
  assert.equal(deliveryStatusLabel("weird"), "weird");
});
