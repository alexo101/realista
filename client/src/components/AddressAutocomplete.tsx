import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, X } from "lucide-react";
import { loadGoogleMaps } from "@/utils/googleMaps";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({ value, onChange, placeholder, className }: AddressAutocompleteProps) {
  const [showMapConfirm, setShowMapConfirm] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Helper function to find the internal input element in PlaceAutocompleteElement
  const getInternalInput = (placeAutocomplete: any): HTMLInputElement | null => {
    // Try shadow DOM access
    if (placeAutocomplete.shadowRoot) {
      const input = placeAutocomplete.shadowRoot.querySelector('input');
      if (input) return input;
    }
    
    // Fallback: Check for inputElement property (future-proofing)
    if (placeAutocomplete.inputElement instanceof HTMLInputElement) {
      return placeAutocomplete.inputElement;
    }
    
    return null;
  };

  // Initialize Google Places Autocomplete (New API)
  useEffect(() => {
    let mounted = true;

    const initAutocomplete = async () => {
      try {
        await loadGoogleMaps();
        
        if (!mounted || !containerRef.current || autocompleteRef.current) {
          return;
        }

        // Import the Places library
        await window.google.maps.importLibrary("places");

        // Create the new PlaceAutocompleteElement
        const placeAutocomplete = new window.google.maps.places.PlaceAutocompleteElement({
          componentRestrictions: { country: ['es'] }, // Restrict to Spain (all cities)
          types: ['address'] // Only show full addresses, not businesses or POIs
        });

        // Handle place selection
        placeAutocomplete.addEventListener('gmp-placeselect', async (event: any) => {
          const place = event.place;
          
          if (!place) {
            console.log('No place found');
            return;
          }

          // Fetch required fields
          await place.fetchFields({
            fields: ['displayName', 'formattedAddress', 'addressComponents', 'location']
          });

          setSelectedPlace(place);
          setShowMapConfirm(true);
        });

        // Append to container FIRST
        if (containerRef.current) {
          containerRef.current.appendChild(placeAutocomplete);
          autocompleteRef.current = placeAutocomplete;
          
          // Wait for element to be fully initialized, then access internal input
          requestAnimationFrame(() => {
            const internalInput = getInternalInput(placeAutocomplete);
            if (internalInput) {
              inputRef.current = internalInput;
              
              // Set initial value
              if (value) {
                internalInput.value = value;
              }
              
              // Set placeholder
              internalInput.placeholder = placeholder || 'Escribe la dirección...';
              
              // Inject custom CSS into shadow DOM to fix styling
              if (placeAutocomplete.shadowRoot) {
                const style = document.createElement('style');
                style.textContent = `
                  input {
                    background-color: hsl(var(--background)) !important;
                    color: hsl(var(--foreground)) !important;
                    border: 1px solid hsl(var(--input)) !important;
                    border-radius: 0.375rem !important;
                    padding: 0.5rem 0.75rem !important;
                    font-size: 0.875rem !important;
                    line-height: 1.25rem !important;
                    width: 100% !important;
                    height: 2.5rem !important;
                  }
                  input::placeholder {
                    color: hsl(var(--muted-foreground)) !important;
                  }
                  input:focus {
                    outline: none !important;
                    ring: 2px !important;
                    ring-color: hsl(var(--ring)) !important;
                    ring-offset: 2px !important;
                  }
                `;
                placeAutocomplete.shadowRoot.appendChild(style);
                console.log('✓ Custom CSS injected into shadow DOM');
              }
              
              // Sync typed values to form field in real-time
              const handleInput = () => {
                if (internalInput) {
                  console.log('Address input changed:', internalInput.value);
                  onChange(internalInput.value);
                }
              };
              
              internalInput.addEventListener('input', handleInput);
              console.log('✓ Input event listener attached');
              
              // Store cleanup function
              (placeAutocomplete as any)._inputCleanup = () => {
                internalInput.removeEventListener('input', handleInput);
              };
            }
            
            setIsInitialized(true);
          });
        }
      } catch (error) {
        console.error('Error initializing Google Places Autocomplete:', error);
      }
    };

    initAutocomplete();

    return () => {
      mounted = false;
      // Cleanup input event listener
      if (autocompleteRef.current && (autocompleteRef.current as any)._inputCleanup) {
        (autocompleteRef.current as any)._inputCleanup();
      }
      // Cleanup autocomplete element
      if (autocompleteRef.current && containerRef.current) {
        try {
          containerRef.current.removeChild(autocompleteRef.current);
        } catch (e) {
          // Element may already be removed
        }
      }
    };
  }, [placeholder, className, onChange]);

  // Update internal input value when value prop changes
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  const confirmAddress = () => {
    if (selectedPlace) {
      // Extract street address from the place
      const addressComponents = selectedPlace.addressComponents || [];
      
      // Try to build a clean street address
      const street = addressComponents.find((c: any) => c.types.includes('route'))?.longText || '';
      const number = addressComponents.find((c: any) => c.types.includes('street_number'))?.longText || '';
      
      let streetAddress = '';
      if (street && number) {
        streetAddress = `${street}, ${number}`;
      } else if (street) {
        streetAddress = street;
      } else {
        // Fallback to formatted address first line
        const formattedAddress = selectedPlace.formattedAddress || '';
        streetAddress = formattedAddress.split(',')[0]?.trim() || formattedAddress;
      }
      
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
    
    const addressComponents = place.addressComponents || [];
    const street = addressComponents.find((c: any) => c.types.includes('route'))?.longText || '';
    const number = addressComponents.find((c: any) => c.types.includes('street_number'))?.longText || '';
    
    if (street && number) {
      return `${street}, ${number}`;
    } else if (street) {
      return street;
    }
    
    return place.formattedAddress?.split(',')[0] || '';
  };

  const getLocation = (place: any): string => {
    if (!place) return '';
    
    const addressComponents = place.addressComponents || [];
    const neighborhood = addressComponents.find((c: any) => c.types.includes('neighborhood'))?.longText;
    const city = addressComponents.find((c: any) => c.types.includes('locality'))?.longText;
    const province = addressComponents.find((c: any) => c.types.includes('administrative_area_level_2'))?.longText;
    
    const parts = [];
    if (neighborhood) parts.push(neighborhood);
    if (city) parts.push(city);
    if (province && province !== city) parts.push(province);
    
    return parts.join(', ') || '';
  };

  return (
    <div className="relative">
      <div ref={containerRef} className="relative w-full" data-testid="container-address-autocomplete">
        {!isInitialized && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
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
                  {getLocation(selectedPlace)}
                </p>
              </div>
              
              <div className="h-64 w-full border rounded-lg overflow-hidden">
                <div id="map-preview" className="w-full h-full">
                  {selectedPlace.formattedAddress && (
                    <iframe
                      src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(selectedPlace.formattedAddress)}&zoom=17`}
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
