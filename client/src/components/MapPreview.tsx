import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/utils/googleMaps";

interface MapPreviewProps {
  address: string;
  height?: number;
}

export function MapPreview({ address, height = 200 }: MapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAddress, setHasAddress] = useState(false);

  // Cleanup function for map resources
  const cleanupMap = () => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    if (mapInstanceRef.current) {
      // Clear all listeners
      window.google?.maps?.event?.clearInstanceListeners(mapInstanceRef.current);
      mapInstanceRef.current = null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Clear any pending geocode timeout
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
      geocodeTimeoutRef.current = null;
    }

    // If no address, clean up and show placeholder
    if (!address) {
      setHasAddress(false);
      setIsLoading(false);
      setError(null);
      // Don't cleanup map here to avoid flickering - keep it rendered
      return;
    }

    setHasAddress(true);

    // Debounce geocoding to prevent API throttling
    geocodeTimeoutRef.current = setTimeout(async () => {
      if (!mounted || !mapRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        // Load Google Maps API
        await loadGoogleMaps();

        if (!mounted) return;

        // Geocode the address to get coordinates
        const geocoder = new window.google.maps.Geocoder();
        const result = await new Promise<any>((resolve, reject) => {
          geocoder.geocode({ address }, (results: any[], status: string) => {
            if (!mounted) return;
            
            if (status === 'OK' && results && results.length > 0) {
              resolve(results[0]);
            } else if (status === 'OVER_QUERY_LIMIT') {
              reject(new Error('Demasiadas solicitudes. Intenta de nuevo en un momento.'));
            } else {
              reject(new Error('No se pudo encontrar la ubicación'));
            }
          });
        });

        if (!mounted) return;

        const location = result.geometry.location;

        // Create or update map
        if (!mapInstanceRef.current && mapRef.current) {
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center: location,
            zoom: 16,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
          });
        } else if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(location);
          mapInstanceRef.current.setZoom(16);
        }

        // Remove old marker if exists
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        // Add marker
        if (mapInstanceRef.current) {
          markerRef.current = new window.google.maps.Marker({
            position: location,
            map: mapInstanceRef.current,
            title: address,
          });
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Map error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error al cargar el mapa');
          setIsLoading(false);
        }
      }
    }, 500); // 500ms debounce

    return () => {
      mounted = false;
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, [address]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMap();
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, []);

  if (!address) {
    return (
      <div 
        className="border rounded-lg bg-gray-50 flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <div className="text-center text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="text-sm">Introduce una dirección para ver el mapa</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="border rounded-lg bg-red-50 flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <div className="text-center text-red-500 px-4">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div 
        ref={mapRef}
        className="border rounded-lg bg-gray-100 relative overflow-hidden"
        style={{ height: `${height}px` }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm">Cargando mapa...</p>
            </div>
          </div>
        )}
      </div>
      {address && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2 border">
          <strong>Dirección:</strong> {address}
        </div>
      )}
      <p className="text-xs text-center text-gray-500">
        La ubicación exacta no se mostrará públicamente para proteger la privacidad
      </p>
    </div>
  );
}
