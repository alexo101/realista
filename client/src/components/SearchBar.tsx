import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

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

export function SearchBar() {
  const [, setLocation] = useLocation();
  const [isNeighborhoodOpen, setIsNeighborhoodOpen] = useState(false);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });

  const filteredNeighborhoods = BARCELONA_NEIGHBORHOODS.filter(n =>
    n.toLowerCase().includes(neighborhoodSearch.toLowerCase())
  );

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedNeighborhoods.length > 0) {
      params.append("neighborhoods", selectedNeighborhoods.join(","));
    }
    if (priceRange.min) params.append("minPrice", priceRange.min);
    if (priceRange.max) params.append("maxPrice", priceRange.max);
    
    setLocation(`/search?${params.toString()}`);
  };

  const toggleNeighborhood = (neighborhood: string) => {
    setSelectedNeighborhoods(prev =>
      prev.includes(neighborhood)
        ? prev.filter(n => n !== neighborhood)
        : [...prev, neighborhood]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center gap-4">
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

        <div className="flex-1 flex gap-2">
          <Input
            type="number"
            placeholder="Precio min"
            value={priceRange.min}
            onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
          />
          <Input
            type="number"
            placeholder="Precio max"
            value={priceRange.max}
            onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
          />
        </div>

        <Button onClick={handleSearch} className="px-8">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isNeighborhoodOpen} onOpenChange={setIsNeighborhoodOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">BARRIOS DE BARCELONA</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsNeighborhoodOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
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
                      className="bg-primary/10 rounded-full px-3 py-1 text-sm flex items-center gap-1"
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
              {filteredNeighborhoods.map(neighborhood => (
                <Button
                  key={neighborhood}
                  variant="ghost"
                  className={`w-full justify-start ${
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

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedNeighborhoods([])}
              >
                Reset
              </Button>
              <Button onClick={() => setIsNeighborhoodOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
