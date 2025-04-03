import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { PropertyResults } from "@/components/PropertyResults";
import { AgencyResults } from "@/components/AgencyResults";
import { AgentResults } from "@/components/AgentResults";
import { Building2, UserCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NeighborhoodResultsPage() {
  const { type, neighborhood } = useParams<{ type: string; neighborhood: string }>();
  const [, setLocation] = useLocation();
  const decodedNeighborhood = decodeURIComponent(neighborhood);
  
  // Determinar el título según el tipo
  const getTypeTitle = () => {
    switch (type) {
      case 'agencies':
        return 'Agencias en';
      case 'agents':
        return 'Agentes en';
      default:
        return 'Resultados en';
    }
  };

  // Determinar los parámetros de búsqueda según el tipo
  const queryKey = type === 'agencies' 
    ? ['/api/search/agencies', { neighborhoods: decodedNeighborhood }]
    : ['/api/search/agents', { neighborhoods: decodedNeighborhood }];

  const { data: results, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('neighborhoods', decodedNeighborhood);
      
      const response = await fetch(`/api/search/${type}?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed to fetch ${type} for ${decodedNeighborhood}`);
      return response.json();
    }
  });

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setLocation('/search/' + type)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver a la búsqueda
          </Button>
          
          <h1 className="text-3xl font-bold">
            {getTypeTitle()} {decodedNeighborhood}
          </h1>
        </div>

        {/* Resultados para agencias */}
        {type === 'agencies' && (
          <>
            {!isLoading && results?.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                <Building2 className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron agencias</h3>
                <p className="text-gray-600 max-w-md">
                  No hay agencias inmobiliarias registradas en {decodedNeighborhood}. 
                  Prueba a buscar en otro barrio.
                </p>
              </div>
            )}
            {results && results.length > 0 && (
              <AgencyResults results={results} isLoading={isLoading} />
            )}
          </>
        )}

        {/* Resultados para agentes */}
        {type === 'agents' && (
          <>
            {!isLoading && results?.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                <UserCircle className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron agentes</h3>
                <p className="text-gray-600 max-w-md">
                  No hay agentes inmobiliarios registrados en {decodedNeighborhood}.
                  Prueba a buscar en otro barrio.
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