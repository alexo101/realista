import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { getAllNeighborhoodsByCity, findDistrictByNeighborhood } from "@/utils/neighborhoods";
import { ALL_ZONES } from "@shared/schema";

interface NeighborhoodSelectorProps {
  selectedNeighborhoods: string[];
  onChange: (neighborhoods: string[]) => void;
  city: string;
  title?: string;
  buttonText?: string;
  singleSelection?: boolean;
}

export function NeighborhoodSelector({
  selectedNeighborhoods,
  onChange,
  city,
  title,
  buttonText = "Buscar barrios...",
  singleSelection = false
}: NeighborhoodSelectorProps) {
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get neighborhoods for the selected city
  const cityNeighborhoods = getAllNeighborhoodsByCity(city);
  const dynamicTitle = title || `BARRIOS DE ${city.toUpperCase()}`;
  
  // Show all neighborhoods when focused, then filter by neighborhood or district
  // as the user types.
  const searchTerm = search.trim().toLowerCase();
  const filteredResults = [
    ...(`${city} (Todos los barrios)`.toLowerCase().includes(searchTerm) ? [`${city} (Todos los barrios)`] : []),
    ...cityNeighborhoods.filter((n: string) => {
      if (!searchTerm) return true;

      const neighborhoodMatch = n.toLowerCase().includes(searchTerm);
      const district = findDistrictByNeighborhood(n, city);
      const districtMatch = district?.toLowerCase().includes(searchTerm);
      return neighborhoodMatch || districtMatch;
    })
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setHighlightedIndex(-1);
    setShowResults(true);
  };

  const toggleNeighborhood = (neighborhood: string) => {
    // Special handling for "Todos los barrios" option
    if (neighborhood.includes('(Todos los barrios)')) {
      selectAll();
      setSearch("");
      setShowResults(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
      return;
    }

    if (singleSelection) {
      // Single selection mode
      const newNeighborhoods = selectedNeighborhoods.includes(neighborhood) ? [] : [neighborhood];
      onChange(newNeighborhoods);
      setSearch(neighborhood);
      setShowResults(false);
    } else {
      // Multi-selection mode
      const newNeighborhoods = selectedNeighborhoods.includes(neighborhood)
        ? selectedNeighborhoods.filter(n => n !== neighborhood)
        : [...selectedNeighborhoods, neighborhood];
      onChange(newNeighborhoods);
      
      // Clear search after selection but keep focus
      setSearch("");
      setShowResults(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const removeNeighborhood = (neighborhood: string) => {
    const newNeighborhoods = selectedNeighborhoods.filter(n => n !== neighborhood);
    onChange(newNeighborhoods);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!filteredResults.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredResults.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : 0
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredResults.length) {
          toggleNeighborhood(filteredResults[highlightedIndex]);
        }
        break;

      case 'Escape':
        setShowResults(false);
        break;
    }
  };

  const selectAll = () => {
    onChange([ALL_ZONES]);
  };

  const clearAll = () => {
    onChange([]);
  };

  // Click outside effect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-2">
      {/* Selected neighborhoods display */}
      {selectedNeighborhoods.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedNeighborhoods.map(neighborhood => (
            <span
              key={neighborhood}
              className="bg-primary/10 rounded-full px-3 py-1 text-sm flex items-center gap-1"
            >
              {neighborhood}
              <button
                type="button"
                onClick={() => removeNeighborhood(neighborhood)}
                className="hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {/* Search input with autocomplete */}
      <div className="relative" ref={containerRef}>
        <Input
          ref={inputRef}
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
          placeholder={buttonText}
          className="w-full min-h-[44px]"
        />
        
        {showResults && filteredResults.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg overflow-auto" style={{ maxHeight: '250px' }}>
            {filteredResults.map((result, index) => (
              <button
                key={result}
                type="button"
                className={`w-full text-left p-3 min-h-[48px] hover:bg-gray-100 border-b border-gray-100 last:border-0 flex items-center justify-between ${
                  highlightedIndex === index ? 'bg-gray-100' : ''
                }`}
                onClick={() => toggleNeighborhood(result)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span>{result}</span>
                {selectedNeighborhoods.includes(result) && (
                  <span className="text-green-600 text-sm">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Action buttons for multi-selection */}
      {!singleSelection && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={clearAll}
            size="sm"
            type="button"
            className="min-h-[40px]"
          >
            Limpiar
          </Button>
          <Button
            variant="outline"
            onClick={selectAll}
            size="sm"
            type="button"
            className="min-h-[40px]"
          >Todas las zonas</Button>
        </div>
      )}
    </div>
  );
}