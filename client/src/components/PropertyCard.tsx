import { Card, CardContent } from "@/components/ui/card";
import { type Property } from "@shared/schema";
import { Link } from "wouter";
import { Building2 } from "lucide-react";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Card className="overflow-hidden">
      <Link href={`/property/${property.id}`}>
        <a className="block">
          <div className="aspect-video relative overflow-hidden">
            {property.images?.[0] ? (
              <img
                src={property.images[0]}
                alt={property.title || property.address}
                className="object-cover w-full h-full hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <Building2 className="h-12 w-12 text-gray-400" />
              </div>
            )}
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
            <p className="mt-2 text-sm text-gray-600">{property.address}</p>
          </CardContent>
        </a>
      </Link>
    </Card>
  );
}