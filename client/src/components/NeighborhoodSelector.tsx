import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { BARCELONA_DISTRICTS_AND_NEIGHBORHOODS, BARCELONA_NEIGHBORHOODS } from "@/utils/neighborhoods";

export interface NeighborhoodSelectorRef {
  open: () => void;
  close: () => void;
}

interface NeighborhoodSelectorProps {
  selectedNeighborhoods: string[];
  onChange: (neighborhoods: string[]) => void;
  title?: string;
  buttonText?: string;
  singleSelection?: boolean;
}

export const NeighborhoodSelector = forwardRef<NeighborhoodSelectorRef, NeighborhoodSelectorProps>(({
  selectedNeighborhoods,
  onChange,
  title = "BARRIOS DE BARCELONA",
  buttonText = "Selecciona barrios",
  singleSelection = false
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [localNeighborhoods, setLocalNeighborhoods] = useState<string[]>(selectedNeighborhoods);
  
  // Exponer métodos para abrir/cerrar el diálogo desde fuera
  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false)
  }));

  // Actualizar estado local cuando cambian las props
  useEffect(() => {
    setLocalNeighborhoods(selectedNeighborhoods);
  }, [selectedNeighborhoods]);
  
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
      setLocalNeighborhoods(
        localNeighborhoods.includes(neighborhood) ? [] : [neighborhood]
      );
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
    setLocalNeighborhoods([...BARCELONA_NEIGHBORHOODS]);
  };
  
  // Este método se llama cuando el usuario confirma su selección
  const handleConfirm = () => {
    onChange(localNeighborhoods);
    setIsOpen(false);
  };

  return (
    <>
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

      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Al cerrar sin confirmar, descartar cambios
            setLocalNeighborhoods(selectedNeighborhoods);
          }
          setIsOpen(open);
        }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogDescription className="sr-only">Seleccione barrios de Barcelona</DialogDescription>
          <div className="space-y-4">
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

            <div className="max-h-[300px] overflow-auto">
              {filteredDistricts.map((district) => (
                <div key={district.district}>
                  {/* El distrito en negrita y no seleccionable */}
                  <div className="font-bold text-gray-800 py-2 px-4">
                    {district.district}
                  </div>

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

            <div className="flex justify-between">
              {!singleSelection && (
                <div>
                  <Button
                    variant="outline"
                    onClick={() => setLocalNeighborhoods([])}
                    className="mr-2"
                    type="button"
                  >
                    Limpiar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={selectAll}
                    type="button"
                  >
                    Seleccionar todos
                  </Button>
                </div>
              )}
              <Button 
                onClick={handleConfirm}
                className={singleSelection ? "ml-auto" : ""}
                type="button"
              >
                {singleSelection ? "Seleccionar" : "Hecho"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});