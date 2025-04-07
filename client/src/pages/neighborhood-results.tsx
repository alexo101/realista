import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { PropertyResults } from "@/components/PropertyResults";
import { AgencyResults } from "@/components/AgencyResults";
import { AgentResults } from "@/components/AgentResults";
import { Building2, UserCircle, ChevronLeft, HomeIcon, MapPin, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { findDistrictByNeighborhood, isDistrict, BARCELONA_DISTRICTS, BARCELONA_DISTRICTS_AND_NEIGHBORHOODS } from "@/utils/neighborhoods";

export default function NeighborhoodResultsPage() {
  const { neighborhood } = useParams<{ neighborhood: string }>();
  const [, setLocation] = useLocation();
  const [currentLocation] = useLocation();
  const decodedNeighborhood = decodeURIComponent(neighborhood);
  
  // Verificar si estamos en Barcelona general
  const isBarcelonaPage = decodedNeighborhood === 'Barcelona';
  
  // Verificar si el valor seleccionado es un distrito
  const isDistrictPage = isDistrict(decodedNeighborhood);
  
  // Determinar el distrito correspondiente al barrio (solo si no es un distrito o Barcelona)
  const district = !isDistrictPage && !isBarcelonaPage ? findDistrictByNeighborhood(decodedNeighborhood) : null;
  
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
            {/* Barcelona siempre está en el nivel superior */}
            <span 
              className="cursor-pointer hover:text-primary"
              onClick={() => setLocation('/neighborhood/Barcelona/properties')}
            >
              Barcelona
            </span>
            
            {/* Si es un distrito o tiene distrito, mostrar el siguiente nivel */}
            {(isDistrictPage || district) && (
              <>
                <ChevronLeft className="h-4 w-4 mx-1 rotate-180" />
                {isDistrictPage ? (
                  <span className="font-medium">{decodedNeighborhood}</span>
                ) : (
                  <>
                    <span 
                      className="cursor-pointer hover:text-primary"
                      onClick={() => setLocation(`/neighborhood/${encodeURIComponent(district || '')}/properties`)}
                    >
                      {district}
                    </span>
                    <ChevronLeft className="h-4 w-4 mx-1 rotate-180" />
                    <span className="font-medium">{decodedNeighborhood}</span>
                  </>
                )}
              </>
            )}
            
            {/* Si es Barcelona general, no mostrar más niveles */}
            {isBarcelonaPage && (
              <span className="font-medium ml-0">Todos los barrios</span>
            )}
          </div>
          
          
          
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
              {/* Removed empty state */}
              <PropertyResults results={properties || []} isLoading={propertiesLoading} />
            </TabsContent>

            {/* Contenido de pestaña: Agencias */}
            <TabsContent value="agencies" className="mt-0">
              {/* Removed empty state */}
              <AgencyResults results={agencies || []} isLoading={agenciesLoading} />
            </TabsContent>

            {/* Contenido de pestaña: Agentes */}
            <TabsContent value="agents" className="mt-0">
              {/* Removed empty state */}
              <AgentResults results={agents || []} isLoading={agentsLoading} />
            </TabsContent>

            {/* Contenido de pestaña: Overview */}
            <TabsContent value="overview" className="mt-0">
              <div className="bg-white rounded-lg shadow p-6">
                {/* Título personalizado según el tipo de página */}
                {isBarcelonaPage && (
                  <h2 className="text-2xl font-bold mb-4">Barcelona</h2>
                )}
                {isDistrictPage && (
                  <h2 className="text-2xl font-bold mb-4">Distrito de {decodedNeighborhood}</h2>
                )}
                {!isBarcelonaPage && !isDistrictPage && (
                  <h2 className="text-2xl font-bold mb-4">Barrio de {decodedNeighborhood}</h2>
                )}
                
                {/* Información de distrito para barrios */}
                {district && !isDistrictPage && !isBarcelonaPage && (
                  <div className="flex items-center mb-4">
                    <MapPin className="h-5 w-5 mr-2 text-primary" />
                    <span>Distrito: <strong>{district}</strong></span>
                  </div>
                )}
                
                {/* Información del distrito cuando estamos viendo un distrito */}
                {isDistrictPage && (
                  <div className="mb-6">
                    <p className="text-gray-600">
                      El distrito de {decodedNeighborhood} incluye los siguientes barrios:
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {BARCELONA_DISTRICTS_AND_NEIGHBORHOODS
                        .find(d => d.district === decodedNeighborhood)
                        ?.neighborhoods.map(neighborhood => (
                          <span 
                            key={neighborhood}
                            className="bg-gray-100 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-primary/10"
                            onClick={() => setLocation(`/neighborhood/${encodeURIComponent(neighborhood)}/properties`)}
                          >
                            {neighborhood}
                          </span>
                        ))
                      }
                    </div>
                  </div>
                )}
                
                {/* Información de Barcelona cuando estamos en la página general */}
                {isBarcelonaPage && (
                  <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                      Barcelona está dividida en los siguientes distritos:
                    </p>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {BARCELONA_DISTRICTS.map(district => (
                        <span 
                          key={district}
                          className="bg-gray-100 px-3 py-2 rounded text-sm cursor-pointer hover:bg-primary/10 flex items-center justify-center text-center"
                          onClick={() => setLocation(`/neighborhood/${encodeURIComponent(district)}/properties`)}
                        >
                          {district}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Información genérica del barrio */}
                {!isBarcelonaPage && !isDistrictPage && (
                  <p className="text-gray-600 mb-4">
                    Información general sobre el barrio de {decodedNeighborhood}.
                  </p>
                )}
                
                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Propiedades</h3>
                    <p className="text-sm text-gray-600">
                      {properties?.length || 0} propiedades disponibles
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Agencias</h3>
                    <p className="text-sm text-gray-600">
                      {agencies?.length || 0} agencias inmobiliarias
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Agentes</h3>
                    <p className="text-sm text-gray-600">
                      {agents?.length || 0} agentes especializados
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