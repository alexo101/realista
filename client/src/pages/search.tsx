import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SearchBar } from "@/components/SearchBar";
import { PropertyResults } from "@/components/PropertyResults";
import { AgencyResults } from "@/components/AgencyResults";
import { AgentResults } from "@/components/AgentResults";
import { Building2, UserCircle } from "lucide-react";

export default function SearchPage() {
  const [location] = useLocation();
  const searchType = location.startsWith('/search/agencies')
    ? 'agencies'
    : location.startsWith('/search/agents')
    ? 'agents'
    : location.startsWith('/search/rent')
    ? 'rent'
    : 'buy';

  const { data: results, isLoading } = useQuery({
    queryKey: ['/api/search', searchType, location],
    queryFn: async () => {
      const response = await fetch(`/api${location}`);
      if (!response.ok) throw new Error('Failed to fetch results');
      return response.json();
    },
    staleTime: 0, // No cache entre cambios de tipo de búsqueda
  });

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <SearchBar />
        </div>

        {/* Propiedades en venta */}
        {searchType === 'buy' && (
          <PropertyResults results={results || []} isLoading={isLoading} />
        )}
        
        {/* Propiedades en alquiler */}
        {searchType === 'rent' && (
          <PropertyResults results={results || []} isLoading={isLoading} />
        )}
        {searchType === 'agencies' && (
          <AgencyResults results={results || []} isLoading={isLoading} />
        )}
        {searchType === 'agents' && (
          <AgentResults results={results || []} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
}
