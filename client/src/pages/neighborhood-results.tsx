import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { PropertyResults } from "@/components/PropertyResults";
import { AgencyResults } from "@/components/AgencyResults";
import { AgentResults } from "@/components/AgentResults";
import { Building2, UserCircle, ChevronLeft, HomeIcon, MapPin, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { findDistrictByNeighborhood } from "@/utils/neighborhoods";

export default function NeighborhoodResultsPage() {
  const { neighborhood } = useParams<{ neighborhood: string }>();
  const [, setLocation] = useLocation();
  const [currentLocation] = useLocation();
  const decodedNeighborhood = decodeURIComponent(neighborhood);
  
  // Determinar el distrito correspondiente al barrio
  const district = findDistrictByNeighborhood(decodedNeighborhood);
  
  // Determinar la pestaña activa según la ruta
  const getActiveTab = () => {
    if (currentLocation.includes('/properties')) return 'properties';
    if (currentLocation.includes('/agencies')) return 'agencies';
    if (currentLocation.includes('/agents')) return 'agents';
    if (currentLocation.includes('/overview')) return 'overview';
    return 'properties'; // Pestaña por defecto si no hay otra especificada
  };

  const activeTab = getActiveTab();
  
  // Cambiar tab
  const handleTabChange = (value: string) => {
    setLocation(`/neighborhood/${encodeURIComponent(decodedNeighborhood)}/${value}`);
  };

  // Consultas para propiedades
  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['/api/search/buy', { neighborhoods: decodedNeighborhood }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('neighborhoods', decodedNeighborhood);
      const response = await fetch(`/api/search/buy?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed to fetch properties for ${decodedNeighborhood}`);
      return response.json();
    },
    enabled: activeTab === 'properties',
  });

  // Consultas para agencias
  const { data: agencies, isLoading: agenciesLoading } = useQuery({
    queryKey: ['/api/search/agencies', { neighborhoods: decodedNeighborhood }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('neighborhoods', decodedNeighborhood);
      const response = await fetch(`/api/search/agencies?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed to fetch agencies for ${decodedNeighborhood}`);
      return response.json();
    },
    enabled: activeTab === 'agencies',
  });

  // Consultas para agentes
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/search/agents', { neighborhoods: decodedNeighborhood }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('neighborhoods', decodedNeighborhood);
      const response = await fetch(`/api/search/agents?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed to fetch agents for ${decodedNeighborhood}`);
      return response.json();
    },
    enabled: activeTab === 'agents',
  });

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-2"
            onClick={() => setLocation('/')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver a inicio
          </Button>
          
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            {district && (
              <>
                <span>{district}</span>
                <ChevronLeft className="h-4 w-4 mx-1 rotate-180" />
              </>
            )}
            <span className="font-medium">{decodedNeighborhood}</span>
          </div>
          
          <h1 className="text-3xl font-bold mb-6">
            {decodedNeighborhood}
          </h1>
          
          {/* Tabs para diferentes tipos de resultados */}
          <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="properties" className="flex items-center gap-1">
                <HomeIcon className="h-4 w-4" />
                Propiedades
              </TabsTrigger>
              <TabsTrigger value="agencies" className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                Agencias
              </TabsTrigger>
              <TabsTrigger value="agents" className="flex items-center gap-1">
                <UserCircle className="h-4 w-4" />
                Agentes
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center gap-1">
                <Info className="h-4 w-4" />
                Overview
              </TabsTrigger>
            </TabsList>

            {/* Contenido de pestaña: Propiedades */}
            <TabsContent value="properties" className="mt-0">
              {!propertiesLoading && properties?.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                  <HomeIcon className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron propiedades</h3>
                  <p className="text-gray-600 max-w-md">
                    No hay propiedades registradas en {decodedNeighborhood}. 
                    Prueba a buscar en otro barrio.
                  </p>
                </div>
              )}
              {properties && properties.length > 0 && (
                <PropertyResults results={properties} isLoading={propertiesLoading} />
              )}
            </TabsContent>

            {/* Contenido de pestaña: Agencias */}
            <TabsContent value="agencies" className="mt-0">
              {!agenciesLoading && agencies?.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                  <Building2 className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron agencias</h3>
                  <p className="text-gray-600 max-w-md">
                    No hay agencias inmobiliarias registradas en {decodedNeighborhood}. 
                    Prueba a buscar en otro barrio.
                  </p>
                </div>
              )}
              {agencies && agencies.length > 0 && (
                <AgencyResults results={agencies} isLoading={agenciesLoading} />
              )}
            </TabsContent>

            {/* Contenido de pestaña: Agentes */}
            <TabsContent value="agents" className="mt-0">
              {!agentsLoading && agents?.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                  <UserCircle className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron agentes</h3>
                  <p className="text-gray-600 max-w-md">
                    No hay agentes inmobiliarios registrados en {decodedNeighborhood}. 
                    Prueba a buscar en otro barrio.
                  </p>
                </div>
              )}
              {agents && agents.length > 0 && (
                <AgentResults results={agents} isLoading={agentsLoading} />
              )}
            </TabsContent>

            {/* Contenido de pestaña: Overview */}
            <TabsContent value="overview" className="mt-0">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Sobre {decodedNeighborhood}</h2>
                {district && (
                  <div className="flex items-center mb-4">
                    <MapPin className="h-5 w-5 mr-2 text-primary" />
                    <span>Distrito: <strong>{district}</strong></span>
                  </div>
                )}
                <p className="text-gray-600 mb-4">
                  Información general sobre el barrio de {decodedNeighborhood}.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Propiedades</h3>
                    <p className="text-sm text-gray-600">
                      {properties?.length || 0} propiedades disponibles en este barrio
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Agencias</h3>
                    <p className="text-sm text-gray-600">
                      {agencies?.length || 0} agencias inmobiliarias operando en este barrio
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Agentes</h3>
                    <p className="text-sm text-gray-600">
                      {agents?.length || 0} agentes especializados en este barrio
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}