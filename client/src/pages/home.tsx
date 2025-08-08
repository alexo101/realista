import { useQuery } from "@tanstack/react-query";
import { PropertyCard } from "@/components/PropertyCard";
import { type Property } from "@shared/schema";
import { SearchBar } from "@/components/SearchBar";
import { NeighborhoodRating } from "@/components/NeighborhoodRating";
import { MessageCarousel } from "@/components/MessageCarousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  // Consulta para propiedades más vistas en venta
  const { data: mostViewedSaleProperties, isLoading: isLoadingSales } = useQuery<Property[]>({
    queryKey: ["/api/properties?mostViewed=true&operationType=Venta"],
    staleTime: 300000, // 5 minutes cache
    gcTime: 600000, // 10 minutes in cache
    refetchOnWindowFocus: false,
  });

  // Consulta para propiedades más vistas en alquiler
  const { data: mostViewedRentProperties, isLoading: isLoadingRental } = useQuery<Property[]>({
    queryKey: ["/api/properties?mostViewed=true&operationType=Alquiler"],
    staleTime: 300000, // 5 minutes cache
    gcTime: 600000, // 10 minutes in cache
    refetchOnWindowFocus: false,
  });

  const isLoading = isLoadingSales || isLoadingRental;

  return (
    <div className="min-h-screen pt-16">
      <section className="bg-primary/5 py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-4xl font-bold text-center mb-4">
            Encuentra tu hogar ideal en Barcelona
          </h1>
          <div className="mb-6 md:mb-8">
            <MessageCarousel />
          </div>
          <SearchBar />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <NeighborhoodRating />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">Las más vistas</h2>
        
        <Tabs defaultValue="venta" className="mt-4">
          <TabsList className="mb-4">
            <TabsTrigger value="venta">En Venta</TabsTrigger>
            <TabsTrigger value="alquiler">En Alquiler</TabsTrigger>
          </TabsList>
          
          <TabsContent value="venta">
            {isLoadingSales ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-[400px] bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mostViewedSaleProperties && mostViewedSaleProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="alquiler">
            {isLoadingRental ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-[400px] bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mostViewedRentProperties && mostViewedRentProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}