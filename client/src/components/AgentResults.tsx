import { UserCircle, MapPin, ExternalLink, Users, Star, Heart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/user-context";
import { useLanguage } from "@/contexts/language-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Actualizamos la interfaz para que coincida con la respuesta real del servidor
interface Agent {
  id: number;
  uuid?: string; // UUID for favorites API
  slug?: string; // Slug for SEO-friendly URLs
  name: string | null;
  surname: string | null;
  email: string;
  description: string | null;
  avatar?: string | null;
  influenceNeighborhoods: string[] | null;
  reviewCount?: number;
  reviewAverage?: number;
  isAgent: boolean;
}

interface AgentResultsProps {
  results: Agent[];
  showSkeleton: boolean;
}

export function AgentResults({ results, showSkeleton }: AgentResultsProps) {
  const { user } = useUser();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Get favorite status for all agents if user is logged in as client
  const { data: favoriteStatus = {} } = useQuery({
    queryKey: [`/api/clients/${user?.id}/favorites/agents/status`, results?.map(a => a.id)],
    queryFn: async () => {
      if (!user?.isClient || !results?.length) return {};
      
      const agentIds = results.map(agent => agent.id);
      const response = await fetch(`/api/clients/${user.id}/favorites/agents/status?agentIds=${agentIds.join(',')}`);
      if (!response.ok) return {};
      return response.json();
    },
    enabled: !!user?.isClient && !!results?.length,
    staleTime: 30000,
  });

  // Mutation to toggle favorite status
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (agentUuid: string): Promise<{ isFavorite: boolean; message: string }> => {
      if (!user || !user.id) {
        throw new Error("Debes iniciar sesión para agregar favoritos");
      }

      if (!user.isClient) {
        throw new Error("Debes ser un cliente para agregar favoritos");
      }

      // apiRequest already returns parsed JSON, no need to call .json() again
      return await apiRequest("POST", `/api/clients/favorites/agents/${agentUuid}`, {
        clientId: user.id
      });
    },
    onSuccess: (data) => {
      // Invalidate and refetch favorite status
      queryClient.invalidateQueries({ 
        queryKey: [`/api/clients/${user?.id}/favorites/agents/status`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/clients/${user?.id}/favorites/agents`] 
      });

      toast({
        title: data.isFavorite ? "Agregado a favoritos" : "Eliminado de favoritos",
        description: data.isFavorite 
          ? "El agente se ha agregado a tus favoritos."
          : "El agente se ha eliminado de tus favoritos."
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

  const handleFavoriteClick = (agentUuid: string | undefined) => {
    // If user is not logged in, redirect to login page
    if (!user) {
      toast({
        title: "Inicia sesión para guardar",
        description: "Debes iniciar sesión para agregar agentes a favoritos",
        variant: "destructive",
      });
      navigate("/iniciar-sesion");
      return;
    }
    
    // If user is not a client, show error
    if (!user.isClient) {
      toast({
        title: "Función solo para clientes",
        description: "Solo los clientes pueden agregar agentes a favoritos",
        variant: "destructive",
      });
      return;
    }
    
    if (!agentUuid) {
      toast({
        title: "Error",
        description: "No se pudo identificar el agente",
        variant: "destructive",
      });
      return;
    }
    
    toggleFavoriteMutation.mutate(agentUuid);
  };

  if (showSkeleton) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="bg-primary/10 animate-pulse h-[240px] rounded-lg" />
        ))}
      </div>
    );
  }

  // Display empty state if no results or if results array is empty
  if (!results || results.length === 0) {
    return (
      <div className="w-full py-16">
        <Users className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">
          No hay agentes disponibles
        </h3>
        <p className="mt-1 text-gray-500">
          No se encontraron agentes que coincidan con tu búsqueda
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((agent) => {
        const isFavorite = favoriteStatus[agent.id] || false;
        const showFavoriteButton = true; // Always show favorite button, redirect to login if not logged in
        
        return (
          <div key={agent.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col">
            <div className="flex items-center gap-4 relative">
              {/* Favorite heart icon - positioned at top right */}
              {showFavoriteButton && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className={`absolute -top-2 -right-2 h-8 w-8 p-0 ${isFavorite ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-gray-600"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFavoriteClick(agent.uuid);
                        }}
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
                      {isFavorite ? t("results.remove_favorite") : t("results.save_favorite")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                {agent.avatar ? (
                  <img
                    src={agent.avatar || ''}
                    alt={`${agent.name || ''} ${agent.surname || ''}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <UserCircle className="w-12 h-12 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {agent.name || ''} {agent.surname || ''}
                </h3>
                
                {/* Review score display */}
                {agent.reviewCount && agent.reviewCount > 0 && agent.reviewAverage ? (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">{agent.reviewAverage.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">({agent.reviewCount})</span>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm mt-1">{t("reviews.no_reviews")}</p>
                )}
                
                {agent.influenceNeighborhoods && agent.influenceNeighborhoods.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">{t("results.influence_neighborhoods")}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {agent.influenceNeighborhoods.slice(0, 2).map((neighborhood) => (
                        <span key={neighborhood} className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {neighborhood}
                        </span>
                      ))}
                      {agent.influenceNeighborhoods.length > 2 && (
                        <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">
                          +{agent.influenceNeighborhoods.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-auto pt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/agentes/${agent.slug || agent.id}`}>
                  {t("results.view_agent")} <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
