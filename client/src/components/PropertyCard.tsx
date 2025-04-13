import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Square, MapPin, Euro } from "lucide-react";

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
}

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  // Formato del precio en euros con puntos como separadores de miles
  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(property.price);

  // Imagen por defecto en caso de que no haya imágenes
  const imageUrl = property.images && property.images.length > 0
    ? property.images[0]
    : "https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=2070&auto=format&fit=crop";

  return (
    <Link href={`/property/${property.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        <div className="relative">
          <img
            src={imageUrl}
            alt={property.title}
            className="h-48 w-full object-cover"
          />
          <Badge className="absolute top-2 right-2 capitalize">
            {property.operationType === 'Alquiler' || property.operationType === 'alquiler' ? 'Alquiler' : 'Venta'}
          </Badge>
        </div>
        
        <CardContent className="p-4">
          <div className="mb-2">
            <h3 className="font-semibold text-lg truncate">{property.title}</h3>
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="h-3 w-3 mr-1" /> {property.address}
            </div>
          </div>
          
          <div className="text-xl font-bold mb-3 flex items-center">
            <Euro className="h-5 w-5 mr-1" /> {formattedPrice}
            {property.operationType === 'rent' && <span className="text-sm font-normal ml-1">/mes</span>}
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              <span>{property.bathrooms}</span>
            </div>
            <div className="flex items-center">
              <Square className="h-4 w-4 mr-1" />
              <span>{property.superficie || property.size}m²</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}