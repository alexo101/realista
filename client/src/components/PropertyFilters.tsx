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
import { Euro, Bath, BedDouble, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import debounce from "lodash.debounce";

interface PropertyFiltersProps {
  onFilterChange: (filters: PropertyFilters) => void;
  defaultOperationType?: "Venta" | "Alquiler";
  defaultBedrooms?: number | null;
  defaultBedroomsList?: number[];
}

export interface PropertyFilters {
  operationType: "Venta" | "Alquiler";
  priceMin: number | null;
  priceMax: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  features?: string[];
  sortBy?: string;
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

export function PropertyFilters({ onFilterChange, defaultOperationType = "Venta", defaultBedrooms, defaultBedroomsList }: PropertyFiltersProps) {
  const [operationType, setOperationType] = useState<"Venta" | "Alquiler">(defaultOperationType);
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [roomsFilter, setRoomsFilter] = useState<number[]>(
    defaultBedroomsList && defaultBedroomsList.length > 0 
      ? defaultBedroomsList 
      : defaultBedrooms 
        ? [defaultBedrooms] 
        : [1]
  );
  const [bathroomsFilter, setBathroomsFilter] = useState<number[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("default");

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
      bedrooms: roomsFilter.length > 0 ? Math.min(...roomsFilter) : 1,
      bathrooms: bathroomsFilter.length > 0 ? Math.min(...bathroomsFilter) : null,
      features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
      sortBy: sortBy !== "default" ? sortBy : undefined,
    };

    debouncedFilterChange(filters);
  }, [operationType, priceMin, priceMax, roomsFilter, bathroomsFilter, selectedFeatures, sortBy, debouncedFilterChange]);

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
                  bedrooms: roomsFilter.length > 0 ? Math.min(...roomsFilter) : 1,
                  bathrooms: bathroomsFilter.length > 0 ? Math.min(...bathroomsFilter) : null,
                  features: selectedFeatures,
                  sortBy: sortBy !== "default" ? sortBy : undefined
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
                  bedrooms: roomsFilter.length > 0 ? Math.min(...roomsFilter) : 1,
                  bathrooms: bathroomsFilter.length > 0 ? Math.min(...bathroomsFilter) : null,
                  features: selectedFeatures,
                  sortBy: sortBy !== "default" ? sortBy : undefined
                });
              }}
            >
              Alquilar
            </Button>
          </div>
        </div>

        {/* Fila de filtros - Precio, habitaciones, baños, características, ordenación */}
        <div className="flex flex-wrap gap-6 justify-between">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 flex-grow">
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
                <SelectContent side="bottom">
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
                <SelectContent side="bottom">
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

          {/* Filtros de habitaciones y baños en la misma fila */}
          <div className="flex gap-3">
            {/* Filtro de habitaciones */}
            <div className="flex-1">
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
                        setRoomsFilter([0]); // Solo se permite seleccionar estudios
                      }
                    }}
                  >
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300" 
                      checked={roomsFilter.includes(0)}
                      onChange={() => {}} // Controlado por el onClick del label
                    />
                    <span>0 habitaciones (estudios)</span>
                  </label>
                  <label 
                    className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (roomsFilter.includes(1)) {
                        // Si 1 está seleccionado, lo quitamos junto con todos los superiores
                        setRoomsFilter(prev => prev.filter(r => r !== 1 && r !== 2 && r !== 3 && r !== 4));
                      } else {
                        // Si no está seleccionado, lo seleccionamos junto con todos los superiores
                        // Y nos aseguramos de quitar 0 (estudios) si estuviera seleccionado
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
                      onChange={() => {}} // Controlado por el onClick del label
                    />
                    <span>1</span>
                  </label>
                  <label 
                    className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (roomsFilter.includes(2)) {
                        // Si 2 está seleccionado, lo quitamos junto con todos los superiores
                        setRoomsFilter(prev => prev.filter(r => r !== 2 && r !== 3 && r !== 4));
                      } else {
                        // Si no está seleccionado, lo seleccionamos junto con todos los superiores
                        // Y nos aseguramos de quitar 0 (estudios) si estuviera seleccionado
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
                      onChange={() => {}} // Controlado por el onClick del label
                    />
                    <span>2</span>
                  </label>
                  <label 
                    className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (roomsFilter.includes(3)) {
                        // Si 3 está seleccionado, lo quitamos junto con todos los superiores
                        setRoomsFilter(prev => prev.filter(r => r !== 3 && r !== 4));
                      } else {
                        // Si no está seleccionado, lo seleccionamos junto con todos los superiores
                        // Y nos aseguramos de quitar 0 (estudios) si estuviera seleccionado
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
                      onChange={() => {}} // Controlado por el onClick del label
                    />
                    <span>3</span>
                  </label>
                  <label 
                    className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (roomsFilter.includes(4)) {
                        // Si 4 está seleccionado, lo quitamos
                        setRoomsFilter(prev => prev.filter(r => r !== 4));
                      } else {
                        // Si no está seleccionado, lo seleccionamos
                        // Y nos aseguramos de quitar 0 (estudios) si estuviera seleccionado
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
                      onChange={() => {}} // Controlado por el onClick del label
                    />
                    <span>4 habitaciones o más</span>
                  </label>
                </div>
              </SelectContent>
            </Select>
          </div>

            {/* Filtro de baños */}
            <div className="flex-1">
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
                          setBathroomsFilter(prev => prev.filter(b => b !== 1 && b !== 2));
                        } else {
                          setBathroomsFilter([1, 2]);
                        }
                      }}
                    >
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300" 
                        checked={bathroomsFilter.includes(1)}
                        onChange={() => {}}
                      />
                      <span>1+ baños</span>
                    </label>
                    <label 
                      className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (bathroomsFilter.includes(2)) {
                          setBathroomsFilter(prev => prev.filter(b => b !== 2));
                        } else {
                          setBathroomsFilter(prev => [...prev.filter(b => b !== 1), 2]);
                        }
                      }}
                    >
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300" 
                        checked={bathroomsFilter.includes(2)}
                        onChange={() => {}}
                      />
                      <span>2+ baños</span>
                    </label>
                  </div>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtro de características */}
          <div className="border-l border-gray-200 pl-4">
            <Label className="font-medium mb-1.5 block text-sm">
              <Building className="w-4 h-4 inline-block mr-1.5" strokeWidth={2} />
              Características
            </Label>
            <Select>
              <SelectTrigger className="h-9 text-sm w-full justify-start">
                <SelectValue placeholder={
                  selectedFeatures.length > 0 
                    ? `${selectedFeatures.length} seleccionadas` 
                    : "Seleccionar"
                } />
              </SelectTrigger>
              <SelectContent side="bottom" className="w-[240px]">
                <div className="space-y-2 px-1 py-2">
                  {features.map((feature) => (
                    <label 
                      key={feature.id}
                      className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFeature(feature.id);
                      }}
                    >
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300" 
                        checked={selectedFeatures.includes(feature.id)}
                        onChange={() => {}}
                      />
                      <span>{feature.label}</span>
                    </label>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de ordenación */}
          <div className="border-l border-gray-200 pl-4">
            <Label className="font-medium mb-1.5 block text-sm">
              Ordenar por
            </Label>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value)}
            >
              <SelectTrigger className="h-9 text-sm w-full justify-start">
                <SelectValue placeholder="Predeterminado" />
              </SelectTrigger>
              <SelectContent side="bottom">
                <SelectItem value="default">Predeterminado</SelectItem>
                <SelectItem value="price-asc">Precio: menor a mayor</SelectItem>
                <SelectItem value="price-desc">Precio: mayor a menor</SelectItem>
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="oldest">Más antiguos</SelectItem>
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