import { UserCircle } from "lucide-react";

interface Agent {
  id: number;
  name: string;
  agency: string;
  location: string;
  avatar?: string;
}

interface AgentResultsProps {
  results: Agent[];
  isLoading: boolean;
}

export function AgentResults({ results, isLoading }: AgentResultsProps) {
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
        <UserCircle className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No se encontraron agentes</h3>
        <p className="text-gray-600 max-w-md">
          Prueba a buscar con otro nombre o selecciona un barrio diferente para encontrar agentes inmobiliarios.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((agent) => (
        <div key={agent.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              {agent.avatar ? (
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <UserCircle className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{agent.name}</h3>
              <p className="text-gray-600">{agent.agency}</p>
              <p className="text-sm text-gray-500">{agent.location}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
