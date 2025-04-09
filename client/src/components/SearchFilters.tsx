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
          <Label>Min Price</Label>
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
          <Label>Max Price</Label>
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
        <Label>Bedrooms</Label>
        <Select
          value={filters.bedrooms}
          onValueChange={(value) =>
            setFilters({ ...filters, bedrooms: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            <SelectItem value="1">1+</SelectItem>
            <SelectItem value="2">2+</SelectItem>
            <SelectItem value="3">3+</SelectItem>
            <SelectItem value="4">4+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Property Type</Label>
        <Select
          value={filters.type}
          onValueChange={(value) =>
            setFilters({ ...filters, type: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="house">House</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={handleFilter}
        >
          <Search className="w-4 h-4 mr-2" />
          Filter
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
