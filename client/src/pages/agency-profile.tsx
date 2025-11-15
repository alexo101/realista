import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouteTransition } from "@/contexts/route-transition-context";
import { useSkeletonVisibility } from "@/hooks/useSkeletonVisibility";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Phone, Mail, MapPin, Building2, Building, Calendar, ExternalLink, Globe, Facebook, Instagram, Twitter, MessageCircle, Home, Heart, Share2, Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageGallery } from "@/components/ImageGallery";
import { PropertyCard } from "@/components/PropertyCard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AgencyReview } from "@/components/AgencyReview";
import { useUser } from "@/contexts/user-context";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface AgencyAgent {
  id: number;
  slug?: string;
  agencyId: number;
  agentName: string;
  agentSurname: string;
  agentEmail: string;
  createdAt: string;
  avatar?: string;
  rating?: number;
  reviewCount?: number;
  reviewAverage?: number; // Añadido para el cálculo del promedio de reseñas
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
  // Obtenemos el ID o slug de la agencia de los parámetros de la URL
  const params = useParams<{ slug?: string; id?: string }>();
  const identifier = params.slug || params.id;
  
  // Estado para la pestaña activa y favoritos
  const [activeTab, setActiveTab] = useState("overview");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);

  // Hooks para autenticación y navegación
  const { user } = useUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { isTransitioning, endTransition } = useRouteTransition();

  // La galería no mostrará imágenes predeterminadas, solo las que agregue el agente
  const agencyImages: string[] = [];

  // Mutación para manejar favoritos de agencias
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (agencyId: string) => {
      if (!user || !user.isClient) {
        throw new Error("Debes ser un cliente para agregar favoritos");
      }
      
      const response = await fetch(`/api/clients/favorites/agencies/${agencyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId: user.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar favoritos");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setIsFavorite(data.isFavorite);
      
      // Invalidate client favorites query to refresh the client profile page
      queryClient.invalidateQueries({ 
        queryKey: [`/api/clients/${user?.id}/favorites/agencies`] 
      });
      
      // Also invalidate the status query for this specific agency
      queryClient.invalidateQueries({ 
        queryKey: [`/api/clients/${user?.id}/favorites/agencies/${identifier}/status`] 
      });
      
      toast({
        title: data.isFavorite ? "Agencia agregada a favoritos" : "Agencia eliminada de favoritos",
        description: data.isFavorite 
          ? "La agencia ha sido agregada a tu lista de favoritos" 
          : "La agencia ha sido eliminada de tu lista de favoritos",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Función para manejar click en favoritos
  const handleFavoriteClick = () => {
    if (!user) {
      toast({
        title: "Inicia sesión para guardar la agencia",
        description: "Debes iniciar sesión para agregar agencias a favoritos",
        variant: "destructive",
      });
      navigate("/iniciar-sesion");
      return;
    }
    
    if (!user.isClient) {
      toast({
        title: "Función solo para clientes",
        description: "Solo los clientes pueden agregar agencias a favoritos",
        variant: "destructive",
      });
      return;
    }
    
    if (identifier) {
      toggleFavoriteMutation.mutate(identifier);
    }
  };

  // Función para compartir el perfil
  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Conoce ${agency?.agencyName || 'esta agencia'} en Realista`;
    
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

  // Detectar si el usuario está en un dispositivo móvil (solo userAgent, NO viewport)
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Función para manejar el click en el botón de teléfono
  const handlePhoneClick = () => {
    if (!agency?.agencyPhone) return;

    if (isMobileDevice()) {
      // En móvil: abrir la app de teléfono
      window.location.href = `tel:${agency.agencyPhone}`;
    } else {
      // En desktop: revelar el número
      setPhoneRevealed(true);
    }
  };

  // Función para copiar el número de teléfono
  const handleCopyPhone = async () => {
    if (!agency?.agencyPhone) return;

    try {
      await navigator.clipboard.writeText(agency.agencyPhone);
      setPhoneCopied(true);
      
      toast({
        title: "Número copiado",
        description: "El número de teléfono ha sido copiado al portapapeles",
      });

      // Reset después de 2 segundos
      setTimeout(() => {
        setPhoneCopied(false);
      }, 2000);
    } catch (error) {
      // Error en contexto inseguro o permisos denegados
      toast({
        title: "No se pudo copiar",
        description: "Por favor, selecciona y copia el número manualmente",
        variant: "destructive",
      });
    }
  };

  // Consulta para obtener los datos de la agencia
  const { data: agency, isFetching: agencyFetching, error } = useQuery<Agency>({
    queryKey: [`/api/agencies/${identifier}`],
    queryFn: async () => {
      const response = await fetch(`/api/agencies/${identifier}`);
      if (!response.ok) {
        throw new Error("Failed to fetch agency");
      }
      return response.json();
    },
    enabled: !!identifier,
  });

  // Reset phone reveal state when navigating to a different agency
  useEffect(() => {
    setPhoneRevealed(false);
    setPhoneCopied(false);
  }, [identifier]);
  
  // Consulta para obtener las reseñas directas de la agencia
  const { data: agencyReviews = [], isFetching: reviewsFetching } = useQuery({
    queryKey: [`/api/agencies/${identifier}/reviews`],
    queryFn: async () => {
      const response = await fetch(`/api/agencies/${identifier}/reviews`);
      if (!response.ok) {
        throw new Error("Failed to fetch agency reviews");
      }
      return response.json();
    },
    // Solo ejecutar cuando tenemos un identifier de agencia
    enabled: !!identifier,
  });
  
  // Consulta para obtener los agentes vinculados a esta agencia
  const { data: linkedAgents = [], isFetching: agentsFetching } = useQuery({
    queryKey: [`/api/agencies/${identifier}/agents`],
    queryFn: async () => {
      const response = await fetch(`/api/agencies/${identifier}/agents`);
      if (!response.ok) {
        throw new Error("Failed to fetch linked agents");
      }
      // Transformamos los agentes para que tengan el formato esperado
      const agents = await response.json();
      return agents.map(agent => ({
        id: agent.id,
        agentName: agent.name || '',
        agentSurname: agent.surname || '',
        agentEmail: agent.email,
        avatar: agent.avatar,
        rating: agent.reviewAverage || 0,
        reviewCount: agent.reviewCount || 0,
        reviewAverage: agent.reviewAverage || 0,
        createdAt: agent.createdAt
      }));
    },
    // Solo ejecutar cuando tenemos un identifier de agencia
    enabled: !!identifier,
  });
  
  // Consulta para obtener las propiedades de la agencia con optimización de carga
  const { data: agencyProperties = [], isFetching: propertiesFetching } = useQuery<Property[]>({
    queryKey: [`/api/agencies/${identifier}/properties`],
    queryFn: async () => {
      if (!identifier) {
        return [];
      }
      
      try {
        // Usamos la ruta dedicada para obtener todas las propiedades vinculadas a la agencia
        const response = await fetch(`/api/agencies/${identifier}/properties`);
        if (!response.ok) {
          console.error('Error fetching agency properties:', response.statusText);
          return [];
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching agency properties:', error);
        return [];
      }
    },
    enabled: !!identifier && activeTab === 'properties', // Solo cargar cuando se necesite
    staleTime: 300000, // 5 minutos de cache
    gcTime: 600000, // 10 minutos en memoria
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Query para verificar si la agencia ya está en favoritos
  const { data: favoriteStatus } = useQuery({
    queryKey: [`/api/clients/${user?.id}/favorites/agencies/${identifier}/status`],
    queryFn: async () => {
      if (!user || !user.isClient || !identifier) return { isFavorite: false };
      
      const response = await fetch(`/api/clients/${user.id}/favorites/agencies/${identifier}/status`);
      if (!response.ok) {
        return { isFavorite: false };
      }
      return response.json();
    },
    enabled: !!user?.isClient && !!identifier
  });

  // Efecto para actualizar el estado de favorito cuando se carga la página
  useEffect(() => {
    if (favoriteStatus) {
      setIsFavorite(favoriteStatus.isFavorite);
    }
  }, [favoriteStatus]);

  // Efecto para desplazar al inicio de la página cuando cambia el identifier
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [identifier]);

  // Combine critical isFetching states with route transition for skeleton visibility
  const showSkeleton = useSkeletonVisibility({ 
    isFetching: agencyFetching || agentsFetching || reviewsFetching, 
    isTransitioning 
  });

  // End transition when critical data is ready
  useEffect(() => {
    if (isTransitioning && !agencyFetching && !agentsFetching && !reviewsFetching) {
      endTransition();
    } else if (error && isTransitioning) {
      endTransition();
    }
  }, [isTransitioning, agencyFetching, agentsFetching, reviewsFetching, error, endTransition]);

  // Si los datos están cargando, mostramos un esqueleto de carga
  if (showSkeleton) {
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
            <Link href="/buscar/agencias">Volver al listado de agencias</Link>
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
          <div className="h-36 w-36 lg:h-48 lg:w-48 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-primary/20">
            {(agency.agencyLogo || agency.avatar) ? (
              <img
                src={agency.agencyLogo || agency.avatar}
                alt={agency.agencyName}
                className="w-full h-full object-contain"
              />
            ) : (
              <Building className="w-16 h-16 text-gray-400" />
            )}
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{agency.agencyName}</h1>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Badge variant="outline" className="mr-2">Agencia inmobiliaria</Badge>
          </div>

          <div className="flex items-center mb-4">
            <span className="text-xl font-bold mr-2">
              {(() => {
                // Calcular puntuación promedio de agentes (solo los vinculados a esta agencia)
                const agentsScore = (() => {
                  if (!linkedAgents || linkedAgents.length === 0) return 0;
                  const totalReviews = linkedAgents.reduce((acc, agent) => acc + (agent.reviewCount || 0), 0);
                  const totalRating = linkedAgents.reduce((acc, agent) => acc + ((agent.reviewAverage || 0) * (agent.reviewCount || 0)), 0);
                  return totalReviews > 0 ? totalRating / totalReviews : 0;
                })();
                
                // Calcular puntuación promedio de la agencia
                const agencyScore = (() => {
                  if (!agencyReviews || agencyReviews.length === 0) return 0;
                  const sum = agencyReviews.reduce((acc, review) => acc + review.rating, 0);
                  return sum / agencyReviews.length;
                })();
                
                // Calcular total de reseñas (solo de agentes vinculados)
                const totalAgentReviews = linkedAgents && linkedAgents.length > 0 ? 
                  linkedAgents.reduce((acc, agent) => acc + (agent.reviewCount || 0), 0) : 0;
                const totalReviews = totalAgentReviews + agencyReviews.length;

                // Si no hay reseñas, devolver 0
                if (totalReviews === 0) return "0.0";
                
                // Calcular el promedio ponderado final
                // Si hay ambos tipos de reseñas, promediar los promedios
                let finalScore;
                if (agencyScore > 0 && agentsScore > 0) {
                  finalScore = (agencyScore + agentsScore) / 2;
                } else if (agencyScore > 0) {
                  finalScore = agencyScore;
                } else {
                  finalScore = agentsScore;
                }
                
                return finalScore.toFixed(1);
              })()}
            </span>
            <span className="text-sm text-gray-500">
              ({agencyReviews.length + (linkedAgents && linkedAgents.length > 0 ? 
                linkedAgents.reduce((acc, agent) => acc + (agent.reviewCount || 0), 0) : 0)} reseñas)
            </span>
          </div>
          {agency.agencyAddress && (
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <MapPin className="h-4 w-4 mr-1" />
              {agency.agencyAddress}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            {/* Botón de contacto telefónico con comportamiento específico por plataforma */}
            {agency.agencyPhone && (
              !phoneRevealed ? (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handlePhoneClick}
                  data-testid="button-contact-agency-phone"
                >
                  <Phone className="mr-2 h-4 w-4" /> Contactar agencia
                </Button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-background">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium select-text" data-testid="text-revealed-phone">
                    {agency.agencyPhone}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={handleCopyPhone}
                    data-testid="button-copy-phone"
                  >
                    {phoneCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )
            )}
            <Button size="sm" variant="outline">
              <Mail className="mr-2 h-4 w-4" /> Contactar
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
                    disabled={toggleFavoriteMutation.isPending}
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
                  
                  {agency.yearEstablished && (
                    <div className="flex">
                      <Calendar className="h-5 w-5 mr-3 text-gray-500" />
                      <div>
                        <div className="font-medium">Fundada en</div>
                        <div>{agency.yearEstablished}</div>
                      </div>
                    </div>
                  )}
                  
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
          
          {propertiesFetching ? (
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
          
          {/* Admin Agent Section */}
          {agency.adminAgentId && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Administrador de la Agencia</h3>
              <div className="grid grid-cols-1 gap-6">
                <Link href={`/agentes/${(agency as any).adminAgentSlug || agency.adminAgentId}`}>
                  <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                          <AvatarImage src={agency.adminAvatar || undefined} />
                          <AvatarFallback className="text-2xl bg-primary/10">
                            {agency.adminName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-lg mb-1">
                          {agency.adminName} {agency.adminSurname}
                        </h3>
                        <div className="text-sm text-gray-500 mb-2">{agency.adminEmail}</div>
                        <Badge className="mb-3">Administrador</Badge>
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
              </div>
            </div>
          )}

          {/* Agency Agents Section */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Agentes</h3>
            {!linkedAgents || linkedAgents.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Sin agentes registrados</h3>
                <p className="text-gray-500">
                  Esta agencia no tiene agentes registrados actualmente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {linkedAgents.map(agent => (
                <Link key={agent.id} href={`/agentes/${agent.slug || agent.id}`}>
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
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Valoración general</h2>
                  
                  {/* Cálculo de puntuaciones */}
                  {(() => {
                    // Calcular puntuación promedio de agentes (solo los vinculados)
                    const agentsScore = (() => {
                      if (!linkedAgents || linkedAgents.length === 0) return 0;
                      const totalReviews = linkedAgents.reduce((acc, agent) => acc + (agent.reviewCount || 0), 0);
                      const totalRating = linkedAgents.reduce((acc, agent) => acc + ((agent.reviewAverage || 0) * (agent.reviewCount || 0)), 0);
                      return totalReviews > 0 ? totalRating / totalReviews : 0;
                    })();
                    
                    // Calcular puntuación promedio de la agencia
                    const agencyScore = (() => {
                      if (!agencyReviews || agencyReviews.length === 0) return 0;
                      const sum = agencyReviews.reduce((acc, review) => acc + review.rating, 0);
                      return sum / agencyReviews.length;
                    })();
                    
                    // Calcular total de reseñas (solo de agentes vinculados)
                    const totalAgentReviews = linkedAgents && linkedAgents.length > 0 ? 
                      linkedAgents.reduce((acc, agent) => acc + (agent.reviewCount || 0), 0) : 0;
                    const totalReviews = totalAgentReviews + agencyReviews.length;
                    
                    // Si no hay reseñas, mostrar mensaje de sin reseñas
                    if (totalReviews === 0) {
                      return (
                        <div className="text-center py-8">
                          <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium mb-2">No hay reseñas disponibles</h3>
                          <p className="text-gray-500 max-w-md mx-auto">
                            Esta agencia aún no tiene reseñas.
                          </p>
                          <Button className="mt-4" onClick={() => setIsReviewModalOpen(true)}>
                            Escribir una reseña
                          </Button>
                        </div>
                      );
                    }
                    
                    // Calcular el promedio ponderado final
                    // Si hay ambos tipos de reseñas, promediar los promedios
                    let finalScore;
                    if (agencyScore > 0 && agentsScore > 0) {
                      finalScore = (agencyScore + agentsScore) / 2;
                    } else if (agencyScore > 0) {
                      finalScore = agencyScore;
                    } else {
                      finalScore = agentsScore;
                    }
                    
                    return (
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold mb-2">{finalScore.toFixed(1)}</div>
                          <div className="flex justify-center mb-2">
                            {Array(5).fill(0).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-6 w-6 ${i < Math.round(finalScore) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-500">
                            Basado en {totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'}
                          </p>
                        </div>
                        
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="font-medium text-lg">Desglose de valoraciones</h3>
                          
                          {agencyScore > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Valoraciones directas de la agencia:</span>
                              <span className="font-medium flex items-center">
                                {agencyScore.toFixed(1)}
                                <Star className="h-4 w-4 ml-1 text-yellow-500 fill-yellow-500" />
                                <span className="text-xs text-gray-500 ml-1">
                                  ({agencyReviews.length})
                                </span>
                              </span>
                            </div>
                          )}
                          
                          {agentsScore > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Promedio de agentes:</span>
                              <span className="font-medium flex items-center">
                                {agentsScore.toFixed(1)}
                                <Star className="h-4 w-4 ml-1 text-yellow-500 fill-yellow-500" />
                                <span className="text-xs text-gray-500 ml-1">
                                  ({totalAgentReviews})
                                </span>
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center font-medium mt-2 pt-2 border-t">
                            <span>Puntuación combinada:</span>
                            <span className="flex items-center">
                              {finalScore.toFixed(1)}
                              <Star className="h-4 w-4 ml-1 text-yellow-500 fill-yellow-500" />
                            </span>
                          </div>
                        </div>
                        
                        <Button className="w-full" onClick={() => setIsReviewModalOpen(true)}>
                          Escribir una reseña
                        </Button>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
            
            <div className="md:w-2/3">
              <h2 className="text-xl font-semibold mb-4">Reseñas recientes</h2>
              
              {agencyReviews && agencyReviews.length > 0 ? (
                <div className="space-y-4">
                  {agencyReviews.map((review: any) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarFallback>
                                {review.authorName?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{review.authorName || "Usuario"}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(review.date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex">
                            {Array(5).fill(0).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 mt-2">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <MessageCircle className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-base font-medium mb-1">No hay reseñas directas</h3>
                    <p className="text-gray-500 text-sm">
                      Esta agencia aún no tiene reseñas directas. Sé el primero en escribir una reseña.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Modal para escribir reseña */}
      {isReviewModalOpen && (
        <AgencyReview 
          onClose={() => setIsReviewModalOpen(false)}
        />
      )}
    </div>
  );
}