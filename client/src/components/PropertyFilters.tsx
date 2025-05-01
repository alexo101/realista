import React, { useState, useEffect, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Euro, Bath, BedDouble, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import debounce from "lodash.debounce";

interface PropertyFiltersProps {
  onFilterChange: (filters: PropertyFilters) => void;
  defaultOperationType?: "Venta" | "Alquiler";
}

export interface PropertyFilters {
  operationType: "Venta" | "Alquiler";
  priceMin: number | null;
  priceMax: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  features?: string[];
}

// Lista de características disponibles
const features = [
  { id: "terraza", label: "Terraza" },
  { id: "balcon", label: "Balcón" },
  { id: "ascensor", label: "Ascensor" },
  { id: "aire-acondicionado", label: "Aire acondicionado" },
  { id: "calefaccion", label: "Calefacción" },
  { id: "piscina", label: "Piscina" },
  { id: "garaje", label: "Garaje" },
  { id: "jardin", label: "Jardín" },
  { id: "trastero", label: "Trastero" },
  { id: "amueblado", label: "Amueblado" },
  { id: "vistas-mar", label: "Vistas al mar" },
  { id: "exterior", label: "Exterior" },
  { id: "accesible", label: "Accesible" },
];

export function PropertyFilters({ onFilterChange, defaultOperationType = "Venta" }: PropertyFiltersProps) {
  const [operationType, setOperationType] = useState<"Venta" | "Alquiler">(defaultOperationType);
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [bedrooms, setBedrooms] = useState<number | null | string>(null);
  const [bathrooms, setBathrooms] = useState<number | null | string>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [openFeatures, setOpenFeatures] = useState(false);

  // Opciones para los rangos de precios según el tipo de operación
  const priceOptions = {
    Venta: [
      { value: "100000", label: "100.000€" },
      { value: "150000", label: "150.000€" },
      { value: "200000", label: "200.000€" },
      { value: "300000", label: "300.000€" },
      { value: "400000", label: "400.000€" },
      { value: "500000", label: "500.000€" },
      { value: "600000", label: "600.000€" },
      { value: "700000", label: "700.000€" },
      { value: "800000", label: "800.000€" },
      { value: "900000", label: "900.000€" },
      { value: "1000000", label: "1.000.000€" },
      { value: "2000000", label: "2.000.000€" },
    ],
    Alquiler: [
      { value: "400", label: "400€" },
      { value: "600", label: "600€" },
      { value: "800", label: "800€" },
      { value: "1000", label: "1.000€" },
      { value: "1200", label: "1.200€" },
      { value: "1500", label: "1.500€" },
      { value: "2000", label: "2.000€" },
      { value: "2500", label: "2.500€" },
      { value: "3000", label: "3.000€" },
      { value: "4000", label: "4.000€" },
      { value: "5000", label: "5.000€" },
    ],
  };

  // Reset prices when operation type changes
  useEffect(() => {
    setPriceMin(null);
    setPriceMax(null);
  }, [operationType]);

  // Debounce para no ejecutar el filtro en cada cambio
  const debouncedFilterChange = useCallback(
    debounce((filters: PropertyFilters) => {
      onFilterChange(filters);
    }, 300),
    [onFilterChange]
  );

  // Actualiza los filtros cuando cambia cualquiera
  useEffect(() => {
    const filters: PropertyFilters = {
      operationType,
      priceMin,
      priceMax,
      bedrooms: bedrooms === "any" || bedrooms === "" ? null : parseInt(bedrooms as string),
      bathrooms: bathrooms === "any" || bathrooms === "" ? null : parseInt(bathrooms as string),
      features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
    };

    debouncedFilterChange(filters);
  }, [operationType, priceMin, priceMax, bedrooms, bathrooms, selectedFeatures, debouncedFilterChange]);

  // Añadir o eliminar características
  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(current => 
      current.includes(featureId) 
        ? current.filter(id => id !== featureId) 
        : [...current, featureId]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="space-y-4">
        {/* Fila superior - Operación */}
        <div className="flex justify-center sm:justify-start">
          {/* Toggle de tipo de operación */}
          <div className="flex bg-gray-100 p-1 rounded-full">
            <Button
              variant={operationType === "Venta" ? "default" : "ghost"}
              className={cn(
                "rounded-full text-sm h-9 px-5",
                operationType === "Venta" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-white hover:bg-gray-200"
              )}
              onClick={() => {
                setOperationType("Venta");
                // Reset price filters when changing operation type
                setPriceMin(null);
                setPriceMax(null);
                onFilterChange({
                  operationType: "Venta",
                  priceMin: null,
                  priceMax: null,
                  bedrooms: bedrooms === "any" ? null : Number(bedrooms),
                  bathrooms: bathrooms === "any" ? null : Number(bathrooms),
                  features: selectedFeatures
                });
              }}
            >
              Comprar
            </Button>
            <Button
              variant={operationType === "Alquiler" ? "default" : "ghost"}
              className={cn(
                "rounded-full text-sm h-9 px-5",
                operationType === "Alquiler" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-white hover:bg-gray-200"
              )}
              onClick={() => {
                setOperationType("Alquiler");
                // Reset price filters when changing operation type
                setPriceMin(null);
                setPriceMax(null);
                onFilterChange({
                  operationType: "Alquiler",
                  priceMin: null,
                  priceMax: null,
                  bedrooms: bedrooms === "any" ? null : Number(bedrooms),
                  bathrooms: bathrooms === "any" ? null : Number(bathrooms),
                  features: selectedFeatures
                });
              }}
            >
              Alquilar
            </Button>
          </div>
        </div>

        {/* Fila de filtros - Precio, habitaciones, baños, características */}
        <div className="flex flex-wrap gap-4 justify-between">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-grow">
          {/* Filtro de precio */}
          <div>
            <Label className="font-medium mb-1.5 block text-sm">
              <Euro className="w-4 h-4 inline-block mr-1.5" strokeWidth={2} />
              Precio {operationType === "Alquiler" ? "/mes" : ""}
            </Label>
            <div className="flex items-center gap-2">
              <Select
                value={priceMin?.toString() || "any"}
                onValueChange={(value) => setPriceMin(value === "any" ? null : parseInt(value))}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Min precio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Cualquier precio</SelectItem>
                  {priceOptions[operationType].map((option) => (
                    <SelectItem key={`min-${option.value}`} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>-</span>
              <Select
                value={priceMax?.toString() || "any"}
                onValueChange={(value) => setPriceMax(value === "any" ? null : parseInt(value))}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Máx precio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Cualquier precio</SelectItem>
                  {priceOptions[operationType].map((option) => (
                    <SelectItem key={`max-${option.value}`} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtro de habitaciones */}
          <div>
            <Label className="font-medium mb-1.5 block text-sm">
              <BedDouble className="w-4 h-4 inline-block mr-1.5" strokeWidth={2} />
              Habitaciones
            </Label>
            <Select
              value={bedrooms?.toString() || "any"}
              onValueChange={(value) => setBedrooms(value === "any" ? null : value)}
            >
              <SelectTrigger className="h-9 text-sm w-full">
                <SelectValue placeholder="Habitaciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Cualquiera</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="5">5+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de baños */}
          <div>
            <Label className="font-medium mb-1.5 block text-sm">
              <Bath className="w-4 h-4 inline-block mr-1.5" strokeWidth={2} />
              Baños
            </Label>
            <Select
              value={bathrooms?.toString() || "any"}
              onValueChange={(value) => setBathrooms(value === "any" ? null : value)}
            >
              <SelectTrigger className="h-9 text-sm w-full">
                <SelectValue placeholder="Baños" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Cualquiera</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de características */}
          <div>
            <Label className="font-medium mb-1.5 block text-sm">
              <Building className="w-4 h-4 inline-block mr-1.5" strokeWidth={2} />
              Características
            </Label>
            <Popover open={openFeatures} onOpenChange={setOpenFeatures}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openFeatures}
                  className="w-2/3 justify-between h-9 text-sm"
                >
                  {selectedFeatures.length === 0
                    ? "Seleccionar"
                    : `${selectedFeatures.length} seleccionadas`}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {features.map((feature) => (
                        <CommandItem
                          key={feature.id}
                          value={feature.id}
                          onSelect={() => toggleFeature(feature.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedFeatures.includes(feature.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {feature.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Ordenar por */}
          <div className="min-w-[200px]">
            <Label className="font-medium mb-1.5 block text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 inline-block mr-1.5">
                <path d="m3 16 4 4 4-4"/>
                <path d="M7 20V4"/>
                <path d="M21 8h-8"/>
                <path d="M21 12h-8"/>
                <path d="M21 16h-8"/>
              </svg>
              Ordenar por
            </Label>
            <Select>
              <SelectTrigger className="h-9 text-sm w-full text-left">
                <SelectValue placeholder="Relevancia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevancia</SelectItem>
                <SelectItem value="price_asc">Precio: menor a mayor</SelectItem>
                <SelectItem value="price_desc">Precio: mayor a menor</SelectItem>
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="price_m2">Precio por m²</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        </div>

        {/* Mostrar etiquetas de características seleccionadas */}
        {selectedFeatures.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedFeatures.map((featureId) => {
              const feature = features.find(f => f.id === featureId);
              return feature ? (
                <Badge
                  key={featureId}
                  variant="outline"
                  className="px-2 py-1 rounded-full bg-gray-50"
                >
                  {feature.label}
                  <button
                    className="ml-1 text-gray-500 hover:text-gray-700"
                    onClick={() => toggleFeature(featureId)}
                  >
                    ×
                  </button>
                </Badge>
              ) : null;
            })}
            {selectedFeatures.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={() => setSelectedFeatures([])}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}