import { Building2, UserX, Search } from "lucide-react";

interface ResultsProps {
  type: 'properties' | 'agencies' | 'agents';
  results: any[] | null;
  isLoading: boolean;
}

export function SearchResults({ type, results, isLoading }: ResultsProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  // Ensure results is an array before checking length
  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <UserX className="h-16 w-16 text-gray-400 mb-4" />
        {type === 'properties' && (
          <>
            <h3 className="text-lg font-semibold mb-2">No se encontraron propiedades</h3>
            <p className="text-gray-600 max-w-md">
              Prueba a cambiar los filtros de búsqueda o seleccionar otros barrios para ver más resultados.
            </p>
          </>
        )}
        {type === 'agencies' && (
          <>
            <h3 className="text-lg font-semibold mb-2">No se encontraron agencias</h3>
            <p className="text-gray-600 max-w-md">
              Intenta buscar con otro nombre o selecciona un barrio diferente.
            </p>
          </>
        )}
        {type === 'agents' && (
          <>
            <h3 className="text-lg font-semibold mb-2">No se encontraron agentes</h3>
            <p className="text-gray-600 max-w-md">
              Intenta buscar con otro nombre o selecciona un barrio diferente.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((result) => (
        <div key={result.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Content will vary based on type */}
          {type === 'properties' && (
            <>
              <div className="aspect-video bg-gray-200 relative">
                {result.image ? (
                  <img
                    src={result.image}
                    alt={result.address}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-12 h-12 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-2">{result.address}</h3>
                <p className="text-gray-600">{result.type}</p>
                <p className="text-primary font-semibold mt-2">{result.price}€</p>
              </div>
            </>
          )}
          {(type === 'agencies' || type === 'agents') && (
            <div className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  {result.avatar ? (
                    <img
                      src={result.avatar}
                      alt={result.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <UserX className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{result.name}</h3>
                  <p className="text-gray-600">{result.location}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
