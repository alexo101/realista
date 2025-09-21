import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { getDistrictsByCity, getAllNeighborhoodsByCity, getCities } from "@/utils/neighborhoods";

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
  
  // Get neighborhoods and districts for the selected city
  const cityNeighborhoods = getAllNeighborhoodsByCity(city);
  const cityDistricts = getDistrictsByCity(city);
  const dynamicTitle = title || `BARRIOS DE ${city.toUpperCase()}`;
  
  // Filter neighborhoods, districts, and city option based on search
  const filteredResults = search.length >= 3 
    ? [
        ...(`${city} (Todos los barrios)`.toLowerCase().includes(search.toLowerCase()) ? [`${city} (Todos los barrios)`] : []),
        ...cityDistricts.filter((d: string) =>
          d.toLowerCase().includes(search.toLowerCase())
        ),
        ...cityNeighborhoods.filter((n: string) =>
          n.toLowerCase().includes(search.toLowerCase())
        )
      ].slice(0, 10) // Limit to 10 results
    : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setHighlightedIndex(-1);
    setShowResults(value.length >= 3);
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
    onChange([...cityNeighborhoods]);
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
        <div>
          <p className="text-sm text-gray-500 mb-2">{singleSelection ? `BARRIO SELECCIONADO (${city})` : `SELECCIONADOS (${city})`}</p>
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
        </div>
      )}

      {/* Search input with autocomplete */}
      <div className="relative" ref={containerRef}>
        <Input
          ref={inputRef}
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={() => setShowResults(search.length >= 3)}
          onKeyDown={handleKeyDown}
          placeholder={buttonText}
          className="w-full"
        />
        
        {showResults && filteredResults.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg overflow-auto" style={{ maxHeight: '200px' }}>
            {filteredResults.map((result, index) => (
              <button
                key={result}
                type="button"
                className={`w-full text-left p-3 hover:bg-gray-100 border-b border-gray-100 last:border-0 flex items-center justify-between ${
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={clearAll}
            size="sm"
            type="button"
          >
            Limpiar
          </Button>
          <Button
            variant="outline"
            onClick={selectAll}
            size="sm"
            type="button"
          >
            Seleccionar todos
          </Button>
        </div>
      )}
    </div>
  );
}