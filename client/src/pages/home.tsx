import { useQuery } from "@tanstack/react-query";
import { PropertyCard } from "@/components/PropertyCard";
import { type Property } from "@shared/schema";
import { SearchBar } from "@/components/SearchBar";
import { NeighborhoodRating } from "@/components/NeighborhoodRating";

export default function Home() {
  // Consulta para obtener las propiedades más vistas
  const { data: mostViewedProperties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties", { mostViewed: true }],
    queryFn: async () => {
      const response = await fetch("/api/properties?mostViewed=true");
      if (!response.ok) {
        throw new Error("Error al cargar las propiedades más vistas");
      }
      return response.json();
    }
  });

  return (
    <div className="min-h-screen pt-16">
      <section className="bg-primary/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-center mb-4">
            Encuentra tu hogar ideal en Barcelona
          </h1>
          <p className="text-lg text-center text-gray-600 mb-8">
            Miles de propiedades te están esperando
          </p>
          <SearchBar />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <NeighborhoodRating />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-semibold mb-6">Las más vistas</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-[400px] bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mostViewedProperties && mostViewedProperties.length > 0 ? (
              mostViewedProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-500">
                Todavía no hay propiedades visitadas. ¡Explora nuestro catálogo!
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}