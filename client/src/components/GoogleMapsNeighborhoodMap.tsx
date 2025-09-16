import { useEffect, useRef, useState } from 'react';
import { geocodeAddresses, GeocodingResult, getFallbackCoordinates } from '../utils/geocoding';
import { loadGoogleMaps } from '../utils/googleMaps';

interface Property {
  id: number;
  title: string | null;
  address: string;
  neighborhood: string;
  price: number;
  operationType: string;
  type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  superficie?: number | null;
  images?: string[];
}

interface GoogleMapsNeighborhoodMapProps {
  neighborhood: string;
  properties: Property[];
  center?: [number, number];
  zoom?: number;
  onPropertyClick?: (property: Property) => void;
}

export default function GoogleMapsNeighborhoodMap({ 
  neighborhood, 
  properties, 
  center, 
  zoom = 14,
  onPropertyClick 
}: GoogleMapsNeighborhoodMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const [geocodedCoords, setGeocodedCoords] = useState<Map<number, GeocodingResult>>(new Map());

  // Get coordinates for the neighborhood
  const getNeighborhoodCenter = (): [number, number] => {
    if (center) return center;
    return getFallbackCoordinates(neighborhood);
  };

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        await loadGoogleMaps();
        
        const [lat, lng] = getNeighborhoodCenter();
        
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });

        setIsMapReady(true);
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
        setIsLoading(false);
      }
    };

    initMap();
  }, [neighborhood, zoom]);

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
        // Use fallback coordinates with small randomization to avoid overlapping markers
        const fallback = getFallbackCoordinates(property.neighborhood);
        const offsetLat = ((property.id * 7) % 100 - 50) * 0.003; // ±0.15 degrees ≈ ±170m
        const offsetLng = ((property.id * 13) % 100 - 50) * 0.003;
        position = { lat: fallback[0] + offsetLat, lng: fallback[1] + offsetLng };
      }

      // Create custom marker icon based on operation type
      const markerColor = property.operationType.toLowerCase() === 'venta' ? '#ef4444' : '#3b82f6';
      const markerIcon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: markerColor,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      };

      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        icon: markerIcon,
        title: property.title || property.address
      });

      // Create info window content
      const infoContent = `
        <div style="min-width: 200px; padding: 10px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
            ${property.title || 'Propiedad sin título'}
          </h3>
          <p style="margin: 4px 0; font-size: 12px; color: #666;">
            <strong>Dirección:</strong> ${property.address}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0;">
            <span style="font-size: 16px; font-weight: bold; color: #3b82f6;">
              €${property.price.toLocaleString()}
            </span>
            <span style="font-size: 11px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">
              ${property.operationType}
            </span>
          </div>
          ${property.bedrooms ? `<p style="margin: 2px 0; font-size: 12px;"><strong>Habitaciones:</strong> ${property.bedrooms}</p>` : ''}
          ${property.bathrooms ? `<p style="margin: 2px 0; font-size: 12px;"><strong>Baños:</strong> ${property.bathrooms}</p>` : ''}
          ${property.superficie ? `<p style="margin: 2px 0; font-size: 12px;"><strong>Superficie:</strong> ${property.superficie}m²</p>` : ''}
          <button 
            onclick="window.location.href='/property/${property.id}'" 
            style="width: 100%; background: #3b82f6; color: white; border: none; border-radius: 6px; padding: 8px 12px; font-size: 12px; cursor: pointer; margin-top: 8px;"
          >
            Ver detalles
          </button>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoContent
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        if (onPropertyClick) {
          onPropertyClick(property);
        }
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // Fit map to show all markers if there are properties
    if (properties.length > 0) {
      mapInstanceRef.current.fitBounds(bounds);
      
      // Set minimum zoom if there's only one property
      if (properties.length === 1) {
        mapInstanceRef.current.setZoom(Math.max(zoom, 16));
      }
    }

  }, [properties, isLoading, onPropertyClick, geocodedCoords, isMapReady, zoom]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 rounded-lg flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-gray-600 text-sm">
              Cargando mapa y ubicaciones...
            </div>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
        data-testid="google-maps-container"
      />
    </div>
  );
}