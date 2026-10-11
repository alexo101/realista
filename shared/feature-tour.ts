import { z } from "zod";

/**
 * Card ids for the agent feature tour. Each id matches a dashboard section
 * (`/gestionar/:agentUuid/:section`) that has a sidebar entry.
 */
export const FEATURE_TOUR_CARD_IDS = [
  "calendario",
  "clientes",
  "mensajes",
  "propiedades",
  "servicios",
  "perfil-agente",
  "resenas",
  "control-jornada",
  "control-ausencias",
  "perfil-agencia",
  "equipo",
  "facturacion",
] as const;

export type FeatureTourCardId = (typeof FEATURE_TOUR_CARD_IDS)[number];

/** Upper bound for the number of steps a single card's tour may contain. */
export const MAX_FEATURE_TOUR_STEPS = 3;

export type FeatureTourState = {
  /** Cards removed via "Skip this". */
  skippedCards: FeatureTourCardId[];
  /** Cards whose tour was finished with "Done". */
  completedCards: FeatureTourCardId[];
  /** Set by "Skip all"; hides the whole widget. */
  dismissedAll: boolean;
};

export const DEFAULT_FEATURE_TOUR_STATE: FeatureTourState = {
  skippedCards: [],
  completedCards: [],
  dismissedAll: false,
};

export const featureTourCardIdSchema = z.enum(FEATURE_TOUR_CARD_IDS);

export const featureTourStateSchema = z.object({
  skippedCards: z.array(featureTourCardIdSchema),
  completedCards: z.array(featureTourCardIdSchema),
  dismissedAll: z.boolean(),
});

/** Body accepted by PATCH /api/agent/feature-tour. Exactly one action per request. */
export const featureTourActionSchema = z.union([
  z.object({ skipCard: featureTourCardIdSchema }).strict(),
  z.object({ completeCard: featureTourCardIdSchema }).strict(),
  z.object({ skipAll: z.literal(true) }).strict(),
]);

export type FeatureTourAction = z.infer<typeof featureTourActionSchema>;

/** Converts whatever is stored in the database into a valid state. */
export function normalizeFeatureTourState(raw: unknown): FeatureTourState {
  const parsed = featureTourStateSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_FEATURE_TOUR_STATE;
}

function appendUnique<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list : [...list, value];
}

/** Pure reducer used by the server; idempotent for repeated actions. */
export function applyFeatureTourAction(
  state: FeatureTourState,
  action: FeatureTourAction,
): FeatureTourState {
  if ("skipCard" in action) {
    return { ...state, skippedCards: appendUnique(state.skippedCards, action.skipCard) };
  }
  if ("completeCard" in action) {
    return { ...state, completedCards: appendUnique(state.completedCards, action.completeCard) };
  }
  return { ...state, dismissedAll: true };
}
