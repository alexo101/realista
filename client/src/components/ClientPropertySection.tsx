import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/language-context";
import { PropertyFormMultiStep } from "@/components/PropertyFormMultiStep";
import { PropertyForm } from "@/components/PropertyForm";
import type { Property } from "@shared/schema";

export function ClientPropertySection() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { data: property, isLoading } = useQuery<Property | null>({
    queryKey: ["/api/client/property"],
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/client/property"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const listing = property ?? null;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("clientProfile.property.title")}</h1>
        <p className="text-gray-600">
          {listing ? t("clientProfile.property.edit_subtitle") : t("clientProfile.property.empty")}
        </p>
      </div>

      {!listing || listing.isDraft ? (
        <PropertyFormMultiStep
          ownerMode
          isEditing={!!listing}
          initialData={listing ?? undefined}
          onClose={refresh}
        />
      ) : (
        <PropertyForm
          ownerMode
          isEditing
          onClose={() => undefined}
          onSubmit={async (data) => {
            const { managementStatus: _managementStatus, ...listingFields } = data;
            await apiRequest("PATCH", "/api/client/property", {
              ...listingFields,
              isDraft: false,
            });
            refresh();
          }}
          initialData={{
            isActive: listing.isActive,
            title: listing.title,
            description: listing.description,
            price: listing.price,
            address: listing.address,
            locality: listing.locality || "",
            streetName: listing.streetName || "",
            streetNumber: listing.streetNumber || "",
            latitude: listing.latitude,
            longitude: listing.longitude,
            escalera: (listing.escalera || undefined) as "A" | "B" | "C" | undefined,
            planta: (listing.planta || undefined) as "1" | undefined,
            puerta: (listing.puerta || undefined) as "1" | undefined,
            superficie: listing.superficie,
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            imageUrls: listing.imageUrls || [],
            type: listing.type as "Vivienda",
            housingType: (listing.housingType || undefined) as "Pisos" | undefined,
            housingStatus: (listing.housingStatus || undefined) as "Disponible sin limitación" | undefined,
            propertyCondition: (listing.propertyCondition || undefined) as "Buen estado" | undefined,
            floor: (listing.floor || undefined) as "Última planta" | undefined,
            neighborhood: listing.neighborhood,
            city: listing.city || null,
            district: listing.district || null,
            reference: listing.reference || "",
            operationType: listing.operationType as "Venta" | "Alquiler",
            features: listing.features || [],
            availability: (listing.availability || "Inmediatamente") as "Inmediatamente" | "A partir de",
            availabilityDate: listing.availabilityDate ? new Date(listing.availabilityDate) : undefined,
            mainImageIndex: listing.mainImageIndex || 0,
            hideAddress: listing.hideAddress ?? true,
            hasCedulaHabitabilidad: listing.hasCedulaHabitabilidad,
          }}
        />
      )}
    </div>
  );
}
