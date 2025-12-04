import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRouteTransition } from "@/contexts/route-transition-context";
import { useSkeletonVisibility } from "@/hooks/useSkeletonVisibility";
import { type Property } from "@shared/schema";
import { ImageGallery } from "@/components/ImageGallery";
import { PropertyApplicationForm } from "@/components/PropertyApplicationForm";
import { ClientAuthModal } from "@/components/ClientAuthModal";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUser } from "@/contexts/user-context";
import { useToast } from "@/hooks/use-toast";
import { Bed, Bath, MapPin, Phone, Mail, Maximize, Heart, Share2, Copy, MessageCircle, Star, ExternalLink, Flag, ChevronDown } from "lucide-react";

// Extended Property type with additional fields for features
interface ExtendedProperty extends Omit<Property, 'bedrooms' | 'bathrooms' | 'features' | 'agencyId'> {
  bedrooms: number | null;
  bathrooms: number | null;
  viewCount: number;
  features?: string[];
  agencyId?: number | null;
}

// Agent interface
interface Agent {
  id: number;
  name: string;
  surname?: string;
  slug?: string;
  email: string;
  phone?: string;
  photo?: string;
  avatar?: string;
  description?: string;
  influenceNeighborhoods?: string[];
  reviewCount?: number;
  reviewAverage?: number;
  agencyId?: number;
  pinnedReview?: {
    id: number;
    rating: number;
    comment?: string;
    author: string;
    date: string;
  };
}

// Agency interface
interface Agency {
  id: number;
  agencyName: string;
  agencyLogo?: string;
  slug?: string;
  reviewCount?: number;
  reviewAverage?: number;
}

