import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface MobileFiltersState {
  operationType: "Venta" | "Alquiler";
  propertyType: string;
  priceMin: number | null;
  priceMax: number | null;
  bedrooms: number[];
  bathrooms: number[];
  features: string[];
}

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function MobileFilterSheet({
  isOpen,
  onClose,
  children
}: MobileFilterSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0">
        <SheetHeader className="sticky top-0 bg-white border-b px-4 py-3 z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Filtros</SheetTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              data-testid="button-close-filters"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(90vh-60px)] p-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
