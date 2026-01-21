import { Search, Bookmark, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileSearchHeaderProps {
  locationName: string;
  propertyCount: number;
  onSaveSearch: () => void;
  isSaved: boolean;
  isSaveConfirming: boolean;
  isSavePending: boolean;
  className?: string;
}

export function MobileSearchHeader({
  locationName,
  propertyCount,
  onSaveSearch,
  isSaved,
  isSaveConfirming,
  isSavePending,
  className
}: MobileSearchHeaderProps) {
  return (
    <div className={cn("flex items-center gap-2 px-4 py-3", className)}>
      <div 
        className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2.5"
        data-testid="mobile-search-bar"
      >
        <Search className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <span className="text-sm text-gray-800 truncate flex-1" data-testid="text-search-location">
          {locationName}
        </span>
        <span 
          className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
          data-testid="text-property-count"
        >
          {propertyCount}
        </span>
      </div>
      
      <Button
        onClick={onSaveSearch}
        disabled={isSavePending || isSaved}
        variant="outline"
        size="sm"
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 whitespace-nowrap",
          isSaveConfirming && "bg-[#0284c5] text-white border-[#0284c5]",
          isSaved && "bg-green-50 text-green-700 border-green-200"
        )}
        data-testid="button-mobile-save-search"
      >
        {isSaved ? (
          <>
            <Check className="h-4 w-4" />
            <span className="sr-only md:not-sr-only">Guardada</span>
          </>
        ) : (
          <>
            <Bookmark className="h-4 w-4" />
            <span>Guardar</span>
          </>
        )}
      </Button>
    </div>
  );
}
