import { Building2 } from "lucide-react";

interface PropertyResult {
  id: number;
  address: string;
  type: string;
  operationType: string;
  price: number;
  neighborhood: string;
  title?: string;
  images?: string[] | null;
  mainImageIndex?: number | null;
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
              {property.operationType === 'Alquiler' ? 'Alquiler' : 'Venta'}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg line-clamp-1">{property.title || property.address}</h3>
            <p className="text-2xl font-bold text-primary mt-2">€{property.price.toLocaleString()}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>{property.type}</span>
              <span>{property.neighborhood}</span>
            </div>
            <p className="mt-2 text-sm text-gray-600 line-clamp-1">{property.address}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
