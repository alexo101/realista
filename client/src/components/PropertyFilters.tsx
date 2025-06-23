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
  defaultBedrooms?: number | null;
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

export function PropertyFilters({ onFilterChange, defaultOperationType = "Venta", defaultBedrooms }: PropertyFiltersProps) {
  const [operationType, setOperationType] = useState<"Venta" | "Alquiler">(defaultOperationType);
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [roomsFilter, setRoomsFilter] = useState<number[]>(defaultBedrooms ? [defaultBedrooms] : [1]);
  const [bathroomsFilter, setBathroomsFilter] = useState<number[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [openFeatures, setOpenFeatures] = useState(false);

  // Opciones para los rangos de precios según el tipo de operación
  const priceRanges = operationType === "Venta" 
    ? [
        { value: 50000, label: "50.000 €" },
        { value: 75000, label: "75.000 €" },
        { value: 100000, label: "100.000 €" },
        { value: 125000, label: "125.000 €" },
        { value: 150000, label: "150.000 €" },
        { value: 175000, label: "175.000 €" },
        { value: 200000, label: "200.000 €" },
        { value: 250000, label: "250.000 €" },
        { value: 300000, label: "300.000 €" },
        { value: 400000, label: "400.000 €" },
        { value: 500000, label: "500.000 €" },
        { value: 600000, label: "600.000 €" },
        { value: 700000, label: "700.000 €" },
        { value: 800000, label: "800.000 €" },
        { value: 900000, label: "900.000 €" },
        { value: 1000000, label: "1.000.000 €" },
      ]
    : [
        { value: 300, label: "300 €" },
        { value: 400, label: "400 €" },
        { value: 500, label: "500 €" },
        { value: 600, label: "600 €" },
        { value: 700, label: "700 €" },
        { value: 800, label: "800 €" },
        { value: 900, label: "900 €" },
        { value: 1000, label: "1.000 €" },
        { value: 1200, label: "1.200 €" },
        { value: 1500, label: "1.500 €" },
        { value: 1800, label: "1.800 €" },
        { value: 2000, label: "2.000 €" },
        { value: 2500, label: "2.500 €" },
        { value: 3000, label: "3.000 €" },
        { value: 4000, label: "4.000 €" },
        { value: 5000, label: "5.000 €" },
      ];

  // Función debounced para actualizar los filtros
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
      priceMin: priceMin === "" || priceMin === "any" ? null : parseInt(priceMin),
      priceMax: priceMax === "" || priceMax === "any" ? null : parseInt(priceMax),
      bedrooms: roomsFilter.length > 0 ? Math.min(...roomsFilter) : 1,
      bathrooms: bathroomsFilter.length > 0 ? Math.min(...bathroomsFilter) : null,
      features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
    };

    debouncedFilterChange(filters);
  }, [operationType, priceMin, priceMax, roomsFilter, bathroomsFilter, selectedFeatures, debouncedFilterChange]);

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
                setPriceMin(null);
                setPriceMax(null);
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
                setPriceMin(null);
                setPriceMax(null);
              }}
            >
              Alquilar
            </Button>
          </div>
        </div>

        {/* Fila de filtros de precio */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Precio mínimo */}
          <div>
            <Label className="font-medium mb-1.5 block text-sm">
              <Euro className="w-4 h-4 inline-block mr-1.5" strokeWidth={2} />
              Precio desde
            </Label>
            <Select
              value={priceMin?.toString() || ""}
              onValueChange={(value) => setPriceMin(value ? parseInt(value) : null)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Precio mín." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Sin mínimo</SelectItem>
                {priceRanges.map(range => (
                  <SelectItem key={range.value} value={range.value.toString()}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Precio máximo */}
          <div>
            <Label className="font-medium mb-1.5 block text-sm">
              <Euro className="w-4 h-4 inline-block mr-1.5" strokeWidth={2} />
              Precio hasta
            </Label>
            <div className="flex gap-1">
              <Select
                value={priceMax?.toString() || ""}
                onValueChange={(value) => setPriceMax(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="h-9 text-sm w-full justify-start">
                  <SelectValue placeholder="Precio máx." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Sin máximo</SelectItem>
                  {priceRanges.map(range => (
                    <SelectItem key={range.value} value={range.value.toString()}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Fila de filtros de habitaciones y baños */}
        <div className="flex gap-4 mb-4">
          {/* Filtro de habitaciones */}
          <div className="w-1/2">
            <Label className="font-medium mb-1.5 block text-sm">
              <BedDouble className="w-4 h-4 inline-block mr-1.5" strokeWidth={2} />
              Habitaciones
            </Label>
            <Select>
              <SelectTrigger className="h-9 text-sm w-full justify-start">
                <SelectValue placeholder={
                  roomsFilter.length > 0 
                    ? `${roomsFilter.length} seleccionadas` 
                    : "Habitaciones"
                } />
              </SelectTrigger>
              <SelectContent className="w-[240px]">
                <div className="space-y-2 px-1 py-2">
                  <label 
                    className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (roomsFilter.includes(0)) {
                        setRoomsFilter(prev => prev.filter(r => r !== 0));
                      } else {
                        setRoomsFilter([0]);
                      }
                    }}
                  >
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300" 
                      checked={roomsFilter.includes(0)}
                      onChange={() => {}}
                    />
                    <span>0 habitaciones (estudios)</span>
                  </label>
                  <label 
                    className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (roomsFilter.includes(1)) {
                        setRoomsFilter(prev => prev.filter(r => r !== 1 && r !== 2 && r !== 3 && r !== 4));
                      } else {
                        setRoomsFilter(prev => {
                          const newFilter = prev.filter(r => r !== 0);
                          return [...newFilter, 1, 2, 3, 4];
                        });
                      }
                    }}
                  >
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300" 
                      checked={roomsFilter.includes(1)}
                      onChange={() => {}}
                    />
                    <span>1</span>
                  </label>
                  <label 
                    className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (roomsFilter.includes(2)) {
                        setRoomsFilter(prev => prev.filter(r => r !== 2 && r !== 3 && r !== 4));
                      } else {
                        setRoomsFilter(prev => {
                          const newFilter = prev.filter(r => r !== 0);
                          return [...newFilter, 2, 3, 4];
                        });
                      }
                    }}
                  >
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300" 
                      checked={roomsFilter.includes(2)}
                      onChange={() => {}}
                    />
                    <span>2</span>
                  </label>
                  <label 
                    className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (roomsFilter.includes(3)) {
                        setRoomsFilter(prev => prev.filter(r => r !== 3 && r !== 4));
                      } else {
                        setRoomsFilter(prev => {
                          const newFilter = prev.filter(r => r !== 0);
                          return [...newFilter, 3, 4];
                        });
                      }
                    }}
                  >
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300" 
                      checked={roomsFilter.includes(3)}
                      onChange={() => {}}
                    />
                    <span>3</span>
                  </label>
                  <label 
                    className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (roomsFilter.includes(4)) {
                        setRoomsFilter(prev => prev.filter(r => r !== 4));
                      } else {
                        setRoomsFilter(prev => {
                          const newFilter = prev.filter(r => r !== 0);
                          return [...newFilter, 4];
                        });
                      }
                    }}
                  >
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300" 
                      checked={roomsFilter.includes(4)}
                      onChange={() => {}}
                    />
                    <span>4 habitaciones o más</span>
                  </label>
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de baños */}
          <div className="w-1/2">
            <Label className="font-medium mb-1.5 block text-sm">
              <Bath className="w-4 h-4 inline-block mr-1.5" strokeWidth={2} />
              Baños
            </Label>
            <Select>
              <SelectTrigger className="h-9 text-sm w-full justify-start">
                <SelectValue placeholder={
                  bathroomsFilter.length > 0 
                    ? `${bathroomsFilter.length} seleccionados` 
                    : "Baños"
                } />
              </SelectTrigger>
              <SelectContent className="w-[200px]">
                <div className="space-y-2 px-1 py-2">
                  <label 
                    className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (bathroomsFilter.includes(1)) {
                        setBathroomsFilter(prev => prev.filter(r => r !== 1 && r !== 2 && r !== 3 && r !== 4));
                      } else {
                        setBathroomsFilter([1, 2, 3, 4]);
                      }
                    }}
                  >
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300" 
                      checked={bathroomsFilter.includes(1)}
                      onChange={() => {}}
                    />
                    <span>1</span>
                  </label>
                  <label 
                    className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (bathroomsFilter.includes(2)) {
                        setBathroomsFilter(prev => prev.filter(r => r !== 2 && r !== 3 && r !== 4));
                      } else {
                        setBathroomsFilter(prev => [...prev.filter(r => r !== 2 && r !== 3 && r !== 4), 2, 3, 4]);
                      }
                    }}
                  >
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300" 
                      checked={bathroomsFilter.includes(2)}
                      onChange={() => {}}
                    />
                    <span>2</span>
                  </label>
                  <label 
                    className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (bathroomsFilter.includes(3)) {
                        setBathroomsFilter(prev => prev.filter(r => r !== 3 && r !== 4));
                      } else {
                        setBathroomsFilter(prev => [...prev.filter(r => r !== 3 && r !== 4), 3, 4]);
                      }
                    }}
                  >
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300" 
                      checked={bathroomsFilter.includes(3)}
                      onChange={() => {}}
                    />
                    <span>3</span>
                  </label>
                  <label 
                    className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (bathroomsFilter.includes(4)) {
                        setBathroomsFilter(prev => prev.filter(r => r !== 4));
                      } else {
                        setBathroomsFilter(prev => [...prev, 4]);
                      }
                    }}
                  >
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300" 
                      checked={bathroomsFilter.includes(4)}
                      onChange={() => {}}
                    />
                    <span>4 baños o más</span>
                  </label>
                </div>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtro de características en fila separada */}
        <div className="mb-4">
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
                className="w-full justify-start h-9 text-sm"
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

        {/* Mostrar etiquetas de características seleccionadas */}
        {selectedFeatures.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedFeatures.map(featureId => {
              const feature = features.find(f => f.id === featureId);
              return feature ? (
                <Badge
                  key={featureId}
                  variant="secondary"
                  className="text-xs px-2 py-1"
                >
                  {feature.label}
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