import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, X, Check, Search } from "lucide-react";
import { SiGooglemaps } from "react-icons/si";
import { NeighborhoodSelector } from "./NeighborhoodSelector";
import { getCities } from "@/utils/neighborhoods";

export interface Agency {
  id: number;
  agencyName: string;
  agencyAddress?: string;
  agencyLogo?: string;
  agencyDescription?: string;
  agencyPhone?: string;
  agencyWebsite?: string;
  city?: string;
  agencyInfluenceNeighborhoods?: string[];
  yearEstablished?: number;
  agencySupportedLanguages?: string[];
  agencySocialMedia?: Record<string, string>;
  adminAgentId: number;
}

interface AgencyFormProps {
  agency: Agency | null;
  onSubmit: (data: Partial<Agency>) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function AgencyForm({ agency, onSubmit, onCancel, isSubmitting }: AgencyFormProps) {
  // Estados para los campos del formulario
  const [agencyName, setAgencyName] = useState("");
  const [agencyAddress, setAgencyAddress] = useState("");
  const [agencyDescription, setAgencyDescription] = useState("");
  const [agencyPhone, setAgencyPhone] = useState("");
  const [agencyWebsite, setAgencyWebsite] = useState("");
  const [yearEstablished, setYearEstablished] = useState<number | undefined>(undefined);
  const [agencySupportedLanguages, setAgencySupportedLanguages] = useState<string[]>([]);
  const [agencyLogo, setAgencyLogo] = useState<string | undefined>();
  const [city, setCity] = useState("");
  const [influenceNeighborhoods, setInfluenceNeighborhoods] = useState<string[]>([]);
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // City search state
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  // Estados para errores de validación
  const [phoneError, setPhoneError] = useState<string>("");
  const [websiteError, setWebsiteError] = useState<string>("");

  // Funciones de validación
  const validateSpanishPhone = (phone: string): boolean => {
    if (!phone) return true; // Campo opcional
    // Formatos válidos: +34 XXX XXX XXX, 34XXXXXXXXX, 9XX XXX XXX, etc.
    const phoneRegex = /^(\+34|0034|34)?[\s\-]?[6789]\d{2}[\s\-]?\d{3}[\s\-]?\d{3}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateWebsite = (website: string): boolean => {
    if (!website) return true; // Campo opcional
    const websiteRegex = /^https?:\/\/.+\..+/i;
    return websiteRegex.test(website);
  };

  // Si estamos editando, cargar los datos de la agencia
  useEffect(() => {
    if (agency) {
      setAgencyName(agency.agencyName || "");
      setAgencyAddress(agency.agencyAddress || "");
      setAgencyDescription(agency.agencyDescription || "");
      setAgencyPhone(agency.agencyPhone || "");
      setAgencyWebsite(agency.agencyWebsite || "");
      setYearEstablished(agency.yearEstablished);
      setAgencySupportedLanguages(agency.agencySupportedLanguages || []);
      setAgencyLogo(agency.agencyLogo);
      setCity((agency as any).city || "");
      setInfluenceNeighborhoods(agency.agencyInfluenceNeighborhoods || []);
      setLogoPreview(agency.agencyLogo || null);
      
      // Cargar redes sociales si existen
      const socialMedia = agency.agencySocialMedia || {};
      setFacebookUrl(socialMedia.facebook || "");
      setInstagramUrl(socialMedia.instagram || "");
      setGoogleMapsUrl(socialMedia.googleMaps || "");
      setLinkedinUrl(socialMedia.linkedin || "");
    }
  }, [agency]);

  // Validación completa del formulario
  const isValid = agencyName.trim().length > 0 && !phoneError && !websiteError;

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    // Crear el objeto para guardar las redes sociales
    const socialMedia: Record<string, string> = {};
    if (facebookUrl) socialMedia.facebook = facebookUrl;
    if (instagramUrl) socialMedia.instagram = instagramUrl;
    if (googleMapsUrl) socialMedia.googleMaps = googleMapsUrl;
    if (linkedinUrl) socialMedia.linkedin = linkedinUrl;

    const data: Partial<Agency> = {
      agencyName,
      agencyAddress,
      agencyDescription,
      agencyPhone,
      agencyWebsite,
      yearEstablished,
      agencySupportedLanguages,
      agencyLogo,
      city,
      agencyInfluenceNeighborhoods: influenceNeighborhoods,
      agencySocialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : undefined,
    };

    await onSubmit(data);
  };

  // Manejar la subida de la imagen del logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64String = event.target.result.toString();
        setAgencyLogo(base64String);
        setLogoPreview(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center mb-6 px-4 sm:px-0">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-md bg-gray-100 mb-4 flex items-center justify-center overflow-hidden border-2 border-primary/20">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo de la agencia"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
              )}
            </div>
            <Label htmlFor="agency-logo-upload" className="cursor-pointer text-sm text-primary py-2 px-4 min-h-[44px] flex items-center">
              {logoPreview ? "Cambiar logo" : "Subir logo"}
            </Label>
            <Input
              id="agency-logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="agencyName" className="required">Nombre de la agencia</Label>
              <Input
                id="agencyName"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Introduce el nombre de la agencia"
                required
                className="min-h-[44px] w-full"
              />
            </div>

