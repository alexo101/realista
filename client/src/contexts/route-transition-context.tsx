import { createContext, useContext, useState, useLayoutEffect, useEffect, useRef, useMemo, useCallback, ReactNode } from 'react';
import { useLocation } from 'wouter';

interface RouteTransitionContextType {
  isTransitioning: boolean;
  endTransition: () => void;
}

const RouteTransitionContext = createContext<RouteTransitionContextType | null>(null);

export function RouteTransitionProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [trackedLocation, setTrackedLocation] = useState(location);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout>>();
  const transitionStartAt = useRef<number | null>(null);
  // Keep long enough that back-navigation with cached list data is still visible
  const minDisplayTime = 450;

  // Detect route changes during render so the overlay is present on the first paint,
  // including browser back. React will restart this render with the updated state.
  if (location !== trackedLocation) {
    setTrackedLocation(location);
    setIsTransitioning(true);
    transitionStartAt.current = Date.now();
  }

  // Safety auto-hide if a page never calls endTransition
  useLayoutEffect(() => {
    if (!isTransitioning) return;

    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current);
    }

    transitionTimer.current = setTimeout(() => {
      setIsTransitioning(false);
      transitionStartAt.current = null;
    }, 2000);

    return () => {
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
      }
    };
  }, [isTransitioning, trackedLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
      }
    };
  }, []);

  const endTransition = useCallback(() => {
    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current);
      transitionTimer.current = undefined;
    }

    // Ensure minimum display time before hiding so back navigation isn't a blank flash
    if (transitionStartAt.current !== null) {
      const elapsed = Date.now() - transitionStartAt.current;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      transitionTimer.current = setTimeout(() => {
        setIsTransitioning(false);
        transitionStartAt.current = null;
      }, remainingTime);
    } else {
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
