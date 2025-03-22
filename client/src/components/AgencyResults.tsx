import { Building, Search } from "lucide-react";

interface Agency {
  id: number;
  name: string;
  location: string;
  avatar?: string;
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

  if (results.length === 0) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((agency) => (
        <div key={agency.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              {agency.avatar ? (
                <img
                  src={agency.avatar}
                  alt={agency.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Building className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{agency.name}</h3>
              <p className="text-gray-600">{agency.location}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
