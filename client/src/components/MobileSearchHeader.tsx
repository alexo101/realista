import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileSearchHeaderProps {
  locationName: string;
  propertyCount: number;
  className?: string;
}

export function MobileSearchHeader({
  locationName,
  propertyCount,
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
    </div>
  );
}
