import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { Star, Phone, Mail, MapPin, Building2, Calendar, ExternalLink, Home, MessageCircle, Briefcase, Share2, Heart, HeartOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { PropertyCard } from "@/components/PropertyCard";
import { AgentReviewFlow } from "@/components/AgentReviewFlow";
import { Tooltip as RechartsTooltip } from "recharts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUser } from "@/contexts/user-context";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Interfaz para las reseñas
interface Review {
  id: number;
  author: string;
  rating: number;
  date: string;
  comment?: string;
  verified?: boolean;
  // Campos directos para las puntuaciones en la BD
  areaKnowledge: number;
  priceNegotiation: number;
  treatment: number;
  punctuality: number;
  propertyKnowledge: number;
  // Estructura anidada para mantener compatibilidad
  ratings?: {
    zoneKnowledge: number;
    priceNegotiation: number;
    treatment: number;
    punctuality: number;
    propertyKnowledge: number;
  };
}

interface Agent {
  id: number;
  email: string;
  name: string | null;
  surname: string | null;
  phone?: string;
  description?: string;
  avatar?: string;
  agencyName?: string | null;
  influence_neighborhoods?: string[];
  isAgent: boolean;
  properties?: Property[];
  reviewCount?: number;
  reviewAverage?: number;
  yearsOfExperience?: number;
  languagesSpoken?: string[];
}

interface Property {
  id: number;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  size: number;
  images: string[];
  type: string;
  operationType: string;
}

// Componente de calificación con estrellas
const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 ${
            star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
};

export default function AgentProfile() {
  // Obtenemos el ID del agente de los parámetros de la URL
  const { id } = useParams<{ id: string }>();

  // Estados para la pestaña activa y el modal de reseñas
  const [activeTab, setActiveTab] = useState("overview");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Hooks para autenticación y navegación
  const { user } = useUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Mutación para manejar favoritos
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (agentId: string) => {
      if (!user) {
        throw new Error("No autenticado");
      }
      const response = await apiRequest("POST", `/api/clients/favorites/agents/${agentId}`, {});
      return response.json();
    },
    onSuccess: () => {
      setIsFavorite(!isFavorite);
      toast({
        title: isFavorite ? "Agente eliminado de favoritos" : "Agente agregado a favoritos",
        description: isFavorite 
          ? "El agente ha sido eliminado de tu lista de favoritos" 
          : "El agente ha sido agregado a tu lista de favoritos",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "No se pudo actualizar favoritos",
        variant: "destructive",
      });
    }
  });

  // Función para manejar el click en favoritos
  const handleFavoriteClick = () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para guardar agentes como favoritos",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    
    if (!id) return;
    toggleFavoriteMutation.mutate(id);
  };

  // Función para compartir
  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Mira el perfil de ${agent?.name || 'este agente'} en Realista`;
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} - ${url}`)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast({
          title: "Enlace copiado",
          description: "El enlace del perfil ha sido copiado al portapapeles",
        });
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`, '_blank');
        break;
    }
  };

  // Consulta para obtener los datos del agente
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

  // Explicitly fetch properties for this agent
  const { data: agentProperties = [] } = useQuery<Property[]>({
    queryKey: [`/api/agents/${id}/properties`],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${id}/properties`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!id
  });

  // Efecto para desplazar al inicio de la página cuando cambia el ID
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Consulta para obtener las reseñas del agente
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: [`/api/agents/${id}/reviews`],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${id}/reviews`);
      if (!response.ok) {
        return [];
      }
      const reviewsData = await response.json();
      
      // Transformamos los datos para garantizar compatibilidad
      return reviewsData.map((review: any) => ({
        ...review,
        // Aseguramos que comment existe y no es null
        comment: review.comment || "",
        // Mantenemos también acceso directo a los valores de puntuación
        areaKnowledge: Number(review.areaKnowledge) || 0,
        priceNegotiation: Number(review.priceNegotiation) || 0,
        treatment: Number(review.treatment) || 0,
        punctuality: Number(review.punctuality) || 0,
        propertyKnowledge: Number(review.propertyKnowledge) || 0,
        // Estructura anidada para compatibilidad
        ratings: {
          zoneKnowledge: Number(review.areaKnowledge) || 0,
          priceNegotiation: Number(review.priceNegotiation) || 0,
          treatment: Number(review.treatment) || 0,
          punctuality: Number(review.punctuality) || 0,
          propertyKnowledge: Number(review.propertyKnowledge) || 0
        }
      }));
    },
    enabled: !!agent
  });

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

  const fullName = `${agent.name || ''} ${agent.surname || ''}`.trim();
  const reviewAverage = agent.reviewAverage || 0; // Valor predeterminado 0 si no hay reseñas
  const reviewCount = agent.reviewCount || 0; // Valor predeterminado 0 si no hay reseñas

  // Renderizamos el perfil completo del agente
  return (
    <div className="container pt-16 pb-8 max-w-7xl mx-auto">
      {/* Header del Perfil */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="md:w-36 lg:w-48">
          <Avatar className="h-36 w-36 lg:h-48 lg:w-48 rounded-lg">
            <AvatarImage src={agent.avatar} />
            <AvatarFallback className="text-4xl rounded-lg">
              {agent.name ? agent.name.charAt(0) : ''}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{fullName}</h1>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Badge variant="outline" className="mr-2">Agente inmobiliario</Badge>
            {agent.agencyName && (
              <span className="flex items-center">
                <Building2 className="h-4 w-4 mr-1" /> 
                <Link href={`/agencias/${agent.id}`} className="text-gray-600 hover:text-primary hover:underline">
                  {agent.agencyName}
                </Link>
              </span>
            )}
          </div>

          <div className="flex items-center mb-4">
            <span className="text-xl font-bold mr-2">
              {reviews && reviews.length > 0 ? 
                (() => {
                  const verifiedReviews = reviews.filter(rev => rev.verified === true);
                  if (verifiedReviews.length === 0) return "0.0";
                  const sum = verifiedReviews.reduce((acc, rev) => acc + Number(rev.rating || 0), 0);
                  return (sum / verifiedReviews.length).toFixed(1);
                })() :
                "0.0"}
            </span>
            <span className="text-sm text-gray-500">({reviews ? reviews.filter(rev => rev.verified === true).length : 0} reseñas verificadas)</span>
          </div>

          <div className="flex flex-wrap gap-3">
            {agent.phone && (
              <Button size="sm">
                <Phone className="mr-2 h-4 w-4" /> Llamar
              </Button>
            )}
            <Button size="sm" variant="outline">
              <Mail className="mr-2 h-4 w-4" /> Contactar
            </Button>
            <Button size="sm" variant="outline">
              <Phone className="mr-2 h-4 w-4" /> Contactar agente
            </Button>
            
            {/* Botón de favoritos */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleFavoriteClick}
                    className={isFavorite ? "text-red-500 border-red-500 hover:bg-red-50" : ""}
                  >
                    {isFavorite ? (
                      <Heart className="h-4 w-4 fill-current" />
                    ) : (
                      <Heart className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFavorite ? "Eliminar de favoritos" : "Agregar a favoritos"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Botón de compartir */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <Share2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                  <span className="text-green-600 mr-2">📱</span>
                  WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('email')}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('copy')}>
                  <span className="mr-2">🔗</span>
                  Copiar enlace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                <h2 className="text-xl font-semibold mb-4">Sobre {fullName}</h2>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    {agent.description || 
                     `${fullName} es un agente inmobiliario con amplia experiencia en el mercado de Barcelona. 
                     Se especializa en propiedades residenciales y ayuda a sus clientes a encontrar el hogar perfecto.
                     Con un profundo conocimiento del mercado local, ${agent.name} ofrece un servicio personalizado
                     y dedicado a cada cliente.`}
                  </p>

                  {agent.influence_neighborhoods && agent.influence_neighborhoods.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2 flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                        Zonas de especialidad
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {agent.influence_neighborhoods.map((neighborhood) => (
                          <Badge key={neighborhood} variant="secondary">
                            {neighborhood}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Estadísticas del agente */}
                <div className="mt-8">
                  <h3 className="font-medium mb-4">Estadísticas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center mb-2">
                          <Home className="h-5 w-5 mr-2 text-primary" />
                          <h4 className="font-medium">Propiedades activas</h4>
                        </div>
                        <div className="text-3xl font-bold">{agent.properties?.length || 0}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center mb-2">
                          <Briefcase className="h-5 w-5 mr-2 text-primary" />
                          <h4 className="font-medium">Años de experiencia</h4>
                        </div>
                        <div className="text-3xl font-bold">{agent.yearsOfExperience || '-'}</div>
                      </CardContent>
                    </Card>
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
                      <a href={`mailto:${agent.email}`} className="text-blue-600 hover:underline">
                        {agent.email}
                      </a>
                    </div>
                  </div>

                  {agent.phone && (
                    <div className="flex">
                      <Phone className="h-5 w-5 mr-3 text-gray-500" />
                      <div>
                        <div className="font-medium">Teléfono</div>
                        <a href={`tel:${agent.phone}`} className="text-blue-600 hover:underline">
                          {agent.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {agent.agencyName && (
                    <div className="flex">
                      <Building2 className="h-5 w-5 mr-3 text-gray-500" />
                      <div>
                        <div className="font-medium">Agencia</div>
                        <div>{agent.agencyName}</div>
                      </div>
                    </div>
                  )}

                  {agent.languagesSpoken && agent.languagesSpoken.length > 0 && (
                    <div className="flex">
                      <div className="h-5 w-5 mr-3 text-gray-500">🌍</div>
                      <div>
                        <div className="font-medium">Idiomas</div>
                        <div>{agent.languagesSpoken.join(', ')}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="mt-6">
          <h2 className="text-2xl font-semibold mb-6">Propiedades de {fullName}</h2>

          {!agentProperties || agentProperties.length === 0 ? (
            <div className="text-center py-8">
              <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Sin propiedades listadas</h3>
              <p className="text-gray-500">
                Este agente no tiene propiedades listadas actualmente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agentProperties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <Button 
                    className="w-full mb-6"
                    onClick={() => setReviewModalOpen(true)}
                  >
                    Escribir una reseña
                  </Button>
                  
                  <div className="space-y-5 p-4 bg-gray-50 rounded-md">
                    {/* Conocimientos de la zona */}
                    <div>
                      <div className="text-sm font-medium mb-2">Conocimientos de la zona</div>
                      <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
                        <div 
                          className="bg-blue-300 h-5 rounded-r-full" 
                          style={{ 
                            width: `${reviews.length > 0 ? 
                            (reviews.reduce((acc, review) => acc + (Number(review.areaKnowledge) || 0), 0) / reviews.length / 5) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Negociación del precio */}
                    <div>
                      <div className="text-sm font-medium mb-2">Negociación del precio</div>
                      <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
                        <div 
                          className="bg-blue-300 h-5 rounded-r-full" 
                          style={{ 
                            width: `${reviews.length > 0 ? 
                            (reviews.reduce((acc, review) => acc + (Number(review.priceNegotiation) || 0), 0) / reviews.length / 5) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Trato */}
                    <div>
                      <div className="text-sm font-medium mb-2">Trato</div>
                      <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
                        <div 
                          className="bg-blue-300 h-5 rounded-r-full" 
                          style={{ 
                            width: `${reviews.length > 0 ? 
                            (reviews.reduce((acc, review) => acc + (Number(review.treatment) || 0), 0) / reviews.length / 5) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Puntualidad y disponibilidad */}
                    <div>
                      <div className="text-sm font-medium mb-2">Puntualidad y disponibilidad</div>
                      <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
                        <div 
                          className="bg-blue-300 h-5 rounded-r-full" 
                          style={{ 
                            width: `${reviews.length > 0 ? 
                            (reviews.reduce((acc, review) => acc + (Number(review.punctuality) || 0), 0) / reviews.length / 5) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Conocimiento de la propiedad */}
                    <div>
                      <div className="text-sm font-medium mb-2">Conocimiento de la propiedad</div>
                      <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
                        <div 
                          className="bg-blue-300 h-5 rounded-r-full" 
                          style={{ 
                            width: `${reviews.length > 0 ? 
                            (reviews.reduce((acc, review) => acc + (Number(review.propertyKnowledge) || 0), 0) / reviews.length / 5) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <h2 className="text-2xl font-semibold mb-4">Todas las reseñas</h2>

              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review: Review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between mb-2">
                          <div className="font-medium">{review.author}</div>
                          <div className="text-sm text-gray-500">
                            {typeof review.date === 'string' 
                              ? review.date.substring(0, 16).replace('T', ' ')
                              : new Date(review.date).toISOString().substring(0, 16).replace('T', ' ')}
                          </div>
                        </div>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="mb-3 flex items-center gap-2">
                                <StarRating rating={review.rating} />
                                {review.verified && (
                                  <Badge variant="outline" className="text-xs h-5 bg-blue-50 border-blue-200 text-blue-600">
                                    Verificado
                                  </Badge>
                                )}
                              </div>
                            </TooltipTrigger>
                            {review.ratings && (
                              <TooltipContent className="w-80 p-4">
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="text-sm">Conocimientos de la zona:</div>
                                    <div className="flex items-center gap-1">
                                      <div className="w-32 bg-gray-200 rounded-full h-2.5">
                                        <div 
                                          className="bg-green-500 h-2.5 rounded-full" 
                                          style={{ width: `${(review.ratings.zoneKnowledge / 5) * 100}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs">{review.ratings.zoneKnowledge}/5</span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="text-sm">Negociación del precio:</div>
                                    <div className="flex items-center gap-1">
                                      <div className="w-32 bg-gray-200 rounded-full h-2.5">
                                        <div 
                                          className="bg-green-500 h-2.5 rounded-full" 
                                          style={{ width: `${(review.ratings.priceNegotiation / 5) * 100}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs">{review.ratings.priceNegotiation}/5</span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="text-sm">Trato:</div>
                                    <div className="flex items-center gap-1">
                                      <div className="w-32 bg-gray-200 rounded-full h-2.5">
                                        <div 
                                          className="bg-green-500 h-2.5 rounded-full" 
                                          style={{ width: `${(review.ratings.treatment / 5) * 100}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs">{review.ratings.treatment}/5</span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="text-sm">Puntualidad:</div>
                                    <div className="flex items-center gap-1">
                                      <div className="w-32 bg-gray-200 rounded-full h-2.5">
                                        <div 
                                          className="bg-green-500 h-2.5 rounded-full" 
                                          style={{ width: `${(review.ratings.punctuality / 5) * 100}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs">{review.ratings.punctuality}/5</span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="text-sm">Conocimiento de la propiedad:</div>
                                    <div className="flex items-center gap-1">
                                      <div className="w-32 bg-gray-200 rounded-full h-2.5">
                                        <div 
                                          className="bg-green-500 h-2.5 rounded-full" 
                                          style={{ width: `${(review.ratings.propertyKnowledge / 5) * 100}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs">{review.ratings.propertyKnowledge}/5</span>
                                    </div>
                                  </div>
                                </div>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>

                        {review.comment && <p className="text-gray-700">{review.comment}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay reseñas disponibles</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Este agente aún no tiene reseñas. Sé el primero en compartir tu experiencia.
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => setReviewModalOpen(true)}
                  >
                    Escribir una reseña
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de reseñas */}
      <AgentReviewFlow 
        agentId={parseInt(id)}
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
      />
    </div>
  );
}