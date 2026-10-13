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

function steps(id: FeatureTourCardId, targets: string[]): FeatureTourStep[] {
  return targets.map((target, index) => ({
    target,
    titleKey: `tour.${id}.step${index + 1}.title`,
    bodyKey: `tour.${id}.step${index + 1}.body`,
  }));
}

function card(id: FeatureTourCardId, targets: string[], adminOnly = false): FeatureTourCard {
  return {
    id,
    titleKey: `tour.card.${id}.title`,
    descriptionKey: `tour.card.${id}.desc`,
    adminOnly,
    steps: steps(id, [SIDEBAR_TARGET(id), ...targets]),
  };
}

/**
 * Ordered like the sidebar. Each card lists only the controls that are on
 * screen when the tab opens, so simpler tabs stay short and the richer ones
 * can use up to MAX_FEATURE_TOUR_STEPS.
 */
export const FEATURE_TOUR_CARDS: FeatureTourCard[] = [
  card("calendario", [
    "calendario-view",
    "calendario-new",
    "calendario-period",
    "calendario-nav",
    "calendario-events",
  ]),
  card("clientes", ["clientes-views", "clientes-add", "clientes-list"]),
  card("mensajes", ["mensajes-search", "mensajes-list"]),
  card("propiedades", ["propiedades-views", "propiedades-add", "propiedades-list"]),
  card("servicios", ["servicios-catalog", "servicios-notify"]),
  card("perfil-agente", [
    "agente-photo",
    "agente-identity",
    "agente-description",
    "agente-languages",
    "agente-zones",
    "agente-social",
  ]),
  card("resenas", ["resenas-tabs", "resenas-filters", "resenas-list"]),
  card("control-jornada", ["jornada-clock", "jornada-actions"]),
  card("control-ausencias", ["ausencias-tabs", "ausencias-calendar"]),
  card("perfil-agencia", [
    "agencia-logo",
    "agencia-identity",
    "agencia-description",
    "agencia-zones",
    "agencia-social",
  ], true),
  card("equipo", ["equipo-invite", "equipo-list"], true),
  card("facturacion", ["facturacion-plan", "facturacion-change", "facturacion-invoices"]),
];

export function getFeatureTourCardsForUser(isAdmin: boolean): FeatureTourCard[] {
  return FEATURE_TOUR_CARDS.filter((c) => !c.adminOnly || isAdmin);
}

export function getFeatureTourCard(id: FeatureTourCardId): FeatureTourCard | undefined {
  return FEATURE_TOUR_CARDS.find((c) => c.id === id);
}

export { MAX_FEATURE_TOUR_STEPS, SIDEBAR_TARGET };
