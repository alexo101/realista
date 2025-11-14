import { createContext, useContext, useState, useLayoutEffect, useEffect, useRef, useMemo, useCallback, ReactNode } from 'react';
import { useLocation } from 'wouter';

interface RouteTransitionContextType {
  isTransitioning: boolean;
  endTransition: () => void;
}

const RouteTransitionContext = createContext<RouteTransitionContextType | null>(null);

export function RouteTransitionProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousLocation = useRef(location);
  const transitionTimer = useRef<NodeJS.Timeout>();
  const transitionStartAt = useRef<number | null>(null);
  const minDisplayTime = 150; // Minimum 150ms to prevent flash

  // Use layout effect to detect route changes BEFORE paint for instant coverage
  useLayoutEffect(() => {
    if (location !== previousLocation.current) {
      setIsTransitioning(true);
      transitionStartAt.current = Date.now();
      previousLocation.current = location;

      // Auto-hide after max 2 seconds if not manually cleared
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
      }

      transitionTimer.current = setTimeout(() => {
        setIsTransitioning(false);
        transitionStartAt.current = null;
      }, 2000);
    }
  }, [location]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
      }
    };
  }, []);

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

  const value = useMemo(
    () => ({
      isTransitioning,
      endTransition
    }),
    [isTransitioning, endTransition]
  );

  return (
    <RouteTransitionContext.Provider value={value}>
      {children}
    </RouteTransitionContext.Provider>
  );
}

export function useRouteTransition() {
  const context = useContext(RouteTransitionContext);
  if (!context) {
    throw new Error('useRouteTransition must be used within RouteTransitionProvider');
  }
  return context;
}
