import { useQuery } from "@tanstack/react-query";
import { PropertyCard } from "./PropertyCard";
import { Home } from "lucide-react";

interface Property {
  id: number;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  superficie: number;
  images: string[];
  type: string;
  operationType: string;
  neighborhood: string;
  description: string;
  isActive: boolean;
  agentId: number;
  agencyId?: number;
  previousPrice?: number;
  createdAt: Date;
}

interface AgentFavoritePropertiesProps {
  agentId?: number;
}

export function AgentFavoriteProperties({ agentId }: AgentFavoritePropertiesProps) {
  const { data: favoriteProperties, isLoading } = useQuery<Property[]>({
    queryKey: [`/api/agents/${agentId}/favorites/properties`],
    enabled: !!agentId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-64"></div>
        ))}
      </div>
    );
  }

  if (!favoriteProperties || favoriteProperties.length === 0) {
    return (
      <div className="text-center py-12">
        <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Sin propiedades favoritas</h3>
        <p className="text-gray-500">
          Este agente no ha marcado ninguna propiedad como favorita.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {favoriteProperties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}