import { Building2 } from "lucide-react";
import { Link } from "wouter";

interface PropertyResult {
  id: number;
  address: string;
  type: string;
  price: number;
  image?: string;
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

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <Building2 className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No se encontraron propiedades</h3>
        <p className="text-gray-600 max-w-md">
          Prueba a cambiar los filtros de búsqueda o seleccionar otros barrios para ver más resultados.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((property) => (
        <Link href={`/property/${property.id}`} key={property.id}>
          <div className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gray-200 relative">
              {property.image ? (
                <img
                  src={property.image}
                  alt={property.address}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-12 h-12 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-2">{property.address}</h3>
              <p className="text-gray-600">{property.type}</p>
              <p className="text-primary font-semibold mt-2">{property.price.toLocaleString()}€</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