            <div>
              <Label htmlFor="agencyAddress">Dirección de la agencia</Label>
              <Input
                id="agencyAddress"
                value={agencyAddress}
                onChange={(e) => setAgencyAddress(e.target.value)}
                placeholder="Dirección física de la agencia"
                className="min-h-[44px] w-full"
              />
            </div>

            <div>
              <Label htmlFor="agencyDescription">Descripción pública</Label>
              <Textarea
                id="agencyDescription"
                value={agencyDescription}
                onChange={(e) => setAgencyDescription(e.target.value)}
                placeholder="Describe tu agencia inmobiliaria a clientes potenciales"
                className="min-h-[120px] w-full"
              />
            </div>

            <div>
              <Label htmlFor="agencyPhone">Número de teléfono</Label>
              <Input
                id="agencyPhone"
                value={agencyPhone}
                onChange={(e) => {
                  const value = e.target.value;
                  setAgencyPhone(value);
                  if (value && !validateSpanishPhone(value)) {
                    setPhoneError("Formato inválido. Ejemplos: +34 600 123 456 o 600123456");
                  } else {
                    setPhoneError("");
                  }
                }}
                placeholder="Teléfono de contacto (ej: +34 600 123 456)"
                className={`min-h-[44px] w-full ${phoneError ? "border-red-500" : ""}`}
              />
              {phoneError && <p className="text-sm text-red-500 mt-1">{phoneError}</p>}
            </div>

