import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_FEATURE_TOUR_STATE,
  FEATURE_TOUR_CARD_IDS,
  MAX_FEATURE_TOUR_STEPS,
  applyFeatureTourAction,
  featureTourActionSchema,
  normalizeFeatureTourState,
} from "./feature-tour";
import { FEATURE_TOUR_CARDS } from "../client/src/lib/feature-tour";
import { tourTranslations } from "../client/src/i18n/tour-translations";

const LANGUAGES = ["es", "en", "fr", "it"] as const;

const WIDGET_KEYS = [
  "tour.widget_label",
  "tour.prev",
  "tour.next",
  "tour.counter",
  "tour.start",
  "tour.skip_this",
  "tour.skip_all",
  "tour.step_counter",
  "tour.back",
  "tour.next_step",
  "tour.done",
  "tour.close",
];

describe("feature tour configuration", () => {
  it("has exactly one card per known card id", () => {
    const ids = FEATURE_TOUR_CARDS.map((card) => card.id);
    assert.equal(new Set(ids).size, ids.length, "card ids must be unique");
    assert.deepEqual([...ids].sort(), [...FEATURE_TOUR_CARD_IDS].sort());
  });

  it("keeps every card's tour within the step limit", () => {
    for (const card of FEATURE_TOUR_CARDS) {
      assert.ok(card.steps.length >= 1, `${card.id} needs at least one step`);
      assert.ok(
        card.steps.length <= MAX_FEATURE_TOUR_STEPS,
        `${card.id} has ${card.steps.length} steps, max is ${MAX_FEATURE_TOUR_STEPS}`,
      );
      const targets = card.steps.map((step) => step.target);
      assert.equal(new Set(targets).size, targets.length, `${card.id} repeats a target`);
    }
    const longest = Math.max(...FEATURE_TOUR_CARDS.map((card) => card.steps.length));
    assert.equal(longest, MAX_FEATURE_TOUR_STEPS);
    assert.ok(FEATURE_TOUR_CARDS.some((card) => card.steps.length < MAX_FEATURE_TOUR_STEPS));
  });

  it("provides every translation key in all supported languages", () => {
    const requiredKeys = new Set<string>(WIDGET_KEYS);
    for (const card of FEATURE_TOUR_CARDS) {
      requiredKeys.add(card.titleKey);
      requiredKeys.add(card.descriptionKey);
      for (const step of card.steps) {
        requiredKeys.add(step.titleKey);
        requiredKeys.add(step.bodyKey);
      }
    }

    for (const language of LANGUAGES) {
      const dictionary = tourTranslations[language];
      for (const key of requiredKeys) {
        const value = dictionary[key];
        assert.ok(
          typeof value === "string" && value.trim().length > 0,
          `missing "${key}" for language "${language}"`,
        );
      }
    }
  });

  it("uses the same keys in every language (no extra or missing entries)", () => {
    const reference = Object.keys(tourTranslations.es).sort();
    for (const language of LANGUAGES) {
      assert.deepEqual(Object.keys(tourTranslations[language]).sort(), reference, language);
    }
  });

  it("only admin cards are flagged admin-only", () => {
    const adminOnly = FEATURE_TOUR_CARDS.filter((card) => card.adminOnly).map((card) => card.id);
    assert.deepEqual(adminOnly.sort(), ["equipo", "perfil-agencia"]);
  });
});

describe("feature tour state", () => {
  it("applies skipCard idempotently", () => {
    const once = applyFeatureTourAction(DEFAULT_FEATURE_TOUR_STATE, { skipCard: "clientes" });
    const twice = applyFeatureTourAction(once, { skipCard: "clientes" });
    assert.deepEqual(twice.skippedCards, ["clientes"]);
  });

  it("records completed cards and skipAll without touching other fields", () => {
    const completed = applyFeatureTourAction(DEFAULT_FEATURE_TOUR_STATE, { completeCard: "calendario" });
    assert.deepEqual(completed.completedCards, ["calendario"]);
    assert.equal(completed.dismissedAll, false);

    const dismissed = applyFeatureTourAction(completed, { skipAll: true });
    assert.equal(dismissed.dismissedAll, true);
    assert.deepEqual(dismissed.completedCards, ["calendario"]);
  });

  it("rejects unknown card ids and malformed actions", () => {
    assert.equal(featureTourActionSchema.safeParse({ skipCard: "red" }).success, false);
    assert.equal(featureTourActionSchema.safeParse({ skipAll: false }).success, false);
    assert.equal(featureTourActionSchema.safeParse({ skipCard: "clientes", extra: 1 }).success, false);
    assert.equal(featureTourActionSchema.safeParse({ skipCard: "clientes" }).success, true);
  });

  it("falls back to defaults for malformed stored data", () => {
    assert.deepEqual(normalizeFeatureTourState({}), DEFAULT_FEATURE_TOUR_STATE);
    assert.deepEqual(normalizeFeatureTourState(null), DEFAULT_FEATURE_TOUR_STATE);
  });
});
