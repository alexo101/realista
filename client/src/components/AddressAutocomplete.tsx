import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Check, X } from "lucide-react";

interface AddressResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    postcode?: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({ value, onChange, placeholder, className }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMapConfirm, setShowMapConfirm] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressResult | null>(null);
  const [inputValue, setInputValue] = useState(value);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Search for addresses with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Allow shorter queries for numbers or when searching within Barcelona
    const minLength = /^\d/.test(inputValue.trim()) ? 2 : 3; // Allow 2 chars if starts with number
    
    if (inputValue.length < minLength) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      await searchAddresses(inputValue);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [inputValue]);

  const searchAddresses = async (query: string) => {
    const minLength = /^\d/.test(query.trim()) ? 2 : 3;
    if (query.length < minLength) return;

    setLoading(true);
    try {
      // Try multiple search strategies to improve address recognition
      const searchQueries = [
        // Primary search with Barcelona context
        encodeURIComponent(`${query}, Barcelona, Spain`),
        // Secondary search if query already contains Barcelona context
        encodeURIComponent(query.includes('Barcelona') ? query : `${query} Barcelona`),
        // Fallback search for specific street numbers
        encodeURIComponent(`${query} Spain`)
      ];

      let allResults: AddressResult[] = [];
      
      // Try the primary search first
      for (let i = 0; i < searchQueries.length && allResults.length < 5; i++) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${searchQueries[i]}&limit=${5 - allResults.length}&addressdetails=1&bounded=1&viewbox=2.0523,41.4695,2.2280,41.3200&countrycodes=es`,
          {
            headers: {
              'User-Agent': 'PropertySearchApp/1.0'
            }
          }
        );

        if (response.ok) {
          const data: AddressResult[] = await response.json();
          allResults = [...allResults, ...data];
        }
        
        // Break early if we have good results
        if (allResults.length >= 3) break;
      }

      // Filter and sort Barcelona addresses with enhanced logic
      const barcelonaAddresses = allResults
        .filter((addr, index, self) => 
          // Remove duplicates by place_id
          self.findIndex(a => a.place_id === addr.place_id) === index &&
          addr.display_name.includes('Barcelona') &&
          (addr.address?.road || addr.address?.house_number) // Must have either street name or house number
        )
        .sort((a, b) => {
          // Priority scoring system
          let scoreA = 0, scoreB = 0;
          
          // Boost addresses with house numbers
          if (a.address.house_number) scoreA += 10;
          if (b.address.house_number) scoreB += 10;
          
          // Boost exact or partial query matches
          const queryLower = query.toLowerCase();
          if (a.display_name.toLowerCase().includes(queryLower)) scoreA += 5;
          if (b.display_name.toLowerCase().includes(queryLower)) scoreB += 5;
          
          // Boost addresses with road names
          if (a.address.road) scoreA += 3;
          if (b.address.road) scoreB += 3;
          
          return scoreB - scoreA;
        })
        .slice(0, 5); // Limit to 5 results

      setSuggestions(barcelonaAddresses);
      setShowSuggestions(barcelonaAddresses.length > 0);
    } catch (error) {
      console.error('Error searching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleSuggestionClick = (address: AddressResult) => {
    setSelectedAddress(address);
    setShowSuggestions(false);
    setShowMapConfirm(true);
  };

  const confirmAddress = () => {
    if (selectedAddress) {
      const formattedAddress = formatAddress(selectedAddress);
      setInputValue(formattedAddress);
      onChange(formattedAddress);
    }
    setShowMapConfirm(false);
    setSelectedAddress(null);
  };

  const cancelAddress = () => {
    setShowMapConfirm(false);
    setSelectedAddress(null);
  };

  const formatAddress = (address: AddressResult): string => {
    const parts = [];
    
    // Handle different address formats properly
    if (address.address.road && address.address.house_number) {
      // Complete address with street name and number
      parts.push(`${address.address.road} ${address.address.house_number}`);
    } else if (address.address.road) {
      // Street name only
      parts.push(address.address.road);
    } else if (address.address.house_number) {
      // Edge case: house number without street name
      parts.push(address.address.house_number);
    }
    
    return parts.join(', ') || address.display_name.split(',')[0]; // Fallback to first part of display_name
  };

  const formatDisplayName = (address: AddressResult): string => {
    const parts = [];
    
    // Primary address line
    if (address.address.house_number && address.address.road) {
      parts.push(`${address.address.road} ${address.address.house_number}`);
    } else if (address.address.road) {
      parts.push(address.address.road);
    } else if (address.address.house_number) {
      // Show house number even without street name
      parts.push(`Número ${address.address.house_number}`);
    }
    
    // Add suburb for context
    if (address.address.suburb) {
      parts.push(address.address.suburb);
    }
    
    return parts.join(', ') || address.display_name.split(',').slice(0, 2).join(', '); // Fallback
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={suggestionsRef}>
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder || "Escribe la dirección..."}
          className={className}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              className="w-full px-4 py-3 text-left hover:bg-accent/50 border-b border-border/50 last:border-b-0 flex items-start gap-2"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {formatDisplayName(suggestion)}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {suggestion.address.suburb}, Barcelona
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Map confirmation dialog */}
      <Dialog open={showMapConfirm} onOpenChange={setShowMapConfirm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar dirección</DialogTitle>
          </DialogHeader>
          
          {selectedAddress && (
            <div className="space-y-4">
              <div className="p-3 bg-accent/20 rounded-lg">
                <p className="font-medium">{formatDisplayName(selectedAddress)}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAddress.address.suburb}, Barcelona
                </p>
              </div>
              
              <div className="h-64 w-full border rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(selectedAddress.lon) - 0.002},${parseFloat(selectedAddress.lat) - 0.002},${parseFloat(selectedAddress.lon) + 0.002},${parseFloat(selectedAddress.lat) + 0.002}&layer=mapnik&marker=${selectedAddress.lat},${selectedAddress.lon}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa de la dirección"
                />
              </div>
              
              <p className="text-sm text-muted-foreground">
                ¿Es esta la ubicación correcta de tu propiedad?
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={cancelAddress}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={confirmAddress}>
              <Check className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}