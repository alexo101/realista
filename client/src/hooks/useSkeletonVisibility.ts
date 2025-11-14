import { useState, useEffect, useRef } from 'react';

interface UseSkeletonVisibilityOptions {
  isFetching: boolean;
  isTransitioning?: boolean;
  minDisplayTime?: number;
}

export function useSkeletonVisibility({
  isFetching,
  isTransitioning = false,
  minDisplayTime = 150
}: UseSkeletonVisibilityOptions) {
  const [showSkeleton, setShowSkeleton] = useState(isFetching || isTransitioning);
  const displayStartTime = useRef<number | null>(null);
  const hideTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const shouldShow = isFetching || isTransitioning;

    if (shouldShow) {
      // Immediately show skeleton
      setShowSkeleton(true);
      if (displayStartTime.current === null) {
        displayStartTime.current = Date.now();
      }
    } else {
      // Hide with minimum display time
      if (displayStartTime.current !== null) {
        const elapsed = Date.now() - displayStartTime.current;
        const remainingTime = Math.max(0, minDisplayTime - elapsed);

        if (hideTimer.current) {
          clearTimeout(hideTimer.current);
        }

        hideTimer.current = setTimeout(() => {
          setShowSkeleton(false);
          displayStartTime.current = null;
        }, remainingTime);
      } else {
        setShowSkeleton(false);
      }
    }

    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, [isFetching, isTransitioning, minDisplayTime]);

  return showSkeleton;
}
