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

    if (inputValue.length < 3) {
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
    if (query.length < 3) return;

    setLoading(true);
    try {
      const encodedQuery = encodeURIComponent(`${query}, Barcelona, Spain`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5&addressdetails=1&bounded=1&viewbox=2.0523,41.4695,2.2280,41.3200&countrycodes=es`,
        {
          headers: {
            'User-Agent': 'PropertySearchApp/1.0'
          }
        }
      );

      if (response.ok) {
        const data: AddressResult[] = await response.json();
        // Filter to only Barcelona addresses and format them nicely
        const barcelonaAddresses = data.filter(addr => 
          addr.display_name.includes('Barcelona') &&
          addr.address?.road // Must have a street name
        );
        setSuggestions(barcelonaAddresses);
        setShowSuggestions(barcelonaAddresses.length > 0);
      }
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
    if (address.address.road) {
      parts.push(address.address.road);
    }
    if (address.address.house_number) {
      parts[0] = `${address.address.road} ${address.address.house_number}`;
    }
    return parts.join(', ');
  };

  const formatDisplayName = (address: AddressResult): string => {
    const parts = [];
    if (address.address.house_number && address.address.road) {
      parts.push(`${address.address.road} ${address.address.house_number}`);
    } else if (address.address.road) {
      parts.push(address.address.road);
    }
    if (address.address.suburb) {
      parts.push(address.address.suburb);
    }
    return parts.join(', ');
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