import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { BARCELONA_DISTRICTS_AND_NEIGHBORHOODS, BARCELONA_NEIGHBORHOODS } from "@/utils/neighborhoods";

interface NeighborhoodSelectorProps {
  selectedNeighborhoods: string[];
  onChange: (neighborhoods: string[]) => void;
  title?: string;
  buttonText?: string;
}

export function NeighborhoodSelector({
  selectedNeighborhoods,
  onChange,
  title = "BARRIOS DE BARCELONA",
  buttonText = "Selecciona barrios"
}: NeighborhoodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredNeighborhoods = BARCELONA_NEIGHBORHOODS.filter(n =>
    n.toLowerCase().includes(search.toLowerCase())
  );

  const toggleNeighborhood = (neighborhood: string) => {
    onChange(
      selectedNeighborhoods.includes(neighborhood)
        ? selectedNeighborhoods.filter(n => n !== neighborhood)
        : [...selectedNeighborhoods, neighborhood]
    );
  };

  const selectAll = () => {
    onChange([...BARCELONA_NEIGHBORHOODS]);
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start h-auto py-2 px-3"
        onClick={() => setIsOpen(true)}
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <div className="space-y-4">
            <Input
              placeholder="Buscar barrio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {selectedNeighborhoods.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">SELECCIONADOS</p>
                <div className="flex flex-wrap gap-2">
                  {selectedNeighborhoods.map(neighborhood => (
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
              {filteredNeighborhoods.map(neighborhood => (
                <Button
                  key={neighborhood}
                  variant="ghost"
                  className={`w-full justify-start ${
                    selectedNeighborhoods.includes(neighborhood)
                      ? "bg-primary/10"
                      : ""
                  }`}
                  onClick={() => toggleNeighborhood(neighborhood)}
                >
                  {neighborhood}
                </Button>
              ))}
            </div>

            <div className="flex justify-between">
              <div>
                <Button
                  variant="outline"
                  onClick={() => onChange([])}
                  className="mr-2"
                >
                  Limpiar
                </Button>
                <Button
                  variant="outline"
                  onClick={selectAll}
                >
                  Seleccionar todos
                </Button>
              </div>
              <Button onClick={() => setIsOpen(false)}>
                Hecho
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}