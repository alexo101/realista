import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Star, Search } from "lucide-react";

const POPULAR_NEIGHBORHOODS = [
  "Gracia",
  "Eixample", 
  "El Born",
  "Barceloneta"
];

// Static sample data for popular neighborhoods
const NEIGHBORHOOD_DATA: { [key: string]: any } = {
  "Gracia": {
    count: 127,
    security: 8.2,
    publicTransport: 9.1,
    services: 8.7,
    greenSpaces: 9.3
  },
  "Eixample": {
    count: 203,
    security: 7.8,
    publicTransport: 9.5,
    services: 9.2,
    greenSpaces: 6.4
  },
  "El Born": {
    count: 89,
    security: 8.5,
    publicTransport: 8.9,
    services: 9.1,
    greenSpaces: 7.2
  },
  "Barceloneta": {
    count: 156,
    security: 7.3,
    publicTransport: 8.4,
    services: 8.1,
    greenSpaces: 8.8
  }
};

export function NeighborhoodRating() {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("Gracia");
  const [searchValue, setSearchValue] = useState<string>("");

  const ratingCategories = [
    { key: 'security', label: 'Seguridad', icon: '🔒' },
    { key: 'publicTransport', label: 'Conectividad', icon: '🚌' },
    { key: 'services', label: 'Servicios', icon: '🛍️' },
    { key: 'greenSpaces', label: 'Zonas verdes', icon: '🌳' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setSelectedNeighborhood(searchValue.trim());
      setSearchValue("");
    }
  };

  const currentData = NEIGHBORHOOD_DATA[selectedNeighborhood];

  return (
    <div className="w-full text-left">
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar todos los barrios de Barcelona..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            data-testid="neighborhood-search-input"
          />
        </div>
      </form>
      
      <h2 data-testid="neighborhood-section-title" className="text-xl md:text-2xl font-semibold mb-6">
        Calificaciones de barrios
      </h2>
      
      {/* Neighborhood buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        {POPULAR_NEIGHBORHOODS.map((neighborhood) => (
          <Button
            key={neighborhood}
            data-testid={`neighborhood-button-${neighborhood.toLowerCase().replace(' ', '-')}`}
            variant={selectedNeighborhood === neighborhood ? "default" : "outline"}
            onClick={() => setSelectedNeighborhood(neighborhood)}
            className={`px-4 py-2 rounded-full text-sm ${
              selectedNeighborhood === neighborhood 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {neighborhood}
          </Button>
        ))}
      </div>

      {/* Ratings display */}
      {currentData ? (
        <div data-testid="neighborhood-ratings" className="space-y-6">
          <p className="text-sm text-gray-600 mb-4">
            Basado en {currentData.count} valoraciones de residentes
          </p>
          {ratingCategories.map(({ key, label, icon }) => {
            const value = currentData[key] as number;
            const percentage = (value / 10) * 100;
            
            return (
              <div key={key} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-32 flex-shrink-0">
                  <span className="text-lg">{icon}</span>
                  <span data-testid={`rating-label-${key}`} className="text-sm text-gray-700">
                    {label}
                  </span>
                </div>
                
                <div className="flex-1 max-w-md">
                  <Progress 
                    data-testid={`rating-progress-${key}`}
                    value={percentage} 
                    className="h-2"
                  />
                </div>
                
                <div className="flex items-center gap-1 w-16 justify-end">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span data-testid={`rating-value-${key}`} className="text-sm font-medium">
                    {value.toFixed(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div data-testid="no-ratings-message" className="text-gray-500 py-8">
          <p>No hay valoraciones disponibles para {selectedNeighborhood} en este momento.</p>
          <p className="text-sm text-gray-400 mt-2">Prueba con uno de los barrios populares arriba.</p>
        </div>
      )}
    </div>
  );
}