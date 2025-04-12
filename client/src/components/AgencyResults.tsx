import { Building, MapPin, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

// Adaptamos el tipo para que coincida con los datos que recibimos de la API
interface Agency {
  id: number;
  agencyName: string;
  agencyAddress?: string;
  agencyLogo?: string;
  agencyInfluenceNeighborhoods?: string[];
  agencyDescription?: string;
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
          <div key={i} className="bg-gray-100 animate-pulse h-[240px] rounded-lg" />
        ))}
      </div>
    );
  }

  // Removed empty state

  // Mostramos los datos de las agencias
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((agency) => (
        <div key={agency.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-primary/20">
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
                    {agency.agencyInfluenceNeighborhoods.slice(0, 2).map((neighborhood) => (
                      <span key={neighborhood} className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {neighborhood}
                      </span>
                    ))}
                    {agency.agencyInfluenceNeighborhoods.length > 2 && (
                      <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">
                        +{agency.agencyInfluenceNeighborhoods.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {agency.agencyDescription && (
            <p className="mt-3 text-gray-700 text-sm line-clamp-3">{agency.agencyDescription}</p>
          )}
          
          <div className="mt-auto pt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = `/agencias/${agency.id}`}
            >
              Ver agencia <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
