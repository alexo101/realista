import { Building, MapPin, ExternalLink, Star } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

// Adaptamos el tipo para que coincida con los datos que recibimos de la API
interface Agency {
  id: number;
  agencyName: string;
  agencyAddress?: string;
  agencyLogo?: string;
  agencyInfluenceNeighborhoods?: string[] | any;
  agencyNeighborhoods?: string[] | any; // Alternative field name used in some API responses
  agencyDescription?: string;
  description?: string; // Alternative description field
  reviewCount?: number;
  reviewAverage?: number;
}

interface AgencyResultsProps {
  results: Agency[];
  isLoading: boolean;
}

export function AgencyResults({ results, isLoading }: AgencyResultsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 animate-pulse h-[240px] rounded-lg"
            />
          ))}
      </div>
    );
  }

  // Display empty state if no results or if results array is empty
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg">
        <Building className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">
          No hay agencias disponibles
        </h3>
        <p className="mt-1 text-gray-500">
          No se encontraron agencias que coincidan con tu búsqueda
        </p>
      </div>
    );
  }

  // Mostramos solo los datos de las agencias reales (no mostrar placeholders)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((agency) => (
        <div
          key={agency.id}
          className="bg-white rounded-lg shadow-md p-6 flex flex-col"
        >
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
            <div className="flex-1">
              <h3 className="font-semibold">{agency.agencyName}</h3>
              <p className="text-gray-600 text-sm">
                {agency.agencyAddress || "Sin dirección"}
              </p>

              {/* Reviews Section */}
              {(agency.reviewCount !== undefined && agency.reviewAverage !== undefined) && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">
                      {agency.reviewAverage > 0 ? agency.reviewAverage.toFixed(1) : "Sin valoración"}
                    </span>
                  </div>
                  {agency.reviewCount > 0 && (
                    <span className="text-sm text-gray-500">
                      ({agency.reviewCount} {agency.reviewCount === 1 ? "reseña" : "reseñas"})
                    </span>
                  )}
                </div>
              )}

              {/* Get neighborhoods from any available field with enhanced handling */}
              {(() => {
                // Normalize neighborhood data with robust handling
                let neighborhoods = [];

                // Try to get neighborhoods from any available field
                const rawNeighborhoods = agency.agencyInfluenceNeighborhoods;

                if (rawNeighborhoods) {
                  // Convert to array if it's a string (handles both JSON string and regular string)
                  if (typeof rawNeighborhoods === "string") {
                    try {
                      // Try to parse as JSON first
                      neighborhoods = JSON.parse(rawNeighborhoods);
                    } catch {
                      // If not valid JSON, handle PostgreSQL array format or comma-separated
                      if (
                        rawNeighborhoods.startsWith("{") &&
                        rawNeighborhoods.endsWith("}")
                      ) {
                        // PostgreSQL array format
                        const cleaned = rawNeighborhoods.slice(1, -1);
                        neighborhoods = cleaned
                          .split(/","|,/)
                          .map((n) => n.replace(/^"|"$/g, "").trim())
                          .filter(Boolean);
                      } else {
                        // Regular string - treat as a single neighborhood or comma-separated list
                        neighborhoods = rawNeighborhoods
                          .split(",")
                          .map((n) => n.trim())
                          .filter(Boolean);
                      }
                    }
                  } else if (Array.isArray(rawNeighborhoods)) {
                    neighborhoods = rawNeighborhoods;
                  }
                }

                // Filter out any non-string values
                neighborhoods = neighborhoods.filter(
                  (n) => typeof n === "string",
                );

                return neighborhoods.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">
                      Barrios de influencia:
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {neighborhoods.slice(0, 4).map((neighborhood) => (
                        <span
                          key={neighborhood}
                          className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5 flex items-center"
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          {neighborhood}
                        </span>
                      ))}
                      {neighborhoods.length > 4 && (
                        <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">
                          +{neighborhoods.length - 4}
                        </span>
                      )}
                    </div>
                    {neighborhoods.length > 4 && (
                      <p className="text-xs text-gray-400 mt-1">
                        Haz clic en "Ver agencia" para ver todos los barrios
                      </p>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
          </div>

          {(agency.agencyDescription || agency.description) && (
            <p className="mt-3 text-gray-700 text-sm line-clamp-3">
              {agency.agencyDescription || agency.description}
            </p>
          )}

          <div className="mt-auto pt-4">
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/agencias/${agency.id}`}>
                Ver agencia <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
