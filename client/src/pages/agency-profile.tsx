import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Phone, Mail, MapPin, Building2, Calendar, ExternalLink, Globe, Facebook, Instagram, Twitter, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageGallery } from "@/components/ImageGallery";

interface AgencyAgent {
  id: number;
  agencyId: number;
  agentName: string;
  agentSurname: string;
  agentEmail: string;
  createdAt: string;
}

interface Agency {
  id: number;
  email: string;
  agencyName: string;
  agencyAddress?: string;
  agencyDescription?: string;
  agencyPhone?: string;
  agencyWebsite?: string;
  agencySocialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  agencyLogo?: string;
  agencyInfluenceNeighborhoods?: string[];
  agents?: AgencyAgent[];
}

function AgentCard({ agent }: { agent: AgencyAgent }) {
  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{agent.agentName.charAt(0)}</AvatarFallback>
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

function LoadingAgents() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AgencyProfile() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Desplazar al inicio de la página cuando se carga
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

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

  // Imágenes de muestra para la galería (en una implementación real vendrían del backend)
  const sampleImages = [
    "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1577415124269-fc1140a69e91?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1000&auto=format&fit=crop"
  ];

  useEffect(() => {
    // Desplazar al inicio de la página cuando se carga
    window.scrollTo(0, 0);
  }, [id]);

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
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Badge variant="outline" className="mr-2">Agencia inmobiliaria</Badge>
          </div>
          <p className="text-gray-700 mb-4">
            {agency.agencyDescription || "Esta agencia aún no ha añadido una descripción."}
          </p>
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
              <Calendar className="mr-2 h-4 w-4" /> Solicitar información
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs de Navegación */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="overview">Información general</TabsTrigger>
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
                  
                  {agency.agencyInfluenceNeighborhoods && agency.agencyInfluenceNeighborhoods.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2 flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                        Zonas de operación
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {agency.agencyInfluenceNeighborhoods.map((neighborhood) => (
                          <Badge key={neighborhood} variant="secondary">
                            {neighborhood}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Galería de imágenes */}
                <div className="mt-6">
                  <h3 className="font-medium mb-3">Galería</h3>
                  <div className="rounded-lg overflow-hidden">
                    <ImageGallery images={sampleImages} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Información de contacto</h2>
                <div className="space-y-4">
                  <div className="flex">
                    <Mail className="h-5 w-5 mr-3 text-gray-500" />
                    <div>
                      <div className="font-medium">Email</div>
                      <a href={`mailto:${agency.email}`} className="text-blue-600 hover:underline">
                        {agency.email}
                      </a>
                    </div>
                  </div>
                  
                  {agency.agencyPhone && (
                    <div className="flex">
                      <Phone className="h-5 w-5 mr-3 text-gray-500" />
                      <div>
                        <div className="font-medium">Teléfono</div>
                        <a href={`tel:${agency.agencyPhone}`} className="text-blue-600 hover:underline">
                          {agency.agencyPhone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {agency.agencyAddress && (
                    <div className="flex">
                      <Building2 className="h-5 w-5 mr-3 text-gray-500" />
                      <div>
                        <div className="font-medium">Dirección</div>
                        <address className="not-italic">
                          {agency.agencyAddress}
                        </address>
                      </div>
                    </div>
                  )}
                  
                  {agency.agencyWebsite && (
                    <div className="flex">
                      <Globe className="h-5 w-5 mr-3 text-gray-500" />
                      <div>
                        <div className="font-medium">Sitio web</div>
                        <a 
                          href={agency.agencyWebsite.startsWith('http') ? agency.agencyWebsite : `https://${agency.agencyWebsite}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline"
                        >
                          {agency.agencyWebsite}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {agency.agencySocialMedia && Object.values(agency.agencySocialMedia).some(x => x) && (
                    <div>
                      <div className="font-medium mb-2">Redes sociales</div>
                      <div className="flex gap-3">
                        {agency.agencySocialMedia.facebook && (
                          <a 
                            href={agency.agencySocialMedia.facebook} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Facebook className="h-5 w-5" />
                          </a>
                        )}
                        {agency.agencySocialMedia.instagram && (
                          <a 
                            href={agency.agencySocialMedia.instagram} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-pink-600 hover:text-pink-700"
                          >
                            <Instagram className="h-5 w-5" />
                          </a>
                        )}
                        {agency.agencySocialMedia.twitter && (
                          <a 
                            href={agency.agencySocialMedia.twitter} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-400 hover:text-blue-500"
                          >
                            <Twitter className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Agentes destacados */}
          {agency.agents && agency.agents.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Agentes destacados</h2>
                <Button variant="link" asChild>
                  <Link href="#agents" onClick={() => setActiveTab("agents")}>
                    Ver todos <ExternalLink className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agency.agents.slice(0, 4).map(agent => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
          )}
          
          {/* Reseñas recientes */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Reseñas</h2>
            </div>
            
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay reseñas disponibles</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Esta agencia aún no tiene reseñas. Sé el primero en compartir tu experiencia.
              </p>
              <Button className="mt-4">
                Escribir una reseña
              </Button>
            </div>
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agency.agents.map(agent => (
                <Card key={agent.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-24 w-24 mb-4">
                        <AvatarFallback className="text-2xl">
                          {agent.agentName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-lg mb-1">
                        {agent.agentName} {agent.agentSurname}
                      </h3>
                      <div className="text-sm text-gray-500 mb-3">{agent.agentEmail}</div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Mail className="h-4 w-4 mr-1" /> Contactar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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