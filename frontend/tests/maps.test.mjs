import assert from "node:assert/strict";
import { test } from "node:test";

import { addressQuery, isAddressMappable, mapsEmbedUrl, mapsKeylessEmbedUrl, mapsSearchUrl } from "../lib/condominiums/maps.ts";

const full = {
  zip_code: "80010-000",
  street: "Rua XV de Novembro",
  number: "10",
  district: "Centro",
  city: "Curitiba",
  state: "PR",
};

test("the query joins the filled parts and skips the empty ones", () => {
  assert.equal(addressQuery(full), "Rua XV de Novembro, 10, Centro, Curitiba - PR, 80010-000, Brasil");
  assert.equal(addressQuery({ zip_code: "80010000" }), "80010-000, Brasil");
  assert.equal(addressQuery({ street: "  Rua   A ", city: "Curitiba" }), "Rua A, Curitiba, Brasil");
  assert.equal(addressQuery({ zip_code: "8001", city: "Curitiba", state: "PR" }), "Curitiba - PR, Brasil");
});

test("the embed url carries the key and the encoded address", () => {
  const url = mapsEmbedUrl("KEY123", "Rua A, 10, Curitiba - PR, Brasil");

  assert.equal(
    url,
    "https://www.google.com/maps/embed/v1/place?key=KEY123&q=Rua%20A%2C%2010%2C%20Curitiba%20-%20PR%2C%20Brasil"
  );
});

test("the search url needs no key and encodes the address", () => {
  const url = mapsSearchUrl("Rua A, 10, Curitiba - PR, Brasil");

  assert.equal(
    url,
    "https://www.google.com/maps/search/?api=1&query=Rua%20A%2C%2010%2C%20Curitiba%20-%20PR%2C%20Brasil"
  );
  assert.ok(!url.includes("key="));
});

test("a character of the address cannot add or end a parameter of the urls", () => {
  const query = addressQuery({ street: "Rua A & B #5", city: "Curitiba" });

  for (const url of [mapsEmbedUrl("K", query), mapsKeylessEmbedUrl(query), mapsSearchUrl(query)]) {
    assert.equal(new URL(url).searchParams.get(url.includes("embed") ? "q" : "query"), query);
    assert.equal(new URL(url).hash, "");
  }
  assert.equal(new URL(mapsEmbedUrl("a&b=c", "x")).searchParams.get("key"), "a&b=c");
});

test("an address is mappable with a full cep or with street and city only", () => {
  assert.equal(isAddressMappable(full), true);
  assert.equal(isAddressMappable({ zip_code: "80010-000" }), true);
  assert.equal(isAddressMappable({ zip_code: "80010000" }), true);
  assert.equal(isAddressMappable({ street: "Rua A", city: "Curitiba" }), true);
  assert.equal(isAddressMappable({ zip_code: "8001" }), false);
  assert.equal(isAddressMappable({ street: "Rua A" }), false);
  assert.equal(isAddressMappable({ city: "Curitiba", state: "PR" }), false);
  assert.equal(isAddressMappable({ street: "  ", city: "Curitiba" }), false);
  assert.equal(isAddressMappable({}), false);
});

test("the keyless map is the Google embed page with the address as the only query", () => {
  const url = new URL(mapsKeylessEmbedUrl("Rua A, 10, Curitiba - PR, Brasil"));

  assert.equal(url.origin + url.pathname, "https://www.google.com/maps");
  assert.equal(url.searchParams.get("q"), "Rua A, 10, Curitiba - PR, Brasil");
  assert.equal(url.searchParams.get("output"), "embed");
  assert.equal(url.searchParams.has("key"), false);
});
