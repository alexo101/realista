import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geocodeAddresses, GeocodingResult, getFallbackCoordinates } from '../utils/geocoding';

// Fix for default markers not showing in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

interface NeighborhoodMapProps {
  neighborhood: string;
  properties: Property[];
  center?: [number, number];
  zoom?: number;
  onPropertyClick?: (property: Property) => void;
}

// Barcelona neighborhood coordinates - add more as needed
const NEIGHBORHOOD_COORDINATES: Record<string, [number, number]> = {
  'Eixample': [41.3874, 2.1686],
  'Gràcia': [41.4036, 2.1565],
  'Sarrià-Sant Gervasi': [41.4003, 2.1370],
  'Les Corts': [41.3838, 2.1298], 
  'Sants-Montjuïc': [41.3748, 2.1414],
  'Ciutat Vella': [41.3825, 2.1769],
  'Sant Andreu': [41.4348, 2.1890],
  'Horta-Guinardó': [41.4186, 2.1635],
  'Nou Barris': [41.4430, 2.1774],
  'Sant Martí': [41.4066, 2.2042],
  // Default Barcelona center
  'Barcelona': [41.3851, 2.1734]
};

export default function NeighborhoodMap({ 
  neighborhood, 
  properties, 
  center, 
  zoom = 14,
  onPropertyClick 
}: NeighborhoodMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [geocodedCoords, setGeocodedCoords] = useState<Map<number, GeocodingResult>>(new Map());

  // Get coordinates for the neighborhood
  const getNeighborhoodCenter = (): [number, number] => {
    if (center) return center;
    return NEIGHBORHOOD_COORDINATES[neighborhood] || NEIGHBORHOOD_COORDINATES['Barcelona'];
  };

  // Geocode property addresses when properties change
  useEffect(() => {
    if (properties.length === 0) return;

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

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const mapCenter = getNeighborhoodCenter();
    
    // Create map instance
    const map = L.map(mapRef.current, {
      center: mapCenter,
      zoom: zoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create markers layer
    const markersLayer = L.layerGroup().addTo(map);
    
    mapInstanceRef.current = map;
    markersLayerRef.current = markersLayer;
    
    setIsLoading(false);

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [neighborhood, zoom]);

  // Update markers when properties change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || isLoading) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Add property markers
    properties.forEach((property) => {
      // Use geocoded coordinates if available, otherwise use neighborhood fallback
      const geocodedCoord = geocodedCoords.get(property.id);
      let coords: [number, number];
      
      if (geocodedCoord) {
        coords = [geocodedCoord.lat, geocodedCoord.lng];
      } else {
        // Use fallback coordinates from the neighborhood
        const fallbackCoords = getFallbackCoordinates(property.neighborhood);
        // Add small random offset to avoid overlapping markers
        const randomOffset = () => (Math.random() - 0.5) * 0.005; // Smaller offset for better grouping
        coords = [
          fallbackCoords[0] + randomOffset(),
          fallbackCoords[1] + randomOffset()
        ];
      }

      // Create custom house icon based on property type
      const icon = L.divIcon({
        className: 'custom-property-marker',
        html: `
          <div class="house-marker ${property.operationType.toLowerCase()}">
            <svg class="house-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <div class="price-badge">€${property.price.toLocaleString()}</div>
          </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 50],
      });

      const marker = L.marker(coords, { icon })
        .bindPopup(`
          <div class="property-popup">
            <h3 class="text-sm font-semibold">${property.title || 'Propiedad sin título'}</h3>
            <p class="text-xs text-gray-600">${property.address}</p>
            <div class="flex justify-between items-center mt-2">
              <span class="text-lg font-bold text-blue-600">€${property.price.toLocaleString()}</span>
              <span class="text-xs bg-gray-100 px-2 py-1 rounded">${property.operationType}</span>
            </div>
            ${property.bedrooms ? `<p class="text-xs"><strong>Habitaciones:</strong> ${property.bedrooms}</p>` : ''}
            ${property.bathrooms ? `<p class="text-xs"><strong>Baños:</strong> ${property.bathrooms}</p>` : ''}
            ${property.superficie ? `<p class="text-xs"><strong>Superficie:</strong> ${property.superficie}m²</p>` : ''}
            <button onclick="window.location.href='/property/${property.id}'" class="property-details-btn">
              Ver detalles
            </button>
          </div>
        `)
        .on('click', () => {
          if (onPropertyClick) {
            onPropertyClick(property);
          }
        });

      markersLayerRef.current!.addLayer(marker);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when properties or geocoding results change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || isLoading) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Add markers for each property
    properties.forEach(property => {
      const geocoded = geocodedCoords.get(property.id);
      let coordinates: [number, number];

      if (geocoded) {
        coordinates = [geocoded.lat, geocoded.lng];
      } else {
        // Use fallback coordinates with slight randomization
        const fallback = getFallbackCoordinates(property.neighborhood);
        const offsetLat = ((property.id * 7) % 100 - 50) * 0.002;
        const offsetLng = ((property.id * 13) % 100 - 50) * 0.002;
        coordinates = [fallback[0] + offsetLat, fallback[1] + offsetLng];
      }

      // Create custom marker HTML
      const markerHtml = `
        <div class="house-marker ${property.operationType.toLowerCase()}">
          <svg class="house-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <div class="price-badge">
            <div class="marker-price">${property.price.toLocaleString()}€</div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-property-marker',
        iconSize: [40, 50],
        iconAnchor: [20, 50],
        popupAnchor: [0, -50]
      });

      const marker = L.marker(coordinates, { icon: customIcon });

      // Create popup content
      const popupContent = `
        <div class="property-popup">
          <h3>${property.title || property.address}</h3>
          <p><strong>Dirección:</strong> ${property.address}</p>
          <p><strong>Precio:</strong> ${property.price.toLocaleString()}€</p>
          ${property.bedrooms ? `<p><strong>Habitaciones:</strong> ${property.bedrooms}</p>` : ''}
          ${property.superficie ? `<p><strong>Superficie:</strong> ${property.superficie}m²</p>` : ''}
          <button class="property-details-btn" onclick="window.location.href='/property/${property.id}'">
            Ver detalles
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add click handler if provided
      if (onPropertyClick) {
        marker.on('click', () => onPropertyClick(property));
      }

      markersLayerRef.current!.addLayer(marker);
    });

    // Fit map to show all markers if there are properties
    if (properties.length > 0 && markersLayerRef.current.getLayers().length > 0) {
      const layers = markersLayerRef.current.getLayers() as L.Layer[];
      const group = L.featureGroup(layers);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }

  }, [properties, isLoading, onPropertyClick, geocodedCoords]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapRef} 
        className="w-full h-full min-h-[400px] rounded-lg z-0"
        style={{ height: '400px' }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 rounded-lg flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-gray-600 text-sm">
              {properties.length > 0 ? 'Ubicando propiedades en el mapa...' : 'Cargando mapa...'}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}