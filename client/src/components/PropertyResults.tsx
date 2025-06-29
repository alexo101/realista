import { useState } from "react";
import { Building2, ChevronLeft, ChevronRight, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PropertyResult {
  id: number;
  address: string;
  type: string;
  operationType: string;
  price: number;
  previousPrice?: number | null;
  neighborhood: string;
  title?: string;
  images?: string[] | null;
  mainImageIndex?: number | null;
  superficie?: number | null;
  createdAt?: string;
  // Campos nuevos
  housingType?: string | null;
  housingStatus?: string | null;
  floor?: string | null;
  features?: string[] | null;
  availability?: string | null;
  availabilityDate?: string | null;
}

interface PropertyResultsProps {
  results: PropertyResult[];
  isLoading: boolean;
}

export function PropertyResults({ results, isLoading }: PropertyResultsProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const handlePrevImage = (propertyId: number, images: string[], e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => ({
      ...prev,
      [propertyId]: ((prev[propertyId] || 0) - 1 + images.length) % images.length
    }));
  };

  const handleNextImage = (propertyId: number, images: string[], e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => ({
      ...prev,
      [propertyId]: ((prev[propertyId] || 0) + 1) % images.length
    }));
  };

  const handleToggleFavorite = (propertyId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(propertyId)) {
        newFavorites.delete(propertyId);
        toast({
          title: "Eliminado de favoritos",
          description: "La propiedad se ha eliminado de tus favoritos."
        });
      } else {
        newFavorites.add(propertyId);
        toast({
          title: "Agregado a favoritos",
          description: "La propiedad se ha agregado a tus favoritos."
        });
      }
      return newFavorites;
    });
  };

  const handleShare = (property: PropertyResult, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: property.title || property.address,
        text: `${property.title || property.address} - €${property.price.toLocaleString()}`,
        url: `${window.location.origin}/property/${property.id}`
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/property/${property.id}`);
      toast({
        title: "Enlace copiado",
        description: "El enlace de la propiedad se ha copiado al portapapeles."
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="bg-gray-100 animate-pulse h-[300px] rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((property) => {
        const hasMultipleImages = property.images && property.images.length > 1;
        const currentIndex = currentImageIndex[property.id] || 0;
        const currentImage = property.images?.[currentIndex] || property.images?.[0];

        return (
          <div 
            key={property.id} 
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
            onClick={() => window.location.href = `/property/${property.id}`}
          >
            <div className="aspect-video bg-gray-200 relative overflow-hidden">
              {property.images && property.images.length > 0 ? (
                <>
                  <img
                    src={currentImage}
                    alt={property.title || property.address}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  
                  {/* Navigation arrows */}
                  {hasMultipleImages && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handlePrevImage(property.id, property.images!, e)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleNextImage(property.id, property.images!, e)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      
                      {/* Image indicators */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {property.images.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full ${
                              index === currentIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Building2 className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              <div className="absolute top-2 right-2 bg-primary text-white text-xs font-medium px-2 py-1 rounded-md">
                {property.operationType === 'Alquiler' || property.operationType === 'alquiler' ? 'Alquiler' : 'Venta'}
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg line-clamp-1 flex-1 mr-2">{property.title || property.address}</h3>
                
                {/* Favorite and Share buttons */}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-8 w-8 hover:bg-gray-100"
                    onClick={(e) => handleToggleFavorite(property.id, e)}
                  >
                    <Heart 
                      className={`h-4 w-4 ${
                        favorites.has(property.id) 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-gray-400 hover:text-red-500'
                      }`} 
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-8 w-8 hover:bg-gray-100"
                    onClick={(e) => handleShare(property, e)}
                  >
                    <Share2 className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <p className="text-2xl font-bold text-primary">€{property.price.toLocaleString()}</p>
                {property.previousPrice && property.previousPrice > property.price && (
                  <span className="text-sm font-medium text-red-600">
                    {Math.round(((property.previousPrice - property.price) / property.previousPrice) * 100)}% ↓
                  </span>
                )}
              </div>
              {property.superficie && (
                <p className="text-sm font-medium text-gray-800">
                  {Math.round(property.price / property.superficie)}€/m²
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>{property.type}</span>
                {property.housingType && <span>{property.housingType}</span>}
                <span>{property.neighborhood}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600 line-clamp-1">{property.address}</p>
              
              {/* Mostrar características si existen */}
              {property.features && property.features.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {property.features.slice(0, 3).map(feature => (
                    <span key={feature} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                  {property.features.length > 3 && (
                    <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                      +{property.features.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}