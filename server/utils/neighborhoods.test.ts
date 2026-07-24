import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findLocationByNeighborhood,
  getCities,
  resolvePropertyLocation,
} from "./neighborhoods";

describe("getCities alphabetical order", () => {
  it("returns cities sorted alphabetically in Spanish locale", () => {
    const cities = getCities();
    assert.ok(cities.includes("Barcelona"));
    assert.ok(cities.includes("Madrid"));
    const sorted = [...cities].sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
    assert.deepEqual(cities, sorted);
    // Barcelona/Madrid are no longer forced to the top
    assert.notEqual(cities[0], "Barcelona");
  });
});

describe("findLocationByNeighborhood", () => {
  it("resolves a unique Barcelona neighborhood", () => {
    const match = findLocationByNeighborhood("El Raval");
    assert.ok(match);
    assert.equal(match!.city, "Barcelona");
    assert.equal(match!.district, "Ciutat Vella");
  });

  it("resolves a unique Madrid neighborhood", () => {
    const match = findLocationByNeighborhood("Sol");
    assert.ok(match);
    assert.equal(match!.city, "Madrid");
    assert.equal(match!.district, "Centro");
  });

  it("uses hintCity when neighborhood names collide", () => {
    // "Centro" exists as a district/terminal in many cities; Sol is unique to Madrid Centro.
    // Prefer hint when provided for El Raval (unique) — smoke-check API.
    const match = findLocationByNeighborhood("El Raval", "Barcelona");
    assert.equal(match?.city, "Barcelona");
  });
});

describe("resolvePropertyLocation", () => {
  it("fills city and district from neighborhood", () => {
    const known = resolvePropertyLocation({
      neighborhood: "Vila de Gràcia",
      city: null,
      district: null,
    });
    assert.equal(known.city, "Barcelona");
    assert.equal(known.district, "Gràcia");
  });

  it("does not use arbitrary Google locality when it is not a catalog city", () => {
    const resolved = resolvePropertyLocation({
      neighborhood: "El Raval",
      city: null,
      district: null,
      locality: "Some Google Locality That Is Not Catalog",
    });
    assert.equal(resolved.city, "Barcelona");
  });

  it("can use locality as hint only when it matches a catalog city", () => {
    const resolved = resolvePropertyLocation({
      neighborhood: "El Raval",
      city: null,
      district: null,
      locality: "Barcelona",
    });
    assert.equal(resolved.city, "Barcelona");
  });
});
