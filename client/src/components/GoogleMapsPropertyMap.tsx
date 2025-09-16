import { useEffect, useRef, useState } from "react";
import { type Property } from "@shared/schema";
import { geocodeAddresses, GeocodingResult, getFallbackCoordinates } from '../utils/geocoding';
import { loadGoogleMaps } from '../utils/googleMaps';

interface GoogleMapsPropertyMapProps {
  properties: Property[];
  neighborhood: string;
  className?: string;
  onPropertySelect?: (property: Property) => void;
}

export function GoogleMapsPropertyMap({ 
  properties, 
  neighborhood, 
  className,
  onPropertySelect 
}: GoogleMapsPropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const [geocodedCoords, setGeocodedCoords] = useState<Map<number, GeocodingResult>>(new Map());

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        await loadGoogleMaps();
        
        const [lat, lng] = getFallbackCoordinates(neighborhood);
        
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: 15,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'transit',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'cooperative'
        });

        setIsMapReady(true);
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
        setIsLoading(false);
      }
    };

    initMap();
  }, [neighborhood]);

  // Geocode property addresses when properties change
  useEffect(() => {
    if (properties.length === 0) {
      setIsLoading(false);
      return;
    }

    const geocodeProperties = async () => {
      setIsLoading(true);
      
      const addressesToGeocode = properties.map(property => ({
        address: property.address,
        neighborhood: property.neighborhood,
        id: property.id
      }));

      try {
        const geocodedResults = await geocodeAddresses(addressesToGeocode);
        setGeocodedCoords(geocodedResults);
      } catch (error) {
        console.error('Error geocoding addresses:', error);
        // Continue with fallback coordinates
      }
      
      setIsLoading(false);
    };

    geocodeProperties();
  }, [properties]);

  // Add markers when map is ready and geocoding is done
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || isLoading) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();

    // Add markers for each property
    properties.forEach(property => {
      const geocoded = geocodedCoords.get(property.id);
      let position: { lat: number; lng: number };

      if (geocoded) {
        position = { lat: geocoded.lat, lng: geocoded.lng };
      } else {
        // Use fallback coordinates with small randomization for properties in same neighborhood
        const [baseLat, baseLng] = getFallbackCoordinates(property.neighborhood);
        const offsetLat = ((property.id * 7) % 100 - 50) * 0.003; // ±0.15 degrees ≈ ±170m
        const offsetLng = ((property.id * 13) % 100 - 50) * 0.003;
        position = { lat: baseLat + offsetLat, lng: baseLng + offsetLng };
      }

      // Create custom marker with price label
      const markerColor = property.operationType.toLowerCase() === 'venta' ? '#ef4444' : '#3b82f6';
      
      // Create custom marker with house icon and price
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="60" height="80" viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg">
              <g>
                <!-- House icon background -->
                <circle cx="30" cy="25" r="20" fill="${markerColor}" stroke="white" stroke-width="2"/>
                <!-- House icon -->
                <path d="M20 30v-6h4v6h5v-8h3L30 13 28 22h3v8z" fill="white"/>
                <!-- Price badge -->
                <rect x="5" y="50" width="50" height="20" rx="10" fill="white" stroke="${markerColor}" stroke-width="2"/>
                <text x="30" y="63" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="${markerColor}">
                  €${property.price >= 1000 ? Math.round(property.price/1000) + 'K' : property.price}
                </text>
              </g>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(60, 80),
          anchor: new window.google.maps.Point(30, 80)
        },
        title: `${property.title || property.address} - €${property.price.toLocaleString()}`
      });

      // Create info window content
      const infoContent = `
        <div style="min-width: 250px; padding: 12px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">
            ${property.title || property.address}
          </h3>
          <p style="margin: 4px 0; font-size: 13px; color: #6b7280;">
            <strong>Dirección:</strong> ${property.address}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin: 12px 0;">
            <span style="font-size: 18px; font-weight: bold; color: ${markerColor};">
              €${property.price.toLocaleString()}
            </span>
            <span style="font-size: 12px; background: #f3f4f6; padding: 4px 8px; border-radius: 6px; color: #374151;">
              ${property.operationType}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0;">
            ${property.bedrooms ? `<p style="margin: 0; font-size: 12px; color: #6b7280;"><strong>Habitaciones:</strong> ${property.bedrooms}</p>` : ''}
            ${property.bathrooms ? `<p style="margin: 0; font-size: 12px; color: #6b7280;"><strong>Baños:</strong> ${property.bathrooms}</p>` : ''}
            ${property.superficie ? `<p style="margin: 0; font-size: 12px; color: #6b7280;"><strong>Superficie:</strong> ${property.superficie}m²</p>` : ''}
          </div>
          <button 
            onclick="window.location.href='/property/${property.id}'" 
            style="width: 100%; background: ${markerColor}; color: white; border: none; border-radius: 8px; padding: 10px 16px; font-size: 13px; font-weight: 500; cursor: pointer; margin-top: 12px; transition: opacity 0.2s;"
            onmouseover="this.style.opacity='0.9'"
            onmouseout="this.style.opacity='1'"
          >
            Ver detalles
          </button>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoContent
      });

      marker.addListener('click', () => {
        // Close any open info windows
        markersRef.current.forEach(m => m.infoWindow?.close());
        
        infoWindow.open(mapInstanceRef.current, marker);
        setSelectedProperty(property);
        
        if (onPropertySelect) {
          onPropertySelect(property);
        }
      });

      // Store reference to info window for cleanup
      (marker as any).infoWindow = infoWindow;
      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // Fit map to show all markers if there are properties
    if (properties.length > 0) {
      mapInstanceRef.current.fitBounds(bounds);
      
      // Set minimum zoom if there's only one property
      if (properties.length === 1) {
        mapInstanceRef.current.setZoom(Math.max(16, mapInstanceRef.current.getZoom()));
      }
    }

  }, [properties, isLoading, onPropertySelect, geocodedCoords, isMapReady]);

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 rounded-lg flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-gray-600 text-sm">
              Ubicando propiedades en el mapa...
            </div>
          </div>
        </div>
      )}

      <div 
        ref={mapRef}
        className="w-full h-[600px] bg-gray-100 rounded-lg border"
        data-testid="google-property-map"
      />

      {selectedProperty && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 border z-10">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {selectedProperty.title || selectedProperty.address}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {selectedProperty.address}
              </p>
              <div className="flex items-center gap-4">
                <span className="text-xl font-bold text-blue-600">
                  €{selectedProperty.price.toLocaleString()}
                </span>
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {selectedProperty.operationType}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setSelectedProperty(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
              data-testid="close-property-details"
            >
              ✕
            </button>
          </div>
          <button 
            onClick={() => window.location.href = `/property/${selectedProperty.id}`}
            className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90 transition-colors mt-3"
            data-testid="view-property-details"
          >
            Ver detalles
          </button>
        </div>
      )}
    </div>
  );
}