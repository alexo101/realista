import type { ClientPropertyPreferences } from "./schema";

/** Tunable category weights — must sum to 1.0. */
export const RECOMMENDATION_WEIGHTS = {
  budget: 0.2,
  location: 0.2,
  core: 0.3, // bedrooms, bathrooms, area
  structured: 0.1, // condition, availability, floor, housingType
  preferred: 0.2,
} as const;

export type RecommendationCategory = keyof typeof RECOMMENDATION_WEIGHTS;

export type RecommendationLabel = "excellent" | "good" | "possible" | "low";

/** Minimal property shape required for scoring. */
export type ScorableProperty = {
  uuid: string;
  operationType: string;
  type: string;
  housingType?: string | null;
  city?: string | null;
  neighborhood: string;
  price: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  superficie?: number | null;
  propertyCondition?: string | null;
  availability?: string | null;
  floor?: string | null;
  features?: string[] | null;
};

export type ScoreBreakdownItem = {
  category: RecommendationCategory;
  /** Effective weight after redistribution (0–1). */
  weight: number;
  /** Points earned toward the 0–100 score. */
  earned: number;
  details: string[];
};

export type RecommendationResult = {
  eligible: boolean;
  exclusionReasons?: string[];
  /** 0–100 integer; 0 when ineligible. */
  score: number;
  label: RecommendationLabel;
  breakdown: ScoreBreakdownItem[];
};

export type RankedProperty<T extends ScorableProperty> = T & {
  recommendation: RecommendationResult;
};

const CATEGORIES = Object.keys(RECOMMENDATION_WEIGHTS) as RecommendationCategory[];

function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function isSpecified(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function neighborhoodList(prefs: ClientPropertyPreferences): string[] {
  const raw = prefs.neighborhood;
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map(norm).filter(Boolean);
  const single = norm(raw);
  return single ? [single] : [];
}

function preferredList(prefs: ClientPropertyPreferences): string[] {
  const list = prefs.preferredFeatures ?? [];
  return list.filter((id) => typeof id === "string" && id.trim().length > 0);
}

function essentialList(prefs: ClientPropertyPreferences): string[] {
  const list = prefs.essentialFeatures ?? [];
  return list.filter((id) => typeof id === "string" && id.trim().length > 0);
}

function hasBudget(prefs: ClientPropertyPreferences): boolean {
  return (
    (prefs.minPrice != null && Number.isFinite(prefs.minPrice)) ||
    (prefs.maxPrice != null && Number.isFinite(prefs.maxPrice))
  );
}

function hasArea(prefs: ClientPropertyPreferences): boolean {
  return (
    (prefs.minArea != null && Number.isFinite(prefs.minArea)) ||
    (prefs.maxArea != null && Number.isFinite(prefs.maxArea))
  );
}

/** How far `price` sits outside [min, max], as a fraction of the nearest bound. 0 = inside. */
export function budgetOutsideFraction(
  price: number,
  minPrice: number | null | undefined,
  maxPrice: number | null | undefined,
): number {
  const hasMin = minPrice != null && Number.isFinite(minPrice);
  const hasMax = maxPrice != null && Number.isFinite(maxPrice);

  if (!hasMin && !hasMax) return 0;

  if (hasMin && hasMax) {
    if (price >= minPrice! && price <= maxPrice!) return 0;
    if (price < minPrice!) {
      return minPrice! > 0 ? (minPrice! - price) / minPrice! : 1;
    }
    return maxPrice! > 0 ? (price - maxPrice!) / maxPrice! : 1;
  }

  if (hasMax) {
    if (price <= maxPrice!) return 0;
    return maxPrice! > 0 ? (price - maxPrice!) / maxPrice! : 1;
  }

  // only min
  if (price >= minPrice!) return 0;
  return minPrice! > 0 ? (minPrice! - price) / minPrice! : 1;
}

/** Fraction of the budget category weight earned (1 / 0.75 / 0.4 / 0). */
export function budgetScoreFraction(outside: number): number {
  if (outside <= 0) return 1;
  if (outside <= 0.05) return 0.75;
  if (outside <= 0.1) return 0.4;
  return 0;
}

function roomScoreFraction(actual: number | null | undefined, requested: number): number {
  if (actual == null || !Number.isFinite(actual)) return 0;
  if (actual >= requested) return 1;
  if (actual === requested - 1) return 1 / 3;
  return 0;
}

function areaMatches(
  superficie: number | null | undefined,
  minArea: number | null | undefined,
  maxArea: number | null | undefined,
): boolean {
  if (superficie == null || !Number.isFinite(superficie)) return false;
  if (minArea != null && Number.isFinite(minArea) && superficie < minArea) return false;
  if (maxArea != null && Number.isFinite(maxArea) && superficie > maxArea) return false;
  return true;
}

export function labelForScore(score: number): RecommendationLabel {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 60) return "possible";
  return "low";
}

