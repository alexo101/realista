import { UserCircle, MapPin, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

// Actualizamos la interfaz para que coincida con la respuesta real del servidor
interface Agent {
  id: number;
  name: string | null;
  surname: string | null;
  email: string;
  description: string | null;
  avatar?: string | null;
  influenceNeighborhoods: string[] | null;
  isAgent: boolean;
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
          <div key={i} className="bg-gray-100 animate-pulse h-[240px] rounded-lg" />
        ))}
      </div>
    );
  }

  // Removed empty state

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((agent) => (
        <div key={agent.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-primary/20">
              {agent.avatar ? (
                <img
                  src={agent.avatar || ''}
                  alt={`${agent.name || ''} ${agent.surname || ''}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <UserCircle className="w-12 h-12 text-primary" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold">
                {agent.name || ''} {agent.surname || ''}
              </h3>
              <p className="text-gray-600">{agent.email}</p>
              {agent.influenceNeighborhoods && agent.influenceNeighborhoods.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">Barrios de influencia:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {agent.influenceNeighborhoods.slice(0, 2).map((neighborhood) => (
                      <span key={neighborhood} className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {neighborhood}
                      </span>
                    ))}
                    {agent.influenceNeighborhoods.length > 2 && (
                      <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">
                        +{agent.influenceNeighborhoods.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {agent.description && (
            <p className="mt-3 text-gray-700 text-sm line-clamp-3">{agent.description}</p>
          )}
          
          <div className="mt-auto pt-4">
            <Link href={`/agent/${agent.id}`}>
              <Button 
                variant="outline" 
                className="w-full"
              >
                Ver perfil <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
