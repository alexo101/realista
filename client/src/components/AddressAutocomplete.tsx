import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/utils/googleMaps";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({ value, onChange, placeholder, className }: AddressAutocompleteProps) {
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

  // Initialize Google Places Autocomplete
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

        // Runtime guard: Check if PlaceAutocompleteElement is available
        if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
          console.error('❌ PlaceAutocompleteElement not available - ensure Google Maps API loaded with v=beta');
          return;
        }

        console.log('✓ PlaceAutocompleteElement found, initializing...');

        // Create the new PlaceAutocompleteElement with Spain restriction
        const placeAutocomplete = new window.google.maps.places.PlaceAutocompleteElement({
          // Use locationBias to strongly prefer Spain
          locationBias: {
            north: 43.7913,  // Northern Spain
            south: 36.0,     // Southern Spain
            east: 4.3271,    // Eastern Spain
            west: -9.3003    // Western Spain
          },
          componentRestrictions: { country: 'es' }, // Restrict to Spain
          fields: ['address_components', 'formatted_address', 'geometry', 'name']
        });

        // Handle place selection - immediately save the address
        placeAutocomplete.addEventListener('gmp-placeselect', async (event: any) => {
          const place = event.place;
          
          if (!place) {
            console.log('No place found');
            return;
          }

          try {
            // Fetch required fields
            await place.fetchFields({
              fields: ['displayName', 'formattedAddress', 'addressComponents', 'location']
            });

            console.log('✓ Address selected:', place.formattedAddress);

            // Extract street address from the place
            const addressComponents = place.addressComponents || [];
            
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
              const formattedAddress = place.formattedAddress || '';
              streetAddress = formattedAddress.split(',')[0]?.trim() || formattedAddress;
            }
            
            // Immediately update the form field
            console.log('✓ Saving address to form:', streetAddress);
            onChange(streetAddress);

            // Update internal input to match
            if (inputRef.current) {
              inputRef.current.value = streetAddress;
            }
          } catch (error) {
            console.error('Error processing selected place:', error);
          }
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
              internalInput.placeholder = placeholder || 'Introduce la dirección (calle y número)';
              
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

  return (
    <div className="relative">
      <div ref={containerRef} className="relative w-full" data-testid="container-address-autocomplete">
        {!isInitialized && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}
