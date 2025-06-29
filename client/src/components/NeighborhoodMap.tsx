import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

  // Get coordinates for the neighborhood
  const getNeighborhoodCenter = (): [number, number] => {
    if (center) return center;
    return NEIGHBORHOOD_COORDINATES[neighborhood] || NEIGHBORHOOD_COORDINATES['Barcelona'];
  };

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
      // For demo purposes, we'll add some offset around the neighborhood center
      // In a real app, you'd geocode the actual addresses
      const baseCoords = getNeighborhoodCenter();
      const randomOffset = () => (Math.random() - 0.5) * 0.01; // Small random offset
      const coords: [number, number] = [
        baseCoords[0] + randomOffset(),
        baseCoords[1] + randomOffset()
      ];

      // Create custom icon based on property type
      const icon = L.divIcon({
        className: 'custom-property-marker',
        html: `
          <div class="property-marker ${property.operationType.toLowerCase()}">
            <div class="marker-price">€${property.price.toLocaleString()}</div>
            <div class="marker-type">${property.type}</div>
          </div>
        `,
        iconSize: [120, 60],
        iconAnchor: [60, 60],
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
          </div>
        `)
        .on('click', () => {
          if (onPropertyClick) {
            onPropertyClick(property);
          }
        });

      markersLayerRef.current!.addLayer(marker);
    });

    // Fit map to show all markers if there are properties
    if (properties.length > 0 && markersLayerRef.current.getLayers().length > 0) {
      const layers = markersLayerRef.current.getLayers() as L.Layer[];
      const group = L.featureGroup(layers);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }

  }, [properties, isLoading, onPropertyClick]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapRef} 
        className="w-full h-full min-h-[400px] rounded-lg z-0"
        style={{ height: '400px' }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-gray-600">Cargando mapa...</div>
        </div>
      )}

      {/* Custom CSS for markers */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .property-marker {
          background: white;
          border: 2px solid #3b82f6;
          border-radius: 8px;
          padding: 4px 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          font-size: 10px;
          text-align: center;
          min-width: 100px;
        }
        
        .property-marker.venta {
          border-color: #ef4444;
          background: #fee2e2;
        }
        
        .property-marker.alquiler {
          border-color: #3b82f6;
          background: #dbeafe;
        }
        
        .marker-price {
          font-weight: bold;
          color: #1f2937;
        }
        
        .marker-type {
          font-size: 8px;
          color: #6b7280;
          margin-top: 2px;
        }
        
        .property-popup {
          min-width: 200px;
        }
        
        .property-popup h3 {
          margin: 0 0 8px 0;
        }
        
        .property-popup p {
          margin: 4px 0;
        }
        `
      }} />
    </div>
  );
}