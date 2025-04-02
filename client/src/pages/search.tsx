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

        {(searchType === 'buy' || searchType === 'rent') && (
          <PropertyResults results={results || []} isLoading={isLoading} />
        )}
        {searchType === 'agencies' && (
          <>
            {!isLoading && results?.length === 0 && location.includes('agencyName=') && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                <Building2 className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron agencias</h3>
                <p className="text-gray-600 max-w-md">
                  Prueba a buscar con otro nombre o selecciona un barrio diferente para encontrar agencias inmobiliarias.
                </p>
              </div>
            )}
            {!isLoading && results?.length === 0 && !location.includes('agencyName=') && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                <Building2 className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Busca agencias inmobiliarias</h3>
                <p className="text-gray-600 max-w-md">
                  Escribe el nombre de una agencia en el campo de búsqueda para encontrar agencias inmobiliarias.
                </p>
              </div>
            )}
            {results && results.length > 0 && (
              <AgencyResults results={results} isLoading={isLoading} />
            )}
          </>
        )}
        {searchType === 'agents' && (
          <>
            {!isLoading && results?.length === 0 && location.includes('agentName=') && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                <UserCircle className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron agentes</h3>
                <p className="text-gray-600 max-w-md">
                  Prueba a buscar con otro nombre o selecciona un barrio diferente para encontrar agentes inmobiliarios.
                </p>
              </div>
            )}
            {!isLoading && results?.length === 0 && !location.includes('agentName=') && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                <UserCircle className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Busca agentes inmobiliarios</h3>
                <p className="text-gray-600 max-w-md">
                  Escribe el nombre de un agente en el campo de búsqueda para encontrar agentes inmobiliarios.
                </p>
              </div>
            )}
            {results && results.length > 0 && (
              <AgentResults results={results} isLoading={isLoading} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
