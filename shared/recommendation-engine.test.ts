import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ClientPropertyPreferences } from "./schema";
import {
  budgetOutsideFraction,
  budgetScoreFraction,
  effectiveWeights,
  labelForScore,
  rankProperties,
  scoreProperty,
  type ScorableProperty,
} from "./recommendation-engine";

function baseProperty(overrides: Partial<ScorableProperty> = {}): ScorableProperty {
  return {
    uuid: "prop-1",
    operationType: "Venta",
    type: "Vivienda",
    housingType: "Pisos",
    city: "Barcelona",
    neighborhood: "Eixample",
    price: 350_000,
    bedrooms: 3,
    bathrooms: 2,
    superficie: 90,
    propertyCondition: "Buen estado",
    availability: "Inmediatamente",
    floor: "Planta intermedia",
    features: ["ascensor", "accesible", "garaje", "terraza"],
    ...overrides,
  };
}

function basePrefs(overrides: Partial<ClientPropertyPreferences> = {}): ClientPropertyPreferences {
  return {
    operationType: "Venta",
    propertyType: "Vivienda",
    city: "Barcelona",
    minPrice: 300_000,
    maxPrice: 400_000,
    neighborhood: "Eixample",
    bedrooms: 3,
    bathrooms: 2,
    minArea: 80,
    maxArea: 120,
    essentialFeatures: ["ascensor", "accesible"],
    preferredFeatures: ["garaje", "terraza"],
    ...overrides,
  };
}

describe("budgetOutsideFraction / budgetScoreFraction", () => {
  it("returns 0 when inside range", () => {
    assert.equal(budgetOutsideFraction(350_000, 300_000, 400_000), 0);
    assert.equal(budgetScoreFraction(0), 1);
  });

  it("scores 0–5% outside at 0.75", () => {
    // 3% above max: 412_000
    const outside = budgetOutsideFraction(412_000, 300_000, 400_000);
    assert.ok(outside > 0 && outside <= 0.05);
    assert.equal(budgetScoreFraction(outside), 0.75);
  });

  it("scores 5–10% outside at 0.4", () => {
    const outside = budgetOutsideFraction(432_000, 300_000, 400_000);
    assert.ok(outside > 0.05 && outside <= 0.1);
    assert.equal(budgetScoreFraction(outside), 0.4);
  });

  it("returns >10% outside as ineligible band (score fraction 0)", () => {
    const outside = budgetOutsideFraction(450_000, 300_000, 400_000);
    assert.ok(outside > 0.1);
    assert.equal(budgetScoreFraction(outside), 0);
  });
});

describe("eligibility", () => {
  it("excludes when an essential feature is missing", () => {
    const result = scoreProperty(
      basePrefs(),
      baseProperty({ features: ["ascensor", "garaje"] }),
    );
    assert.equal(result.eligible, false);
    assert.ok(result.exclusionReasons?.includes("essentialFeatures"));
    assert.equal(result.score, 0);
  });

  it("excludes when price is more than 10% outside budget", () => {
    const result = scoreProperty(basePrefs(), baseProperty({ price: 500_000 }));
    assert.equal(result.eligible, false);
    assert.ok(result.exclusionReasons?.includes("price"));
  });

  it("excludes on city mismatch", () => {
    const result = scoreProperty(basePrefs(), baseProperty({ city: "Madrid" }));
    assert.equal(result.eligible, false);
    assert.ok(result.exclusionReasons?.includes("city"));
  });

  it("excludes when property city is missing and client city is set", () => {
    const result = scoreProperty(basePrefs(), baseProperty({ city: null }));
    assert.equal(result.eligible, false);
    assert.ok(result.exclusionReasons?.includes("city"));
  });

  it("matches when catalog city equals client city preference", () => {
    const result = scoreProperty(
      basePrefs({ city: "Madrid" }),
      baseProperty({ city: "Madrid", neighborhood: "Sol" }),
    );
    assert.equal(result.eligible, true);
  });

  it("skips unspecified hard filters", () => {
    const result = scoreProperty(
      {
        essentialFeatures: ["ascensor"],
      },
      baseProperty({ city: "Madrid", operationType: "Alquiler", features: ["ascensor"] }),
    );
    assert.equal(result.eligible, true);
  });
});