type ActiveField = { key: string; fraction: number; detail: string };

function collectEligibility(
  prefs: ClientPropertyPreferences,
  property: ScorableProperty,
): string[] {
  const reasons: string[] = [];

  if (isSpecified(prefs.operationType)) {
    if (norm(property.operationType) !== norm(prefs.operationType)) {
      reasons.push("operationType");
    }
  }

  if (isSpecified(prefs.propertyType)) {
    if (norm(property.type) !== norm(prefs.propertyType)) {
      reasons.push("propertyType");
    }
  }

  if (isSpecified(prefs.city)) {
    if (norm(property.city) !== norm(prefs.city)) {
      reasons.push("city");
    }
  }

  if (hasBudget(prefs)) {
    const outside = budgetOutsideFraction(property.price, prefs.minPrice, prefs.maxPrice);
    if (outside > 0.1) {
      reasons.push("price");
    }
  }

  const essentials = essentialList(prefs);
  if (essentials.length > 0) {
    const features = new Set((property.features ?? []).map(norm));
    const missing = essentials.filter((id) => !features.has(norm(id)));
    if (missing.length > 0) {
      reasons.push("essentialFeatures");
    }
  }

  return reasons;
}

function activeCategories(prefs: ClientPropertyPreferences): Set<RecommendationCategory> {
  const active = new Set<RecommendationCategory>();

  if (hasBudget(prefs)) active.add("budget");
  if (neighborhoodList(prefs).length > 0) active.add("location");

  const coreFields =
    (prefs.bedrooms != null && Number.isFinite(prefs.bedrooms) ? 1 : 0) +
    (prefs.bathrooms != null && Number.isFinite(prefs.bathrooms) ? 1 : 0) +
    (hasArea(prefs) ? 1 : 0);
  if (coreFields > 0) active.add("core");

  const structured =
    isSpecified(prefs.propertyCondition) ||
    isSpecified(prefs.availability) ||
    isSpecified(prefs.floor) ||
    isSpecified(prefs.housingType);
  if (structured) active.add("structured");

  if (preferredList(prefs).length > 0) active.add("preferred");

  return active;
}

/** Redistribute base weights so only active categories contribute and sum to 1. */
export function effectiveWeights(
  prefs: ClientPropertyPreferences,
): Partial<Record<RecommendationCategory, number>> {
  const active = activeCategories(prefs);
  if (active.size === 0) return {};

  let activeSum = 0;
  for (const cat of Array.from(active)) {
    activeSum += RECOMMENDATION_WEIGHTS[cat];
  }
  if (activeSum <= 0) return {};

  const result: Partial<Record<RecommendationCategory, number>> = {};
  for (const cat of Array.from(active)) {
    result[cat] = RECOMMENDATION_WEIGHTS[cat] / activeSum;
  }
  return result;
}

