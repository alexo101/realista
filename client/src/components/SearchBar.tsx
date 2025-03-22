import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BARCELONA_NEIGHBORHOODS = [
  "Barceloneta",
  "Born",
  "Eixample",
  "El Raval",
  "Gràcia",
  "Les Corts",
  "Poble Sec",
  "Poblenou",
  "Sagrada Familia",
  "Sant Andreu",
  "Sant Antoni",
  "Sant Martí",
  "Sants",
  "Sarrià-Sant Gervasi"
];

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
    if ((searchType === 'agencies' || searchType === 'agents')) {
      const searchTerm = searchType === 'agencies' ? agencyName : agentName;
      if (!searchTerm && !selectedNeighborhoods.length) {
        toast({
          title: "Error",
          description: `Por favor, introduce un nombre de ${searchType === 'agencies' ? 'agencia' : 'agente'} o selecciona un barrio.`,
          variant: "destructive",
        });
        return;
      }
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
    if (selectedNeighborhoods.length > 0) {
      params.append("neighborhoods", selectedNeighborhoods.join(","));
    }
    if ((searchType === 'buy' || searchType === 'rent') && priceRange.min) {
      params.append("minPrice", priceRange.min);
    }
    if ((searchType === 'buy' || searchType === 'rent') && priceRange.max) {
      params.append("maxPrice", priceRange.max);
    }
    if (searchType === 'agencies' && agencyName) {
      params.append('agencyName', agencyName);
    }
    if (searchType === 'agents' && agentName) {
      params.append('agentName', agentName);
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
  };

  const toggleNeighborhood = (neighborhood: string) => {
    setSelectedNeighborhoods(prev =>
      prev.includes(neighborhood)
        ? prev.filter(n => n !== neighborhood)
        : [...prev, neighborhood]
    );
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
                placeholder={`Buscar ${searchType === 'agencies' ? 'agencias' : 'agentes'}...`}
                className="w-full"
                onChange={searchType === 'agencies' ? (e) => setAgencyName(e.target.value) : (e) => setAgentName(e.target.value)}
                value={searchType === 'agencies' ? agencyName : agentName}
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
                      disabled={priceRange.max && parseInt(range.value) > parseInt(priceRange.max)}
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
                      disabled={priceRange.min && parseInt(range.value) < parseInt(priceRange.min)}
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
          <Button variant="outline" size="lg">
            Deja una reseña a tu agencia
          </Button>
        </div>
      )}

      {searchType === 'agents' && (
        <div className="text-center">
          <Button variant="outline" size="lg">
            Deja una reseña a tu agente
          </Button>
        </div>
      )}

      <Dialog open={isNeighborhoodOpen} onOpenChange={setIsNeighborhoodOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">BARRIOS DE BARCELONA</h2>
          </div>

          <div className="space-y-4">
            <Input
              placeholder="Buscar barrio..."
              value={neighborhoodSearch}
              onChange={(e) => setNeighborhoodSearch(e.target.value)}
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

            <div className="max-h-[300px] overflow-auto">
              {filteredNeighborhoods.map(neighborhood => (
                <Button
                  key={neighborhood}
                  variant="ghost"
                  className={`w-full justify-start ${
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