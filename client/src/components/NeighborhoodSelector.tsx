import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { BARCELONA_DISTRICTS_AND_NEIGHBORHOODS, BARCELONA_NEIGHBORHOODS } from "@/utils/neighborhoods";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface NeighborhoodSelectorProps {
  selectedNeighborhoods: string[];
  onChange: (neighborhoods: string[]) => void;
  title?: string;
  buttonText?: string;
  singleSelection?: boolean;
}

export function NeighborhoodSelector({
  selectedNeighborhoods,
  onChange,
  title = "BARRIOS DE BARCELONA",
  buttonText = "Selecciona barrios",
  singleSelection = false
}: NeighborhoodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [localNeighborhoods, setLocalNeighborhoods] = useState<string[]>(selectedNeighborhoods);
  
  // Filtramos los barrios o distritos que coincidan con la búsqueda
  const filteredDistricts = BARCELONA_DISTRICTS_AND_NEIGHBORHOODS.filter(district => {
    // Si el distrito coincide con la búsqueda
    if (district.district.toLowerCase().includes(search.toLowerCase())) {
      return true;
    }
    // Si algún barrio del distrito coincide con la búsqueda
    return district.neighborhoods.some(n => 
      n.toLowerCase().includes(search.toLowerCase())
    );
  });

  const toggleNeighborhood = (neighborhood: string) => {
    if (singleSelection) {
      // En modo de selección única, simplemente reemplazar la selección actual
      const newNeighborhoods = localNeighborhoods.includes(neighborhood) ? [] : [neighborhood];
      setLocalNeighborhoods(newNeighborhoods);
      
      // Si está en modo de selección única, aplicar cambios inmediatamente
      onChange(newNeighborhoods);
      
      // Y cerrar el popover
      if (neighborhood && !localNeighborhoods.includes(neighborhood)) {
        setIsOpen(false);
      }
    } else {
      // En modo multi-selección, mantener el comportamiento original
      setLocalNeighborhoods(
        localNeighborhoods.includes(neighborhood)
          ? localNeighborhoods.filter(n => n !== neighborhood)
          : [...localNeighborhoods, neighborhood]
      );
    }
  };

  const selectAll = () => {
    const newNeighborhoods = [...BARCELONA_NEIGHBORHOODS];
    setLocalNeighborhoods(newNeighborhoods);
  };
  
  // Este método se llama cuando el usuario confirma su selección
  const handleConfirm = () => {
    onChange(localNeighborhoods);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start h-auto py-2 px-3"
          onClick={() => {
            // Restablecer selección local al abrir
            setLocalNeighborhoods(selectedNeighborhoods);
            setIsOpen(true);
          }}
        >
          {selectedNeighborhoods.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedNeighborhoods.map(n => (
                <span key={n} className="bg-primary/10 rounded px-2 py-1 text-sm">
                  {n}
                </span>
              ))}
            </div>
          ) : (
            buttonText
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[425px] max-h-[500px] overflow-y-auto p-4" align="start">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          
          <Input
            placeholder="Buscar barrio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {localNeighborhoods.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">{singleSelection ? "BARRIO SELECCIONADO" : "SELECCIONADOS"}</p>
              <div className="flex flex-wrap gap-2">
                {localNeighborhoods.map(neighborhood => (
                  <span
                    key={neighborhood}
                    className="bg-primary/10 rounded-full px-3 py-1 text-sm flex items-center gap-1 cursor-pointer"
                    onClick={() => toggleNeighborhood(neighborhood)}
                  >
                    {neighborhood}
                    <X className="h-3 w-3" />
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Opción para seleccionar toda Barcelona */}
          <div className="border-b pb-2 mb-3">
            <Button
              variant="ghost"
              className={`w-full justify-start font-bold ${
                localNeighborhoods.includes("Barcelona (Todos los barrios)")
                  ? "bg-primary/10"
                  : ""
              }`}
              onClick={() => toggleNeighborhood("Barcelona (Todos los barrios)")}
              type="button"
            >
              Barcelona (Todos los barrios)
            </Button>
          </div>
          
          <div className="max-h-[300px] overflow-auto">
            {filteredDistricts.map((district) => (
              <div key={district.district}>
                {/* El distrito en negrita y también seleccionable */}
                <Button
                  variant="ghost"
                  className={`w-full justify-start font-bold ${
                    localNeighborhoods.includes(district.district)
                      ? "bg-primary/10"
                      : ""
                  }`}
                  onClick={() => toggleNeighborhood(district.district)}
                  type="button"
                >
                  {district.district}
                </Button>

                {/* Los barrios de ese distrito */}
                {district.neighborhoods
                  .filter(n => n.toLowerCase().includes(search.toLowerCase()))
                  .map(neighborhood => (
                    <Button
                      key={neighborhood}
                      variant="ghost"
                      className={`w-full justify-start pl-8 ${
                        localNeighborhoods.includes(neighborhood)
                          ? "bg-primary/10"
                          : ""
                      }`}
                      onClick={() => toggleNeighborhood(neighborhood)}
                      type="button"
                    >
                      {neighborhood}
                    </Button>
                  ))}
              </div>
            ))}
          </div>

          {!singleSelection && (
            <div className="flex justify-between">
              <div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setLocalNeighborhoods([]);
                    onChange([]);
                  }}
                  className="mr-2"
                  type="button"
                >
                  Limpiar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    selectAll();
                    onChange([...BARCELONA_NEIGHBORHOODS]);
                  }}
                  type="button"
                >
                  Seleccionar todos
                </Button>
              </div>
              <Button 
                onClick={handleConfirm}
                type="button"
              >
                Hecho
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}