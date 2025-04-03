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

// Estructura de distritos y barrios de Barcelona
const BARCELONA_DISTRICTS_AND_NEIGHBORHOODS = [
  {
    district: "Ciutat Vella",
    neighborhoods: ["El Raval", "El Gòtic", "La Barceloneta", "Sant Pere, Santa Caterina i la Ribera"]
  },
  {
    district: "Eixample",
    neighborhoods: ["El Fort Pienc", "La Sagrada Família", "La Dreta de l'Eixample", "L'Antiga Esquerra de l'Eixample", "La Nova Esquerra de l'Eixample", "Sant Antoni"]
  },
  {
    district: "Sants-Montjuïc",
    neighborhoods: ["El Poble-sec", "La Marina del Prat Vermell", "La Marina de Port", "La Font de la Guatlla", "Hostafrancs", "La Bordeta", "Sants-Badal", "Sants"]
  },
  {
    district: "Les Corts",
    neighborhoods: ["Les Corts", "La Maternitat i Sant Ramon", "Pedralbes"]
  },
  {
    district: "Sarrià-Sant Gervasi",
    neighborhoods: ["Vallvidrera, el Tibidabo i les Planes", "Sarrià", "Les Tres Torres", "Sant Gervasi - la Bonanova", "Sant Gervasi - Galvany", "El Putxet i el Farró"]
  },
  {
    district: "Gràcia",
    neighborhoods: ["Vallcarca i els Penitents", "El Coll", "La Salut", "Vila de Gràcia", "Camp d'en Grassot i Gràcia Nova"]
  },
  {
    district: "Horta-Guinardó",
    neighborhoods: ["El Baix Guinardó", "Can Baró", "El Guinardó", "La Font d'en Fargues", "El Carmel", "La Teixonera", "Sant Genís dels Agudells", "Montbau", "La Vall d'Hebron", "La Clota", "Horta"]
  },
  {
    district: "Nou Barris",
    neighborhoods: ["Vilapicina i la Torre Llobeta", "Porta", "El Turó de la Peira", "Can Peguera", "La Guineueta", "Canyelles", "Les Roquetes", "Verdun", "La Prosperitat", "La Trinitat Nova", "Torre Baró", "Ciutat Meridiana", "Vallbona"]
  },
  {
    district: "Sant Andreu",
    neighborhoods: ["La Trinitat Vella", "Baró de Viver", "El Bon Pastor", "Sant Andreu", "La Sagrera", "El Congrés i els Indians", "Navas"]
  },
  {
    district: "Sant Martí",
    neighborhoods: ["El Clot", "El Camp de l'Arpa del Clot", "La Verneda i la Pau", "Sant Martí de Provençals", "El Besòs i el Maresme", "Provençals del Poblenou", "Diagonal Mar i el Front Marítim del Poblenou", "El Poblenou", "El Parc i la Llacuna del Poblenou", "La Vila Olímpica del Poblenou"]
  }
];

