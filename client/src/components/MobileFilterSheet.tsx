import { useState, useEffect } from "react";
import { X, Euro, BedDouble, Bath, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PROPERTY_FEATURES } from "@/utils/property-features";

const PROPERTY_TYPES = [
  "Vivienda",
  "Oficinas",
  "Locales",
  "Parking",
  "Terrenos",
  "Trasteros",
  "Edificios"
] as const;

type PropertyType = typeof PROPERTY_TYPES[number];

export interface MobileFiltersState {
  operationType: "Venta" | "Alquiler";
  propertyType: PropertyType;
  priceMin: number | null;
  priceMax: number | null;
  bedrooms: number[];
  bathrooms: number[];
  features: string[];
}

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: MobileFiltersState;
  onApplyFilters: (filters: MobileFiltersState) => void;
}

const PRICE_OPTIONS_VENTA = [
  { value: "60000", label: "60.000€" },
  { value: "100000", label: "100.000€" },
  { value: "150000", label: "150.000€" },
  { value: "200000", label: "200.000€" },
  { value: "300000", label: "300.000€" },
  { value: "400000", label: "400.000€" },
  { value: "500000", label: "500.000€" },
  { value: "750000", label: "750.000€" },
  { value: "1000000", label: "1.000.000€" },
  { value: "1500000", label: "1.500.000€" },
  { value: "2000000", label: "2.000.000€" },
  { value: "3000000", label: "3.000.000€" },
];

const PRICE_OPTIONS_ALQUILER = [
  { value: "500", label: "500€" },
  { value: "750", label: "750€" },
  { value: "1000", label: "1.000€" },
  { value: "1250", label: "1.250€" },
  { value: "1500", label: "1.500€" },
  { value: "2000", label: "2.000€" },
  { value: "2500", label: "2.500€" },
  { value: "3000", label: "3.000€" },
];

export function MobileFilterSheet({
  isOpen,
  onClose,
  filters,
  onApplyFilters
}: MobileFilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<MobileFiltersState>(filters);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  const priceOptions = localFilters.operationType === "Venta" 
    ? PRICE_OPTIONS_VENTA 
    : PRICE_OPTIONS_ALQUILER;

  const toggleRoom = (room: number) => {
    setLocalFilters(prev => ({
      ...prev,
      bedrooms: prev.bedrooms.includes(room)
        ? prev.bedrooms.filter(r => r !== room)
        : [...prev.bedrooms, room]
    }));
  };

  const toggleBathroom = (bath: number) => {
    setLocalFilters(prev => ({
      ...prev,
      bathrooms: prev.bathrooms.includes(bath)
        ? prev.bathrooms.filter(b => b !== bath)
        : [...prev.bathrooms, bath]
    }));
  };

  const toggleFeature = (featureId: string) => {
    setLocalFilters(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId]
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: MobileFiltersState = {
      operationType: "Venta",
      propertyType: "Vivienda",
      priceMin: null,
      priceMax: null,
      bedrooms: [],
      bathrooms: [],
      features: []
    };
    setLocalFilters(resetFilters);
  };

  const activeFiltersCount = [
    localFilters.priceMin !== null,
    localFilters.priceMax !== null,
    localFilters.bedrooms.length > 0,
    localFilters.bathrooms.length > 0,
    localFilters.features.length > 0,
    localFilters.propertyType !== "Vivienda"
  ].filter(Boolean).length;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0">
        <SheetHeader className="sticky top-0 bg-white border-b px-4 py-3 z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Filtros</SheetTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              data-testid="button-close-filters"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(90vh-130px)] px-4 py-4 space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Tipo de operación</Label>
            <div className="flex gap-2">
              <Button
                variant={localFilters.operationType === "Venta" ? "default" : "outline"}
                size="sm"
                className="flex-1 rounded-full"
                onClick={() => setLocalFilters(prev => ({ 
                  ...prev, 
                  operationType: "Venta",
                  priceMin: null,
                  priceMax: null
                }))}
                data-testid="filter-operation-venta"
              >
                Comprar
              </Button>
              <Button
                variant={localFilters.operationType === "Alquiler" ? "default" : "outline"}
                size="sm"
                className="flex-1 rounded-full"
                onClick={() => setLocalFilters(prev => ({ 
                  ...prev, 
                  operationType: "Alquiler",
                  priceMin: null,
                  priceMax: null
                }))}
                data-testid="filter-operation-alquiler"
              >
                Alquilar
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Building className="h-4 w-4" />
              Tipo de inmueble
            </Label>
            <Select
              value={localFilters.propertyType}
              onValueChange={(value: PropertyType) => setLocalFilters(prev => ({ ...prev, propertyType: value }))}
            >
              <SelectTrigger className="w-full" data-testid="filter-property-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Precio
            </Label>
            <div className="flex gap-3">
              <Select
                value={localFilters.priceMin?.toString() || "any"}
                onValueChange={(value) => setLocalFilters(prev => ({ 
                  ...prev, 
                  priceMin: value === "any" ? null : parseInt(value) 
                }))}
              >
                <SelectTrigger className="flex-1" data-testid="filter-price-min">
                  <SelectValue placeholder="Mínimo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Cualquiera</SelectItem>
                  {priceOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="flex items-center text-gray-400">-</span>
              <Select
                value={localFilters.priceMax?.toString() || "any"}
                onValueChange={(value) => setLocalFilters(prev => ({ 
                  ...prev, 
                  priceMax: value === "any" ? null : parseInt(value) 
                }))}
              >
                <SelectTrigger className="flex-1" data-testid="filter-price-max">
                  <SelectValue placeholder="Máximo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Cualquiera</SelectItem>
                  {priceOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <BedDouble className="h-4 w-4" />
              Habitaciones
            </Label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((room) => (
                <Button
                  key={room}
                  variant={localFilters.bedrooms.includes(room) ? "default" : "outline"}
                  size="sm"
                  className="rounded-full min-w-[44px]"
                  onClick={() => toggleRoom(room)}
                  data-testid={`filter-bedroom-${room}`}
                >
                  {room === 5 ? "5+" : room}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Bath className="h-4 w-4" />
              Baños
            </Label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((bath) => (
                <Button
                  key={bath}
                  variant={localFilters.bathrooms.includes(bath) ? "default" : "outline"}
                  size="sm"
                  className="rounded-full min-w-[44px]"
                  onClick={() => toggleBathroom(bath)}
                  data-testid={`filter-bathroom-${bath}`}
                >
                  {bath === 4 ? "4+" : bath}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Características</Label>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_FEATURES.map((feature) => (
                <Badge
                  key={feature.id}
                  variant={localFilters.features.includes(feature.id) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors py-1.5 px-3",
                    localFilters.features.includes(feature.id)
                      ? "bg-[#0284c5] hover:bg-[#0273b0]"
                      : "hover:bg-gray-100"
                  )}
                  onClick={() => toggleFeature(feature.id)}
                  data-testid={`filter-feature-${feature.id}`}
                >
                  {feature.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-4 py-3 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleReset}
            data-testid="button-reset-filters"
          >
            Limpiar
          </Button>
          <Button
            className="flex-1 bg-[#0284c5] hover:bg-[#0273b0]"
            onClick={handleApply}
            data-testid="button-apply-filters"
          >
            Ver resultados
            {activeFiltersCount > 0 && (
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
