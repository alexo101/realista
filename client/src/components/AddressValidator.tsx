import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Check, AlertCircle, Loader2 } from "lucide-react";
import { loadGoogleMaps } from "@/utils/googleMaps";

interface AddressValidatorProps {
  onAddressValidated: (data: {
    formattedAddress: string;
    latitude: number;
    longitude: number;
    locality: string;
    streetName: string;
    streetNumber: string;
  }) => void;
  initialLocality?: string;
  initialStreetName?: string;
  initialStreetNumber?: string;
  initialFormattedAddress?: string;
}

interface GeocodeCandidate {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  placeId: string;
}

export function AddressValidator({
  onAddressValidated,
  initialLocality = "",
  initialStreetName = "",
  initialStreetNumber = "",
  initialFormattedAddress = "",
}: AddressValidatorProps) {
  const [locality, setLocality] = useState(initialLocality);
  const [streetName, setStreetName] = useState(initialStreetName);
  const [streetNumber, setStreetNumber] = useState(initialStreetNumber);
  
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(!!initialFormattedAddress);
  const [validatedAddress, setValidatedAddress] = useState(initialFormattedAddress);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<GeocodeCandidate[]>([]);
  const [showCandidates, setShowCandidates] = useState(false);

  const handleValidate = async () => {
    // Reset states
    setError(null);
    setCandidates([]);
    setShowCandidates(false);
    setIsValidated(false);

    // Basic validation
    if (!locality.trim() || !streetName.trim()) {
      setError("Por favor, introduce al menos la localidad y el nombre de la calle.");
      return;
    }

    setIsValidating(true);

    try {
      await loadGoogleMaps();

      // Build the address query
      const addressQuery = [
        streetNumber.trim(),
        streetName.trim(),
        locality.trim(),
        "España"
      ].filter(Boolean).join(", ");

      console.log("Validating address:", addressQuery);

      // Use Geocoding API
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode(
        {
          address: addressQuery,
          componentRestrictions: { country: 'ES' }, // Spain only
        },
        (results: any, status: any) => {
          setIsValidating(false);

          if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
            console.log("Geocoding results:", results);

            if (results.length === 1) {
              // Single result - auto-select
              const result: any = results[0];
              handleSelectCandidate({
                formattedAddress: result.formatted_address,
                latitude: result.geometry.location.lat(),
                longitude: result.geometry.location.lng(),
                placeId: result.place_id,
              });
            } else {
              // Multiple results - show candidates
              const candidateList = results.slice(0, 5).map((result: any) => ({
                formattedAddress: result.formatted_address,
                latitude: result.geometry.location.lat(),
                longitude: result.geometry.location.lng(),
                placeId: result.place_id,
              }));
              setCandidates(candidateList);
              setShowCandidates(true);
            }
          } else if (status === window.google.maps.GeocoderStatus.ZERO_RESULTS) {
            setError("No se encontró la dirección. Verifica la ortografía o intenta con información más específica.");
          } else {
            setError("Error al validar la dirección. Por favor, inténtalo de nuevo.");
            console.error("Geocoding error:", status);
          }
        }
      );
    } catch (error) {
      console.error("Error during geocoding:", error);
      setError("Error al conectar con el servicio de mapas. Por favor, inténtalo de nuevo.");
      setIsValidating(false);
    }
  };

  const handleSelectCandidate = (candidate: GeocodeCandidate) => {
    setValidatedAddress(candidate.formattedAddress);
    setLatitude(candidate.latitude);
    setLongitude(candidate.longitude);
    setIsValidated(true);
    setShowCandidates(false);
    setCandidates([]);

    // Notify parent
    onAddressValidated({
      formattedAddress: candidate.formattedAddress,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      locality,
      streetName,
      streetNumber,
    });
  };

  const handleRelocalize = () => {
    setIsValidated(false);
    setValidatedAddress("");
    setLatitude(null);
    setLongitude(null);
    setError(null);
    setCandidates([]);
    setShowCandidates(false);
  };

  return (
    <div className="space-y-4">
      {/* Input Fields */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="locality">Localidad</Label>
          <Input
            id="locality"
            placeholder="Ej: Madrid, Barcelona, Valencia"
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            disabled={isValidated}
            data-testid="input-locality"
          />
        </div>

        <div>
          <Label htmlFor="streetName">Nombre de la calle</Label>
          <Input
            id="streetName"
            placeholder="Ej: Calle Gran Vía"
            value={streetName}
            onChange={(e) => setStreetName(e.target.value)}
            disabled={isValidated}
            data-testid="input-street-name"
          />
        </div>

        <div>
          <Label htmlFor="streetNumber">Número</Label>
          <Input
            id="streetNumber"
            placeholder="Ej: 123"
            value={streetNumber}
            onChange={(e) => setStreetNumber(e.target.value)}
            disabled={isValidated}
            data-testid="input-street-number"
          />
        </div>
      </div>

      {/* Validate Button */}
      {!isValidated && (
        <Button
          onClick={handleValidate}
          disabled={isValidating}
          className="w-full"
          data-testid="button-validate-address"
        >
          {isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validando...
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Validar dirección
            </>
          )}
        </Button>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Multiple Candidates Selection */}
      {showCandidates && candidates.length > 0 && (
        <div className="border rounded-lg p-4 space-y-2">
          <p className="font-medium text-sm">Se encontraron varias direcciones. Selecciona la correcta:</p>
          <div className="space-y-2">
            {candidates.map((candidate, index) => (
              <button
                key={candidate.placeId}
                onClick={() => handleSelectCandidate(candidate)}
                className="w-full text-left p-3 border rounded-md hover:bg-accent hover:border-primary transition-colors"
                data-testid={`button-candidate-${index}`}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{candidate.formattedAddress}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Success Panel with Map */}
      {isValidated && validatedAddress && latitude !== null && longitude !== null && (
        <div className="border border-green-500 bg-green-50 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-900 text-sm">Dirección encontrada:</p>
              <p className="text-sm text-green-800 mt-1">{validatedAddress}</p>
            </div>
          </div>

          {/* Embedded Map */}
          <div className="rounded-md overflow-hidden border border-green-300">
            <iframe
              width="100%"
              height="200"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${latitude},${longitude}&zoom=16`}
              data-testid="map-validated-address"
            />
          </div>

          {/* Re-localize Button */}
          <Button
            onClick={handleRelocalize}
            variant="outline"
            size="sm"
            className="w-full"
            data-testid="button-relocalize"
          >
            Cambiar dirección
          </Button>
        </div>
      )}
    </div>
  );
}
