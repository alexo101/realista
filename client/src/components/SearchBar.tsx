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
import { AgentReview } from "./AgentReview";
import { AgencyReview } from "./AgencyReview";
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
  const [isAgentReviewOpen, setIsAgentReviewOpen] = useState(false);
  const [isAgencyReviewOpen, setIsAgencyReviewOpen] = useState(false);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const [agencyName, setAgencyName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [roomsFilter, setRoomsFilter] = useState<number[]>([]);

  // Determine initial search type based on current location
  const getInitialSearchType = (): SearchType => {
    if (currentLocation.startsWith('/search/agencies')) return 'agencies';
    if (currentLocation.startsWith('/search/agents')) return 'agents';
    if (currentLocation.startsWith('/search/rent')) return 'rent';
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
      
      // Redirigir a la página de resultados
      setLocation(`/neighborhood/${encodedValue}/${tab}`);
      return;
    }
    
    let baseUrl = '';
    switch (searchType) {
      case 'agencies':
        baseUrl = '/search/agencies';
        break;
      case 'agents':
        baseUrl = '/search/agents';
        break;
      case 'rent':
        baseUrl = '/search/rent';
        break;
      case 'buy':
        baseUrl = '/search/buy';
        break;
    }

    const params = new URLSearchParams();
    
    // Añadir parámetros según el tipo de búsqueda
    if (selectedNeighborhoods.length > 0) {
      params.append("neighborhoods", selectedNeighborhoods.join(","));
    }
    
    // Parámetros específicos para propiedades
    if ((searchType === 'buy' || searchType === 'rent') && priceRange.min) {
      params.append("minPrice", priceRange.min);
    }
    if ((searchType === 'buy' || searchType === 'rent') && priceRange.max) {
      params.append("maxPrice", priceRange.max);
    }
    
    // Añadir filtro de habitaciones
    if ((searchType === 'buy' || searchType === 'rent') && roomsFilter.length > 0) {
      params.append("rooms", roomsFilter.join(','));
    }
    
    // Parámetros para búsqueda de agencias
    if (searchType === 'agencies') {
      if (agencyName && agencyName.trim() !== '') {
        params.append('agencyName', agencyName.trim());
      }
      // Mostrar todas las agencias cuando no hay criterios de búsqueda
      if (!agencyName.trim() && !selectedNeighborhoods.length) {
        params.append('showAll', 'true');
      }
    }
    
    // Parámetros para búsqueda de agentes
    if (searchType === 'agents') {
      if (agentName && agentName.trim() !== '') {
        params.append('agentName', agentName.trim());
      }
      // Mostrar todos los agentes cuando no hay criterios de búsqueda
      if (!agentName.trim() && !selectedNeighborhoods.length) {
        params.append('showAll', 'true');
      }
    }

    const queryString = params.toString();
    setLocation(`${baseUrl}${queryString ? '?' + queryString : ''}`);
  };

  // Reset state when search type changes
  const handleSearchTypeChange = (newType: SearchType) => {
    setSearchType(newType);
    setSelectedNeighborhoods([]);
    setPriceRange({ min: "", max: "" });
    setRoomsFilter([]);
    setAgencyName('');
    setAgentName('');
    
    // Ejecutar búsqueda después de actualizar el estado
    setTimeout(() => {
      // Construir la URL base según el nuevo tipo de búsqueda
      let baseUrl = '';
      switch (newType) {
        case 'agencies':
          // Para agencias, no mostrar resultados inicialmente
          baseUrl = '/search/agencies?showAll=false';
          break;
        case 'agents':
          // Para agentes, no mostrar resultados inicialmente
          baseUrl = '/search/agents?showAll=false';
          break;
        case 'rent':
          // Para alquiler, no mostrar resultados inicialmente hasta que se busque explícitamente
          baseUrl = '/search/rent?initialLoad=true';
          break;
        case 'buy':
          baseUrl = '/search/buy';
          break;
      }
      setLocation(baseUrl);
    }, 0);
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
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant={searchType === 'rent' ? 'default' : 'ghost'}
            className="rounded-none px-8"
            onClick={() => handleSearchTypeChange('rent')}
          >
            Alquilar
          </Button>
          <Button
            variant={searchType === 'buy' ? 'default' : 'ghost'}
            className="rounded-none px-8"
            onClick={() => handleSearchTypeChange('buy')}
          >
            Comprar
          </Button>
          <Button
            variant={searchType === 'agencies' ? 'default' : 'ghost'}
            className="rounded-none px-8"
            onClick={() => handleSearchTypeChange('agencies')}
          >
            Agencias
          </Button>
          <Button
            variant={searchType === 'agents' ? 'default' : 'ghost'}
            className="rounded-none px-8"
            onClick={() => handleSearchTypeChange('agents')}
          >
            Agentes
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* Buscador para Agencias y Agentes */}
          {(searchType === 'agencies' || searchType === 'agents') && (
            <>
              <div className="flex-1 relative" style={{ flex: 2 }}>
                <AutocompleteSearch 
                  type={searchType as 'agencies' | 'agents'} 
                  placeholder={`Buscar ${searchType === 'agencies' ? 'agencias' : 'agentes'} por nombre...`}
                  onSelect={(result) => {
                    // Actualiza el estado con el resultado seleccionado
                    if (searchType === 'agencies') {
                      setAgencyName(result.agencyName || '');
                    } else {
                      setAgentName(`${result.name || ''} ${result.surname || ''}`);
                    }
                  }}
                />
              </div>

              {/* Selector de barrio para Agencias y Agentes */}
              <div className="flex-1">
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
              {/* 1. Precio máximo */}
              <div className="flex-1">
                <Select
                  value={priceRange.max}
                  onValueChange={(value) => setPriceRange(prev => ({
                    ...prev,
                    max: value
                  }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Precio max" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map(range => (
                      <SelectItem
                        key={range.value}
                        value={range.value}
                      >
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. Habitaciones */}
              <div className="flex-1">
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={
                      roomsFilter.length > 0 
                        ? `${roomsFilter.length} seleccionadas` 
                        : "Habitaciones"
                    } />
                  </SelectTrigger>
                  <SelectContent className="w-[240px]">
                    <div className="space-y-2 px-1 py-2">
                      <label 
                        className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (roomsFilter.includes(0)) {
                            setRoomsFilter(prev => prev.filter(r => r !== 0));
                          } else {
                            setRoomsFilter([0]); // Solo se permite seleccionar estudios
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300" 
                          checked={roomsFilter.includes(0)}
                          onChange={() => {}} // Controlado por el onClick del label
                        />
                        <span>0 habitaciones (estudios)</span>
                      </label>
                      <label 
                        className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (roomsFilter.includes(1)) {
                            // Si 1 está seleccionado, lo quitamos junto con todos los superiores
                            setRoomsFilter(prev => prev.filter(r => r !== 1 && r !== 2 && r !== 3 && r !== 4));
                          } else {
                            // Si no está seleccionado, lo seleccionamos junto con todos los superiores
                            // Y nos aseguramos de quitar 0 (estudios) si estuviera seleccionado
                            setRoomsFilter(prev => {
                              const newFilter = prev.filter(r => r !== 0);
                              return [...newFilter, 1, 2, 3, 4];
                            });
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300" 
                          checked={roomsFilter.includes(1)}
                          onChange={() => {}} // Controlado por el onClick del label
                        />
                        <span>1</span>
                      </label>
                      <label 
                        className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (roomsFilter.includes(2)) {
                            // Si 2 está seleccionado, lo quitamos junto con todos los superiores
                            setRoomsFilter(prev => prev.filter(r => r !== 2 && r !== 3 && r !== 4));
                          } else {
                            // Si no está seleccionado, lo seleccionamos junto con todos los superiores
                            // Y nos aseguramos de quitar 0 (estudios) si estuviera seleccionado
                            setRoomsFilter(prev => {
                              const newFilter = prev.filter(r => r !== 0);
                              return [...newFilter, 2, 3, 4];
                            });
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300" 
                          checked={roomsFilter.includes(2)}
                          onChange={() => {}} // Controlado por el onClick del label
                        />
                        <span>2</span>
                      </label>
                      <label 
                        className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (roomsFilter.includes(3)) {
                            // Si 3 está seleccionado, lo quitamos junto con todos los superiores
                            setRoomsFilter(prev => prev.filter(r => r !== 3 && r !== 4));
                          } else {
                            // Si no está seleccionado, lo seleccionamos junto con todos los superiores
                            // Y nos aseguramos de quitar 0 (estudios) si estuviera seleccionado
                            setRoomsFilter(prev => {
                              const newFilter = prev.filter(r => r !== 0);
                              return [...newFilter, 3, 4];
                            });
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300" 
                          checked={roomsFilter.includes(3)}
                          onChange={() => {}} // Controlado por el onClick del label
                        />
                        <span>3</span>
                      </label>
                      <label 
                        className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (roomsFilter.includes(4)) {
                            // Si 4 está seleccionado, lo quitamos
                            setRoomsFilter(prev => prev.filter(r => r !== 4));
                          } else {
                            // Si no está seleccionado, lo seleccionamos
                            // Y nos aseguramos de quitar 0 (estudios) si estuviera seleccionado
                            setRoomsFilter(prev => {
                              const newFilter = prev.filter(r => r !== 0);
                              return [...newFilter, 4];
                            });
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300" 
                          checked={roomsFilter.includes(4)}
                          onChange={() => {}} // Controlado por el onClick del label
                        />
                        <span>4 habitaciones o más</span>
                      </label>
                    </div>
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Selección de barrio */}
              <div className="flex-1">
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
            className="flex items-center gap-2 px-6"
          >
            <Search className="h-4 w-4" /> Buscar
          </Button>
        </div>
        
        <div className="flex items-center gap-4 mt-4">
          <Button
            variant="ghost"
            className="text-primary flex items-center gap-2 text-sm"
            onClick={() => setIsAgentReviewOpen(true)}
            aria-label="Valorar agente"
          >
            <Pencil className="h-4 w-4" /> Valorar agente
          </Button>
          
          <Button
            variant="ghost"
            className="text-primary flex items-center gap-2 text-sm"
            onClick={() => setIsAgencyReviewOpen(true)}
            aria-label="Valorar agencia"
          >
            <Pencil className="h-4 w-4" /> Valorar agencia
          </Button>
        </div>
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
                  className={`w-full justify-start ${
                    selectedNeighborhoods.includes("Barcelona")
                      ? "bg-primary/10"
                      : ""
                  }`}
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
                      className={`w-full justify-start ${
                        selectedNeighborhoods.includes(district.district)
                          ? "bg-primary/10"
                          : ""
                      }`}
                      onClick={() => toggleNeighborhood(district.district)}
                    >
                      {district.district}
                    </Button>
                    
                    {filteredNeighborhoodsInDistrict.length > 0 && filteredNeighborhoodsInDistrict.map(neighborhood => (
                      <Button
                        key={neighborhood}
                        variant="ghost"
                        className={`w-full justify-start pl-6 ${
                          selectedNeighborhoods.includes(neighborhood)
                            ? "bg-primary/10"
                            : ""
                        }`}
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

      {/* Agent Review Dialog */}
      {isAgentReviewOpen && (
        <AgentReview onClose={() => setIsAgentReviewOpen(false)} />
      )}

      {/* Agency Review Dialog */}
      {isAgencyReviewOpen && (
        <AgencyReview onClose={() => setIsAgencyReviewOpen(false)} />
      )}
    </div>
  );
}