import { useState, useEffect, KeyboardEvent } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { AutocompleteSearch } from "./AutocompleteSearch";
import { BARCELONA_DISTRICTS_AND_NEIGHBORHOODS, BARCELONA_NEIGHBORHOODS, BARCELONA_DISTRICTS, isDistrict } from "@/utils/neighborhoods";

// Definimos rangos de precios para el selector
const PRICE_RANGES = [
  { value: "less-than-60000", label: "<60.000 €" },
  { value: "60000", label: "60.000 €" },
  { value: "80000", label: "80.000 €" },
  { value: "100000", label: "100.000 €" },
  { value: "120000", label: "120.000 €" },
  { value: "140000", label: "140.000 €" },
  { value: "160000", label: "160.000 €" },
  { value: "180000", label: "180.000 €" },
  { value: "200000", label: "200.000 €" },
  { value: "220000", label: "220.000 €" },
  { value: "240000", label: "240.000 €" },
  { value: "260000", label: "260.000 €" },
  { value: "280000", label: "280.000 €" },
  { value: "300000", label: "300.000 €" },
  { value: "320000", label: "320.000 €" },
  { value: "340000", label: "340.000 €" },
  { value: "360000", label: "360.000 €" },
  { value: "380000", label: "380.000 €" },
  { value: "400000", label: "400.000 €" },
  { value: "450000", label: "450.000 €" },
  { value: "500000", label: "500.000 €" },
  { value: "550000", label: "550.000 €" },
  { value: "600000", label: "600.000 €" },
  { value: "650000", label: "650.000 €" },
  { value: "700000", label: "700.000 €" },
  { value: "750000", label: "750.000 €" },
  { value: "800000", label: "800.000 €" },
  { value: "850000", label: "850.000 €" },
  { value: "900000", label: "900.000 €" },
  { value: "950000", label: "950.000 €" },
  { value: "1000000", label: "1.000.000 €" },
  { value: "1100000", label: "1.100.000 €" },
  { value: "1200000", label: "1.200.000 €" },
  { value: "1300000", label: "1.300.000 €" },
  { value: "1400000", label: "1.400.000 €" },
  { value: "1500000", label: "1.500.000 €" },
  { value: "1600000", label: "1.600.000 €" },
  { value: "1700000", label: "1.700.000 €" },
  { value: "1800000", label: "1.800.000 €" },
  { value: "1900000", label: "1.900.000 €" },
  { value: "2000000", label: "2.000.000 €" },
  { value: "2100000", label: "2.100.000 €" },
  { value: "2200000", label: "2.200.000 €" },
  { value: "2300000", label: "2.300.000 €" },
  { value: "2400000", label: "2.400.000 €" },
  { value: "2500000", label: "2.500.000 €" },
  { value: "2600000", label: "2.600.000 €" },
  { value: "2700000", label: "2.700.000 €" },
  { value: "2800000", label: "2.800.000 €" },
  { value: "2900000", label: "2.900.000 €" },
  { value: "3000000", label: "3.000.000 €" },
  { value: "no-limit", label: "Sin límite" },
];

type SearchType = 'rent' | 'buy' | 'agencies' | 'agents';