            <div>
              <Label htmlFor="yearEstablished">Año de fundación</Label>
              <Select
                value={yearEstablished ? yearEstablished.toString() : 'none'}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setYearEstablished(undefined);
                  } else {
                    setYearEstablished(parseInt(value, 10));
                  }
                }}
              >
                <SelectTrigger className="min-h-[44px] w-full">
                  <SelectValue placeholder="Selecciona el año de fundación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Seleccionar año --</SelectItem>
                  {(() => {
                    const currentYear = new Date().getFullYear();
                    const years = [];
                    for (let year = currentYear; year >= 1900; year--) {
                      years.push(year);
                    }
                    return years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="agencySupportedLanguages">Idiomas que se hablan en la agencia</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {['español', 'català', 'english', 'français', 'deutsch', 'italiano', 'português', 'русский', '中文', '日本語', 'العربية'].map((lang) => (
                  <Button
                    key={lang}
                    type="button"
                    variant={agencySupportedLanguages.includes(lang) ? "default" : "outline"}
                    size="sm"
                    className="min-h-[40px] px-3"
                    onClick={() => {
                      if (agencySupportedLanguages.includes(lang)) {
                        setAgencySupportedLanguages(agencySupportedLanguages.filter(l => l !== lang));
                      } else {
                        setAgencySupportedLanguages([...agencySupportedLanguages, lang]);
                      }
                    }}
                  >
                    {lang}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="city">Ciudad donde opera la agencia</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="agency-city-search"
                    placeholder="Buscar ciudad..."
                    value={cityDropdownOpen ? citySearchTerm : city}
                    onChange={(e) => {
                      setCitySearchTerm(e.target.value);
                      if (!cityDropdownOpen) setCityDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setCityDropdownOpen(true);
                      setCitySearchTerm("");
                    }}
                    className="pl-9 pr-8 min-h-[44px] w-full"
                    data-testid="input-agency-city-search"
                  />
                  {city && !cityDropdownOpen && (
                    <button
                      type="button"
                      onClick={() => {
                        setCity("");
                        setInfluenceNeighborhoods([]);
                        setCityDropdownOpen(true);
                        setCitySearchTerm("");
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {cityDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => {
                        setCityDropdownOpen(false);
                        setCitySearchTerm("");
                      }}
                    />
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {getCities()
                        .filter((cityOption) => 
                          cityOption.toLowerCase().includes(citySearchTerm.toLowerCase())
                        )
                        .slice(0, 50)
                        .map((cityOption, index) => (
                          <button
                            key={`${cityOption}-${index}`}
                            type="button"
                            className={`w-full px-4 py-3 min-h-[44px] text-left text-sm hover:bg-gray-100 ${
                              city === cityOption ? 'bg-primary/10 text-primary font-medium' : ''
                            }`}
                            onClick={() => {
                              setCity(cityOption);
                              setInfluenceNeighborhoods([]);
                              setCityDropdownOpen(false);
                              setCitySearchTerm("");
                            }}
                            data-testid={`agency-city-option-${cityOption}`}
                          >
                            {cityOption}
                          </button>
                        ))
                      }
                      {getCities().filter((cityOption) => 
                        cityOption.toLowerCase().includes(citySearchTerm.toLowerCase())
                      ).length === 0 && (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          No se encontraron ciudades
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="influenceNeighborhoods">Barrios de influencia (el perfil de tu agencia aparecerá en estos barrios)</Label>
              <NeighborhoodSelector
                selectedNeighborhoods={influenceNeighborhoods}
                city={city}
                onChange={setInfluenceNeighborhoods}
                buttonText="Selecciona los barrios donde opera la agencia"
                title="ZONAS DE OPERACIÓN DE LA AGENCIA"
              />
              <p className="text-sm text-gray-500 mt-1">
                Estos barrios se utilizarán para relacionar esta agencia con las búsquedas de los clientes.
              </p>
            </div>

            <div>
              <Label>Enlaces a página web y redes sociales</Label>
              <div className="space-y-3 mt-2">
                <div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                    </div>
                    <Input
                      id="agencyWebsite"
                      value={agencyWebsite}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAgencyWebsite(value);
                        if (value && !validateWebsite(value)) {
                          setWebsiteError("URL inválida. Debe incluir http:// o https://");
                        } else {
                          setWebsiteError("");
                        }
                      }}
                      placeholder="URL de tu sitio web (con https://)"
                      className={`min-h-[44px] flex-1 ${websiteError ? "border-red-500" : ""}`}
                    />
                  </div>
                  {websiteError && <p className="text-sm text-red-500 mt-1 ml-12 sm:ml-[52px]">{websiteError}</p>}
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  </div>
                  <Input
                    placeholder="URL de Facebook"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    className="min-h-[44px] flex-1"
                  />
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </div>
                  <Input
                    placeholder="URL de Instagram"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    className="min-h-[44px] flex-1"
                  />
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-full">
                    <SiGooglemaps className="w-5 h-5 text-primary" />
                  </div>
                  <Input
                    placeholder="URL de Google Maps"
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    className="min-h-[44px] flex-1"
                  />
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </div>
                  <Input
                    placeholder="URL de LinkedIn"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="min-h-[44px] flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="w-full sm:w-auto min-h-[44px]"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Check className="mr-2 h-4 w-4" />
                    {agency ? "Actualizar agencia" : "Crear agencia"}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}