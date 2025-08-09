import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';

interface RouteMetadata {
  imageCount: number;
  estimatedBytes: number;
}

interface ClientMetricsConfig {
  showLoaderOnFirst: boolean;
  cacheTimeouts: {
    visited: number;
    metrics: number;
  };
  loadingThresholds: {
    imageCount: number;
    estimatedBytes: number;
    slowNetworkTypes: string[];
  };
}

interface NetworkConnection {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
}

declare global {
  interface Navigator {
    connection?: NetworkConnection;
    mozConnection?: NetworkConnection;
    webkitConnection?: NetworkConnection;
  }
}

export function useGlobalLoading() {
  const [location] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ClientMetricsConfig | null>(null);

  // Helper function to get network connection info
  const getNetworkConnection = useCallback((): NetworkConnection | null => {
    return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  }, []);

  // Helper function to check if route has been visited
  const isRouteVisited = useCallback((route: string): boolean => {
    try {
      const visitedKey = `visited:${route}`;
      const visitedData = sessionStorage.getItem(visitedKey);
      
      if (!visitedData) return false;
      
      const parsed = JSON.parse(visitedData);
      const now = Date.now();
      
      // Check if visit record is still valid (within cache timeout)
      if (config && now - parsed.timestamp > config.cacheTimeouts.visited) {
        sessionStorage.removeItem(visitedKey);
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }, [config]);

  // Helper function to mark route as visited
  const markRouteVisited = useCallback((route: string) => {
    try {
      const visitedKey = `visited:${route}`;
      const visitData = {
        timestamp: Date.now(),
        route
      };
      sessionStorage.setItem(visitedKey, JSON.stringify(visitData));
    } catch (error) {
      console.warn('Failed to mark route as visited:', error);
    }
  }, []);

  // Helper function to estimate route metadata
  const estimateRouteMetadata = useCallback((route: string): RouteMetadata => {
    // Estimate based on route patterns
    let imageCount = 0;
    let estimatedBytes = 50000; // Base page size

    // Property-related routes typically have more images
    if (route.includes('/property/') || route.includes('/properties')) {
      imageCount = 8; // Property images + thumbnails
      estimatedBytes = 800000; // Large images
    } else if (route.includes('/agent/') || route.includes('/agency/')) {
      imageCount = 6; // Profile images + property thumbnails
      estimatedBytes = 600000;
    } else if (route.includes('/search') || route.includes('/neighborhood')) {
      imageCount = 12; // Multiple property cards
      estimatedBytes = 1200000;
    } else if (route.includes('/manage')) {
      imageCount = 10; // Property management interface
      estimatedBytes = 700000;
    } else {
      imageCount = 2; // Header/logo images
      estimatedBytes = 200000;
    }

    return { imageCount, estimatedBytes };
  }, []);

  // Helper function to determine if loading should be shown
  const shouldShowLoading = useCallback((route: string): boolean => {
    if (!config) return false;

    // Check if route has been visited
    if (isRouteVisited(route)) {
      return false;
    }

    const network = getNetworkConnection();
    const routeMeta = estimateRouteMetadata(route);

    // Check network condition
    if (network?.effectiveType && config.loadingThresholds.slowNetworkTypes.includes(network.effectiveType)) {
      return true;
    }

    // Check image count threshold
    if (routeMeta.imageCount > config.loadingThresholds.imageCount) {
      return true;
    }

    // Check estimated bytes threshold
    if (routeMeta.estimatedBytes > config.loadingThresholds.estimatedBytes) {
      return true;
    }

    // Check server configuration
    if (config.showLoaderOnFirst) {
      return true;
    }

    return false;
  }, [config, isRouteVisited, getNetworkConnection, estimateRouteMetadata]);

  // Load configuration on mount
  useEffect(() => {
    let mounted = true;

    // Use fallback configuration immediately for development
    // In production, this could fetch from the API endpoint
    if (mounted) {
      setConfig({
        showLoaderOnFirst: true,
        cacheTimeouts: {
          visited: 86400000, // 24 hours
          metrics: 300000 // 5 minutes
        },
        loadingThresholds: {
          imageCount: 4,
          estimatedBytes: 500000,
          slowNetworkTypes: ['2g', 'slow-2g']
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Handle route changes
  useEffect(() => {
    if (!config) return;

    const currentRoute = location;
    
    // Check if we should show loading for this route
    if (shouldShowLoading(currentRoute)) {
      setIsLoading(true);
      
      // Set a minimum loading time to avoid flashing
      const minLoadingTime = 800; // 800ms minimum for better UX
      const startTime = Date.now();
      
      // Auto-hide loading after a reasonable time if not manually hidden
      const autoHideTimer = setTimeout(() => {
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsed);
        
        setTimeout(() => {
          setIsLoading(false);
          markRouteVisited(currentRoute);
        }, remainingTime);
      }, 2000); // Auto-hide after 2 seconds max
      
      return () => clearTimeout(autoHideTimer);
    } else {
      setIsLoading(false);
    }
  }, [location, config, shouldShowLoading, markRouteVisited]);

  // Function to manually hide loading (for when main content is rendered)
  const hideLoading = useCallback(() => {
    setIsLoading(false);
    markRouteVisited(location);
  }, [location, markRouteVisited]);

  return {
    isLoading,
    hideLoading,
    networkInfo: getNetworkConnection(),
    routeMetadata: config ? estimateRouteMetadata(location) : null
  };
}