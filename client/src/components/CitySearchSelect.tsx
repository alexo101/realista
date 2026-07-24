import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getCities } from "@/utils/neighborhoods";

type CitySearchSelectProps = {
  value?: string | null;
  onChange: (city: string | null) => void;
  placeholder?: string;
  emptyLabel?: string;
  testId?: string;
};

/**
 * Searchable city picker backed by the internal catalog (getCities).
 * Alphabetically ordered; not tied to Google locality naming.
 */
export function CitySearchSelect({
  value,
  onChange,
  placeholder = "Buscar ciudad...",
  emptyLabel = "No se encontraron ciudades",
  testId = "input-city-search",
}: CitySearchSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filteredCities = getCities()
    .filter((cityOption) =>
      cityOption.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .slice(0, 50);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
        <Input
          placeholder={placeholder}
          value={dropdownOpen ? searchTerm : value || ""}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!dropdownOpen) setDropdownOpen(true);
          }}
          onFocus={() => {
            setDropdownOpen(true);
            setSearchTerm("");
          }}
          className="min-h-[44px] w-full pl-9 pr-8"
          data-testid={testId}
        />
        {value && !dropdownOpen && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setDropdownOpen(true);
              setSearchTerm("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
            aria-label="Clear city"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {dropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setDropdownOpen(false);
              setSearchTerm("");
            }}
          />
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
            {filteredCities.map((cityOption, index) => (
              <button
                key={`${cityOption}-${index}`}
                type="button"
                className={`min-h-[44px] w-full px-4 py-3 text-left text-sm hover:bg-gray-100 ${
                  value === cityOption ? "bg-primary/10 font-medium text-primary" : ""
                }`}
                onClick={() => {
                  onChange(cityOption);
                  setDropdownOpen(false);
                  setSearchTerm("");
                }}
                data-testid={`city-option-${cityOption}`}
              >
                {cityOption}
              </button>
            ))}
            {filteredCities.length === 0 && (
              <div className="px-4 py-2 text-sm text-gray-500">{emptyLabel}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