function scoreBudget(
  prefs: ClientPropertyPreferences,
  property: ScorableProperty,
  weight: number,
): ScoreBreakdownItem {
  const outside = budgetOutsideFraction(property.price, prefs.minPrice, prefs.maxPrice);
  const fraction = budgetScoreFraction(outside);
  const earned = Math.round(weight * fraction * 100);
  const details: string[] = [];
  if (fraction === 1) details.push("within_budget");
  else if (fraction === 0.75) details.push("outside_0_5");
  else if (fraction === 0.4) details.push("outside_5_10");
  else details.push("outside_budget");
  return { category: "budget", weight, earned, details };
}

function scoreLocation(
  prefs: ClientPropertyPreferences,
  property: ScorableProperty,
  weight: number,
): ScoreBreakdownItem {
  const wanted = neighborhoodList(prefs);
  const actual = norm(property.neighborhood);
  const match = wanted.includes(actual);
  const earned = match ? Math.round(weight * 100) : 0;
  return {
    category: "location",
    weight,
    earned,
    details: [match ? "exact_neighborhood" : "different_neighborhood"],
  };
}

function scoreCore(
  prefs: ClientPropertyPreferences,
  property: ScorableProperty,
  weight: number,
): ScoreBreakdownItem {
  const fields: ActiveField[] = [];

  if (prefs.bedrooms != null && Number.isFinite(prefs.bedrooms)) {
    const fraction = roomScoreFraction(property.bedrooms, prefs.bedrooms);
    fields.push({
      key: "bedrooms",
      fraction,
      detail:
        fraction === 1
          ? "bedrooms_met"
          : fraction > 0
            ? "bedrooms_one_less"
            : "bedrooms_miss",
    });
  }

  if (prefs.bathrooms != null && Number.isFinite(prefs.bathrooms)) {
    const fraction = roomScoreFraction(property.bathrooms, prefs.bathrooms);
    fields.push({
      key: "bathrooms",
      fraction,
      detail:
        fraction === 1
          ? "bathrooms_met"
          : fraction > 0
            ? "bathrooms_one_less"
            : "bathrooms_miss",
    });
  }

  if (hasArea(prefs)) {
    const ok = areaMatches(property.superficie, prefs.minArea, prefs.maxArea);
    fields.push({
      key: "area",
      fraction: ok ? 1 : 0,
      detail: ok ? "area_met" : "area_miss",
    });
  }

  const perField = fields.length > 0 ? weight / fields.length : 0;
  let earnedFloat = 0;
  const details: string[] = [];
  for (const field of fields) {
    earnedFloat += perField * field.fraction * 100;
    details.push(field.detail);
  }

  return {
    category: "core",
    weight,
    earned: Math.round(earnedFloat),
    details,
  };
}

function scoreStructured(
  prefs: ClientPropertyPreferences,
  property: ScorableProperty,
  weight: number,
): ScoreBreakdownItem {
  const fields: ActiveField[] = [];

  if (isSpecified(prefs.propertyCondition)) {
    const match = norm(property.propertyCondition) === norm(prefs.propertyCondition);
    fields.push({
      key: "propertyCondition",
      fraction: match ? 1 : 0,
      detail: match ? "condition_met" : "condition_miss",
    });
  }

  if (isSpecified(prefs.availability)) {
    const match = norm(property.availability) === norm(prefs.availability);
    fields.push({
      key: "availability",
      fraction: match ? 1 : 0,
      detail: match ? "availability_met" : "availability_miss",
    });
  }

  if (isSpecified(prefs.floor)) {
    const match = norm(property.floor) === norm(prefs.floor);
    fields.push({
      key: "floor",
      fraction: match ? 1 : 0,
      detail: match ? "floor_met" : "floor_miss",
    });
  }

  if (isSpecified(prefs.housingType)) {
    const match = norm(property.housingType) === norm(prefs.housingType);
    fields.push({
      key: "housingType",
      fraction: match ? 1 : 0,
      detail: match ? "housing_type_met" : "housing_type_miss",
    });
  }

  const perField = fields.length > 0 ? weight / fields.length : 0;
  let earnedFloat = 0;
  const details: string[] = [];
  for (const field of fields) {
    earnedFloat += perField * field.fraction * 100;
    details.push(field.detail);
  }

  return {
    category: "structured",
    weight,
    earned: Math.round(earnedFloat),
    details,
  };
}

