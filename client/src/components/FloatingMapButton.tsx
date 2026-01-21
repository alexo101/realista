import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingMapButtonProps {
  onClick: () => void;
  isMapView: boolean;
  className?: string;
}

export function FloatingMapButton({ onClick, isMapView, className }: FloatingMapButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-40 rounded-full shadow-lg px-4 py-2 gap-2",
        "bg-[#0284c5] hover:bg-[#0273b0] text-white",
        "md:hidden",
        className
      )}
      data-testid="button-floating-map"
    >
      <Map className="h-4 w-4" />
      <span>{isMapView ? "Lista" : "Mapa"}</span>
    </Button>
  );
}
