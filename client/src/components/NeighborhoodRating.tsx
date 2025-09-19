import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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

interface NeighborhoodAverages {
  count: number;
  security: number;
  parking: number;
  familyFriendly: number;
  publicTransport: number;
  greenSpaces: number;
  services: number;
}

export function NeighborhoodRating() {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("Gracia");
  const [searchValue, setSearchValue] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch all neighborhoods with ratings
  const { data: allNeighborhoods } = useQuery<string[]>({
    queryKey: ['/api/neighborhoods'],
    staleTime: 300000, // 5 minutes cache
  });

  // Fetch ratings for the selected neighborhood  
  const { data: ratings, isLoading } = useQuery<NeighborhoodAverages>({
    queryKey: [`/api/neighborhoods/ratings/average?neighborhood=${selectedNeighborhood}`],
    enabled: !!selectedNeighborhood,
    staleTime: 300000, // 5 minutes cache
  });

  // Filter neighborhoods based on search input
  const filteredNeighborhoods = allNeighborhoods?.filter(neighborhood =>
    neighborhood.toLowerCase().includes(searchValue.toLowerCase())
  ) || [];

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ratingCategories = [
    { key: 'security' as keyof NeighborhoodAverages, label: 'Seguridad', icon: '🔒' },
    { key: 'parking' as keyof NeighborhoodAverages, label: 'Aparcamiento', icon: '🚗' },
    { key: 'familyFriendly' as keyof NeighborhoodAverages, label: 'Ambiente familiar', icon: '👨‍👩‍👧‍👦' },
    { key: 'publicTransport' as keyof NeighborhoodAverages, label: 'Conectividad', icon: '🚌' },
    { key: 'greenSpaces' as keyof NeighborhoodAverages, label: 'Zonas verdes', icon: '🌳' },
    { key: 'services' as keyof NeighborhoodAverages, label: 'Servicios', icon: '🛍️' },
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setShowSuggestions(value.length > 0);
    setHighlightedIndex(-1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setSelectedNeighborhood(searchValue.trim());
      setSearchValue("");
      setShowSuggestions(false);
    }
  };

  const selectNeighborhood = (neighborhood: string) => {
    setSelectedNeighborhood(neighborhood);
    setSearchValue("");
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredNeighborhoods.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredNeighborhoods.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredNeighborhoods.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          selectNeighborhood(filteredNeighborhoods[highlightedIndex]);
        } else if (searchValue.trim()) {
          selectNeighborhood(searchValue.trim());
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  };

  return (
    <div className="w-full">
      <h2 data-testid="neighborhood-section-title" className="text-xl md:text-2xl font-semibold mb-6 text-left">
        Busca y conoce los barrios de tu interés
      </h2>
      
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar todos los barrios de Barcelona..."
            value={searchValue}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(searchValue.length > 0)}
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            data-testid="neighborhood-search-input"
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && filteredNeighborhoods.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 mt-1"
              data-testid="neighborhood-suggestions"
            >
              {filteredNeighborhoods.map((neighborhood, index) => (
                <button
                  key={neighborhood}
                  type="button"
                  onClick={() => selectNeighborhood(neighborhood)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                    index === highlightedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  } first:rounded-t-lg last:rounded-b-lg`}
                  data-testid={`suggestion-${neighborhood.toLowerCase().replace(/ /g, '-')}`}
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <span>{neighborhood}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </form>
      
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
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(ratingCategories.length)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : ratings && ratings.count > 0 ? (
        <div data-testid="neighborhood-ratings" className="space-y-6">
          <p className="text-sm text-gray-600 mb-4">
            Basado en {ratings.count} valoraciones de residentes
          </p>
          {ratingCategories.map(({ key, label, icon }) => {
            const value = ratings[key] as number;
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
      ) : selectedNeighborhood && (!ratings || ratings.count === 0) ? (
        <div data-testid="no-ratings-message" className="text-gray-500 py-8">
          <p>No hay valoraciones disponibles para {selectedNeighborhood} en este momento.</p>
          <p className="text-sm text-gray-400 mt-2">Prueba con uno de los barrios populares arriba.</p>
        </div>
      ) : null}
    </div>
  );
}