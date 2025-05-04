import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Phone, Mail, MapPin, Building2, Calendar, ExternalLink, Globe, Facebook, Instagram, Twitter, MessageCircle, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageGallery } from "@/components/ImageGallery";
import { PropertyCard } from "@/components/PropertyCard";

interface AgencyAgent {
  id: number;
  agencyId: number;
  agentName: string;
  agentSurname: string;
  agentEmail: string;
  createdAt: string;
  avatar?: string;
  rating?: number;
  reviewCount?: number;
}

interface Property {
  id: number;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  size: number;
  superficie?: number;
  images: string[];
  type: string;
  operationType: string;
  agentId: number;
  agentName?: string;
}

interface Agency {
  id: number;
  email: string;
  agencyName: string;
  agencyAddress?: string;
  agencyDescription?: string;
  agencyPhone?: string;
  agencyWebsite?: string;
  yearEstablished?: number;
  agencyLanguagesSpoken?: string[];
  agencySocialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  agencyLogo?: string;
  agencyInfluenceNeighborhoods?: string[];
  agents?: AgencyAgent[];
  properties?: Property[];
}

// Componente para mostrar una tarjeta de agente
function AgentCard({ agent }: { agent: AgencyAgent }) {
  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback>
              {agent.agentName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">
              {agent.agentName} {agent.agentSurname}
            </h3>
            <div className="text-sm text-gray-500">{agent.agentEmail}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AgencyProfile() {
  // Obtenemos el ID de la agencia de los parámetros de la URL
  const { id } = useParams<{ id: string }>();
  
  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState("overview");

  // La galería no mostrará imágenes predeterminadas, solo las que agregue el agente
  const agencyImages: string[] = [];

  // Consulta para obtener los datos de la agencia
  const { data: agency, isLoading, error } = useQuery<Agency>({
    queryKey: [`/api/agencies/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/agencies/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch agency");
      }
      return response.json();
    },
  });
  
  // Consulta para obtener las propiedades de los agentes de la agencia
  const { data: agencyProperties = [], isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: [`/api/agencies/${id}/properties`],
    queryFn: async () => {
      // Si no hay agencia o no hay agentes, no hay propiedades
      if (!agency || !agency.agents || agency.agents.length === 0) {
        return [];
      }
      
      // Obtenemos todos los IDs de agentes de la agencia
      const agentIds = agency.agents.map(agent => agent.id);
      
      // Consulta para obtener las propiedades de todos los agentes
      const promises = agentIds.map(agentId => 
        fetch(`/api/properties?agentId=${agentId}`)
          .then(res => res.ok ? res.json() : [])
      );
      
      // Resolvemos todas las promesas
      const results = await Promise.all(promises);
      
      // Aplanamos el array de arrays de propiedades
      return results.flat();
    },
    enabled: !!agency && !!agency.agents && agency.agents.length > 0,
  });

  // Efecto para desplazar al inicio de la página cuando cambia el ID
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Si los datos están cargando, mostramos un esqueleto de carga
  if (isLoading) {
    return (
      <div className="container py-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <Skeleton className="h-36 w-36 rounded-lg" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-48" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si hay un error o no hay datos, mostramos un mensaje de error
  if (error || !agency) {
    return (
      <div className="container py-8 max-w-7xl mx-auto">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">No se pudo cargar el perfil de la agencia</h2>
          <p className="text-gray-500 mb-6">
            Lo sentimos, ha ocurrido un error al cargar los datos de la agencia.
          </p>
          <Button asChild>
            <Link href="/search/agencies">Volver al listado de agencias</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Renderizamos el perfil completo de la agencia
  return (
    <div className="container pt-16 pb-8 max-w-7xl mx-auto">
      {/* Header del Perfil */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="md:w-36 lg:w-48">
          <Avatar className="h-36 w-36 lg:h-48 lg:w-48 rounded-lg">
            <AvatarImage src={agency.agencyLogo} />
            <AvatarFallback className="text-4xl rounded-lg">
              {agency.agencyName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{agency.agencyName}</h1>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Badge variant="outline" className="mr-2">Agencia inmobiliaria</Badge>
          </div>

          <div className="flex items-center mb-4">
            <span className="text-xl font-bold mr-2">
              {agency.agents && agency.agents.length > 0 ? 
                (() => {
                  const totalReviews = agency.agents.reduce((acc, agent) => acc + (agent.reviewCount || 0), 0);
                  const totalRating = agency.agents.reduce((acc, agent) => acc + ((agent.reviewAverage || 0) * (agent.reviewCount || 0)), 0);
                  return totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : "0.0";
                })() :
                "0.0"}
            </span>
            <span className="text-sm text-gray-500">
              ({agency.agents ? agency.agents.reduce((acc, agent) => acc + (agent.reviewCount || 0), 0) : 0} reseñas)
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {agency.agencyPhone && (
              <Button size="sm">
                <Phone className="mr-2 h-4 w-4" /> Llamar
              </Button>
            )}
            <Button size="sm" variant="outline">
              <Mail className="mr-2 h-4 w-4" /> Contactar
            </Button>
            <Button size="sm" variant="outline">
              <Phone className="mr-2 h-4 w-4" /> Contactar agencia
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs de Navegación */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex">
          <TabsTrigger value="overview">Información general</TabsTrigger>
          <TabsTrigger value="properties">Propiedades</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="reviews">Reseñas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="col-span-2">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Sobre {agency.agencyName}</h2>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    {agency.agencyDescription || 
                     `${agency.agencyName} es una agencia inmobiliaria especializada en propiedades en Barcelona. 
                     Ofrecemos servicios de compra, venta y alquiler de inmuebles, con un enfoque
                     personalizado para cada cliente.`}
                  </p>
                  
                  <div className="mt-6">
                    <h3 className="font-medium mb-3 flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                      Barrios de influencia
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {agency.agencyInfluenceNeighborhoods && Array.isArray(agency.agencyInfluenceNeighborhoods) && agency.agencyInfluenceNeighborhoods.length > 0 ? (
                        agency.agencyInfluenceNeighborhoods.map((neighborhood) => (
                          <Badge key={neighborhood} variant="secondary" className="text-sm">
                            {neighborhood}
                          </Badge>
                        ))
                      ) : (
                        agency.influenceNeighborhoods && Array.isArray(agency.influenceNeighborhoods) && agency.influenceNeighborhoods.length > 0 ? (
                          agency.influenceNeighborhoods.map((neighborhood) => (
                            <Badge key={neighborhood} variant="secondary" className="text-sm">
                              {neighborhood}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No hay barrios especificados</span>
                        )
                      )}
                    </div>
                  </div>
                </div>
                
                
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Información de la agencia</h2>
                <div className="space-y-4">
                  <div className="flex">
                    <Building2 className="h-5 w-5 mr-3 text-gray-500" />
                    <div>
                      <div className="font-medium">Nombre</div>
                      <div>{agency.agencyName}</div>
                    </div>
                  </div>
                  
                  {agency.agencyAddress && (
                    <div className="flex">
                      <MapPin className="h-5 w-5 mr-3 text-gray-500" />
                      <div>
                        <div className="font-medium">Dirección</div>
                        <address className="not-italic">
                          {agency.agencyAddress}
                        </address>
                      </div>
                    </div>
                  )}
                  
                  {agency.agencyInfluenceNeighborhoods && agency.agencyInfluenceNeighborhoods.length > 0 && (
                    <div className="flex">
                      <Building className="h-5 w-5 mr-3 text-gray-500" />
                      <div>
                        <div className="font-medium">Barrios de influencia</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {agency.agencyInfluenceNeighborhoods.map((neighborhood) => (
                            <Badge key={neighborhood} variant="secondary">
                              {neighborhood}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="properties" className="mt-6">
          <h2 className="text-2xl font-semibold mb-6">Propiedades de {agency.agencyName}</h2>
          
          {isLoadingProperties ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-3" />
                    <Skeleton className="h-6 w-1/2 mb-3" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !agencyProperties || agencyProperties.length === 0 ? (
            <div className="text-center py-8">
              <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Sin propiedades listadas</h3>
              <p className="text-gray-500">
                Esta agencia no tiene propiedades listadas actualmente.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Propiedades en venta */}
              {agencyProperties.some(p => p.operationType.toLowerCase() === 'venta') && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Propiedades en venta</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agencyProperties
                      .filter(p => p.operationType.toLowerCase() === 'venta')
                      .map(property => (
                        <PropertyCard key={property.id} property={property} />
                      ))}
                  </div>
                </div>
              )}
              
              {/* Propiedades en alquiler */}
              {agencyProperties.some(p => p.operationType.toLowerCase() === 'alquiler') && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Propiedades en alquiler</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agencyProperties
                      .filter(p => p.operationType.toLowerCase() === 'alquiler')
                      .map(property => (
                        <PropertyCard key={property.id} property={property} />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="agents" className="mt-6">
          <h2 className="text-2xl font-semibold mb-6">Equipo de {agency.agencyName}</h2>
          
          {!agency.agents || agency.agents.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Sin agentes registrados</h3>
              <p className="text-gray-500">
                Esta agencia no tiene agentes registrados actualmente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agency.agents.map(agent => (
                <Link key={agent.id} href={`/agents/${agent.id}`}>
                  <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                          <AvatarImage src={agent.avatar || undefined} />
                          <AvatarFallback className="text-2xl bg-primary/10">
                            {agent.agentName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-lg mb-1">
                          {agent.agentName} {agent.agentSurname}
                        </h3>
                        <div className="text-sm text-gray-500 mb-2">{agent.agentEmail}</div>
                        <div className="flex items-center mb-3">
                          {Array(5).fill(0).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < (agent.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                            />
                          ))}
                          <span className="text-sm ml-2 text-gray-500">
                            {agent.reviewCount ? `(${agent.reviewCount})` : 'Sin reseñas'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Mail className="h-4 w-4 mr-1" /> Contactar
                          </Button>
                          <Button size="sm" variant="outline">
                            Ver perfil
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Valoración general</h2>
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay reseñas disponibles</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Esta agencia aún no tiene reseñas.
                    </p>
                    <Button className="mt-4">
                      Escribir una reseña
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}