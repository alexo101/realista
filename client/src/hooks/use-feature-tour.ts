import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  DEFAULT_FEATURE_TOUR_STATE,
  applyFeatureTourAction,
  type FeatureTourAction,
  type FeatureTourCardId,
  type FeatureTourState,
} from "@shared/feature-tour";
import { getFeatureTourCardsForUser, type FeatureTourCard } from "@/lib/feature-tour";

const FEATURE_TOUR_URL = "/api/agent/feature-tour";

/**
 * Loads the agent's feature tour preferences and exposes the actions that
 * change them. Changes are applied optimistically and rolled back on error.
 */
export function useFeatureTour({ enabled, isAdmin }: { enabled: boolean; isAdmin: boolean }) {
  const queryClient = useQueryClient();

  const query = useQuery<FeatureTourState>({
    queryKey: [FEATURE_TOUR_URL],
    enabled,
  });

  const mutation = useMutation({
    mutationFn: (action: FeatureTourAction) =>
      apiRequest("PATCH", FEATURE_TOUR_URL, action) as Promise<FeatureTourState>,
    onMutate: async (action) => {
      await queryClient.cancelQueries({ queryKey: [FEATURE_TOUR_URL] });
      const previous = queryClient.getQueryData<FeatureTourState>([FEATURE_TOUR_URL]);
      queryClient.setQueryData<FeatureTourState>([FEATURE_TOUR_URL], (current) =>
        applyFeatureTourAction(current ?? DEFAULT_FEATURE_TOUR_STATE, action),
      );
      return { previous };
    },
    onError: (_error, _action, context) => {
      if (context?.previous) {
        queryClient.setQueryData([FEATURE_TOUR_URL], context.previous);
      }
    },
    onSuccess: (serverState) => {
      queryClient.setQueryData([FEATURE_TOUR_URL], serverState);
    },
  });

  const state = query.data ?? DEFAULT_FEATURE_TOUR_STATE;

  const visibleCards = useMemo<FeatureTourCard[]>(() => {
    if (state.dismissedAll) return [];
    const hidden = new Set<FeatureTourCardId>([...state.skippedCards, ...state.completedCards]);
    return getFeatureTourCardsForUser(isAdmin).filter((card) => !hidden.has(card.id));
  }, [state, isAdmin]);

  return {
    /** True once the saved preferences have loaded. Hides the widget until then. */
    ready: query.isSuccess,
    visibleCards,
    skipCard: (id: FeatureTourCardId) => mutation.mutate({ skipCard: id }),
    completeCard: (id: FeatureTourCardId) => mutation.mutate({ completeCard: id }),
    skipAll: () => mutation.mutate({ skipAll: true }),
  };
}
