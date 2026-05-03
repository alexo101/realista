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
import { Switch } from "@/components/ui/switch";
import { Euro, Bath, BedDouble, Building, List, Map, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import debounce from "lodash.debounce";
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

interface PropertyFiltersProps {
  onFilterChange: (filters: PropertyFilters) => void;
  defaultOperationType?: "Venta" | "Alquiler";
  defaultPropertyType?: PropertyType;
  defaultBedrooms?: number | null;
  defaultBedroomsList?: number[];
  defaultExcludeSinglePhoto?: boolean;
  defaultRequireExactAddress?: boolean;
  defaultRequireCedulaHabitabilidad?: boolean;
  defaultExcludeOcupados?: boolean;
  defaultExcludeAlquilados?: boolean;
  viewMode?: 'list' | 'map';
  onViewModeChange?: (mode: 'list' | 'map') => void;
  showViewToggle?: boolean;
  saveSearchButton?: React.ReactNode;
}

export interface PropertyFilters {
  operationType: "Venta" | "Alquiler";
  propertyType: PropertyType;
  priceMin: number | null;
  priceMax: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  features: string[];
  excludeSinglePhoto?: boolean;
  requireExactAddress?: boolean;
  requireCedulaHabitabilidad?: boolean;
  excludeOcupados?: boolean;
  excludeAlquilados?: boolean;
  sortBy?: string;
}

interface ExclusionToggleConfig {
  key: 'excludeSinglePhoto' | 'requireExactAddress' | 'requireCedulaHabitabilidad' | 'excludeOcupados' | 'excludeAlquilados';
  label: string;
  description?: string;
}

const EXCLUSION_TOGGLES: ExclusionToggleConfig[] = [
  { key: 'excludeSinglePhoto', label: 'Ocultar anuncios con 1 sola foto' },
  { key: 'requireExactAddress', label: 'Solo dirección exacta' },
  { key: 'requireCedulaHabitabilidad', label: 'Solo con cédula de habitabilidad' },
  { key: 'excludeOcupados', label: 'Ocultar inmuebles ocupados' },
  { key: 'excludeAlquilados', label: 'Ocultar inmuebles alquilados' },
];

export function PropertyFilters({ 
  onFilterChange, 
  defaultOperationType = "Venta",
  defaultPropertyType = "Vivienda",
  defaultBedrooms = null,
  defaultBedroomsList = [],
  defaultExcludeSinglePhoto = false,
  defaultRequireExactAddress = false,
  defaultRequireCedulaHabitabilidad = false,
  defaultExcludeOcupados = false,
  defaultExcludeAlquilados = false,
  viewMode = 'list',
  onViewModeChange,
  showViewToggle = false,
  saveSearchButton
}: PropertyFiltersProps) {
  const [operationType, setOperationType] = useState<"Venta" | "Alquiler">(defaultOperationType);
  const [propertyType, setPropertyType] = useState<PropertyType>(defaultPropertyType);
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [roomsFilter, setRoomsFilter] = useState<number[]>(
    defaultBedroomsList.length > 0 
      ? defaultBedroomsList 
      : defaultBedrooms !== null 
        ? [defaultBedrooms] 
        : []
  );
  const [bathroomsFilter, setBathroomsFilter] = useState<number[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [exclusionFlags, setExclusionFlags] = useState<{
    excludeSinglePhoto: boolean;
    requireExactAddress: boolean;
    requireCedulaHabitabilidad: boolean;
    excludeOcupados: boolean;
    excludeAlquilados: boolean;
  }>({
    excludeSinglePhoto: defaultExcludeSinglePhoto,
    requireExactAddress: defaultRequireExactAddress,
    requireCedulaHabitabilidad: defaultRequireCedulaHabitabilidad,
    excludeOcupados: defaultExcludeOcupados,
    excludeAlquilados: defaultExcludeAlquilados,
  });

  // Opciones para los rangos de precios según el tipo de operación
  const priceOptions = {
    Venta: [
      { value: "60000", label: "60.000€" },
      { value: "70000", label: "70.000€" },
      { value: "80000", label: "80.000€" },
      { value: "90000", label: "90.000€" },
      { value: "100000", label: "100.000€" },
      { value: "110000", label: "110.000€" },
      { value: "120000", label: "120.000€" },
      { value: "130000", label: "130.000€" },
      { value: "140000", label: "140.000€" },
      { value: "150000", label: "150.000€" },
      { value: "160000", label: "160.000€" },
      { value: "170000", label: "170.000€" },
      { value: "180000", label: "180.000€" },
      { value: "190000", label: "190.000€" },
      { value: "200000", label: "200.000€" },
      { value: "220000", label: "220.000€" },
      { value: "240000", label: "240.000€" },
      { value: "260000", label: "260.000€" },
      { value: "280000", label: "280.000€" },
      { value: "300000", label: "300.000€" },
      { value: "320000", label: "320.000€" },
      { value: "340000", label: "340.000€" },
      { value: "360000", label: "360.000€" },
      { value: "380000", label: "380.000€" },
      { value: "400000", label: "400.000€" },
      { value: "450000", label: "450.000€" },
      { value: "500000", label: "500.000€" },
      { value: "550000", label: "550.000€" },
      { value: "600000", label: "600.000€" },
      { value: "650000", label: "650.000€" },
      { value: "700000", label: "700.000€" },
      { value: "750000", label: "750.000€" },
      { value: "800000", label: "800.000€" },
      { value: "850000", label: "850.000€" },
      { value: "900000", label: "900.000€" },
      { value: "950000", label: "950.000€" },
      { value: "1000000", label: "1.000.000€" },
      { value: "1100000", label: "1.100.000€" },
      { value: "1200000", label: "1.200.000€" },
      { value: "1300000", label: "1.300.000€" },
      { value: "1400000", label: "1.400.000€" },
      { value: "1500000", label: "1.500.000€" },
      { value: "1600000", label: "1.600.000€" },
      { value: "1700000", label: "1.700.000€" },
      { value: "1800000", label: "1.800.000€" },
      { value: "1900000", label: "1.900.000€" },
      { value: "2000000", label: "2.000.000€" },
      { value: "2100000", label: "2.100.000€" },
      { value: "2200000", label: "2.200.000€" },
      { value: "2300000", label: "2.300.000€" },
      { value: "2400000", label: "2.400.000€" },
      { value: "2500000", label: "2.500.000€" },
      { value: "2600000", label: "2.600.000€" },
      { value: "2700000", label: "2.700.000€" },
      { value: "2800000", label: "2.800.000€" },
      { value: "2900000", label: "2.900.000€" },
      { value: "3000000", label: "3.000.000€" },
      { value: "3000000+", label: "+ 3.000.000€" }
    ],
    Alquiler: [
      { value: "500", label: "500€" },
      { value: "550", label: "550€" },
      { value: "600", label: "600€" },
      { value: "650", label: "650€" },
      { value: "700", label: "700€" },
      { value: "750", label: "750€" },
      { value: "800", label: "800€" },
      { value: "850", label: "850€" },
      { value: "900", label: "900€" },
      { value: "950", label: "950€" },
      { value: "1000", label: "1.000€" },
      { value: "1100", label: "1.100€" },
      { value: "1200", label: "1.200€" },
      { value: "1300", label: "1.300€" },
      { value: "1400", label: "1.400€" },
      { value: "1500", label: "1.500€" },
      { value: "1600", label: "1.600€" },
      { value: "1700", label: "1.700€" },
      { value: "1800", label: "1.800€" },
      { value: "1900", label: "1.900€" },
      { value: "2000", label: "2.000€" },
      { value: "2200", label: "2.200€" },
      { value: "2400", label: "2.400€" },
      { value: "2600", label: "2.600€" },
      { value: "2800", label: "2.800€" },
      { value: "3000", label: "3.000€" },
      { value: "3000+", label: "+3.000€" }
    ]
  };

  // Using unified features from shared configuration

  // Actualizar filtros cuando cambien los valores
  const debouncedFilterChange = debounce((filters: PropertyFilters) => {
    onFilterChange(filters);
  }, 300);

  useEffect(() => {
    const filters: PropertyFilters = {
      operationType,
      propertyType,
      priceMin,
      priceMax,
      bedrooms: roomsFilter.length > 0 ? Math.min(...roomsFilter) : null,
      bathrooms: bathroomsFilter.length > 0 ? Math.min(...bathroomsFilter) : null,
      features: selectedFeatures,
      ...exclusionFlags,
      sortBy: sortBy !== "newest" ? sortBy : undefined
    };
    
    debouncedFilterChange(filters);
  }, [operationType, propertyType, priceMin, priceMax, roomsFilter, bathroomsFilter, selectedFeatures, sortBy, exclusionFlags]);

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="space-y-6">
        {/* Sección superior - Toggle de operación y vista */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-all",
                  operationType === "Venta" 
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-white"
                )}
                onClick={() => {
                  setOperationType("Venta");
                  setPriceMin(null);
                  setPriceMax(null);
                  onFilterChange({
                    operationType: "Venta",
                    propertyType,
                    priceMin: null,
                    priceMax: null,
                    bedrooms: roomsFilter.length > 0 ? Math.min(...roomsFilter) : 1,
                    bathrooms: bathroomsFilter.length > 0 ? Math.min(...bathroomsFilter) : null,
                    features: selectedFeatures,
                    sortBy: sortBy !== "newest" ? sortBy : undefined
                  });
                }}
              >
                Comprar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-all",
                  operationType === "Alquiler" 
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-white"
                )}
                onClick={() => {
                  setOperationType("Alquiler");
                  setPriceMin(null);
                  setPriceMax(null);
                  onFilterChange({
                    operationType: "Alquiler",
                    propertyType,
                    priceMin: null,
                    priceMax: null,
                    bedrooms: roomsFilter.length > 0 ? Math.min(...roomsFilter) : 1,
                    bathrooms: bathroomsFilter.length > 0 ? Math.min(...bathroomsFilter) : null,
                    features: selectedFeatures,
                    sortBy: sortBy !== "newest" ? sortBy : undefined
                  });
                }}
              >
                Alquilar
              </Button>
            </div>

            {/* Tipo de inmueble dropdown */}
            <Select
              value={propertyType}
              onValueChange={(value: PropertyType) => {
                setPropertyType(value);
                onFilterChange({
                  operationType,
                  propertyType: value,
                  priceMin,
                  priceMax,
                  bedrooms: roomsFilter.length > 0 ? Math.min(...roomsFilter) : 1,
                  bathrooms: bathroomsFilter.length > 0 ? Math.min(...bathroomsFilter) : null,
                  features: selectedFeatures,
                  sortBy: sortBy !== "newest" ? sortBy : undefined
                });
              }}
            >
              <SelectTrigger className="w-[140px] h-9 text-sm border-gray-200 rounded-lg" data-testid="select-property-type">
                <SelectValue placeholder="Tipo de inmueble" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type} value={type} data-testid={`option-property-type-${type.toLowerCase()}`}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Save search button if provided */}
            {saveSearchButton && saveSearchButton}
          </div>

          {/* Toggle de vista (Lista/Mapa) */}
          {showViewToggle && onViewModeChange && (
            <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-all",
                  viewMode === "list" 
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-white"
                )}
                onClick={() => onViewModeChange('list')}
              >
                <List className="h-4 w-4 mr-2" />
                Lista
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-all",
                  viewMode === "map" 
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-white"
                )}
                onClick={() => onViewModeChange('map')}
              >
                <Map className="h-4 w-4 mr-2" />
                Mapa
              </Button>
            </div>
          )}
        </div>

        {/* Sección de filtros principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {/* Precio mínimo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600 flex items-center">
              <Euro className="w-4 h-4 mr-1" />
              Min.
            </Label>
            <Select
              value={priceMin?.toString() || "any"}
              onValueChange={(value) => setPriceMin(value === "any" ? null : parseInt(value))}
            >
              <SelectTrigger className="h-10 text-sm border-gray-300 rounded-md">
                <SelectValue placeholder="Cualquiera" />
              </SelectTrigger>
              <SelectContent side="bottom">
                <SelectItem value="any">Cualquiera</SelectItem>
                {priceOptions[operationType].map((option) => (
                  <SelectItem key={`min-${option.value}`} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Precio máximo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600 flex items-center">
              <Euro className="w-4 h-4 mr-1" />
              Máx.
            </Label>
            <Select
              value={priceMax?.toString() || "any"}
              onValueChange={(value) => setPriceMax(value === "any" ? null : parseInt(value))}
            >
              <SelectTrigger className="h-10 text-sm border-gray-300 rounded-md">
                <SelectValue placeholder="Cualquiera" />
              </SelectTrigger>
              <SelectContent side="bottom">
                <SelectItem value="any">Cualquiera</SelectItem>
                {priceOptions[operationType].map((option) => (
                  <SelectItem key={`max-${option.value}`} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Habitaciones */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600 flex items-center">
              <BedDouble className="w-4 h-4 mr-1" />
              Habitaciones
            </Label>
            <Select>
              <SelectTrigger className="h-10 text-sm border-gray-300 rounded-md">
                <SelectValue placeholder="Cualquiera" />
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

          {/* Baños */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600 flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              Baños
            </Label>
            <Select>
              <SelectTrigger className="h-10 text-sm border-gray-300 rounded-md">
                <SelectValue placeholder="Baños" />
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

          {/* Características */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600 flex items-center">
              <Building className="w-4 h-4 mr-1" />
              Características
            </Label>
            <Select>
              <SelectTrigger className="h-10 text-sm border-gray-300 rounded-md">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent side="bottom" className="w-[240px]">
                <div className="space-y-2 px-1 py-2">
                  {PROPERTY_FEATURES.map((feature) => (
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

        </div>

        {/* Filtros de exclusión */}
        <div className="border-t pt-4">
          <div className="flex items-center mb-3">
            <Filter className="w-4 h-4 mr-2 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-700">Filtros de exclusión</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EXCLUSION_TOGGLES.map((toggle) => (
              <label
                key={toggle.key}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer"
                data-testid={`row-exclusion-${toggle.key}`}
              >
                <span className="text-sm text-gray-700">{toggle.label}</span>
                <Switch
                  checked={exclusionFlags[toggle.key]}
                  onCheckedChange={(checked) =>
                    setExclusionFlags(prev => ({ ...prev, [toggle.key]: checked }))
                  }
                  data-testid={`switch-exclusion-${toggle.key}`}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Etiquetas de características seleccionadas */}
        {selectedFeatures.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex flex-wrap gap-2">
              {selectedFeatures.map((featureId) => {
                const feature = PROPERTY_FEATURES.find(f => f.id === featureId);
                return feature ? (
                  <Badge
                    key={featureId}
                    variant="secondary"
                    className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {feature.label}
                    <button
                      className="ml-1.5 text-blue-600 hover:text-blue-800"
                      onClick={() => toggleFeature(featureId)}
                    >
                      ×
                    </button>
                  </Badge>
                ) : null;
              })}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-3 text-xs text-gray-500 hover:text-gray-700"
                onClick={() => setSelectedFeatures([])}
              >
                Limpiar todo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}