import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SearchBar } from "@/components/SearchBar";
import { PropertyResults } from "@/components/PropertyResults";
import { AgencyResults } from "@/components/AgencyResults";
import { AgentResults } from "@/components/AgentResults";

export default function SearchPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1]);
  const searchType = params.get('type') || 'properties';

  const { data: results, isLoading } = useQuery({
    queryKey: ['/api/search', location],
    queryFn: async () => {
      const response = await fetch(`/api${location}`);
      if (!response.ok) throw new Error('Failed to fetch results');
      return response.json();
    },
  });

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <SearchBar />
        </div>

        {searchType === 'properties' && (
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