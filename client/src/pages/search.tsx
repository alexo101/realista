import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Property } from "@shared/schema";
import { PropertyCard } from "@/components/PropertyCard";
import { SearchFilters } from "@/components/SearchFilters";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({});

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties", searchQuery, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(searchQuery && { query: searchQuery }),
        ...filters,
      });
      const response = await fetch(`/api/properties?${params}`);
      if (!response.ok) throw new Error("Failed to fetch properties");
      return response.json();
    },
  });

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search by location or property name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside>
            <SearchFilters onFilter={setFilters} />
          </aside>

          <main className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-[400px] bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : properties?.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-2">No properties found</h2>
                <p className="text-gray-600">
                  Try adjusting your search criteria
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties?.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}