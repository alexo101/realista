import { Building2 } from "lucide-react";

interface PropertyResult {
  id: number;
  address: string;
  type: string;
  operationType: string;
  price: number;
  previousPrice?: number | null;
  neighborhood: string;
  title?: string;
  images?: string[] | null;
  mainImageIndex?: number | null;
  superficie?: number | null;
  createdAt?: string;
  // Campos nuevos
  housingType?: string | null;
  housingStatus?: string | null;
  floor?: string | null;
  features?: string[] | null;
  availability?: string | null;
  availabilityDate?: string | null;
}

interface PropertyResultsProps {
  results: PropertyResult[];
  isLoading: boolean;
}

export function PropertyResults({ results, isLoading }: PropertyResultsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="bg-gray-100 animate-pulse h-[300px] rounded-lg" />
        ))}
      </div>
    );
  }

  // Removed empty state

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((property) => (
        <div 
          key={property.id} 
          className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
          onClick={() => window.location.href = `/property/${property.id}`}
        >
          <div className="aspect-video bg-gray-200 relative overflow-hidden">
            {property.images && property.images.length > 0 ? (
              <img
                src={property.images[property.mainImageIndex || 0] || property.images[0]}
                alt={property.title || property.address}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Building2 className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <div className="absolute top-2 right-2 bg-primary text-white text-xs font-medium px-2 py-1 rounded-md">
              {property.operationType === 'Alquiler' || property.operationType === 'alquiler' ? 'Alquiler' : 'Venta'}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg line-clamp-1">{property.title || property.address}</h3>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-2xl font-bold text-primary">€{property.price.toLocaleString()}</p>
              {property.previousPrice && property.previousPrice > property.price && (
                <span className="text-sm font-medium text-red-600">
                  {Math.round(((property.previousPrice - property.price) / property.previousPrice) * 100)}% ↓
                </span>
              )}
            </div>
            {property.superficie && (
              <p className="text-sm font-medium text-gray-800">
                {Math.round(property.price / property.superficie)}€/m²
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>{property.type}</span>
              {property.housingType && <span>{property.housingType}</span>}
              <span>{property.neighborhood}</span>
            </div>
            <p className="mt-2 text-sm text-gray-600 line-clamp-1">{property.address}</p>
            
            {/* Mostrar características si existen */}
            {property.features && property.features.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {property.features.slice(0, 3).map(feature => (
                  <span key={feature} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                    {feature}
                  </span>
                ))}
                {property.features.length > 3 && (
                  <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                    +{property.features.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}