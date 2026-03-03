import { useQuery } from "@tanstack/react-query";
import { PropertyCard } from "@/components/PropertyCard";
import { type Property } from "@shared/schema";
import { SearchBar } from "@/components/SearchBar";
import { NeighborhoodRating } from "@/components/NeighborhoodRating";
import { MessageCarousel } from "@/components/MessageCarousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/language-context";

export default function Home() {
  const { t } = useLanguage();
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
    <div className="min-h-screen flex flex-col pt-16">
      <section className="bg-primary/5 py-8 md:py-16 flex flex-col justify-start md:justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <h1 className="text-2xl md:text-4xl font-bold text-center mb-4">
            {t("home.hero_title")}
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
        <h2 className="text-xl md:text-2xl font-semibold mb-6">{t("home.most_viewed")}</h2>
        
        <Tabs defaultValue="venta" className="mt-4">
          <TabsList className="mb-4">
            <TabsTrigger value="venta">{t("home.tab_sale")}</TabsTrigger>
            <TabsTrigger value="alquiler">{t("home.tab_rent")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="venta" className="min-h-[400px]">
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
                {mostViewedSaleProperties && mostViewedSaleProperties.length > 0 ? (
                  mostViewedSaleProperties.map((property) => (
                    <PropertyCard
                      key={property.uuid}
                      property={{
                        ...property,
                        mainImageIndex: property.mainImageIndex ?? 0
                      }}
                    />
                  ))
                ) : (
                  <div className="py-8 text-left">
                    <p className="text-gray-500 text-lg">
                      {t("home.no_sale_title")}
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      {t("home.no_results_subtitle")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="alquiler" className="min-h-[400px]">
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
                {mostViewedRentProperties && mostViewedRentProperties.length > 0 ? (
                  mostViewedRentProperties.map((property) => (
                    <PropertyCard
                      key={property.uuid}
                      property={{
                        ...property,
                        mainImageIndex: property.mainImageIndex ?? 0
                      }}
                    />
                  ))
                ) : (
                  <div className="py-8 text-left">
                    <p className="text-gray-500 text-lg">
                      {t("home.no_rent_title")}
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      {t("home.no_results_subtitle")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
      
      {/* Footer - Import and use Footer component */}
      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  );
}