import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type Property } from "@shared/schema";
import { ImageGallery } from "@/components/ImageGallery";
import { ContactForm } from "@/components/ContactForm";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, MapPin, Phone, Mail } from "lucide-react";

// Extended Property type with additional fields for features
interface ExtendedProperty extends Omit<Property, 'bedrooms' | 'bathrooms'> {
  bedrooms: number | null;
  bathrooms: number | null;
  features?: string[];
}

// Agent interface
interface Agent {
  id: number;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
}

export default function PropertyPage() {
  const { id } = useParams<{ id: string }>();
  const propertyId = parseInt(id);

  const { data: property, isLoading: propertyLoading } = useQuery<ExtendedProperty>({
    queryKey: [`/api/properties/${propertyId}`],
  });

  const { data: agent, isLoading: agentLoading } = useQuery<Agent>({
    queryKey: [`/api/agents/${property?.agentId}`],
    enabled: !!property?.agentId,
  });

  if (propertyLoading) {
    return (
      <div className="min-h-screen pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-8 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-32 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900">Property not found</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ImageGallery 
          images={property.images || []} 
          mainImageIndex={property.mainImageIndex !== null ? property.mainImageIndex : 0} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
              <p className="text-xl font-semibold text-primary mt-2">
                €{property.price.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{property.address} - {property.neighborhood}</span>
              </div>
            </div>

            <div className="flex gap-6">
              {property.bedrooms && (
                <div className="flex items-center gap-2">
                  <Bed className="h-5 w-5 text-gray-600" />
                  <span>{property.bedrooms} {property.bedrooms === 1 ? 'Habitación' : 'Habitaciones'}</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-2">
                  <Bath className="h-5 w-5 text-gray-600" />
                  <span>{property.bathrooms} {property.bathrooms === 1 ? 'Baño' : 'Baños'}</span>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-600 whitespace-pre-line">{property.description}</p>
            </div>

            {property.features && property.features.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Features</h2>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((feature, index) => (
                    <Badge key={index} variant="secondary">{feature}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {agent && !agentLoading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      <img
                        src={agent.photo}
                        alt={agent.name}
                        className="rounded-full object-cover w-full h-full"
                      />
                    </div>
                    <h3 className="font-semibold text-lg">{agent.name}</h3>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{agent.phone}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{agent.email}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">Interested in this property?</h3>
                <ContactForm propertyId={property.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
