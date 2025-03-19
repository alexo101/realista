import { Card, CardContent } from "@/components/ui/card";
import { type Property } from "@shared/schema";
import { Link } from "wouter";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Card className="overflow-hidden">
      <Link href={`/property/${property.id}`}>
        <a className="block">
          <div className="aspect-video relative overflow-hidden">
            <img
              src={property.images[0]}
              alt={property.title}
              className="object-cover w-full h-full hover:scale-105 transition-transform"
            />
          </div>

          <CardContent className="p-4">
            <h3 className="text-lg font-semibold line-clamp-1">{property.title}</h3>
            <p className="text-2xl font-bold text-primary mt-2">
              €{property.price.toLocaleString()}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>{property.bedrooms} beds</span>
              <span>{property.bathrooms} baths</span>
              <span>{property.squareMeters}m²</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{property.location}</p>
          </CardContent>
        </a>
      </Link>
    </Card>
  );
}