import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Check, X } from "lucide-react";
import { loadGoogleMaps } from "@/utils/googleMaps";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({ value, onChange, placeholder, className }: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [showMapConfirm, setShowMapConfirm] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    let mounted = true;

    const initAutocomplete = async () => {
      try {
        await loadGoogleMaps();
        
        if (!mounted || !inputRef.current || autocompleteRef.current) {
          return;
        }

        // Barcelona city bounds for location bias
        const barcelonaBounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(41.3200, 2.0523), // Southwest
          new window.google.maps.LatLng(41.4695, 2.2280)  // Northeast
        );

        // Create autocomplete instance
        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            bounds: barcelonaBounds,
            componentRestrictions: { country: 'es' }, // Restrict to Spain
            fields: ['address_components', 'formatted_address', 'geometry', 'name'],
            strictBounds: false, // Allow results outside bounds if they're better matches
            types: ['address'] // Only show full addresses, not businesses or POIs
          }
        );

        // Bias results to Barcelona
        autocomplete.setFields(['address_components', 'formatted_address', 'geometry', 'name']);

        // Handle place selection
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          
          if (!place.geometry) {
            console.log('No geometry found for place');
            return;
          }

          // Check if the address is in Barcelona
          const addressComponents = place.address_components || [];
          const cityComponent = addressComponents.find(
            component => component.types.includes('locality')
          );
          
          if (cityComponent && cityComponent.long_name === 'Barcelona') {
            setSelectedPlace(place);
            setShowMapConfirm(true);
          } else {
            // Not in Barcelona, show warning but still allow
            setSelectedPlace(place);
            setShowMapConfirm(true);
          }
        });

        autocompleteRef.current = autocomplete;
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing Google Places Autocomplete:', error);
      }
    };

    initAutocomplete();

    return () => {
      mounted = false;
      // Cleanup autocomplete listeners
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const confirmAddress = () => {
    if (selectedPlace) {
      // Extract street address from formatted_address
      const formattedAddress = selectedPlace.formatted_address;
      
      // Try to extract just the street name and number
      const addressParts = formattedAddress.split(',');
      const streetAddress = addressParts[0]?.trim() || formattedAddress;
      
      setInputValue(streetAddress);
      onChange(streetAddress);
    }
    setShowMapConfirm(false);
    setSelectedPlace(null);
  };

  const cancelAddress = () => {
    setShowMapConfirm(false);
    setSelectedPlace(null);
  };

  const formatDisplayAddress = (place: any): string => {
    if (!place) return '';
    
    const addressComponents = place.address_components || [];
    const street = addressComponents.find(c => c.types.includes('route'))?.long_name || '';
    const number = addressComponents.find(c => c.types.includes('street_number'))?.long_name || '';
    const neighborhood = addressComponents.find(c => c.types.includes('neighborhood'))?.long_name || '';
    
    if (street && number) {
      return `${street} ${number}`;
    } else if (street) {
      return street;
    }
    
    return place.formatted_address?.split(',')[0] || '';
  };

  const getNeighborhood = (place: any): string => {
    if (!place) return '';
    
    const addressComponents = place.address_components || [];
    const neighborhood = addressComponents.find(c => c.types.includes('neighborhood'))?.long_name;
    const city = addressComponents.find(c => c.types.includes('locality'))?.long_name;
    
    if (neighborhood && city) {
      return `${neighborhood}, ${city}`;
    } else if (city) {
      return city;
    }
    
    return '';
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder || "Escribe la dirección..."}
          className={className}
          data-testid="input-address-autocomplete"
        />
        {!isInitialized && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Map confirmation dialog */}
      <Dialog open={showMapConfirm} onOpenChange={setShowMapConfirm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar dirección</DialogTitle>
          </DialogHeader>
          
          {selectedPlace && (
            <div className="space-y-4">
              <div className="p-3 bg-accent/20 rounded-lg">
                <p className="font-medium">{formatDisplayAddress(selectedPlace)}</p>
                <p className="text-sm text-muted-foreground">
                  {getNeighborhood(selectedPlace)}
                </p>
              </div>
              
              <div className="h-64 w-full border rounded-lg overflow-hidden">
                <div id="map-preview" className="w-full h-full">
                  {selectedPlace.geometry && (
                    <iframe
                      src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(selectedPlace.formatted_address)}&zoom=17`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Mapa de la dirección"
                    />
                  )}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                ¿Es esta la ubicación correcta de tu propiedad?
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={cancelAddress} data-testid="button-cancel-address">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={confirmAddress} data-testid="button-confirm-address">
              <Check className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
