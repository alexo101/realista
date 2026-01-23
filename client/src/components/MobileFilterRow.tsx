import { SlidersHorizontal, ChevronDown, ArrowUpDown, HomeIcon, Building2, UserCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type TabType = 'properties' | 'agencies' | 'agents' | 'overview';
type PropertySortOption = 'newest' | 'price-asc' | 'price-m2' | 'price-drop';
type EntitySortOption = 'best_rating' | 'most_reviews';

interface MobileFilterRowProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  // Property sorting
  propertySortBy: PropertySortOption;
  onPropertySortChange: (sort: PropertySortOption) => void;
  // Agency/Agent sorting
  entitySortBy: EntitySortOption;
  onEntitySortChange: (sort: EntitySortOption) => void;
  onOpenFilters: () => void;
  className?: string;
}

const TAB_OPTIONS: { value: TabType; label: string; icon: typeof HomeIcon }[] = [
  { value: 'properties', label: 'Propiedades', icon: HomeIcon },
  { value: 'agencies', label: 'Agencias', icon: Building2 },
  { value: 'agents', label: 'Agentes', icon: UserCircle },
  { value: 'overview', label: 'Descripción', icon: Info },
];

const PROPERTY_SORT_OPTIONS: { value: PropertySortOption; label: string }[] = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-m2', label: 'Precio por m²' },
  { value: 'price-drop', label: 'Mayor rebaja' },
];

const ENTITY_SORT_OPTIONS: { value: EntitySortOption; label: string }[] = [
  { value: 'best_rating', label: 'Mejor puntuación' },
  { value: 'most_reviews', label: 'Más reseñas' },
];

export function MobileFilterRow({
  activeTab,
  onTabChange,
  propertySortBy,
  onPropertySortChange,
  entitySortBy,
  onEntitySortChange,
  onOpenFilters,
  className
}: MobileFilterRowProps) {
  const activeTabOption = TAB_OPTIONS.find(t => t.value === activeTab) || TAB_OPTIONS[0];
  const ActiveTabIcon = activeTabOption.icon;

  // Determine which sort options and value to use based on activeTab
  const isPropertyTab = activeTab === 'properties';
  const isEntityTab = activeTab === 'agencies' || activeTab === 'agents';
  const showSortDropdown = activeTab !== 'overview';

  const getCurrentSortLabel = () => {
    if (isPropertyTab) {
      const option = PROPERTY_SORT_OPTIONS.find(s => s.value === propertySortBy);
      return option?.label || 'Más recientes';
    }
    if (isEntityTab) {
      const option = ENTITY_SORT_OPTIONS.find(s => s.value === entitySortBy);
      return option?.label || 'Mejor puntuación';
    }
    return '';
  };

  return (
    <div className={cn("flex items-center gap-2 px-4 py-2 overflow-x-auto", className)}>
      {/* Filter button - only show for properties tab */}
      {activeTab === 'properties' && (
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenFilters}
          className="flex items-center gap-1.5 rounded-full px-3 flex-shrink-0"
          data-testid="button-mobile-filter"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filtrar</span>
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1.5 rounded-full px-3 bg-[#0284c5] text-white hover:bg-[#0273b0] flex-shrink-0"
            data-testid="button-mobile-tab-selector"
          >
            <ActiveTabIcon className="h-4 w-4" />
            <span>{activeTabOption.label}</span>
            <ChevronDown className="h-3 w-3 ml-0.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          {TAB_OPTIONS.filter(t => t.value !== activeTab).map((tab) => {
            const TabIcon = tab.icon;
            return (
              <DropdownMenuItem
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                className="flex items-center gap-2 cursor-pointer"
                data-testid={`menu-tab-${tab.value}`}
              >
                <TabIcon className="h-4 w-4" />
                <span>{tab.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort dropdown - different options based on tab */}
      {showSortDropdown && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 rounded-full px-3 flex-shrink-0"
              data-testid="button-mobile-sort"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span>{getCurrentSortLabel()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {isPropertyTab && PROPERTY_SORT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onPropertySortChange(option.value)}
                className={cn(
                  "cursor-pointer",
                  propertySortBy === option.value && "bg-gray-100 font-medium"
                )}
                data-testid={`menu-sort-${option.value}`}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
            {isEntityTab && ENTITY_SORT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onEntitySortChange(option.value)}
                className={cn(
                  "cursor-pointer",
                  entitySortBy === option.value && "bg-gray-100 font-medium"
                )}
                data-testid={`menu-sort-${option.value}`}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
