import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { PropertyResults } from "@/components/PropertyResults";
import { PropertyMap } from "@/components/PropertyMap";
import { AgencyResults } from "@/components/AgencyResults";
import { AgentResults } from "@/components/AgentResults";
import { PropertyFilters, PropertyFilters as PropertyFiltersType } from "@/components/PropertyFilters";
import { Building2, UserCircle, ChevronLeft, HomeIcon, MapPin, Info, Star, ArrowDownAZ, ArrowUpDown, List, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { findDistrictByNeighborhood, isDistrict, BARCELONA_DISTRICTS, BARCELONA_DISTRICTS_AND_NEIGHBORHOODS } from "@/utils/neighborhoods";

export default function NeighborhoodResultsPage() {
  const { neighborhood } = useParams<{ neighborhood: string }>();
  const [, setLocation] = useLocation();
  const [currentLocation] = useLocation();
  const decodedNeighborhood = decodeURIComponent(neighborhood);
  
  // Extract URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const bedroomsFromUrl = urlParams.get('bedrooms');
  const minPriceFromUrl = urlParams.get('minPrice');
  const maxPriceFromUrl = urlParams.get('maxPrice');
  
  // Parse bedrooms - could be a single number or comma-separated list
  let defaultBedroomsList: number[] = [];
  if (bedroomsFromUrl) {
    defaultBedroomsList = bedroomsFromUrl.split(',').map(b => parseInt(b)).filter(b => !isNaN(b));
  }
  const defaultBedrooms = defaultBedroomsList.length > 0 ? Math.min(...defaultBedroomsList) : null;
  
  // Filtros para cada pestaña
  const [agenciesFilter, setAgenciesFilter] = useState<string>("default");
  const [agentsFilter, setAgentsFilter] = useState<string>("default");
  
  // Estado para el toggle de vista (lista/mapa)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Filtros específicos para propiedades
  const [propertyFilters, setPropertyFilters] = useState<PropertyFiltersType>({
    operationType: "Venta",
    priceMin: minPriceFromUrl ? parseInt(minPriceFromUrl) : null,
    priceMax: maxPriceFromUrl ? parseInt(maxPriceFromUrl) : null,
    bedrooms: defaultBedrooms || 1,
    bathrooms: null,
    features: []
  });
  
  // Verificar si estamos en Barcelona general
  const isBarcelonaPage = decodedNeighborhood === 'Barcelona';
  
  // Verificar si el valor seleccionado es un distrito
  const isDistrictPage = isDistrict(decodedNeighborhood);
  
  // Manejo especial para Sant Andreu del Palomar (que es en realidad Sant Andreu barrio)
  const isSantAndreuBarrio = decodedNeighborhood === "Sant Andreu del Palomar";
  // Mantenemos el nombre original para consultas de valoraciones
  const effectiveNeighborhood = decodedNeighborhood;
  
  // Determinar el distrito correspondiente al barrio (solo si no es un distrito o Barcelona)
  const district = !isDistrictPage && !isBarcelonaPage ? findDistrictByNeighborhood(effectiveNeighborhood) : null;
  
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
    window.location.href = `/neighborhood/${encodeURIComponent(decodedNeighborhood)}/${value}`;
  };

  // Consultas para propiedades
  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['/api/properties', { 
      neighborhoods: effectiveNeighborhood,
      operationType: propertyFilters.operationType,
      priceMin: propertyFilters.priceMin,
      priceMax: propertyFilters.priceMax,
      bedrooms: propertyFilters.bedrooms,
      bathrooms: propertyFilters.bathrooms,
      features: propertyFilters.features,
      mostViewed: false
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('neighborhoods', effectiveNeighborhood);
      params.append('operationType', propertyFilters.operationType);
      params.append('mostViewed', 'false');
      
      if (propertyFilters.priceMin !== null) {
        params.append('priceMin', propertyFilters.priceMin.toString());
      }
      
      if (propertyFilters.priceMax !== null) {
        params.append('priceMax', propertyFilters.priceMax.toString());
      }
      
      if (propertyFilters.bedrooms !== null) {
        params.append('bedrooms', propertyFilters.bedrooms.toString());
      }
      
      if (propertyFilters.bathrooms !== null) {
        params.append('bathrooms', propertyFilters.bathrooms.toString());
      }
      
      // Add feature filters if they exist
      if (propertyFilters.features && propertyFilters.features.length > 0) {
        params.append('features', propertyFilters.features.join(','));
      }
      
      console.log(`Fetching properties with operationType: ${propertyFilters.operationType}`);
      const response = await fetch(`/api/properties?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed to fetch properties for ${effectiveNeighborhood}`);
      return response.json();
    },
    enabled: activeTab === 'properties',
  });

  // Consultas para agencias
  const { data: agencies, isLoading: agenciesLoading } = useQuery({
    queryKey: ['/api/search/agencies', { neighborhoods: effectiveNeighborhood }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('neighborhoods', effectiveNeighborhood);
      const response = await fetch(`/api/search/agencies?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed to fetch agencies for ${effectiveNeighborhood}`);
      return response.json();
    },
    enabled: activeTab === 'agencies',
  });

  // Consultas para agentes
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/search/agents', { neighborhoods: effectiveNeighborhood }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('neighborhoods', effectiveNeighborhood);
      const response = await fetch(`/api/search/agents?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed to fetch agents for ${effectiveNeighborhood}`);
      return response.json();
    },
    enabled: activeTab === 'agents',
  });
  
  // Consulta para las valoraciones del barrio
  const { data: ratings, isLoading: ratingsLoading, refetch: refetchRatings } = useQuery({
    queryKey: ['/api/neighborhoods/ratings/average', { neighborhood: effectiveNeighborhood }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('neighborhood', effectiveNeighborhood);
      
      // Añadir un parámetro timestamp para evitar caché del navegador
      params.append('_t', Date.now().toString());
      
      const response = await fetch(`/api/neighborhoods/ratings/average?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed to fetch ratings for ${effectiveNeighborhood}`);
      const data = await response.json();
      console.log('Ratings response data:', data);
      return data;
    },
    enabled: !isBarcelonaPage && !isDistrictPage, // Siempre habilitado para barrios individuales
    refetchOnWindowFocus: true, // Refrescar cuando la ventana obtiene el foco
    refetchOnMount: true, // Refrescar cuando el componente se monta
    refetchInterval: 2000 // Refresca cada 2 segundos siempre
  });

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-2"
            onClick={() => window.location.href = '/'}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver a inicio
          </Button>
          
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            {/* Barcelona siempre está en el nivel superior */}
            <span 
              className="cursor-pointer hover:text-primary"
              onClick={() => window.location.href = '/neighborhood/Barcelona/properties'}
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
                      onClick={() => window.location.href = `/neighborhood/${encodeURIComponent(district || '')}/properties`}
                    >
                      {district}
                    </span>
                    <ChevronLeft className="h-4 w-4 mx-1 rotate-180" />
                    <span className="font-medium">
                      {/* Caso especial para Sant Andreu del Palomar */}
                      {decodedNeighborhood === "Sant Andreu del Palomar" ? "Sant Andreu del Palomar" : decodedNeighborhood}
                    </span>
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
                Descripción
              </TabsTrigger>
            </TabsList>

            {/* Contenido de pestaña: Propiedades */}
            <TabsContent value="properties" className="mt-0">
              {/* Filtros de propiedades */}
              <PropertyFilters 
                onFilterChange={setPropertyFilters}
                defaultOperationType={activeTab.includes('rent') ? 'Alquiler' : 'Venta'}
                defaultBedrooms={defaultBedrooms}
                defaultBedroomsList={defaultBedroomsList}
              />
              
              {/* Botones de vista (Lista/Mapa) al mismo nivel que Comprar/Alquilar */}
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  className="rounded-none px-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4 mr-2" />
                  Vista Lista
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  className="rounded-none px-8"
                  onClick={() => setViewMode('map')}
                >
                  <Map className="h-4 w-4 mr-2" />
                  Vista Mapa
                </Button>
              </div>

              {/* Contenido condicional basado en el modo de vista */}
              {viewMode === 'list' ? (
                <PropertyResults 
                  results={useMemo(() => {
                    if (!properties) return [];
                    
                    const sortedProperties = [...properties];
                    
                    // Use the sortBy from propertyFilters instead of the removed propertiesFilter
                    switch (propertyFilters.sortBy) {
                      case 'price-asc':
                        return sortedProperties.sort((a, b) => a.price - b.price);
                      case 'newest':
                        return sortedProperties.sort((a, b) => 
                          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        );
                      case 'price-m2':
                        return sortedProperties.sort((a, b) => {
                          const pricePerM2A = a.superficie ? a.price / a.superficie : Infinity;
                          const pricePerM2B = b.superficie ? b.price / b.superficie : Infinity;
                          return pricePerM2A - pricePerM2B;
                        });
                      case 'price-drop':
                        return sortedProperties.sort((a, b) => {
                          const dropA = a.previousPrice ? ((a.previousPrice - a.price) / a.previousPrice) * 100 : 0;
                          const dropB = b.previousPrice ? ((b.previousPrice - b.price) / b.previousPrice) * 100 : 0;
                          return dropB - dropA; // Mayor a menor
                        });
                      default:
                        return sortedProperties;
                    }
                  }, [properties, propertyFilters.sortBy]) || []} 
                  isLoading={propertiesLoading} 
                />
              ) : (
                <PropertyMap
                  properties={useMemo(() => {
                    if (!properties) return [];
                    
                    const sortedProperties = [...properties];
                    
                    // Apply the same sorting logic as the list view
                    switch (propertyFilters.sortBy) {
                      case 'price-asc':
                        return sortedProperties.sort((a, b) => a.price - b.price);
                      case 'newest':
                        return sortedProperties.sort((a, b) => 
                          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        );
                      case 'price-m2':
                        return sortedProperties.sort((a, b) => {
                          const pricePerM2A = a.superficie ? a.price / a.superficie : Infinity;
                          const pricePerM2B = b.superficie ? b.price / b.superficie : Infinity;
                          return pricePerM2A - pricePerM2B;
                        });
                      case 'price-drop':
                        return sortedProperties.sort((a, b) => {
                          const dropA = a.previousPrice ? ((a.previousPrice - a.price) / a.previousPrice) * 100 : 0;
                          const dropB = b.previousPrice ? ((b.previousPrice - b.price) / b.previousPrice) * 100 : 0;
                          return dropB - dropA; // Mayor a menor
                        });
                      default:
                        return sortedProperties;
                    }
                  }, [properties, propertyFilters.sortBy]) || []}
                  neighborhood={decodedNeighborhood}
                  className="w-full"
                />
              )}
            </TabsContent>

            {/* Contenido de pestaña: Agencias */}
            <TabsContent value="agencies" className="mt-0">
              <div className="mb-4 flex justify-end">
                <Select
                  value={agenciesFilter}
                  onValueChange={setAgenciesFilter}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Predeterminado</SelectItem>
                    <SelectItem value="best_rating">Mejor puntuación</SelectItem>
                    <SelectItem value="newest_reviews">Más recientes</SelectItem>
                    <SelectItem value="most_reviews">Más reseñas</SelectItem>
                    <SelectItem value="most_properties">Más propiedades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <AgencyResults 
                results={useMemo(() => {
                  if (!agencies) return [];
                  
                  const sortedAgencies = [...agencies];
                  
                  switch (agenciesFilter) {
                    case 'best_rating':
                      return sortedAgencies.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                    case 'newest_reviews':
                      return sortedAgencies.sort((a, b) => 
                        (b.lastReviewDate ? new Date(b.lastReviewDate).getTime() : 0) - 
                        (a.lastReviewDate ? new Date(a.lastReviewDate).getTime() : 0)
                      );
                    case 'most_reviews':
                      return sortedAgencies.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
                    case 'most_properties':
                      return sortedAgencies.sort((a, b) => (b.propertyCount || 0) - (a.propertyCount || 0));
                    default:
                      return sortedAgencies;
                  }
                }, [agencies, agenciesFilter]) || []} 
                isLoading={agenciesLoading} 
              />
            </TabsContent>

            {/* Contenido de pestaña: Agentes */}
            <TabsContent value="agents" className="mt-0">
              <div className="mb-4 flex justify-end">
                <Select
                  value={agentsFilter}
                  onValueChange={setAgentsFilter}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Predeterminado</SelectItem>
                    <SelectItem value="best_rating">Mejor puntuación</SelectItem>
                    <SelectItem value="newest_reviews">Más recientes</SelectItem>
                    <SelectItem value="most_reviews">Más reseñas</SelectItem>
                    <SelectItem value="most_properties">Más propiedades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <AgentResults 
                results={useMemo(() => {
                  if (!agents) return [];
                  
                  const sortedAgents = [...agents];
                  
                  switch (agentsFilter) {
                    case 'best_rating':
                      return sortedAgents.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                    case 'newest_reviews':
                      return sortedAgents.sort((a, b) => 
                        (b.lastReviewDate ? new Date(b.lastReviewDate).getTime() : 0) - 
                        (a.lastReviewDate ? new Date(a.lastReviewDate).getTime() : 0)
                      );
                    case 'most_reviews':
                      return sortedAgents.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
                    case 'most_properties':
                      return sortedAgents.sort((a, b) => (b.propertyCount || 0) - (a.propertyCount || 0));
                    default:
                      return sortedAgents;
                  }
                }, [agents, agentsFilter]) || []} 
                isLoading={agentsLoading} 
              />
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
                            onClick={() => {
                              // Caso especial para "Sant Andreu" barrio dentro del distrito "Sant Andreu"
                              if (decodedNeighborhood === "Sant Andreu" && neighborhood === "Sant Andreu") {
                                // Renombramos a "Sant Andreu del Palomar" solo para uso interno de navegación
                                window.location.href = `/neighborhood/Sant Andreu del Palomar/properties`;
                              } else {
                                window.location.href = `/neighborhood/${encodeURIComponent(neighborhood)}/properties`;
                              }
                            }}
                          >
                            {neighborhood === "Sant Andreu" && decodedNeighborhood === "Sant Andreu" 
                              ? "Sant Andreu del Palomar" 
                              : neighborhood}
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
                          onClick={() => window.location.href = `/neighborhood/${encodeURIComponent(district)}/properties`}
                        >
                          {district}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Información genérica del barrio */}
                {!isBarcelonaPage && !isDistrictPage && (
                  <>
                    <p className="text-gray-600 mb-6">
                      Información general sobre el barrio de {decodedNeighborhood}.
                    </p>
                    
                    {/* Valoraciones del barrio */}
                    {!ratingsLoading && ratings && (
                      <div className="mb-8 border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                          <Star className="h-5 w-5 mr-2 text-yellow-500" />
                          Valoraciones del barrio
                          {ratings.count > 0 && (
                            <span className="text-sm font-normal text-gray-500 ml-2">
                              ({ratings.count} {ratings.count === 1 ? 'valoración' : 'valoraciones'})
                            </span>
                          )}
                        </h3>
                        
                        {ratings.count > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            <div className="inline-flex items-center bg-white rounded-full px-3 py-1 shadow-sm">
                              <span className="text-xs font-medium mr-1">Seguridad:</span>
                              <span className="text-xs font-bold">{ratings.security}/10</span>
                            </div>
                            <div className="inline-flex items-center bg-white rounded-full px-3 py-1 shadow-sm">
                              <span className="text-xs font-medium mr-1">Aparcamiento:</span>
                              <span className="text-xs font-bold">{ratings.parking}/10</span>
                            </div>
                            <div className="inline-flex items-center bg-white rounded-full px-3 py-1 shadow-sm">
                              <span className="text-xs font-medium mr-1">Familias:</span>
                              <span className="text-xs font-bold">{ratings.familyFriendly}/10</span>
                            </div>
                            <div className="inline-flex items-center bg-white rounded-full px-3 py-1 shadow-sm">
                              <span className="text-xs font-medium mr-1">Transporte:</span>
                              <span className="text-xs font-bold">{ratings.publicTransport}/10</span>
                            </div>
                            <div className="inline-flex items-center bg-white rounded-full px-3 py-1 shadow-sm">
                              <span className="text-xs font-medium mr-1">Espacios verdes:</span>
                              <span className="text-xs font-bold">{ratings.greenSpaces}/10</span>
                            </div>
                            <div className="inline-flex items-center bg-white rounded-full px-3 py-1 shadow-sm">
                              <span className="text-xs font-medium mr-1">Servicios:</span>
                              <span className="text-xs font-bold">{ratings.services}/10</span>
                            </div>
                          </div>
                        )}
                        
                        {ratings.count > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">Sensación de seguridad</span>
                                  <span className="text-sm font-semibold">{ratings.security}/10</span>
                                </div>
                                <Progress value={ratings.security * 10} className="h-2" />
                              </div>
                              
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">Facilidad de aparcar</span>
                                  <span className="text-sm font-semibold">{ratings.parking}/10</span>
                                </div>
                                <Progress value={ratings.parking * 10} className="h-2" />
                              </div>
                              
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">Amigable para peques</span>
                                  <span className="text-sm font-semibold">{ratings.familyFriendly}/10</span>
                                </div>
                                <Progress value={ratings.familyFriendly * 10} className="h-2" />
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">Conexión con transporte público</span>
                                  <span className="text-sm font-semibold">{ratings.publicTransport}/10</span>
                                </div>
                                <Progress value={ratings.publicTransport * 10} className="h-2" />
                              </div>
                              
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">Parques y espacios verdes</span>
                                  <span className="text-sm font-semibold">{ratings.greenSpaces}/10</span>
                                </div>
                                <Progress value={ratings.greenSpaces * 10} className="h-2" />
                              </div>
                              
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">Disponibilidad de servicios</span>
                                  <span className="text-sm font-semibold">{ratings.services}/10</span>
                                </div>
                                <Progress value={ratings.services * 10} className="h-2" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No hay valoraciones para este barrio todavía.</p>
                            <Button 
                              variant="link" 
                              className="mt-3 text-primary hover:underline cursor-pointer font-medium" 
                              onClick={() => {
                                // Almacenar el barrio en localStorage para seleccionarlo automáticamente en el formulario
                                localStorage.setItem('barrio_a_valorar', decodedNeighborhood);
                                window.location.href = '/#valorar-barrio';
                              }}
                            >
                              Sé el primero en valorar este barrio
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
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