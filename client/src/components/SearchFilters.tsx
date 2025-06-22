import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SearchFiltersProps {
  onFilter: (filters: any) => void;
}

export function SearchFilters({ onFilter }: SearchFiltersProps) {
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
    type: "",
  });

  const handleFilter = () => {
    onFilter(filters);
  };

  const clearFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      type: "",
    });
    onFilter({});
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Precio mínimo</Label>
          <Input
            type="number"
            value={filters.minPrice}
            onChange={(e) =>
              setFilters({ ...filters, minPrice: e.target.value })
            }
            placeholder="€"
          />
        </div>

        <div>
          <Label>Precio máximo</Label>
          <Input
            type="number"
            value={filters.maxPrice}
            onChange={(e) =>
              setFilters({ ...filters, maxPrice: e.target.value })
            }
            placeholder="€"
          />
        </div>
      </div>

      <div>
        <Label>Habitaciones</Label>
        <Select
          value={filters.bedrooms}
          onValueChange={(value) => {
            let selectedValue = value;

            // Lógica para seleccionar habitaciones en cascada
            if (value === "1") {
              // Si selecciona 1, también marcar 2, 3 y 4+
              selectedValue = "1,2,3,4";
            } else if (value === "2") {
              // Si selecciona 2, también marcar 3 y 4+
              selectedValue = "2,3,4";
            } else if (value === "3") {
              // Si selecciona 3, también marcar 4+
              selectedValue = "3,4";
            } else if (value === "0") {
              // Si selecciona "estudio", seleccionar solo 0 (exclusivo)
              selectedValue = "0";
            }

            setFilters({ ...filters, bedrooms: selectedValue });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Cualquiera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquiera</SelectItem>
            <SelectItem value="0">0 habitaciones (estudio)</SelectItem>
            <SelectItem value="1">1+ habitaciones</SelectItem>
            <SelectItem value="2">2+ habitaciones</SelectItem>
            <SelectItem value="3">3+ habitaciones</SelectItem>
            <SelectItem value="4">4+ habitaciones</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Tipo de propiedad</Label>
        <Select
          value={filters.type}
          onValueChange={(value) =>
            setFilters({ ...filters, type: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Cualquiera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquiera</SelectItem>
            <SelectItem value="apartment">Piso</SelectItem>
            <SelectItem value="house">Casa</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
            <SelectItem value="penthouse">Ático</SelectItem>
            <SelectItem value="duplex">Dúplex</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={handleFilter}
        >
          <Search className="w-4 h-4 mr-2" />
          Filtrar
        </Button>

        <Button
          variant="outline"
          onClick={clearFilters}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}