function scorePreferred(
  prefs: ClientPropertyPreferences,
  property: ScorableProperty,
  weight: number,
): ScoreBreakdownItem {
  const preferred = preferredList(prefs);
  const features = new Set((property.features ?? []).map(norm));
  const matched = preferred.filter((id) => features.has(norm(id)));
  const fraction = preferred.length > 0 ? matched.length / preferred.length : 0;
  const earned = Math.round(weight * fraction * 100);
  return {
    category: "preferred",
    weight,
    earned,
    details: [`preferred_${matched.length}_of_${preferred.length}`],
  };
}

/**
 * Score a single property against client preferences.
 * Ineligible properties get score 0 and exclusion reasons.
 */
export function scoreProperty(
  prefs: ClientPropertyPreferences | null | undefined,
  property: ScorableProperty,
): RecommendationResult {
  const safePrefs: ClientPropertyPreferences = prefs ?? {};
  const exclusionReasons = collectEligibility(safePrefs, property);

  if (exclusionReasons.length > 0) {
    return {
      eligible: false,
      exclusionReasons,
      score: 0,
      label: "low",
      breakdown: [],
    };
  }

  const weights = effectiveWeights(safePrefs);
  const activeCats = Object.keys(weights) as RecommendationCategory[];

  if (activeCats.length === 0) {
    // No scorable preferences — eligible but unscored
    return {
      eligible: true,
      score: 0,
      label: "low",
      breakdown: [],
    };
  }

  const breakdown: ScoreBreakdownItem[] = [];

  for (const cat of CATEGORIES) {
    const w = weights[cat];
    if (w == null) continue;

    if (cat === "budget") breakdown.push(scoreBudget(safePrefs, property, w));
    else if (cat === "location") breakdown.push(scoreLocation(safePrefs, property, w));
    else if (cat === "core") breakdown.push(scoreCore(safePrefs, property, w));
    else if (cat === "structured") breakdown.push(scoreStructured(safePrefs, property, w));
    else if (cat === "preferred") breakdown.push(scorePreferred(safePrefs, property, w));
  }

  // Clamp sum in case of rounding drift
  const rawScore = breakdown.reduce((sum, item) => sum + item.earned, 0);
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    eligible: true,
    score,
    label: labelForScore(score),
    breakdown,
  };
}

/** Rank properties: eligible first (by score desc), then ineligible. */
export function rankProperties<T extends ScorableProperty>(
  prefs: ClientPropertyPreferences | null | undefined,
  properties: T[],
): RankedProperty<T>[] {
  const ranked: RankedProperty<T>[] = properties.map((property) => ({
    ...property,
    recommendation: scoreProperty(prefs, property),
  }));

  ranked.sort((a, b) => {
    if (a.recommendation.eligible !== b.recommendation.eligible) {
      return a.recommendation.eligible ? -1 : 1;
    }
    return b.recommendation.score - a.recommendation.score;
  });

  return ranked;
}

/** Minimal client shape required for ranking against a property. */
export type ScorableClient = {
  id: number;
  propertyPreferences?: ClientPropertyPreferences | null;
};

export type RankedClient<T extends ScorableClient> = T & {
  recommendation: RecommendationResult;
};

/** Rank clients against one property: eligible first (by score desc), then ineligible. */
export function rankClients<T extends ScorableClient>(
  property: ScorableProperty,
  clients: T[],
): RankedClient<T>[] {
  const ranked: RankedClient<T>[] = clients.map((client) => ({
    ...client,
    recommendation: scoreProperty(client.propertyPreferences, property),
  }));

  ranked.sort((a, b) => {
    if (a.recommendation.eligible !== b.recommendation.eligible) {
      return a.recommendation.eligible ? -1 : 1;
    }
    return b.recommendation.score - a.recommendation.score;
  });

  return ranked;
}
