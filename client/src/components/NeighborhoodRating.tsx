import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { searchNeighborhoods, getNeighborhoodDisplayName, parseNeighborhoodDisplayName } from "@/utils/neighborhoods";

const POPULAR_NEIGHBORHOODS = [
  { neighborhood: "Gracia", district: null, city: "Barcelona", display: "Gracia, Barcelona" },
  { neighborhood: "Eixample", district: null, city: "Barcelona", display: "Eixample, Barcelona" }, 
  { neighborhood: "El Born", district: "Ciutat Vella", city: "Barcelona", display: "El Born, Ciutat Vella, Barcelona" },
  { neighborhood: "Rosas", district: "San Blas-Canillejas", city: "Madrid", display: "Rosas, San Blas-Canillejas, Madrid" }
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

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const StarRatingInput = ({ value, onChange, disabled = false }: StarRatingProps) => {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="flex gap-1 mt-2">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className={`text-lg ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHoverValue(star)}
          onMouseLeave={() => !disabled && setHoverValue(0)}
        >
          <Star 
            className={`h-5 w-5 ${
              (hoverValue || value) >= star
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-600 font-medium">
        {value > 0 ? `${value}/10` : 'Sin calificar'}
      </span>
    </div>
  );
};

export function NeighborhoodRating() {
  const [selectedLocation, setSelectedLocation] = useState<{neighborhood: string, district: string | null, city: string}>({neighborhood: "Gracia", district: null, city: "Barcelona"});
  const [searchValue, setSearchValue] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [showRatingForm, setShowRatingForm] = useState<boolean>(false);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({
    security: 0,
    parking: 0,
    familyFriendly: 0,
    publicTransport: 0,
    greenSpaces: 0,
    services: 0,
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // We'll use the hierarchical search function instead of fetching all neighborhoods
  // since the dataset is now much larger with Madrid included

  // Fetch ratings for the selected neighborhood with hierarchical parameters
  const { data: ratings, isLoading } = useQuery<NeighborhoodAverages>({
    queryKey: [`/api/neighborhoods/ratings/average`, { 
      neighborhood: selectedLocation.neighborhood, 
      city: selectedLocation.city, 
      district: selectedLocation.district 
    }],
    enabled: !!selectedLocation.neighborhood && !!selectedLocation.city,
    staleTime: 300000, // 5 minutes cache
    queryFn: async () => {
      const params = new URLSearchParams({
        neighborhood: selectedLocation.neighborhood,
        city: selectedLocation.city,
        ...(selectedLocation.district && { district: selectedLocation.district })
      });
      const response = await fetch(`/api/neighborhoods/ratings/average?${params}`);
      if (!response.ok) throw new Error('Failed to fetch ratings');
      return response.json();
    },
  });

  // Filter neighborhoods using hierarchical search
  const filteredNeighborhoods = searchValue.length >= 3 
    ? searchNeighborhoods(searchValue).map(result => 
        getNeighborhoodDisplayName(result.neighborhood, result.district, result.city)
      ).slice(0, 10)
    : [];

  // Rating submission mutation
  const ratingMutation = useMutation({
    mutationFn: async (ratingData: any) => {
      return await apiRequest('POST', '/api/neighborhoods/ratings', ratingData);
    },
    onSuccess: () => {
      toast({
        title: "¡Valoración enviada!",
        description: `Tu valoración para ${getNeighborhoodDisplayName(selectedLocation.neighborhood, selectedLocation.district, selectedLocation.city)} ha sido guardada con éxito.`,
      });
      setShowRatingForm(false);
      setUserRatings({
        security: 0,
        parking: 0,
        familyFriendly: 0,
        publicTransport: 0,
        greenSpaces: 0,
        services: 0,
      });
      // Invalidate and refetch ratings to show updated data
      queryClient.invalidateQueries({ 
        queryKey: [`/api/neighborhoods/ratings/average`, { 
          neighborhood: selectedLocation.neighborhood, 
          city: selectedLocation.city, 
          district: selectedLocation.district 
        }] 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al enviar valoración",
        description: error?.message || "No se pudo enviar tu valoración. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

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

  const selectNeighborhood = (displayName: string) => {
    const parsed = parseNeighborhoodDisplayName(displayName);
    if (parsed) {
      setSelectedLocation(parsed);
    }
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
          // Try to parse the search value
          const parsed = parseNeighborhoodDisplayName(searchValue.trim());
          if (parsed) {
            setSelectedLocation(parsed);
            setSearchValue("");
            setShowSuggestions(false);
          }
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  };

  const handleRatingChange = (category: string, value: number) => {
    setUserRatings(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSubmitRating = () => {
    // Check if all ratings are filled
    const hasAllRatings = Object.values(userRatings).every(rating => rating > 0);
    
    if (!hasAllRatings) {
      toast({
        title: "Faltan calificaciones",
        description: "Por favor, califica todas las categorías antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    const ratingData = {
      neighborhood: selectedLocation.neighborhood,
      city: selectedLocation.city,
      district: selectedLocation.district,
      ...userRatings,
      userId: -1, // Anonymous user
    };

    ratingMutation.mutate(ratingData);
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h2 data-testid="neighborhood-section-title" className="text-xl md:text-2xl font-semibold mb-6">
          Busca y conoce los barrios de tu interés
        </h2>
        
        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar barrios de Barcelona y Madrid..."
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
        {POPULAR_NEIGHBORHOODS.map((location) => (
          <Button
            key={location.display}
            data-testid={`neighborhood-button-${location.neighborhood.toLowerCase().replace(' ', '-')}`}
            variant={selectedLocation.neighborhood === location.neighborhood && selectedLocation.city === location.city ? "default" : "outline"}
            onClick={() => setSelectedLocation(location)}
            className={`px-4 py-2 rounded-full text-sm ${
              selectedLocation.neighborhood === location.neighborhood && selectedLocation.city === location.city
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {location.display}
          </Button>
        ))}
      </div>

      {/* Rate this neighborhood button */}
      {selectedLocation.neighborhood && !showRatingForm && (
        <div className="mb-8">
          <Button 
            onClick={() => setShowRatingForm(true)}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-blue-700 text-white px-6 py-2 rounded-lg bg-[#0284c5]"
            data-testid="rate-neighborhood-button"
          >
            Calificar este barrio
          </Button>
        </div>
      )}

      {/* Rating form */}
      {showRatingForm && (
        <Card className="mb-8 border shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Califica: {getNeighborhoodDisplayName(selectedLocation.neighborhood, selectedLocation.district, selectedLocation.city)}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowRatingForm(false)}
                data-testid="close-rating-form"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {ratingCategories.map(({ key, label, icon }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <label className="text-sm font-medium text-gray-700">
                      {label}
                    </label>
                  </div>
                  <StarRatingInput
                    value={userRatings[key] || 0}
                    onChange={(value) => handleRatingChange(key, value)}
                    disabled={ratingMutation.isPending}
                  />
                </div>
              ))}
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSubmitRating}
                  disabled={ratingMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  data-testid="submit-rating-button"
                >
                  {ratingMutation.isPending ? "Enviando..." : "Enviar valoración"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRatingForm(false)}
                  disabled={ratingMutation.isPending}
                  data-testid="cancel-rating-button"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
      ) : selectedLocation.neighborhood && (!ratings || ratings.count === 0) ? (
        <div data-testid="no-ratings-message" className="text-gray-500 py-8">
          <p>No hay valoraciones disponibles para {getNeighborhoodDisplayName(selectedLocation.neighborhood, selectedLocation.district, selectedLocation.city)} en este momento.</p>
          <p className="text-sm text-gray-400 mt-2">Prueba con uno de los barrios populares arriba.</p>
        </div>
      ) : null}
      </div>
    </div>
  );
}