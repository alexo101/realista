import { useState, useCallback } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Square, MapPin, Euro, ChevronLeft, ChevronRight } from "lucide-react";

interface Property {
  id: number;
  title: string | null; // Match the actual schema
  address: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  superficie: number | null; // Match the actual schema
  images?: string[] | null; // Legacy base64 images (deprecated)
  imageUrls: string[] | null; // New URL-based images
  mainImageIndex?: number;
  type: string;
  operationType: string;
}

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(property.mainImageIndex ?? 0);
  
  // Formato del precio en euros con puntos como separadores de miles
  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(property.price);

  // Process images using URL-based system with fallback
  const images = (property.imageUrls && property.imageUrls.length > 0)
    ? property.imageUrls
    : (property.images && property.images.length > 0) 
    ? property.images  // Backward compatibility
    : ["https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=2070&auto=format&fit=crop"]; // Placeholder
  
  // Use mainImageIndex for starting image
  const startingIndex = property.mainImageIndex ?? 0;
  
  const hasMultipleImages = images.length > 1;

  // Navegación del carousel
  const goToPrevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const goToImage = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  }, []);

  return (
    <Link href={`/property/${property.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        <div className="relative group">
          {/* Main image */}
          <img
            src={images[currentImageIndex]}
            alt={`${property.title} - Imagen ${currentImageIndex + 1}`}
            className="h-48 w-full object-cover transition-all duration-300"
            loading="lazy"
          />
          
          {/* Operation type badge */}
          <Badge className="absolute top-2 right-2 capitalize z-10">
            {property.operationType === 'Alquiler' || property.operationType === 'alquiler' ? 'Alquiler' : 'Venta'}
          </Badge>

          {/* Navigation arrows - only show if multiple images */}
          {hasMultipleImages && (
            <>
              <button
                onClick={goToPrevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={goToNextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                aria-label="Siguiente imagen"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Image indicators - only show if multiple images */}
          {hasMultipleImages && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => goToImage(e, index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentImageIndex 
                      ? 'bg-white scale-110' 
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Ver imagen ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Image counter - only show if multiple images */}
          {hasMultipleImages && (
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
              {currentImageIndex + 1}/{images.length}
            </div>
          )}
        </div>
        
        <CardContent className="p-3 md:p-4">
          <div className="mb-2">
            <h3 className="font-semibold text-base md:text-lg truncate">{property.title || 'Propiedad sin título'}</h3>
            <div className="flex items-center text-xs md:text-sm text-gray-500">
              <MapPin className="h-3 w-3 mr-1" /> 
              <span className="truncate">{property.address}</span>
            </div>
          </div>
          
          <div className="text-lg md:text-xl font-bold mb-3 flex items-center">
            <Euro className="h-4 w-4 md:h-5 md:w-5 mr-1" /> 
            <span className="truncate">{formattedPrice}</span>
            {property.operationType === 'rent' && <span className="text-xs md:text-sm font-normal ml-1">/mes</span>}
          </div>
          
          <div className="flex items-center justify-between text-xs md:text-sm text-gray-600">
            <div className="flex items-center">
              <Bed className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              <span>{property.bedrooms || 0}</span>
            </div>
            <div className="flex items-center">
              <Bath className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              <span>{property.bathrooms || 0}</span>
            </div>
            <div className="flex items-center">
              <Square className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              <span>{property.superficie || 0}m²</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}