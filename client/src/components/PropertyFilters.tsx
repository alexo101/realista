import React, { useState, useEffect, useCallback } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
}

export function PropertyFilters({ onFilterChange, defaultOperationType = "Venta" }: PropertyFiltersProps) {
  const [operationType, setOperationType] = useState<"Venta" | "Alquiler">(defaultOperationType);
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [bedrooms, setBedrooms] = useState<number | null | string>(null);
  const [bathrooms, setBathrooms] = useState<number | null | string>(null);

  // Precios máximos por defecto según el tipo de operación
  const maxPriceByType = {
    Venta: 1000000, // 1 millón para compra
    Alquiler: 3000   // 3000€ para alquiler
  };

  // Ajustar el rango de precios cuando cambia el tipo de operación
  useEffect(() => {
    const newMax = maxPriceByType[operationType];
    setPriceRange([0, newMax]);
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

  // Ejecutar el callback con los filtros actuales
  useEffect(() => {
    debouncedFilterChange({
      operationType,
      priceMin,
      priceMax,
      bedrooms,
      bathrooms
    });
  }, [operationType, priceMin, priceMax, bedrooms, bathrooms, debouncedFilterChange]);

  // Manejadores para los inputs de precio
  const handlePriceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? null : parseInt(e.target.value);
    setPriceMin(value);
    if (value !== null && priceMax !== null && value > priceMax) {
      setPriceMax(value);
    }
    
    // Actualizar el slider si ambos valores están definidos
    if (value !== null && priceMax !== null) {
      setPriceRange([value, priceMax]);
    } else if (value !== null) {
      setPriceRange([value, priceRange[1]]);
    }
  };

  const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? null : parseInt(e.target.value);
    setPriceMax(value);
    if (value !== null && priceMin !== null && value < priceMin) {
      setPriceMin(value);
    }
    
    // Actualizar el slider si ambos valores están definidos
    if (priceMin !== null && value !== null) {
      setPriceRange([priceMin, value]);
    } else if (value !== null) {
      setPriceRange([priceRange[0], value]);
    }
  };

  // Manejar cambios en el slider
  const handleSliderChange = (value: number[]) => {
    const [min, max] = value;
    setPriceMin(min || null);
    setPriceMax(max || null);
    setPriceRange([min, max]);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro de tipo de operación */}
          <div className="space-y-2">
            <Label htmlFor="operation-type">Operación</Label>
            <Select
              value={operationType}
              onValueChange={(value: "Venta" | "Alquiler") => setOperationType(value)}
            >
              <SelectTrigger id="operation-type">
                <SelectValue placeholder="Tipo de operación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Venta">Comprar</SelectItem>
                <SelectItem value="Alquiler">Alquilar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de rango de precios */}
          <div className="space-y-2">
            <Label>Precio {operationType === "Alquiler" ? "mensual" : ""}</Label>
            <div className="pt-6 px-2">
              <Slider
                min={0}
                max={maxPriceByType[operationType]}
                step={operationType === "Venta" ? 10000 : 50}
                value={priceRange}
                onValueChange={handleSliderChange}
              />
            </div>
            <div className="flex items-center mt-2">
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  €
                </span>
                <Input
                  type="number"
                  placeholder="No min"
                  value={priceMin !== null ? priceMin : ""}
                  onChange={handlePriceMinChange}
                  className="pl-8"
                  min={0}
                  max={priceMax || undefined}
                />
              </div>
              <span className="mx-2">-</span>
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  €
                </span>
                <Input
                  type="number"
                  placeholder="No max"
                  value={priceMax !== null ? priceMax : ""}
                  onChange={handlePriceMaxChange}
                  className="pl-8"
                  min={priceMin || 0}
                  max={maxPriceByType[operationType]}
                />
              </div>
            </div>
          </div>

          {/* Filtro de habitaciones y baños */}
          <div className="space-y-2">
            <Label>Habitaciones y baños</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={bedrooms?.toString() || ""}
                onValueChange={(value) => setBedrooms(value ? parseInt(value) : null)}
              >
                <SelectTrigger>
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

              <Select
                value={bathrooms?.toString() || ""}
                onValueChange={(value) => setBathrooms(value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Baños" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Cualquiera</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}