import type { ReactNode } from "react";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAgentPropertyAddress } from "@/utils/format-property-address";
import type { Property } from "@shared/schema";

type PropertyPreviewCardProps = {
  property: Property;
  imageIndex?: number;
  onImageIndexChange?: (index: number) => void;
  leading?: ReactNode;
  /** Shown on the right inside the card, only when the card is hovered/focused. */
  trailing?: ReactNode;
  selected?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  className?: string;
  "data-testid"?: string;
};

export function PropertyPreviewCard({
  property,
  imageIndex,
  onImageIndexChange,
  leading,
  trailing,
  selected = false,
  dimmed = false,
  onClick,
  className,
  "data-testid": dataTestId,
}: PropertyPreviewCardProps) {
  const propertyImages =
    property.imageUrls && property.imageUrls.length > 0 ? property.imageUrls : [];
  const hasMultipleImages = propertyImages.length > 1;
  const rawIndex = imageIndex ?? property.mainImageIndex ?? 0;
  const safeImageIndex =
    propertyImages.length > 0 ? Math.min(rawIndex, propertyImages.length - 1) : 0;

  const setImageIndex = (next: number) => {
    onImageIndexChange?.(next);
  };

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "group/card flex gap-3 p-3 border rounded-lg",
        dimmed && "opacity-60 bg-muted/30",
        selected && "ring-2 ring-primary bg-primary/5",
        onClick && "cursor-pointer",
        className,
      )}
      data-testid={dataTestId}
    >
      {leading != null && <div className="pt-1">{leading}</div>}

      <div className="relative group h-36 w-48 shrink-0 overflow-hidden rounded-md bg-gray-100">
        {propertyImages.length > 0 ? (
          <img
            src={propertyImages[safeImageIndex]}
            alt={property.title || property.address || "Propiedad"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building2 className="h-10 w-10 text-gray-400" />
          </div>
        )}

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImageIndex(
                  safeImageIndex === 0 ? propertyImages.length - 1 : safeImageIndex - 1,
                );
              }}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
              aria-label="Imagen anterior"
              data-testid={`button-prev-image-${property.uuid}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImageIndex(
                  safeImageIndex === propertyImages.length - 1 ? 0 : safeImageIndex + 1,
                );
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
              aria-label="Siguiente imagen"
              data-testid={`button-next-image-${property.uuid}`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
              {propertyImages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setImageIndex(index);
                  }}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-all",
                    index === safeImageIndex
                      ? "bg-white scale-110"
                      : "bg-white/50 hover:bg-white/75",
                  )}
                  aria-label={`Ver imagen ${index + 1}`}
                />
              ))}
            </div>
            <div className="absolute left-1.5 top-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
              {safeImageIndex + 1}/{propertyImages.length}
            </div>
          </>
        )}
      </div>

      <div className="min-w-0 flex-1 self-center">
        <p className="font-medium line-clamp-2">{property.title || "Sin título"}</p>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {formatAgentPropertyAddress(property) || "Sin dirección"}
        </p>
        <p className="text-base font-semibold text-primary mt-2">
          {property.price ? `€${property.price.toLocaleString()}` : "-"}
        </p>
      </div>

      {trailing != null && (
        <div
          className="shrink-0 self-center opacity-0 pointer-events-none transition-opacity group-hover/card:opacity-100 group-hover/card:pointer-events-auto group-focus-within/card:opacity-100 group-focus-within/card:pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {trailing}
        </div>
      )}
    </div>
  );
}