export default function PropertyPage() {
  const params = useParams<{ slug?: string; id?: string }>();
  const identifier = params.slug || params.id;
  // Try to parse as ID if it's numeric, otherwise use identifier as slug
  const propertyId = !isNaN(parseInt(identifier!)) ? parseInt(identifier!) : undefined;
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFraudDialog, setShowFraudDialog] = useState(false);
  const [fraudCount, setFraudCount] = useState(0);
  const [agentCardExpanded, setAgentCardExpanded] = useState(false);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { user } = useUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { isTransitioning, endTransition } = useRouteTransition();

  const { data: property, isFetching: propertyFetching, isError: propertyError } = useQuery<ExtendedProperty>({
    queryKey: [`/api/properties/${identifier}`],
    enabled: !!identifier,
  });

  const { data: agent, isFetching: agentFetching } = useQuery<Agent>({
    queryKey: [`/api/agents/${property?.agentId}`],
    enabled: !!property?.agentId,
  });

  // Get agency ID from property or agent
  const agencyId = property?.agencyId || agent?.agencyId;

  const { data: agency, isFetching: agencyFetching } = useQuery<Agency>({
    queryKey: [`/api/agencies/${agencyId}`],
    enabled: !!agencyId,
  });

  // State for the contact card tab (agent or agency)
  const [contactTab, setContactTab] = useState<'agent' | 'agency'>('agent');

  // Check if property is favorited
  const { data: favoriteStatus } = useQuery<{ isFavorite: boolean }>({
    queryKey: [`/api/clients/${user?.id}/favorites/properties/${identifier}/status`],
    enabled: !!user?.isClient && !!identifier,
  });

  // Get fraud count for property
  const { data: fraudCountData } = useQuery<{ fraudCount: number }>({
    queryKey: [`/api/properties/${identifier}/fraud-count`],
    enabled: !!identifier,
  });

  // Combine critical isFetching states with route transition for skeleton visibility
  const showSkeleton = useSkeletonVisibility({ 
    isFetching: propertyFetching || agentFetching, 
    isTransitioning 
  });

  // End transition when critical data is ready
  useEffect(() => {
    if (isTransitioning && !propertyFetching && !agentFetching) {
      endTransition();
    } else if (propertyError && isTransitioning) {
      endTransition();
    }
  }, [isTransitioning, propertyFetching, agentFetching, propertyError, endTransition]);

  useEffect(() => {
    if (favoriteStatus?.isFavorite !== undefined) {
      setIsFavorite(favoriteStatus.isFavorite);
    }
  }, [favoriteStatus]);

  useEffect(() => {
    if (fraudCountData?.fraudCount !== undefined) {
      setFraudCount(fraudCountData.fraudCount);
    }
  }, [fraudCountData]);

  // Mutation for toggling favorites
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user || !user.id) {
        throw new Error("Debes iniciar sesión para agregar favoritos");
      }

      if (!user.isClient) {
        throw new Error("Debes ser un cliente para agregar favoritos");
      }

      const response = await fetch(`/api/clients/favorites/properties/${propertyId}`, {
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
        queryKey: [`/api/clients/${user?.id}/favorites/properties`] 
      });

      // Also invalidate the status query for this specific property
      queryClient.invalidateQueries({ 
        queryKey: [`/api/clients/${user?.id}/favorites/properties/${identifier}/status`] 
      });

      toast({
        title: data.isFavorite ? "Propiedad agregada a favoritos" : "Propiedad eliminada de favoritos",
        description: data.isFavorite 
          ? "La propiedad ha sido agregada a tu lista de favoritos" 
          : "La propiedad ha sido eliminada de tu lista de favoritos",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "No se pudo actualizar favoritos",
        variant: "destructive",
      });
    },
  });

  // Function to handle favorite click
  const handleFavoriteClick = () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para guardar propiedades como favoritas",
        variant: "destructive",
      });
      navigate("/iniciar-sesion");
      return;
    }

    if (!user.isClient) {
      toast({
        title: "Función solo para clientes",
        description: "Solo los clientes pueden agregar propiedades a favoritos",
        variant: "destructive",
      });
      return;
    }

    if (!identifier) return;
    toggleFavoriteMutation.mutate(identifier);
  };

  // Fraud reporting mutation
  const reportFraudMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/properties/${identifier}/report-fraud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al reportar la propiedad");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setFraudCount(data.fraudCount);
      setShowFraudDialog(false);
      
      // Invalidate fraud count query
      queryClient.invalidateQueries({ 
        queryKey: [`/api/properties/${identifier}/fraud-count`] 
      });

      toast({
        title: "Reporte enviado",
        description: "Gracias por reportar esta propiedad. Tu reporte ha sido registrado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al reportar",
        description: (error as Error).message || "No se pudo enviar el reporte",
        variant: "destructive",
      });
    },
  });

  const handleFraudReport = () => {
    setShowFraudDialog(true);
  };

  const confirmFraudReport = () => {
    reportFraudMutation.mutate();
  };

  // Function to handle sharing
  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Mira esta propiedad en ${property?.neighborhood || 'Barcelona'} - ${property?.title || property?.address} en Realista`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} - ${url}`)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast({
          title: "Enlace copiado",
          description: "El enlace de la propiedad ha sido copiado al portapapeles",
        });
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`, '_blank');
        break;
      default:
        break;
    }
  };

  if (showSkeleton) {
    return (
      <div className="min-h-screen pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="h-[400px] bg-primary/10 rounded-lg animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-8 bg-primary/10 rounded animate-pulse w-3/4" />
              <div className="h-32 bg-primary/10 rounded animate-pulse" />
            </div>
            <div className="h-[400px] bg-primary/10 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900">Propiedad no encontrada</h1>
      </div>
    );
  }

  // Use imageUrls or empty array if none available
  const propertyImages = (property.imageUrls && property.imageUrls.length > 0)
    ? property.imageUrls
    : [];

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ImageGallery 
          images={propertyImages} 
          mainImageIndex={property.mainImageIndex !== null ? property.mainImageIndex : 0} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {property.previousPrice && property.previousPrice > property.price && (
                      <span className="text-lg text-gray-400 line-through">
                        €{property.previousPrice.toLocaleString()}
                      </span>
                    )}
                    <p className="text-xl font-semibold text-primary">
                      €{property.price.toLocaleString()}
                    </p>
                    {property.previousPrice && property.previousPrice > property.price && (() => {
                      const dropPercentage = Math.round(((property.previousPrice - property.price) / property.previousPrice) * 100);
                      return dropPercentage >= 10 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          -{dropPercentage}%
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{property.address} - {property.neighborhood}</span>
                  </div>
                  {property.viewCount !== undefined && property.viewCount > 0 && (
                    <div className="mt-2 text-sm text-gray-500">
                      <span>Vistas: {property.viewCount}</span>
                    </div>
                  )}
                </div>

                {/* Favorite and Share buttons */}
                <div className="flex gap-2 ml-4">
                  {/* Favorite button - only show for clients or potential clients */}
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

                  {/* Share button */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('email')}>
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('copy')}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar enlace
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Flag button for fraud reporting */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={handleFraudReport}
                          disabled={reportFraudMutation.isPending}
                          className="relative"
                        >
                          <Flag className="h-4 w-4" />
                          {fraudCount > 0 && (
                            <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                              {fraudCount}
                            </span>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Reportar como posible estafa
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            <div className="flex gap-6">
              {property.bedrooms && (
                <div className="flex items-center gap-2">
                  <Bed className="h-5 w-5 text-gray-600" />
                  <span>{property.bedrooms} {property.bedrooms === 1 ? 'Habitación' : 'Habitaciones'}</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-2">
                  <Bath className="h-5 w-5 text-gray-600" />
                  <span>{property.bathrooms} {property.bathrooms === 1 ? 'Baño' : 'Baños'}</span>
                </div>
              )}
              {property.superficie && (
                <div className="flex items-center gap-2">
                  <Maximize className="h-5 w-5 text-gray-600" />
                  <span>{property.superficie} m²</span>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-4">Descripción</h2>
              <p className="text-gray-600 whitespace-pre-line">{property.description}</p>
            </div>

            {property.features && property.features.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Características</h2>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((feature, index) => (
                    <Badge key={index} variant="secondary">{feature}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {(agent || agency) && !agentFetching && !agencyFetching && (
              <Card>
                <CardContent className="pt-4">
                  <Tabs value={contactTab} onValueChange={(v) => setContactTab(v as 'agent' | 'agency')}>
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="agent" disabled={!agent}>Agente</TabsTrigger>
                      <TabsTrigger value="agency" disabled={!agency}>Agencia</TabsTrigger>
                    </TabsList>
                    
                    {/* Agent Tab */}
                    <TabsContent value="agent" className="mt-0">
                      {agent && (
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 flex-shrink-0">
                            {agent.avatar || agent.photo ? (
                              <img
                                src={agent.avatar || agent.photo}
                                alt={`${agent.name || ''} ${agent.surname || ''}`}
                                className="rounded-full object-cover w-full h-full border-2 border-primary/20"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary text-sm font-semibold">
                                  {(agent.name?.[0] || '') + (agent.surname?.[0] || '')}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {agent.name || ''} {agent.surname || ''}
                            </h3>
                            
                            {agent.reviewCount && agent.reviewCount > 0 && agent.reviewAverage ? (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                <span className="text-xs font-medium">{agent.reviewAverage.toFixed(1)}</span>
                                <span className="text-xs text-gray-500">({agent.reviewCount})</span>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-xs mt-0.5">Sin reseñas</p>
                            )}
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/agentes/${agent.slug || agent.id}`)}
                          >
                            Ver perfil
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                    
                    {/* Agency Tab */}
                    <TabsContent value="agency" className="mt-0">
                      {agency && (
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 flex-shrink-0">
                            {agency.agencyLogo ? (
                              <img
                                src={agency.agencyLogo}
                                alt={agency.agencyName}
                                className="rounded-md object-cover w-full h-full border border-gray-200"
                              />
                            ) : (
                              <div className="w-full h-full rounded-md bg-primary/10 flex items-center justify-center">
                                <span className="text-primary text-sm font-semibold">
                                  {agency.agencyName?.[0] || 'A'}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {agency.agencyName}
                            </h3>
                            
                            {agency.reviewCount && agency.reviewCount > 0 && agency.reviewAverage ? (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                <span className="text-xs font-medium">{agency.reviewAverage.toFixed(1)}</span>
                                <span className="text-xs text-gray-500">({agency.reviewCount})</span>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-xs mt-0.5">Sin reseñas</p>
                            )}
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/agencias/${agency.slug || agency.id}`)}
                          >
                            Ver perfil
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Button 
                    className="w-full"
                    onClick={() => {
                      if (user && user.isClient) {
                        setApplicationModalOpen(true);
                      } else {
                        setAuthModalOpen(true);
                      }
                    }}
                    data-testid="button-apply-property"
                  >
                    Aplicar por esta propiedad
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Fraud reporting confirmation dialog */}
      <Dialog open={showFraudDialog} onOpenChange={setShowFraudDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reportar propiedad</DialogTitle>
            <DialogDescription>
              ¿Quieres marcar esta propiedad como posible estafa?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFraudDialog(false)}
              disabled={reportFraudMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmFraudReport}
              disabled={reportFraudMutation.isPending}
              variant="destructive"
            >
              {reportFraudMutation.isPending ? "Enviando..." : "Reportar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client auth modal */}
      <ClientAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          setApplicationModalOpen(true);
        }}
      />

      {/* Property application modal */}
      <Dialog open={applicationModalOpen} onOpenChange={setApplicationModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aplicar por esta propiedad</DialogTitle>
            <DialogDescription>
              Completa el formulario para solicitar información o una visita.
            </DialogDescription>
          </DialogHeader>
          <PropertyApplicationForm 
            propertyUuid={property?.uuid || ''} 
            agentId={property?.agentId}
            onSuccess={() => setApplicationModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}