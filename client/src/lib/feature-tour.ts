import {
  MAX_FEATURE_TOUR_STEPS,
  type FeatureTourCardId,
} from "@shared/feature-tour";

/**
 * One step of a card's tour. `target` is the value of a `data-tour`
 * attribute rendered by the agent dashboard. Missing targets fall back to a
 * centered popover so a step never breaks the tour.
 */
export type FeatureTourStep = {
  target: string;
  titleKey: string;
  bodyKey: string;
};

export type FeatureTourCard = {
  id: FeatureTourCardId;
  titleKey: string;
  descriptionKey: string;
  /** Only shown to agency admins (the Agencia section of the sidebar). */
  adminOnly?: boolean;
  steps: FeatureTourStep[];
};

const SIDEBAR_TARGET = (id: FeatureTourCardId) => `sidebar-${id}`;
const SECTION_TARGET = (id: FeatureTourCardId) => `section-${id}`;

function cardSteps(id: FeatureTourCardId): FeatureTourStep[] {
  return [
    {
      target: SIDEBAR_TARGET(id),
      titleKey: `tour.${id}.step1.title`,
      bodyKey: `tour.${id}.step1.body`,
    },
    {
      target: SECTION_TARGET(id),
      titleKey: `tour.${id}.step2.title`,
      bodyKey: `tour.${id}.step2.body`,
    },
  ];
}

function card(id: FeatureTourCardId, adminOnly = false): FeatureTourCard {
  return {
    id,
    titleKey: `tour.card.${id}.title`,
    descriptionKey: `tour.card.${id}.desc`,
    adminOnly,
    steps: cardSteps(id),
  };
}

/** Ordered like the sidebar. Admin-only cards are filtered per user. */
export const FEATURE_TOUR_CARDS: FeatureTourCard[] = [
  card("calendario"),
  card("clientes"),
  card("mensajes"),
  card("propiedades"),
  card("servicios"),
  card("perfil-agente"),
  card("resenas"),
  card("control-jornada"),
  card("control-ausencias"),
  card("perfil-agencia", true),
  card("equipo", true),
  card("facturacion"),
];

export function getFeatureTourCardsForUser(isAdmin: boolean): FeatureTourCard[] {
  return FEATURE_TOUR_CARDS.filter((c) => !c.adminOnly || isAdmin);
}

export function getFeatureTourCard(id: FeatureTourCardId): FeatureTourCard | undefined {
  return FEATURE_TOUR_CARDS.find((c) => c.id === id);
}

export { MAX_FEATURE_TOUR_STEPS, SIDEBAR_TARGET, SECTION_TARGET };
