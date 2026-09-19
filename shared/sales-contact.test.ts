import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSalesMailto, SALES_EMAIL } from "./salesContact";

describe("Sales contact links", () => {
  it("builds an encoded mailto with the selected tier and billing period", () => {
    const mailto = buildSalesMailto({
      profile: "agency",
      plan: "pequeña & growth",
      billing: "yearly",
      language: "es",
    });

    assert.ok(mailto.startsWith(`mailto:${SALES_EMAIL}?`));
    assert.match(mailto, /subject=/);
    assert.match(mailto, /peque%C3%B1a%20%26%20growth/);
    assert.match(mailto, /yearly/);
  });
});
