import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Phone, Mail, MapPin, Building2, Calendar, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Property {
  id: number;
  title?: string;
  reference?: string;
  address: string;
  type: string;
  operationType: string;
  description: string;
  price: number;
  neighborhood: string;
  bedrooms?: number;
  bathrooms?: number;
  superficie?: number;
  images?: string[];
  mainImageIndex?: number;
  viewCount?: number;
}

interface Agent {
  id: number;
  name: string | null;
  surname: string | null;
  email: string;
  description: string | null;
  avatar?: string | null;
  influenceNeighborhoods: string[] | null;
  isAgent: boolean;
  properties?: Property[];
}

function PropertyCard({ property }: { property: Property }) {
  return (
    <Link href={`/property/${property.id}`}>
      <Card className="overflow-hidden h-full cursor-pointer hover:shadow-md transition-shadow">
        <div className="relative h-48 bg-gray-200">
          {property.images && property.images.length > 0 && (
            <img 
              src={property.images[property.mainImageIndex || 0]} 
              alt={property.title || property.address} 
              className="h-full w-full object-cover"
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <div className="text-white font-bold">
              {property.price.toLocaleString('es-ES')} €
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold truncate">
            {property.title || property.address}
          </h3>
          <div className="text-sm text-gray-500 truncate mb-2">
            {property.address}
          </div>
          <div className="flex items-center text-sm gap-3">
            {property.bedrooms && (
              <div className="flex items-center gap-1">
                <span className="font-medium">{property.bedrooms}</span> hab
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1">
                <span className="font-medium">{property.bathrooms}</span> baños
              </div>
            )}
            {property.superficie && (
              <div className="flex items-center gap-1">
                <span className="font-medium">{property.superficie}</span> m²
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function LoadingProperties() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((item) => (
        <div key={item} className="space-y-3">
          <Skeleton className="h-48 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AgentProfile() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: agent, isLoading, error } = useQuery<Agent>({
    queryKey: [`/api/agents/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch agent");
      }
      return response.json();
    },
  });

  useEffect(() => {
    // Scroll al inicio cuando se carga la página
    window.scrollTo(0, 0);
  }, [id]);

  if (isLoading) {
    return (
      <div className="container py-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <Skeleton className="h-32 w-32 rounded-full" />
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

  if (error || !agent) {
    return (
      <div className="container py-8 max-w-7xl mx-auto">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">No se pudo cargar el perfil del agente</h2>
          <p className="text-gray-500 mb-6">
            Lo sentimos, ha ocurrido un error al cargar los datos del agente.
          </p>
          <Button asChild>
            <Link href="/search/agents">Volver al listado de agentes</Link>
          </Button>
        </div>
      </div>
    );
  }

  const fullName = `${agent.name || ""} ${agent.surname || ""}`.trim();

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      {/* Header del Perfil */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <Avatar className="h-32 w-32">
          <AvatarImage src={agent.avatar || undefined} alt={fullName} />
          <AvatarFallback className="text-4xl">
            {fullName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{fullName}</h1>
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Badge variant="outline" className="mr-2">Agente inmobiliario</Badge>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              <span className="font-medium">5.0</span>
              <span className="mx-1">·</span>
              <span>(11 reseñas)</span>
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            {agent.description || "Este agente aún no ha añadido una descripción."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="sm">
              <Phone className="mr-2 h-4 w-4" /> Llamar
            </Button>
            <Button size="sm" variant="outline">
              <Mail className="mr-2 h-4 w-4" /> Enviar email
            </Button>
            <Button size="sm" variant="outline">
              <Calendar className="mr-2 h-4 w-4" /> Agendar cita
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs de Navegación */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="overview">Información general</TabsTrigger>
          <TabsTrigger value="properties">Propiedades</TabsTrigger>
          <TabsTrigger value="reviews">Reseñas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="col-span-2">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Sobre {agent.name}</h2>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    {agent.description || 
                     `${agent.name} es un agente inmobiliario especializado en Barcelona. 
                     Con experiencia en el sector, ofrece un servicio personalizado 
                     para ayudar a sus clientes a encontrar la propiedad perfecta.`}
                  </p>
                  
                  {agent.influenceNeighborhoods && agent.influenceNeighborhoods.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2 flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                        Barrios de especialización
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {agent.influenceNeighborhoods.map((neighborhood) => (
                          <Badge key={neighborhood} variant="secondary">
                            {neighborhood}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
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
                      <a href={`mailto:${agent.email}`} className="text-blue-600 hover:underline">
                        {agent.email}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <Phone className="h-5 w-5 mr-3 text-gray-500" />
                    <div>
                      <div className="font-medium">Teléfono</div>
                      <a href="tel:+34612345678" className="text-blue-600 hover:underline">
                        +34 612 345 678
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <Building2 className="h-5 w-5 mr-3 text-gray-500" />
                    <div>
                      <div className="font-medium">Oficina</div>
                      <address className="not-italic">
                        Rambla de Poblenou, 138<br />
                        08018 Barcelona
                      </address>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Propiedades destacadas */}
          {agent.properties && agent.properties.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Propiedades destacadas</h2>
                <Button variant="link" asChild>
                  <Link href={`#properties`} onClick={() => setActiveTab("properties")}>
                    Ver todas <ExternalLink className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agent.properties.slice(0, 3).map(property => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </div>
          )}
          
          {/* Reseñas recientes */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Reseñas recientes</h2>
              <Button variant="link" asChild>
                <Link href="#reviews" onClick={() => setActiveTab("reviews")}>
                  Ver todas <ExternalLink className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Reseñas de ejemplo, en una implementación real se cargarían desde la API */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">hace 1 año</span>
                  </div>
                  <h3 className="font-semibold mb-2">Excelente profesional</h3>
                  <p className="text-gray-700 text-sm">
                    {agent.name} me ayudó a encontrar mi piso ideal en la zona de Poblenou. 
                    Muy atento y profesional en todo momento, conoce perfectamente el mercado.
                  </p>
                  <div className="mt-2 text-sm font-medium">Maria G.</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">hace 2 meses</span>
                  </div>
                  <h3 className="font-semibold mb-2">Muy buena experiencia</h3>
                  <p className="text-gray-700 text-sm">
                    Trabajar con {agent.name} ha sido muy fácil. Encontramos rápidamente lo que 
                    buscábamos y nos ayudó con toda la documentación. Muy recomendable.
                  </p>
                  <div className="mt-2 text-sm font-medium">Carlos M.</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="mt-6">
          <h2 className="text-2xl font-semibold mb-6">Propiedades de {agent.name}</h2>
          
          {!agent.properties || agent.properties.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Sin propiedades</h3>
              <p className="text-gray-500">
                Este agente no tiene propiedades publicadas actualmente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agent.properties.map(property => (
                <PropertyCard key={property.id} property={property} />
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
                  <div className="flex items-center mb-4">
                    <div className="text-4xl font-bold mr-3">5.0</div>
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className="h-6 w-6 fill-current" />
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-6">Basado en 11 reseñas</div>
                  
                  <Button className="w-full">Escribir una reseña</Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:w-2/3 space-y-4">
              {/* Reseñas de ejemplo, en una implementación real se cargarían desde la API */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">hace 1 año</span>
                  </div>
                  <h3 className="font-semibold mb-2">Excelente profesional</h3>
                  <p className="text-gray-700">
                    {agent.name} me ayudó a encontrar mi piso ideal en la zona de Poblenou. 
                    Muy atento y profesional en todo momento, conoce perfectamente el mercado.
                  </p>
                  <div className="mt-2 font-medium">Maria G.</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">hace 2 meses</span>
                  </div>
                  <h3 className="font-semibold mb-2">Muy buena experiencia</h3>
                  <p className="text-gray-700">
                    Trabajar con {agent.name} ha sido muy fácil. Encontramos rápidamente lo que 
                    buscábamos y nos ayudó con toda la documentación. Muy recomendable.
                  </p>
                  <div className="mt-2 font-medium">Carlos M.</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">hace 5 meses</span>
                  </div>
                  <h3 className="font-semibold mb-2">Muy profesional</h3>
                  <p className="text-gray-700">
                    Gracias a {agent.name} vendimos nuestro piso en tiempo récord y al precio que queríamos.
                    Excelente servicio y comunicación constante durante todo el proceso.
                  </p>
                  <div className="mt-2 font-medium">Luis R.</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">hace 7 meses</span>
                  </div>
                  <h3 className="font-semibold mb-2">Conocimiento del mercado impresionante</h3>
                  <p className="text-gray-700">
                    Lo que más me gustó de {agent.name} fue su conocimiento profundo del 
                    mercado inmobiliario en Barcelona. Nos aconsejó perfectamente en cada paso.
                  </p>
                  <div className="mt-2 font-medium">Ana T.</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}