import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function SavedIndicator({ visible }: { visible: boolean }) {
  return (
    <Check
      className={cn(
        "ml-1.5 inline h-3.5 w-3.5 shrink-0 text-green-600 transition-opacity duration-500",
        visible ? "opacity-100" : "opacity-0",
      )}
      strokeWidth={3}
      aria-hidden={!visible}
      data-testid="saved-indicator"
    />
  );
}
