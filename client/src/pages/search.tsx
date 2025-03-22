import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SearchBar } from "@/components/SearchBar";
import { SearchResults } from "@/components/SearchResults";

export default function SearchPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1]);
  const searchType = params.get('type') || 'properties'; // Default to properties if type is not specified

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

        <SearchResults
          type={searchType === 'agencies' ? 'agencies' : searchType === 'agents' ? 'agents' : 'properties'}
          results={results || []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}