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
  const shouldShow = isFetching || isTransitioning;
  const [keepVisible, setKeepVisible] = useState(shouldShow);
  const displayStartTime = useRef<number | null>(shouldShow ? Date.now() : null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (shouldShow) {
      setKeepVisible(true);
      if (displayStartTime.current === null) {
        displayStartTime.current = Date.now();
      }
      return;
    }

    if (displayStartTime.current !== null) {
      const elapsed = Date.now() - displayStartTime.current;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }

      hideTimer.current = setTimeout(() => {
        setKeepVisible(false);
        displayStartTime.current = null;
      }, remainingTime);
    } else {
      setKeepVisible(false);
    }

    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, [shouldShow, minDisplayTime]);

  // shouldShow covers the current render; keepVisible holds through the min display window
  return shouldShow || keepVisible;
}
