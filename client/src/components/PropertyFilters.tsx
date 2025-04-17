import React, { useState, useEffect, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const [bedrooms, setBedrooms] = useState<number | null | string>(null);
  const [bathrooms, setBathrooms] = useState<number | null | string>(null);

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
    };

    debouncedFilterChange(filters);
  }, [operationType, priceMin, priceMax, bedrooms, bathrooms, debouncedFilterChange]);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
        {/* Tipo de operación */}
        <div>
          <Label className="mb-2 block">Operación</Label>
          <RadioGroup
            value={operationType}
            onValueChange={(value) => setOperationType(value as "Venta" | "Alquiler")}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Venta" id="venta" />
              <Label htmlFor="venta" className="cursor-pointer">Comprar</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Alquiler" id="alquiler" />
              <Label htmlFor="alquiler" className="cursor-pointer">Alquilar</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Filtro de precios con dropdowns */}
        <div className="flex-1">
          <Label className="mb-2 block">Precio</Label>
          <div className="flex items-center gap-2">
            <Select
              value={priceMin?.toString() || "any"}
              onValueChange={(value) => setPriceMin(value === "any" ? null : parseInt(value))}
            >
              <SelectTrigger>
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
              <SelectTrigger>
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
          <Label className="mb-2 block">Habitaciones</Label>
          <Select
            value={bedrooms?.toString() || "any"}
            onValueChange={(value) => setBedrooms(value ? value : "any")}
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
        </div>

        {/* Filtro de baños */}
        <div>
          <Label className="mb-2 block">Baños</Label>
          <Select
            value={bathrooms?.toString() || "any"}
            onValueChange={(value) => setBathrooms(value ? value : "any")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Baños" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Cualquiera</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}