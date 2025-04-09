import { Building, Search, MapPin } from "lucide-react";

// Adaptamos el tipo para que coincida con los datos que recibimos de la API
interface Agency {
  id: number;
  agencyName: string;
  agencyAddress?: string;
  agencyLogo?: string;
  agencyInfluenceNeighborhoods?: string[];
}

interface AgencyResultsProps {
  results: Agency[];
  isLoading: boolean;
}

export function AgencyResults({ results, isLoading }: AgencyResultsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="bg-gray-100 animate-pulse h-[200px] rounded-lg" />
        ))}
      </div>
    );
  }

  // Verificamos si hay resultados y mostramos mensaje adecuado
  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <Building className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No se encontraron agencias</h3>
        <p className="text-gray-600 max-w-md">
          Prueba a buscar con otro nombre o selecciona un barrio diferente para encontrar agencias inmobiliarias.
        </p>
      </div>
    );
  }

  // Mostramos los datos de las agencias
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((agency) => (
        <div key={agency.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
              {agency.agencyLogo ? (
                <img
                  src={agency.agencyLogo}
                  alt={agency.agencyName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <Building className="w-10 h-10 text-primary" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold">{agency.agencyName}</h3>
              <p className="text-gray-600">{agency.agencyAddress || 'Sin dirección'}</p>
              
              {agency.agencyInfluenceNeighborhoods && agency.agencyInfluenceNeighborhoods.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">Barrios de influencia:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {agency.agencyInfluenceNeighborhoods.map((neighborhood) => (
                      <span key={neighborhood} className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {neighborhood}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
