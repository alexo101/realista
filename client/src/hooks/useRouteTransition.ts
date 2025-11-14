import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';

export function useRouteTransition() {
  const [location] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousLocation = useRef(location);
  const transitionTimer = useRef<NodeJS.Timeout>();
  const minDisplayTime = 150; // Minimum 150ms to prevent flash

  useEffect(() => {
    // Detect route change
    if (location !== previousLocation.current) {
      // Immediately show transition state
      setIsTransitioning(true);
      
      // Clear any existing timer
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
      }

      // Auto-hide after max 2 seconds if not manually cleared
      transitionTimer.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 2000);

      previousLocation.current = location;
    }

    return () => {
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
      }
    };
  }, [location]);

  const endTransition = useCallback(() => {
    // Ensure minimum display time before hiding
    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current);
    }

    transitionTimer.current = setTimeout(() => {
      setIsTransitioning(false);
    }, minDisplayTime);
  }, [minDisplayTime]);

  return {
    isTransitioning,
    endTransition
  };
}
