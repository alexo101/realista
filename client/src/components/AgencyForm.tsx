import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, X, Check } from "lucide-react";
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
  agencyEmailToDisplay?: string;
  yearEstablished?: number;
  agencyLanguagesSpoken?: string[];
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
  const [agencyEmailToDisplay, setAgencyEmailToDisplay] = useState("");
  const [yearEstablished, setYearEstablished] = useState<number | undefined>(undefined);
  const [agencyLanguagesSpoken, setAgencyLanguagesSpoken] = useState<string[]>([]);
  const [agencyLogo, setAgencyLogo] = useState<string | undefined>();
  const [city, setCity] = useState("Barcelona");
  const [influenceNeighborhoods, setInfluenceNeighborhoods] = useState<string[]>([]);
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Si estamos editando, cargar los datos de la agencia
  useEffect(() => {
    if (agency) {
      setAgencyName(agency.agencyName || "");
      setAgencyAddress(agency.agencyAddress || "");
      setAgencyDescription(agency.agencyDescription || "");
      setAgencyPhone(agency.agencyPhone || "");
      setAgencyWebsite(agency.agencyWebsite || "");
      setAgencyEmailToDisplay(agency.agencyEmailToDisplay || "");
      setYearEstablished(agency.yearEstablished);
      setAgencyLanguagesSpoken(agency.agencyLanguagesSpoken || []);
      setAgencyLogo(agency.agencyLogo);
      setCity((agency as any).city || "Barcelona");
      setInfluenceNeighborhoods(agency.agencyInfluenceNeighborhoods || []);
      setLogoPreview(agency.agencyLogo || null);
      
      // Cargar redes sociales si existen
      const socialMedia = agency.agencySocialMedia || {};
      setFacebookUrl(socialMedia.facebook || "");
      setInstagramUrl(socialMedia.instagram || "");
      setTwitterUrl(socialMedia.twitter || "");
      setLinkedinUrl(socialMedia.linkedin || "");
    }
  }, [agency]);

  // Validación simple
  const isValid = agencyName.trim().length > 0;

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    // Crear el objeto para guardar las redes sociales
    const socialMedia: Record<string, string> = {};
    if (facebookUrl) socialMedia.facebook = facebookUrl;
    if (instagramUrl) socialMedia.instagram = instagramUrl;
    if (twitterUrl) socialMedia.twitter = twitterUrl;
    if (linkedinUrl) socialMedia.linkedin = linkedinUrl;

    const data: Partial<Agency> = {
      agencyName,
      agencyAddress,
      agencyDescription,
      agencyPhone,
      agencyWebsite,
      agencyEmailToDisplay,
      yearEstablished,
      agencyLanguagesSpoken,
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{agency ? "Editar agencia" : "Nueva agencia"}</CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onCancel}
          title="Cancelar"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-32 h-32 rounded-md bg-gray-100 mb-4 flex items-center justify-center overflow-hidden border-2 border-primary/20">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo de la agencia"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building className="w-16 h-16 text-gray-400" />
              )}
            </div>
            <Label htmlFor="agency-logo-upload" className="cursor-pointer text-sm text-primary">
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
              />
            </div>

            <div>
              <Label htmlFor="agencyAddress">Dirección de la agencia</Label>
              <Input
                id="agencyAddress"
                value={agencyAddress}
                onChange={(e) => setAgencyAddress(e.target.value)}
                placeholder="Dirección física de la agencia"
              />
            </div>

            <div>
              <Label htmlFor="agencyDescription">Descripción pública</Label>
              <Textarea
                id="agencyDescription"
                value={agencyDescription}
                onChange={(e) => setAgencyDescription(e.target.value)}
                placeholder="Describe tu agencia inmobiliaria a clientes potenciales"
                className="min-h-[120px]"
              />
            </div>

            <div>
              <Label htmlFor="agencyPhone">Número de teléfono</Label>
              <Input
                id="agencyPhone"
                value={agencyPhone}
                onChange={(e) => setAgencyPhone(e.target.value)}
                placeholder="Teléfono de contacto"
              />
            </div>

            <div>
              <Label htmlFor="agencyEmailToDisplay">Email público</Label>
              <Input
                id="agencyEmailToDisplay"
                value={agencyEmailToDisplay}
                onChange={(e) => setAgencyEmailToDisplay(e.target.value)}
                placeholder="Email para mostrar en el perfil público"
                type="email"
              />
            </div>

            <div>
              <Label htmlFor="agencyWebsite">Sitio web</Label>
              <Input
                id="agencyWebsite"
                value={agencyWebsite}
                onChange={(e) => setAgencyWebsite(e.target.value)}
                placeholder="URL de tu sitio web (con https://)"
              />
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
                <SelectTrigger>
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
              <Label htmlFor="agencyLanguagesSpoken">Idiomas que se hablan en la agencia</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {['español', 'català', 'english', 'français', 'deutsch', 'italiano', 'português', 'русский', '中文', '日本語', 'العربية'].map((lang) => (
                  <Button
                    key={lang}
                    type="button"
                    variant={agencyLanguagesSpoken.includes(lang) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (agencyLanguagesSpoken.includes(lang)) {
                        setAgencyLanguagesSpoken(agencyLanguagesSpoken.filter(l => l !== lang));
                      } else {
                        setAgencyLanguagesSpoken([...agencyLanguagesSpoken, lang]);
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
              <Select
                value={city}
                onValueChange={(value) => {
                  setCity(value);
                  setInfluenceNeighborhoods([]); // Clear neighborhoods when city changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la ciudad" />
                </SelectTrigger>
                <SelectContent>
                  {getCities().map((cityOption) => (
                    <SelectItem key={cityOption} value={cityOption}>
                      {cityOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="influenceNeighborhoods">Barrios de influencia</Label>
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
              <Label>Enlaces a redes sociales</Label>
              <div className="space-y-3 mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  </div>
                  <Input
                    placeholder="URL de Facebook"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full">
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
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                    </svg>
                  </div>
                  <Input
                    placeholder="URL de Twitter"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full">
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
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center">
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