describe("adaptive preferred scoring", () => {
  it("gives full preferred weight to a single selected feature", () => {
    const prefs = basePrefs({
      preferredFeatures: ["garaje"],
      // keep other categories so preferred stays at 20%
    });
    const withParking = scoreProperty(prefs, baseProperty({ features: ["ascensor", "accesible", "garaje"] }));
    const without = scoreProperty(prefs, baseProperty({ features: ["ascensor", "accesible"] }));

    const preferredWith = withParking.breakdown.find((b) => b.category === "preferred");
    const preferredWithout = without.breakdown.find((b) => b.category === "preferred");

    assert.ok(preferredWith);
    assert.ok(preferredWithout);
    assert.equal(preferredWith!.earned, Math.round(preferredWith!.weight * 100));
    assert.equal(preferredWithout!.earned, 0);
  });

  it("splits preferred weight across selected features", () => {
    const prefs = basePrefs({
      preferredFeatures: ["garaje", "terraza", "jardin", "aire-acondicionado"],
    });
    const result = scoreProperty(
      prefs,
      baseProperty({
        features: ["ascensor", "accesible", "garaje", "jardin", "aire-acondicionado"],
      }),
    );
    const preferred = result.breakdown.find((b) => b.category === "preferred");
    assert.ok(preferred);
    // 3 of 4 → 75% of preferred weight
    assert.equal(preferred!.earned, Math.round(preferred!.weight * 0.75 * 100));
    assert.ok(preferred!.details[0].includes("3_of_4"));
  });
});

describe("weight redistribution", () => {
  it("redistributes empty preferred category to remaining categories", () => {
    const withPreferred = effectiveWeights(basePrefs({ preferredFeatures: ["garaje"] }));
    const withoutPreferred = effectiveWeights(basePrefs({ preferredFeatures: [] }));

    assert.ok(withPreferred.preferred);
    assert.equal(withoutPreferred.preferred, undefined);

    const withSum = Object.values(withPreferred).reduce((a, b) => a + (b ?? 0), 0);
    const withoutSum = Object.values(withoutPreferred).reduce((a, b) => a + (b ?? 0), 0);
    assert.ok(Math.abs(withSum - 1) < 1e-9);
    assert.ok(Math.abs(withoutSum - 1) < 1e-9);

    // Budget share grows when preferred is dropped
    assert.ok((withoutPreferred.budget ?? 0) > (withPreferred.budget ?? 0));
  });

  it("ignores unspecified core fields so they do not dilute the score", () => {
    const onlyBeds = basePrefs({
      bathrooms: null,
      minArea: null,
      maxArea: null,
      preferredFeatures: [],
      propertyCondition: null,
      availability: null,
      floor: null,
      housingType: null,
    });
    const result = scoreProperty(onlyBeds, baseProperty({ bedrooms: 3 }));
    const core = result.breakdown.find((b) => b.category === "core");
    assert.ok(core);
    // Only bedrooms specified → full core weight when met
    assert.equal(core!.earned, Math.round(core!.weight * 100));
    assert.deepEqual(core!.details, ["bedrooms_met"]);
  });
});

describe("neighborhood array match", () => {
  it("matches when property neighborhood is in the preferred list", () => {
    const result = scoreProperty(
      basePrefs({ neighborhood: ["Gràcia", "Eixample"] }),
      baseProperty({ neighborhood: "Eixample" }),
    );
    assert.equal(result.eligible, true);
    const location = result.breakdown.find((b) => b.category === "location");
    assert.ok(location);
    assert.equal(location!.earned, Math.round(location!.weight * 100));
  });

  it("scores 0 location when neighborhood differs", () => {
    const result = scoreProperty(
      basePrefs({ neighborhood: "Gràcia" }),
      baseProperty({ neighborhood: "Eixample" }),
    );
    const location = result.breakdown.find((b) => b.category === "location");
    assert.ok(location);
    assert.equal(location!.earned, 0);
  });
});

describe("labels and ranking", () => {
  it("maps score thresholds to labels", () => {
    assert.equal(labelForScore(95), "excellent");
    assert.equal(labelForScore(90), "excellent");
    assert.equal(labelForScore(80), "good");
    assert.equal(labelForScore(75), "good");
    assert.equal(labelForScore(65), "possible");
    assert.equal(labelForScore(60), "possible");
    assert.equal(labelForScore(59), "low");
  });

  it("ranks eligible properties above ineligible and by score desc", () => {
    const prefs = basePrefs();
    const ranked = rankProperties(prefs, [
      baseProperty({ uuid: "low", bedrooms: 1, neighborhood: "Other" }),
      baseProperty({ uuid: "best", price: 350_000 }),
      baseProperty({ uuid: "excluded", features: [] }),
    ]);

    assert.equal(ranked[0].uuid, "best");
    assert.equal(ranked[0].recommendation.eligible, true);
    assert.ok(ranked[0].recommendation.score >= ranked[1].recommendation.score);
    assert.equal(ranked[ranked.length - 1].uuid, "excluded");
    assert.equal(ranked[ranked.length - 1].recommendation.eligible, false);
  });

  it("produces a high score for a near-perfect match", () => {
    const result = scoreProperty(basePrefs(), baseProperty());
    assert.equal(result.eligible, true);
    assert.ok(result.score >= 90, `expected excellent score, got ${result.score}`);
    assert.equal(result.label, "excellent");
  });
});
