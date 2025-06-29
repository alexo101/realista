import { useEffect, useRef, useState } from "react";
import { type Property } from "@shared/schema";
import { MapPin, Home } from "lucide-react";

interface PropertyMapProps {
  properties: Property[];
  neighborhood: string;
  className?: string;
}

export function PropertyMap({ properties, neighborhood, className }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Mock coordinates for Barcelona neighborhoods - in a real app, you'd use a geocoding service
  const getNeighborhoodCoordinates = (neighborhood: string) => {
    const coordinates: Record<string, { lat: number; lng: number; zoom: number }> = {
      "Barcelona": { lat: 41.3851, lng: 2.1734, zoom: 11 },
      "Eixample": { lat: 41.3912, lng: 2.1649, zoom: 13 },
      "Gràcia": { lat: 41.4036, lng: 2.1581, zoom: 14 },
      "Sants-Montjuïc": { lat: 41.3748, lng: 2.1394, zoom: 13 },
      "Les Corts": { lat: 41.3870, lng: 2.1247, zoom: 14 },
      "Sarrià-Sant Gervasi": { lat: 41.4067, lng: 2.1404, zoom: 13 },
      "Horta-Guinardó": { lat: 41.4181, lng: 2.1581, zoom: 13 },
      "Nou Barris": { lat: 41.4287, lng: 2.1759, zoom: 13 },
      "Sant Andreu": { lat: 41.4359, lng: 2.1887, zoom: 13 },
      "Sant Martí": { lat: 41.4111, lng: 2.2008, zoom: 13 },
      "Ciutat Vella": { lat: 41.3825, lng: 2.1769, zoom: 14 },
      "La Barceloneta": { lat: 41.3755, lng: 2.1901, zoom: 15 },
      "El Raval": { lat: 41.3794, lng: 2.1694, zoom: 15 },
      "Barrio Gótico": { lat: 41.3828, lng: 2.1761, zoom: 15 },
      "El Born": { lat: 41.3847, lng: 2.1818, zoom: 15 },
    };
    
    return coordinates[neighborhood] || { lat: 41.3851, lng: 2.1734, zoom: 12 };
  };

  // Generate mock coordinates for properties based on neighborhood
  const generatePropertyCoordinates = (property: Property, baseCoords: { lat: number; lng: number }) => {
    // Use property ID to generate consistent but varied coordinates within the neighborhood
    const seed = property.id;
    const offsetLat = ((seed * 7) % 100 - 50) * 0.001; // ±0.05 degrees
    const offsetLng = ((seed * 13) % 100 - 50) * 0.001;
    
    return {
      lat: baseCoords.lat + offsetLat,
      lng: baseCoords.lng + offsetLng
    };
  };

  const neighborhoodCoords = getNeighborhoodCoordinates(neighborhood);
  
  const propertiesWithCoords = properties.map(property => ({
    ...property,
    coordinates: generatePropertyCoordinates(property, neighborhoodCoords)
  }));

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
        {/* Neighborhood boundary (mock) */}
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
        {propertiesWithCoords.map((property, index) => {
          // Convert coordinates to pixel positions (mock calculation)
          const x = 15 + (70 * Math.random());
          const y = 15 + (70 * Math.random());
          
          return (
            <div
              key={property.id}
              className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer group"
              style={{
                left: `${x}%`,
                top: `${y}%`,
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