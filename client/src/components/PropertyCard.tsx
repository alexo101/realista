import { Card, CardContent } from "@/components/ui/card";
import { type Property } from "@shared/schema";
import { Building2, Eye } from "lucide-react";
import { ReviewButtons } from "./ReviewButtons";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Card className="overflow-hidden group h-full flex flex-col">
      <div className="cursor-pointer" onClick={() => window.location.href = `/property/${property.id}`}>
        <div className="aspect-video relative overflow-hidden">
          {property.images?.length ? (
            <img
              src={property.images[property.mainImageIndex || 0] || property.images[0]}
              alt={property.title || property.address}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Building2 className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <div className="absolute top-2 right-2 bg-primary text-white text-xs font-medium px-2 py-1 rounded-md">
            {property.operationType === 'Alquiler' ? 'Alquiler' : 'Venta'}
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="text-lg font-semibold line-clamp-1">{property.title || property.address}</h3>
          <p className="text-2xl font-bold text-primary mt-2">
            €{property.price.toLocaleString()}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span>{property.type}</span>
            <span>{property.neighborhood}</span>
          </div>
          <p className="mt-2 text-sm text-gray-600 line-clamp-1">{property.address}</p>
          {property.viewCount !== undefined && property.viewCount > 0 && (
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <Eye className="h-3 w-3 mr-1" />
              <span>{property.viewCount} {property.viewCount === 1 ? 'vista' : 'vistas'}</span>
            </div>
          )}
        </CardContent>
      </div>
      <CardContent className="border-t pt-4 mt-auto">
        <ReviewButtons />
      </CardContent>
    </Card>
  );
}