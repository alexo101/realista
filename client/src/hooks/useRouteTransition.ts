import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';

export function useRouteTransition() {
  const [location] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousLocation = useRef(location);
  const transitionTimer = useRef<NodeJS.Timeout>();
  const transitionStartAt = useRef<number | null>(null);
  const minDisplayTime = 150; // Minimum 150ms to prevent flash

  // Synchronously detect route change to provide instant skeleton coverage
  if (location !== previousLocation.current && !isTransitioning) {
    setIsTransitioning(true);
    transitionStartAt.current = Date.now();
    previousLocation.current = location;
  }

  useEffect(() => {
    if (isTransitioning && !transitionTimer.current) {
      // Auto-hide after max 2 seconds if not manually cleared
      transitionTimer.current = setTimeout(() => {
        setIsTransitioning(false);
        transitionStartAt.current = null;
      }, 2000);
    }

    return () => {
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
        transitionTimer.current = undefined;
      }
    };
  }, [isTransitioning]);

  const endTransition = useCallback(() => {
    // Clear any existing timer
    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current);
      transitionTimer.current = undefined;
    }

    // Ensure minimum display time before hiding
    if (transitionStartAt.current !== null) {
      const elapsed = Date.now() - transitionStartAt.current;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      transitionTimer.current = setTimeout(() => {
        setIsTransitioning(false);
        transitionStartAt.current = null;
      }, remainingTime);
    } else {
      // No start time recorded, hide immediately
      setIsTransitioning(false);
    }
  }, [minDisplayTime]);

  return useMemo(
    () => ({
      isTransitioning,
      endTransition
    }),
    [isTransitioning, endTransition]
  );
}
