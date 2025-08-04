
import { useEffect, useRef, useState } from "react";
import { type Property } from "@shared/schema";
import { MapPin, Home } from "lucide-react";
import { geocodeAddresses, GeocodingResult, getFallbackCoordinates } from '../utils/geocoding';

interface PropertyMapProps {
  properties: Property[];
  neighborhood: string;
  className?: string;
}

export function PropertyMap({ properties, neighborhood, className }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [geocodedCoords, setGeocodedCoords] = useState<Map<number, GeocodingResult>>(new Map());

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

  // Get neighborhood center coordinates
  const getNeighborhoodCenter = (): [number, number] => {
    return getFallbackCoordinates(neighborhood);
  };

  const neighborhoodCenter = getNeighborhoodCenter();
  
  // Create properties with real or fallback coordinates
  const propertiesWithCoords = properties.map(property => {
    const geocoded = geocodedCoords.get(property.id);
    if (geocoded) {
      return {
        ...property,
        coordinates: { lat: geocoded.lat, lng: geocoded.lng }
      };
    }
    
    // Use fallback coordinates with slight randomization for properties in same neighborhood
    const [baseLat, baseLng] = getFallbackCoordinates(property.neighborhood);
    const offsetLat = ((property.id * 7) % 100 - 50) * 0.002; // ±0.1 degrees
    const offsetLng = ((property.id * 13) % 100 - 50) * 0.002;
    
    return {
      ...property,
      coordinates: {
        lat: baseLat + offsetLat,
        lng: baseLng + offsetLng
      }
    };
  });

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div 
        ref={mapRef}
        className="w-full h-[600px] bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border relative overflow-hidden"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)
          `
        }}
      >
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

        {/* Neighborhood boundary (visual representation) */}
        <div 
          className="absolute border-2 border-primary/30 bg-primary/5 rounded-lg"
          style={{
            top: '15%',
            left: '15%',
            width: '70%',
            height: '70%',
            transform: 'rotate(-2deg)'
          }}
        >
          <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded text-sm font-medium">
            {neighborhood}
          </div>
        </div>

        {/* Property pins */}
        {propertiesWithCoords.map((property) => {
          // Convert real coordinates to pixel positions within the neighborhood area
          const centerLat = neighborhoodCenter[0];
          const centerLng = neighborhoodCenter[1];
          
          // Calculate relative position based on coordinate difference
          const latDiff = property.coordinates.lat - centerLat;
          const lngDiff = property.coordinates.lng - centerLng;
          
          // Convert to pixels (approximate scale for Barcelona area)
          const x = 50 + (lngDiff * 2000); // Longitude difference to X position
          const y = 50 + (latDiff * -2000); // Latitude difference to Y position (inverted)
          
          // Clamp to visible area
          const clampedX = Math.max(20, Math.min(80, x));
          const clampedY = Math.max(20, Math.min(80, y));
          
          return (
            <div
              key={property.id}
              className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer group"
              style={{
                left: `${clampedX}%`,
                top: `${clampedY}%`,
              }}
              onClick={() => setSelectedProperty(property)}
            >
              {/* Property pin */}
              <div className="relative">
                <MapPin 
                  className={`h-8 w-8 ${
                    selectedProperty?.id === property.id 
                      ? 'text-red-600 drop-shadow-lg' 
                      : 'text-red-500 hover:text-red-600'
                  } transition-colors`}
                  fill="currentColor"
                />
                {/* Price label */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white shadow-md rounded px-2 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {property.price.toLocaleString()}€
                </div>
              </div>
            </div>
          );
        })}

        {/* Zoom controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button 
            className="bg-white shadow-md hover:shadow-lg transition-shadow rounded p-2 text-gray-600 hover:text-gray-800"
            onClick={() => console.log('Zoom in')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button 
            className="bg-white shadow-md hover:shadow-lg transition-shadow rounded p-2 text-gray-600 hover:text-gray-800"
            onClick={() => console.log('Zoom out')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>

        {/* Map legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
          <div className="text-sm font-medium text-gray-700 mb-2">Leyenda</div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-red-500" fill="currentColor" />
            <span className="text-xs text-gray-600">Propiedades ({properties.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-primary/30 border border-primary/30 rounded-sm"></div>
            <span className="text-xs text-gray-600">Límites del barrio</span>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 mt-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              <span className="text-xs text-gray-600">Ubicando...</span>
            </div>
          )}
        </div>
      </div>

      {/* Property details popup */}
      {selectedProperty && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-xl p-4 max-w-sm z-10 border">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2">
              {selectedProperty.title || selectedProperty.address}
            </h3>
            <button 
              onClick={() => setSelectedProperty(null)}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{selectedProperty.address}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                {selectedProperty.price.toLocaleString()}€
              </span>
              {selectedProperty.superficie && (
                <span className="text-gray-500">
                  {Math.round(selectedProperty.price / selectedProperty.superficie)}€/m²
                </span>
              )}
            </div>
            
            <div className="flex gap-4 text-gray-600">
              {selectedProperty.bedrooms && (
                <span className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  {selectedProperty.bedrooms} hab.
                </span>
              )}
              {selectedProperty.superficie && (
                <span>{selectedProperty.superficie}m²</span>
              )}
            </div>
            
            <button 
              onClick={() => window.location.href = `/property/${selectedProperty.id}`}
              className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90 transition-colors mt-3"
            >
              Ver detalles
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