export function SearchBar() {
  const [, setLocation] = useLocation();
  const [currentLocation] = useLocation();
  const { toast } = useToast();
  const [isNeighborhoodOpen, setIsNeighborhoodOpen] = useState(false);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: "any", max: "any" });
  const [agencyName, setAgencyName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [roomsFilter, setRoomsFilter] = useState<number[]>([]);

  // Determine initial search type based on URL search params
  const getInitialSearchType = (): SearchType => {
    // Check if we have a type parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type') as SearchType | null;

    // If there's a valid type parameter, use it
    if (typeParam && ['rent', 'buy', 'agencies', 'agents'].includes(typeParam)) {
      return typeParam as SearchType;
    }

    // Otherwise, don't select any tab by default
    return 'buy';
  };

  const [searchType, setSearchType] = useState<SearchType>(getInitialSearchType());

  const filteredNeighborhoods = BARCELONA_NEIGHBORHOODS.filter(n =>
    n.toLowerCase().includes(neighborhoodSearch.toLowerCase())
  );

  const handleSearch = () => {
    // Verificar si se ha seleccionado al menos una ubicación para todos los tipos de búsqueda
    if (selectedNeighborhoods.length === 0) {
      toast({
        title: "Ubicación requerida",
        description: "Por favor, selecciona un barrio, distrito o Barcelona para buscar",
        variant: "destructive",
      });
      return;
    }

    // Si hay un solo barrio/distrito/Barcelona seleccionado, redirigir a la página de resultados específica
    if (selectedNeighborhoods.length === 1) {
      const selectedValue = selectedNeighborhoods[0];
      const encodedValue = encodeURIComponent(selectedValue);

      // Determinar la pestaña según el tipo de búsqueda
      let tab = 'properties';
      if (searchType === 'agencies') tab = 'agencies';
      else if (searchType === 'agents') tab = 'agents';

      // Build query parameters for filters
      const params = new URLSearchParams();

      // Add bedroom filter if rooms are selected
      if ((searchType === 'buy' || searchType === 'rent') && roomsFilter.length > 0) {
        params.append("bedrooms", roomsFilter.join(','));
      }

      // Add price filters
      if ((searchType === 'buy' || searchType === 'rent') && priceRange.min && priceRange.min !== "any") {
        params.append("minPrice", priceRange.min);
      }
      if ((searchType === 'buy' || searchType === 'rent') && priceRange.max && priceRange.max !== "any") {
        params.append("maxPrice", priceRange.max);
      }

      const queryString = params.toString();
      const url = '/neighborhood/' + encodedValue + '/' + tab + (queryString ? '?' + queryString : '');

      // Redirigir a la página de resultados
      setLocation(url);
      return;
    }

    // Instead of changing URLs for different tabs, we'll use a common URL with search parameters
    const params = new URLSearchParams();

    // Add the search type as a parameter
    params.append("type", searchType);

    // Add location parameters
    if (selectedNeighborhoods.length > 0) {
      params.append("neighborhoods", selectedNeighborhoods.join(","));
    }

    // Property specific parameters
    if ((searchType === 'buy' || searchType === 'rent') && priceRange.min && priceRange.min !== "any") {
      params.append("minPrice", priceRange.min);
    }
    if ((searchType === 'buy' || searchType === 'rent') && priceRange.max && priceRange.max !== "any") {
      params.append("maxPrice", priceRange.max);
    }

    // Add room filter
    if ((searchType === 'buy' || searchType === 'rent') && roomsFilter.length > 0) {
      params.append("rooms", roomsFilter.join(','));
    }

    // Agency search parameters
    if (searchType === 'agencies') {
      if (agencyName && agencyName.trim() !== '') {
        params.append('agencyName', agencyName.trim());
      }
      // Show all agencies when no search criteria
      if (!agencyName.trim() && !selectedNeighborhoods.length) {
        params.append('showAll', 'true');
      }
    }

    // Agent search parameters
    if (searchType === 'agents') {
      if (agentName && agentName.trim() !== '') {
        params.append('agentName', agentName.trim());
      }
      // Show all agents when no search criteria
      if (!agentName.trim() && !selectedNeighborhoods.length) {
        params.append('showAll', 'true');
      }
    }

    const queryString = params.toString();
    setLocation('/search' + (queryString ? '?' + queryString : ''));
  };

  // Reset state when search type changes without changing URL
  const handleSearchTypeChange = (newType: SearchType) => {
    setSearchType(newType);
    setSelectedNeighborhoods([]);
    setPriceRange({ min: "any", max: "any" });
    setAgencyName('');
    setAgentName('');

    // We no longer navigate to different URLs when changing tabs
    // Instead, we just stay on the current page and let the parent component
    // handle showing different content based on the searchType state
  };

  const toggleNeighborhood = (neighborhood: string) => {
    // Si el barrio ya está seleccionado, lo quitamos
    if (selectedNeighborhoods.includes(neighborhood)) {
      setSelectedNeighborhoods([]);
    } else {
      // Solo permitimos un barrio a la vez
      setSelectedNeighborhoods([neighborhood]);
    }

    // Nota: Ya no ejecutamos la búsqueda automáticamente al seleccionar un barrio.
    // Ahora el usuario debe hacer clic en "Buscar" para iniciar la búsqueda
  };

  // Handler for Enter key press in search inputs
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handler for Enter key press in neighborhood search
  const handleNeighborhoodKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (filteredNeighborhoods.length > 0) {
        // If there's only one filtered neighborhood, select it
        if (filteredNeighborhoods.length === 1) {
          toggleNeighborhood(filteredNeighborhoods[0]);
        }
        // If the exact search term matches a neighborhood, select it
        else if (filteredNeighborhoods.some(n => n.toLowerCase() === neighborhoodSearch.toLowerCase())) {
          const exactMatch = filteredNeighborhoods.find(n => 
            n.toLowerCase() === neighborhoodSearch.toLowerCase()
          );
          if (exactMatch) toggleNeighborhood(exactMatch);
        }
      }

      // Solo cerrar el diálogo de barrios, pero NO ejecutar búsqueda automática
      setIsNeighborhoodOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4">
          <Button
            variant={searchType === 'rent' ? 'default' : 'ghost'}
            className="px-4 md:px-8 text-sm md:text-base flex-shrink-0"
            style={{ flex: 1, minWidth: '120px' }}
            onClick={() => handleSearchTypeChange('rent')}
          >
            Alquilar
          </Button>
          <Button
            variant={searchType === 'buy' ? 'default' : 'ghost'}
            className="px-4 md:px-8 text-sm md:text-base flex-shrink-0"
            style={{ flex: 1, minWidth: '120px' }}
            onClick={() => handleSearchTypeChange('buy')}
          >
            Comprar
          </Button>
          <Button
            variant={searchType === 'agencies' ? 'default' : 'ghost'}
            className="px-4 md:px-8 text-sm md:text-base flex-shrink-0"
            style={{ flex: 1, minWidth: '120px' }}
            onClick={() => handleSearchTypeChange('agencies')}
          >
            Agencias
          </Button>
          <Button
            variant={searchType === 'agents' ? 'default' : 'ghost'}
            className="px-4 md:px-8 text-sm md:text-base flex-shrink-0"
            style={{ flex: 1, minWidth: '120px' }}
            onClick={() => handleSearchTypeChange('agents')}
          >
            Agentes
          </Button>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          {/* Buscador para Agencias y Agentes */}
          {(searchType === 'agencies' || searchType === 'agents') && (
            <>
              <div className="flex-1 relative" style={{ flex: 5 }}>
                <AutocompleteSearch 
                  type={searchType as 'agencies' | 'agents'} 
                  placeholder={'Buscar ' + (searchType === 'agencies' ? 'agencias' : 'agentes') + ' por nombre...'}
                  onSelect={(result) => {
                    // En vez de solo actualizar el estado, navegamos directamente al perfil
                    const targetPath = searchType === 'agencies'
                      ? '/agencias/' + result.id
                      : '/agentes/' + result.id;

                    console.log('SearchBar - navigating to profile:', targetPath);
                    // Use pushState to navigate without full page refresh
                    window.history.pushState({}, '', targetPath);
                    // Trigger a popstate event to let React Router handle the navigation
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                />
              </div>

              {/* Selector de barrio para Agencias y Agentes */}
              <div className="flex-1" style={{ flex: 3 }}>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-2 px-3"
                  onClick={() => setIsNeighborhoodOpen(true)}
                >
                  {selectedNeighborhoods.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedNeighborhoods.map(n => (
                        <span key={n} className="bg-primary/10 rounded px-2 py-1 text-sm">
                          {n}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "Selecciona un barrio"
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Filtros para Alquilar y Comprar */}
          {(searchType === 'buy' || searchType === 'rent') && (
            <>
              {/* 3. Selección de barrio */}
              <div className="flex-1" style={{ flex: 4 }}>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-2 px-3"
                  onClick={() => setIsNeighborhoodOpen(true)}
                >
                  {selectedNeighborhoods.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedNeighborhoods.map(n => (
                        <span key={n} className="bg-primary/10 rounded px-2 py-1 text-sm">
                          {n}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "Selecciona un barrio"
                  )}
                </Button>
              </div>
            </>
          )}

          <Button
            onClick={handleSearch}
            className="flex items-center gap-2 px-6 flex-shrink-0"
            style={{ flex: 1, minWidth: '120px' }}
          >
            <Search className="h-4 w-4" /> Buscar
          </Button>
        </div>

        {/* Review buttons have been removed */}
      </div>

      {/* Dialog for neighborhood selection */}
      <Dialog open={isNeighborhoodOpen} onOpenChange={setIsNeighborhoodOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="text-lg font-semibold">SELECCIONA UN BARRIO</DialogTitle>
          <div className="space-y-4">
            <Input
              placeholder="Buscar barrio..."
              value={neighborhoodSearch}
              onChange={(e) => setNeighborhoodSearch(e.target.value)}
              onKeyDown={handleNeighborhoodKeyDown}
            />

            {selectedNeighborhoods.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">BARRIO SELECCIONADO</p>
                <div className="flex flex-wrap gap-2">
                  {selectedNeighborhoods.map(neighborhood => (
                    <span
                      key={neighborhood}
                      className="bg-primary/10 rounded-full px-3 py-1 text-sm flex items-center gap-1 cursor-pointer"
                      onClick={() => toggleNeighborhood(neighborhood)}
                    >
                      {neighborhood}
                      <X className="h-3 w-3" />
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-[300px] overflow-auto">
              {/* Barcelona option (for no filter) */}
              <div className="mb-4">
                <Button
                  variant="ghost"
                  className={"w-full justify-start " + (selectedNeighborhoods.includes("Barcelona") ? "bg-primary/10" : "")}
                  onClick={() => toggleNeighborhood("Barcelona")}
                >
                  Barcelona (Todos los barrios)
                </Button>
              </div>

              {/* Group neighborhoods by district */}
              {BARCELONA_DISTRICTS_AND_NEIGHBORHOODS.map((district) => {
                // Filter neighborhoods in this district
                const filteredNeighborhoodsInDistrict = district.neighborhoods.filter(n =>
                  n.toLowerCase().includes(neighborhoodSearch.toLowerCase())
                );

                // Show distrito even if no neighborhoods match (for search)
                const showDistrict = neighborhoodSearch === "" || 
                  district.district.toLowerCase().includes(neighborhoodSearch.toLowerCase()) ||
                  filteredNeighborhoodsInDistrict.length > 0;

                if (!showDistrict) return null;

                return (
                  <div key={district.district} className="mb-4">
                    {/* Make distrito selectable */}
                    <Button
                      variant="ghost"
                      className={"w-full justify-start " + (selectedNeighborhoods.includes(district.district) ? "bg-primary/10" : "")}
                      onClick={() => toggleNeighborhood(district.district)}
                    >
                      {district.district}
                    </Button>

                    {filteredNeighborhoodsInDistrict.length > 0 && filteredNeighborhoodsInDistrict.map(neighborhood => (
                      <Button
                        key={neighborhood}
                        variant="ghost"
                        className={"w-full justify-start pl-6 " + (selectedNeighborhoods.includes(neighborhood) ? "bg-primary/10" : "")}
                        onClick={() => toggleNeighborhood(neighborhood)}
                      >
                        {neighborhood}
                      </Button>
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between">
              <Button 
                onClick={() => {
                  setIsNeighborhoodOpen(false);
                  // No ejecutar búsqueda automáticamente
                }}
                className="ml-auto"
                disabled={selectedNeighborhoods.length === 0}
              >
                Seleccionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review dialog components have been removed */}
    </div>
  );
}