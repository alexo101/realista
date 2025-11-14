import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SearchBar } from "@/components/SearchBar";
import { PropertyResults } from "@/components/PropertyResults";
import { AgencyResults } from "@/components/AgencyResults";
import { AgentResults } from "@/components/AgentResults";
import { Building2, UserCircle } from "lucide-react";
import { useRouteTransition } from "@/hooks/useRouteTransition";
import { useSkeletonVisibility } from "@/hooks/useSkeletonVisibility";

export default function SearchPage() {
  const [location] = useLocation();
  const { isTransitioning, endTransition } = useRouteTransition();
  
  // Support both Spanish and English routes for backward compatibility
  const searchType = location.startsWith('/buscar/agencias') || location.startsWith('/search/agencies')
    ? 'agencies'
    : location.startsWith('/buscar/agentes') || location.startsWith('/search/agents')
    ? 'agents'
    : location.startsWith('/buscar/alquilar') || location.startsWith('/search/rent')
    ? 'rent'
    : 'buy';

  const { data: results, isFetching, isError } = useQuery({
    queryKey: ['/api/search', searchType, location],
    queryFn: async () => {
      const response = await fetch(`/api${location}`);
      if (!response.ok) throw new Error('Failed to fetch results');
      return response.json();
    },
    staleTime: 0, // No cache entre cambios de tipo de búsqueda
  });

  // Combine isFetching with route transition for skeleton visibility
  const showSkeleton = useSkeletonVisibility({ isFetching, isTransitioning });

  // End transition when data is ready
  useEffect(() => {
    if (isTransitioning && !isFetching) {
      endTransition();
    }
  }, [isTransitioning, isFetching, endTransition]);

  // Also end transition on error
  useEffect(() => {
    if (isError && isTransitioning) {
      endTransition();
    }
  }, [isError, isTransitioning, endTransition]);

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <SearchBar />
        </div>

        {/* Propiedades en venta */}
        {searchType === 'buy' && (
          <PropertyResults results={results || []} showSkeleton={showSkeleton} />
        )}
        
        {/* Propiedades en alquiler */}
        {searchType === 'rent' && (
          <PropertyResults results={results || []} showSkeleton={showSkeleton} />
        )}
        {searchType === 'agencies' && (
          <AgencyResults results={results || []} showSkeleton={showSkeleton} />
        )}
        {searchType === 'agents' && (
          <AgentResults results={results || []} showSkeleton={showSkeleton} />
        )}
      </div>
    </div>
  );
}
