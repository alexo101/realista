import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building, X, Check } from "lucide-react";
import { NeighborhoodSelector } from "./NeighborhoodSelector";

export interface Agency {
  id: number;
  agencyName: string;
  agencyAddress?: string;
  agencyLogo?: string;
  agencyInfluenceNeighborhoods?: string[];
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
  const [agencyLogo, setAgencyLogo] = useState<string | undefined>();
  const [influenceNeighborhoods, setInfluenceNeighborhoods] = useState<string[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Si estamos editando, cargar los datos de la agencia
  useEffect(() => {
    if (agency) {
      setAgencyName(agency.agencyName || "");
      setAgencyAddress(agency.agencyAddress || "");
      setAgencyLogo(agency.agencyLogo);
      setInfluenceNeighborhoods(agency.agencyInfluenceNeighborhoods || []);
      setLogoPreview(agency.agencyLogo || null);
    }
  }, [agency]);

  // Validación simple
  const isValid = agencyName.trim().length > 0;

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const data: Partial<Agency> = {
      agencyName,
      agencyAddress,
      agencyLogo,
      agencyInfluenceNeighborhoods: influenceNeighborhoods,
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
              <Label htmlFor="influenceNeighborhoods">Barrios de influencia</Label>
              <NeighborhoodSelector
                selectedNeighborhoods={influenceNeighborhoods}
                onChange={setInfluenceNeighborhoods}
                buttonText="Selecciona los barrios donde opera la agencia"
                title="ZONAS DE OPERACIÓN DE LA AGENCIA"
              />
              <p className="text-sm text-gray-500 mt-1">
                Estos barrios se utilizarán para relacionar esta agencia con las búsquedas de los clientes.
              </p>
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