// Lista plana de todos los barrios para manipulación fácil
const BARCELONA_NEIGHBORHOODS = BARCELONA_DISTRICTS_AND_NEIGHBORHOODS.flatMap(district => district.neighborhoods);

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
    // Si hay un solo barrio seleccionado para agencias o agentes, redirigir a la página de resultados de barrio
    if ((searchType === 'agencies' || searchType === 'agents') && selectedNeighborhoods.length === 1) {
      const encodedNeighborhood = encodeURIComponent(selectedNeighborhoods[0]);
      setLocation(`/neighborhood/${searchType}/${encodedNeighborhood}`);
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
    setSelectedNeighborhoods(prev =>
      prev.includes(neighborhood)
        ? prev.filter(n => n !== neighborhood)
        : [...prev, neighborhood]
    );
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
      
      // Cerrar el diálogo de barrios y ejecutar la búsqueda
      setIsNeighborhoodOpen(false);
      handleSearch();
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
          {(searchType === 'agencies' || searchType === 'agents') && (
            <div className="flex-1">
              <Input
                type="text"
                placeholder={`Buscar ${searchType === 'agencies' ? 'agencias' : 'agentes'} por nombre...`}
                className="w-full"
                onChange={(e) => {
                  if (searchType === 'agencies') {
                    setAgencyName(e.target.value);
                    // Realizar búsqueda con pequeño retraso para evitar muchas solicitudes
                    setTimeout(() => {
                      const params = new URLSearchParams();
                      const searchValue = e.target.value.trim();
                      if (searchValue) {
                        // Solo enviar el parámetro si hay texto escrito
                        params.append('agencyName', searchValue);
                      } else {
                        // Si no hay texto, no mostrar ningún resultado
                        params.append('showAll', 'false');
                      }
                      setLocation(`/search/agencies?${params}`);
                    }, 300);
                  } else {
                    setAgentName(e.target.value);
                    // Realizar búsqueda con pequeño retraso para evitar muchas solicitudes
                    setTimeout(() => {
                      const params = new URLSearchParams();
                      const searchValue = e.target.value.trim();
                      if (searchValue) {
                        // Solo enviar el parámetro si hay texto escrito
                        params.append('agentName', searchValue);
                      } else {
                        // Si no hay texto, no mostrar ningún resultado
                        params.append('showAll', 'false');
                      }
                      setLocation(`/search/agents?${params}`);
                    }, 300);
                  }
                }}
                value={searchType === 'agencies' ? agencyName : agentName}
                onKeyDown={handleKeyDown}
              />
            </div>
          )}

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
                "Selecciona barrios"
              )}
            </Button>
          </div>

          {(searchType === 'buy' || searchType === 'rent') && (
            <div className="flex-1 flex gap-2">
              <Select
                value={priceRange.min}
                onValueChange={(value) => setPriceRange(prev => ({
                  ...prev,
                  min: value,
                  max: value > prev.max ? value : prev.max
                }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Precio min" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map(range => (
                    <SelectItem
                      key={range.value}
                      value={range.value}
                      disabled={!!priceRange.max && parseInt(range.value) > parseInt(priceRange.max)}
                    >
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={priceRange.max}
                onValueChange={(value) => setPriceRange(prev => ({
                  ...prev,
                  max: value,
                  min: value < prev.min ? value : prev.min
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
                      disabled={!!priceRange.min && parseInt(range.value) < parseInt(priceRange.min)}
                    >
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handleSearch} className="px-8">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {searchType === 'agencies' && (
        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setIsAgencyReviewOpen(true)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Deja una reseña a tu agencia
          </Button>
        </div>
      )}

      {searchType === 'agents' && (
        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setIsAgentReviewOpen(true)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Deja una reseña a tu agente
          </Button>
        </div>
      )}

      {isAgentReviewOpen && (
        <AgentReview onClose={() => setIsAgentReviewOpen(false)} />
      )}
      
      {isAgencyReviewOpen && (
        <AgencyReview onClose={() => setIsAgencyReviewOpen(false)} />
      )}

      <Dialog open={isNeighborhoodOpen} onOpenChange={setIsNeighborhoodOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="text-lg font-semibold">BARRIOS DE BARCELONA</DialogTitle>

          <div className="space-y-4">
            <Input
              placeholder="Buscar barrio..."
              value={neighborhoodSearch}
              onChange={(e) => setNeighborhoodSearch(e.target.value)}
              onKeyDown={handleNeighborhoodKeyDown}
            />

            {selectedNeighborhoods.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">SELECCIONADOS</p>
                <div className="flex flex-wrap gap-2">
                  {selectedNeighborhoods.map(neighborhood => (
                    <span
                      key={neighborhood}
                      className="bg-primary/10 rounded-full px-3 py-1 text-sm flex items-center gap-1 cursor-pointer"
                      onClick={() => setSelectedNeighborhoods(prev => prev.filter(n => n !== neighborhood))}
                    >
                      {neighborhood}
                      <X className="h-3 w-3" />
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-[300px] overflow-auto space-y-1">
              {BARCELONA_DISTRICTS_AND_NEIGHBORHOODS.map(district => {
                // Si hay una búsqueda activa, filtrar los barrios de este distrito
                const filteredDistrictNeighborhoods = district.neighborhoods.filter(
                  n => n.toLowerCase().includes(neighborhoodSearch.toLowerCase())
                );
                
                // Si no hay barrios que coincidan con la búsqueda en este distrito, no mostrar el distrito
                if (neighborhoodSearch && filteredDistrictNeighborhoods.length === 0) {
                  return null;
                }
                
                return (
                  <div key={district.district} className="mb-2">
                    {/* Nombre del distrito (en negrita y no seleccionable) */}
                    <div className="font-bold text-sm px-3 py-1 text-gray-700">
                      {district.district}
                    </div>
                    
                    {/* Barrios del distrito */}
                    <div className="ml-2">
                      {/* Si hay búsqueda activa, mostrar solo los barrios filtrados */}
                      {(neighborhoodSearch ? filteredDistrictNeighborhoods : district.neighborhoods).map(neighborhood => (
                        <Button
                          key={neighborhood}
                          variant="ghost"
                          className={`w-full justify-start text-sm ${
                            selectedNeighborhoods.includes(neighborhood)
                              ? "bg-primary/10"
                              : ""
                          }`}
                          onClick={() => setSelectedNeighborhoods(prev =>
                            prev.includes(neighborhood)
                              ? prev.filter(n => n !== neighborhood)
                              : [...prev, neighborhood]
                          )}
                        >
                          {neighborhood}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedNeighborhoods([])}
              >
                Limpiar
              </Button>
              <Button onClick={() => setIsNeighborhoodOpen(false)}>
                Hecho
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}