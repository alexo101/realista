import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  features: string[];
  sortBy?: string;
}

export function PropertyFilters({ 
  onFilterChange, 
  defaultOperationType = "Venta",
  defaultBedrooms = null,
  defaultBedroomsList = []
}: PropertyFiltersProps) {
  const [operationType, setOperationType] = useState<"Venta" | "Alquiler">(defaultOperationType);
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [roomsFilter, setRoomsFilter] = useState<number[]>(
    defaultBedroomsList.length > 0 
      ? defaultBedroomsList 
      : defaultBedrooms !== null 
        ? [defaultBedrooms] 
        : [1]
  );
  const [bathroomsFilter, setBathroomsFilter] = useState<number[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("newest");

  // Opciones para los rangos de precios según el tipo de operación
  const priceOptions = {
    Venta: [
      { value: "100000", label: "100.000€" },
      { value: "200000", label: "200.000€" },
      { value: "300000", label: "300.000€" },
      { value: "400000", label: "400.000€" },
      { value: "500000", label: "500.000€" },
      { value: "750000", label: "750.000€" },
      { value: "1000000", label: "1.000.000€" },
      { value: "1500000", label: "1.500.000€" },
      { value: "2000000", label: "2.000.000€" }
    ],
    Alquiler: [
      { value: "500", label: "500€" },
      { value: "750", label: "750€" },
      { value: "1000", label: "1.000€" },
      { value: "1250", label: "1.250€" },
      { value: "1500", label: "1.500€" },
      { value: "2000", label: "2.000€" },
      { value: "2500", label: "2.500€" },
      { value: "3000", label: "3.000€" },
      { value: "4000", label: "4.000€" }
    ]
  };

  // Características disponibles
  const features = [
    { id: "elevator", label: "Ascensor" },
    { id: "parking", label: "Parking" },
    { id: "terrace", label: "Terraza" },
    { id: "garden", label: "Jardín" },
    { id: "pool", label: "Piscina" },
    { id: "gym", label: "Gimnasio" },
    { id: "security", label: "Seguridad 24h" },
    { id: "furnished", label: "Amueblado" },
    { id: "airConditioning", label: "Aire acondicionado" },
    { id: "heating", label: "Calefacción" },
    { id: "fireplace", label: "Chimenea" },
    { id: "balcony", label: "Balcón" }
  ];

  // Actualizar filtros cuando cambien los valores
  const debouncedFilterChange = debounce((filters: PropertyFilters) => {
    onFilterChange(filters);
  }, 300);

  useEffect(() => {
    const filters: PropertyFilters = {
      operationType,
      priceMin,
      priceMax,
      bedrooms: roomsFilter.length > 0 ? Math.min(...roomsFilter) : null,
      bathrooms: bathroomsFilter.length > 0 ? Math.min(...bathroomsFilter) : null,
      features: selectedFeatures,
      sortBy: sortBy !== "newest" ? sortBy : undefined
    };
    
    debouncedFilterChange(filters);
  }, [operationType, priceMin, priceMax, roomsFilter, bathroomsFilter, selectedFeatures, sortBy]);

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
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

        {/* Fila de filtros organizados uniformemente */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Filtro de precio */}
          <div className="space-y-1.5">
            <Label className="font-medium block text-sm">
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
              <span className="text-gray-400">-</span>
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

          {/* Filtro de habitaciones */}
          <div className="space-y-1.5">
            <Label className="font-medium block text-sm">
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
              <SelectContent side="bottom" className="w-[240px]">
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
          <div className="space-y-1.5">
            <Label className="font-medium block text-sm">
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
              <SelectContent side="bottom" className="w-[200px]">
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

          {/* Filtro de características */}
          <div className="space-y-1.5">
            <Label className="font-medium block text-sm">
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
          <div className="space-y-1.5">
            <Label className="font-medium block text-sm">
              Ordenar por
            </Label>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value)}
            >
              <SelectTrigger className="h-9 text-sm w-full justify-start">
                <SelectValue placeholder="Más recientes" />
              </SelectTrigger>
              <SelectContent side="bottom">
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="price-asc">Más baratos</SelectItem>
                <SelectItem value="price-m2">Más baratos €/m2</SelectItem>
                <SelectItem value="price-drop">Mayores bajadas</SelectItem>
              </SelectContent>
            </Select>
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