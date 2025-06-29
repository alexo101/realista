import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { type Property } from "@shared/schema";
import { ImageGallery } from "@/components/ImageGallery";
import { ContactForm } from "@/components/ContactForm";
import { PropertyVisitRequest } from "@/components/PropertyVisitRequest";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUser } from "@/contexts/user-context";
import { useToast } from "@/hooks/use-toast";
import { Bed, Bath, MapPin, Phone, Mail, Maximize, Heart, Share2, Copy, MessageCircle } from "lucide-react";

// Extended Property type with additional fields for features
interface ExtendedProperty extends Omit<Property, 'bedrooms' | 'bathrooms'> {
  bedrooms: number | null;
  bathrooms: number | null;
  viewCount: number;
  features?: string[];
}

// Agent interface
interface Agent {
  id: number;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
}

export default function PropertyPage() {
  const { id } = useParams<{ id: string }>();
  const propertyId = parseInt(id);
  const [isFavorite, setIsFavorite] = useState(false);

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
  const { data: favoriteStatus } = useQuery({
    queryKey: [`/api/clients/${user?.id}/favorites/properties/${propertyId}/status`],
    enabled: !!user?.isClient && !!propertyId,
  });

  useEffect(() => {
    if (favoriteStatus?.isFavorite !== undefined) {
      setIsFavorite(favoriteStatus.isFavorite);
    }
  }, [favoriteStatus]);

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
                  <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      <img
                        src={agent.photo}
                        alt={agent.name}
                        className="rounded-full object-cover w-full h-full"
                      />
                    </div>
                    <h3 className="font-semibold text-lg">{agent.name}</h3>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{agent.phone}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{agent.email}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">Aplica por esta propiedad</h3>
                <ContactForm propertyId={property.id} />
              </CardContent>
            </Card>

            {property.agentId && (
              <PropertyVisitRequest 
                propertyId={property.id} 
                agentId={property.agentId} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}