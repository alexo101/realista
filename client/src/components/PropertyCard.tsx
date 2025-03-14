import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Property } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface PropertyCardProps {
  property: Property;
  isFavorited?: boolean;
}

export function PropertyCard({ property, isFavorited }: PropertyCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        return apiRequest("DELETE", `/api/favorites/${property.id}`);
      } else {
        return apiRequest("POST", "/api/favorites", { propertyId: property.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: isFavorited ? "Removed from favorites" : "Added to favorites",
        duration: 2000,
      });
    },
  });

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

      <CardFooter className="p-4 pt-0">
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => toggleFavorite.mutate()}
          disabled={toggleFavorite.isPending}
        >
          <Heart
            className={`h-5 w-5 ${isFavorited ? "fill-red-500 text-red-500" : ""}`}
          />
        </Button>
      </CardFooter>
    </Card>
  );
}
