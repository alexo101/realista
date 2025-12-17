import { Building, MapPin, ExternalLink, Star, Heart, Share2, Copy, Mail } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/user-context";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SiWhatsapp } from "react-icons/si";

interface Agency {
  id: number;
  uuid?: string;
  slug?: string;
  agencyName: string;
  agencyAddress?: string;
  agencyLogo?: string;
  agencyInfluenceNeighborhoods?: string[] | any;
  agencyNeighborhoods?: string[] | any;
  agencyDescription?: string;
  description?: string;
  reviewCount?: number;
  reviewAverage?: number;
}

interface AgencyResultsProps {
  results: Agency[];
  showSkeleton: boolean;
}

function AgencyCard({ agency }: { agency: Agency }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [localFavorite, setLocalFavorite] = useState(false);

  const { data: favoriteStatus } = useQuery({
    queryKey: [`/api/clients/${user?.id}/favorites/agencies/${agency.uuid}/status`],
    queryFn: async () => {
      if (!user || !user.isClient || !agency.uuid) return { isFavorite: false };
      const response = await fetch(`/api/clients/${user.id}/favorites/agencies/${agency.uuid}/status`);
      if (!response.ok) return { isFavorite: false };
      return response.json();
    },
    enabled: !!user?.isClient && !!agency.uuid,
  });

  const isFavorite = favoriteStatus?.isFavorite ?? localFavorite;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user || !user.isClient || !agency.uuid) {
        throw new Error("Debes ser un cliente para agregar favoritos");
      }
      const response = await fetch(`/api/clients/favorites/agencies/${agency.uuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: user.id }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar favoritos");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setLocalFavorite(data.isFavorite);
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${user?.id}/favorites/agencies`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${user?.id}/favorites/agencies/${agency.uuid}/status`] });
      toast({
        title: data.isFavorite ? "Agencia guardada" : "Agencia eliminada de favoritos",
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

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Inicia sesión para guardar",
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
    
    if (agency.uuid) {
      toggleFavoriteMutation.mutate();
    }
  };

  const handleShare = (platform: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const url = `${window.location.origin}/agencias/${agency.slug || agency.id}`;
    const text = `Conoce ${agency.agencyName} en Realista`;
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} - ${url}`)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast({
          title: "Enlace copiado",
          description: "El enlace de la agencia ha sido copiado al portapapeles",
        });
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`, '_blank');
        break;
    }
  };

  let neighborhoods: string[] = [];
  const rawNeighborhoods = agency.agencyInfluenceNeighborhoods;
  if (rawNeighborhoods) {
    if (typeof rawNeighborhoods === "string") {
      try {
        neighborhoods = JSON.parse(rawNeighborhoods);
      } catch {
        if (rawNeighborhoods.startsWith("{") && rawNeighborhoods.endsWith("}")) {
          const cleaned = rawNeighborhoods.slice(1, -1);
          neighborhoods = cleaned.split(/","|,/).map((n) => n.replace(/^"|"$/g, "").trim()).filter(Boolean);
        } else {
          neighborhoods = rawNeighborhoods.split(",").map((n) => n.trim()).filter(Boolean);
        }
      }
    } else if (Array.isArray(rawNeighborhoods)) {
      neighborhoods = rawNeighborhoods;
    }
  }
  neighborhoods = neighborhoods.filter((n) => typeof n === "string");

  return (
    <div
      className="bg-white rounded-lg shadow-md p-6 flex flex-col relative"
      data-testid={`card-agency-${agency.id}`}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={handleFavoriteClick}
          disabled={toggleFavoriteMutation.isPending}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          data-testid={`button-favorite-agency-${agency.id}`}
          aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${
              isFavorite 
                ? "fill-red-500 text-red-500" 
                : "text-gray-400 hover:text-red-400"
            }`} 
          />
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              data-testid={`button-share-agency-${agency.id}`}
              aria-label="Compartir agencia"
            >
              <Share2 className="w-5 h-5 text-gray-400 hover:text-primary" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => handleShare('whatsapp', e)} data-testid="share-whatsapp">
              <SiWhatsapp className="w-4 h-4 mr-2 text-green-500" />
              WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleShare('email', e)} data-testid="share-email">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleShare('copy', e)} data-testid="share-copy">
              <Copy className="w-4 h-4 mr-2" />
              Copiar enlace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-4 pr-20">
        <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-primary/20 flex-shrink-0">
          {agency.agencyLogo ? (
            <img
              src={agency.agencyLogo}
              alt={agency.agencyName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <Building className="w-10 h-10 text-primary" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{agency.agencyName}</h3>
          <p className="text-gray-600 text-sm truncate">
            {agency.agencyAddress || "Sin dirección"}
          </p>

          {(agency.reviewCount !== undefined && agency.reviewAverage !== undefined) && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium">
                  {agency.reviewAverage > 0 ? agency.reviewAverage.toFixed(1) : "Sin valoración"}
                </span>
              </div>
              {agency.reviewCount > 0 && (
                <span className="text-sm text-gray-500">
                  ({agency.reviewCount} {agency.reviewCount === 1 ? "reseña" : "reseñas"})
                </span>
              )}
            </div>
          )}

          {neighborhoods.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500">Barrios de influencia:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {neighborhoods.slice(0, 3).map((neighborhood) => (
                  <span
                    key={neighborhood}
                    className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5 flex items-center"
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    {neighborhood}
                  </span>
                ))}
                {neighborhoods.length > 3 && (
                  <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">
                    +{neighborhoods.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {(agency.agencyDescription || agency.description) && (
        <p className="mt-3 text-gray-700 text-sm line-clamp-3">
          {agency.agencyDescription || agency.description}
        </p>
      )}

      <div className="mt-auto pt-4">
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/agencias/${agency.slug || agency.id}`}>
            Ver agencia <ExternalLink className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function AgencyResults({ results, showSkeleton }: AgencyResultsProps) {
  if (showSkeleton) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="bg-primary/10 animate-pulse h-[240px] rounded-lg"
            />
          ))}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="w-full py-16">
        <Building className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">
          No hay agencias disponibles
        </h3>
        <p className="mt-1 text-gray-500">
          No se encontraron agencias que coincidan con tu búsqueda
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((agency) => (
        <AgencyCard key={agency.id} agency={agency} />
      ))}
    </div>
  );
}
