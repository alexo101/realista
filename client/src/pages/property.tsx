import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { type Property } from "@shared/schema";
import { ImageGallery } from "@/components/ImageGallery";
import { PropertyApplicationForm } from "@/components/PropertyApplicationForm";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUser } from "@/contexts/user-context";
import { useToast } from "@/hooks/use-toast";
import { Bed, Bath, MapPin, Phone, Mail, Maximize, Heart, Share2, Copy, MessageCircle, Star, ExternalLink, Flag, ChevronDown, ChevronUp } from "lucide-react";

// Extended Property type with additional fields for features
interface ExtendedProperty extends Omit<Property, 'bedrooms' | 'bathrooms' | 'features'> {
  bedrooms: number | null;
  bathrooms: number | null;
  viewCount: number;
  features?: string[];
}

// Agent interface
interface Agent {
  id: number;
  name: string;
  surname?: string;
  email: string;
  phone?: string;
  photo?: string;
  avatar?: string;
  description?: string;
  influenceNeighborhoods?: string[];
  reviewCount?: number;
  reviewAverage?: number;
}

export default function PropertyPage() {
  const { id } = useParams<{ id: string }>();
  const propertyId = parseInt(id);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFraudDialog, setShowFraudDialog] = useState(false);
  const [fraudCount, setFraudCount] = useState(0);
  const [agentCardExpanded, setAgentCardExpanded] = useState(false);
  const [applicationFormExpanded, setApplicationFormExpanded] = useState(false);

  const { user } = useUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data: property, isLoading: propertyLoading } = useQuery<ExtendedProperty>({
    queryKey: [`/api/properties/${propertyId}`],
  });

  const { data: agent, isLoading: agentLoading } = useQuery<Agent>({
    queryKey: [`/api/agents/${property?.agentId}`],
    enabled: !!property?.agentId,
  });

  // Check if property is favorited
  const { data: favoriteStatus } = useQuery<{ isFavorite: boolean }>({
    queryKey: [`/api/clients/${user?.id}/favorites/properties/${propertyId}/status`],
    enabled: !!user?.isClient && !!propertyId,
  });

  // Get fraud count for property
  const { data: fraudCountData } = useQuery<{ fraudCount: number }>({
    queryKey: [`/api/properties/${propertyId}/fraud-count`],
    enabled: !!propertyId,
  });

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
        queryKey: [`/api/clients/${user?.id}/favorites/properties/${propertyId}/status`] 
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
      navigate("/login");
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

    if (!id) return;
    toggleFavoriteMutation.mutate(id);
  };

  // Fraud reporting mutation
  const reportFraudMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/properties/${propertyId}/report-fraud`, {
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
        queryKey: [`/api/properties/${propertyId}/fraud-count`] 
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

  if (propertyLoading) {
    return (
      <div className="min-h-screen pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-8 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-32 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse" />
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

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ImageGallery 
          images={property.images || []} 
          mainImageIndex={property.mainImageIndex !== null ? property.mainImageIndex : 0} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
                  <p className="text-xl font-semibold text-primary mt-2">
                    €{property.price.toLocaleString()}
                  </p>
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
            {agent && !agentLoading && (
              <Card>
                <CardContent className="pt-6">
                  {!agentCardExpanded ? (
                    // Collapsed view - horizontal layout
                    <div 
                      className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      onClick={() => setAgentCardExpanded(true)}
                    >
                      {/* Agent avatar */}
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
                      
                      {/* Agent name and reviews */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">
                          {agent.name || ''} {agent.surname || ''}
                        </h3>
                        
                        {/* Review score display */}
                        {agent.reviewCount && agent.reviewCount > 0 && agent.reviewAverage ? (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium">{agent.reviewAverage.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({agent.reviewCount})</span>
                          </div>
                        ) : (
                          <p className="text-gray-600 text-xs mt-1">Sin reseñas</p>
                        )}
                      </div>
                      
                      {/* Expand arrow */}
                      <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </div>
                  ) : (
                    // Expanded view - full detailed view
                    <div>
                      {/* Collapse button */}
                      <div 
                        className="flex justify-end cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors mb-4"
                        onClick={() => setAgentCardExpanded(false)}
                      >
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      </div>
                      
                      {/* Detailed content */}
                      <div className="text-center">
                        <div className="relative w-20 h-20 mx-auto mb-4">
                          {agent.avatar || agent.photo ? (
                            <img
                              src={agent.avatar || agent.photo}
                              alt={`${agent.name || ''} ${agent.surname || ''}`}
                              className="rounded-full object-cover w-full h-full border-2 border-primary/20"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary text-xl font-semibold">
                                {(agent.name?.[0] || '') + (agent.surname?.[0] || '')}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-2">
                          {agent.name || ''} {agent.surname || ''}
                        </h3>
                        
                        {/* Review score display */}
                        {agent.reviewCount && agent.reviewCount > 0 && agent.reviewAverage ? (
                          <div className="flex items-center justify-center gap-1 mb-3">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium">{agent.reviewAverage.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({agent.reviewCount})</span>
                          </div>
                        ) : (
                          <p className="text-gray-600 text-sm mb-3">Sin reseñas</p>
                        )}
                        
                        {/* Influence neighborhoods */}
                        {agent.influenceNeighborhoods && agent.influenceNeighborhoods.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">Barrios de influencia:</p>
                            <div className="space-y-1">
                              {agent.influenceNeighborhoods.slice(0, 3).map((neighborhood) => (
                                <div key={neighborhood} className="flex items-center justify-center gap-1 text-sm text-primary">
                                  <MapPin className="w-3 h-3" />
                                  <span>{neighborhood}</span>
                                </div>
                              ))}
                              {agent.influenceNeighborhoods.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{agent.influenceNeighborhoods.length - 3} más
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Ver perfil button */}
                        <Button 
                          variant="outline" 
                          className="w-full mt-4"
                          onClick={() => navigate(`/agent/${agent.id}`)}
                        >
                          Ver perfil
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                {!applicationFormExpanded ? (
                  // Collapsed view - CTA button
                  <div className="text-center">
                    <h3 className="font-semibold text-lg mb-4">¿Interesado en esta propiedad?</h3>
                    <p className="text-gray-600 mb-6">Contacta con el agente para obtener más información o solicitar una visita</p>
                    <Button 
                      className="w-full"
                      onClick={() => setApplicationFormExpanded(true)}
                    >
                      Aplicar por esta propiedad
                    </Button>
                  </div>
                ) : (
                  // Expanded view - full application form
                  <div>
                    {/* Collapse button */}
                    <div 
                      className="flex justify-end cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors mb-4"
                      onClick={() => setApplicationFormExpanded(false)}
                    >
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-4">Aplicar por esta propiedad</h3>
                    <PropertyApplicationForm 
                      propertyId={property.id} 
                      agentId={property.agentId}
                    />
                  </div>
                )}
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
    </div>
  );
}