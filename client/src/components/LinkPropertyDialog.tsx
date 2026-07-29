import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PropertyPreviewCard } from "@/components/PropertyPreviewCard";
import { formatAgentPropertyAddress } from "@/utils/format-property-address";
import type { Property } from "@shared/schema";

type LinkPropertyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId?: number;
  agencyId?: number | null;
  excludePropertyUuids?: string[];
  onLink: (property: Property) => void;
  isLinking?: boolean;
};

export function LinkPropertyDialog({
  open,
  onOpenChange,
  agentId,
  agencyId,
  excludePropertyUuids = [],
  onLink,
  isLinking = false,
}: LinkPropertyDialogProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedUuid(null);
      setImageIndexes({});
    }
  }, [open]);

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties", { agencyId, agentId, forLinking: true }],
    queryFn: async () => {
      const url = agencyId
        ? `/api/properties?agencyId=${agencyId}`
        : `/api/properties?agentId=${agentId}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch properties");
      return response.json();
    },
    enabled: open && Boolean(agentId || agencyId),
  });

  const excluded = useMemo(() => new Set(excludePropertyUuids), [excludePropertyUuids]);

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();
    return properties.filter((property) => {
      if (property.isActive === false) return false;
      if (excluded.has(property.uuid)) return false;
      if (!query) return true;

      const haystack = [
        property.title,
        property.address,
        formatAgentPropertyAddress(property),
        property.reference,
        property.neighborhood,
        property.city,
        property.district,
        property.locality,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [properties, search, excluded]);

  const selectedProperty = filteredProperties.find((p) => p.uuid === selectedUuid) ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] w-[min(95vw,56rem)] max-w-4xl flex-col overflow-hidden sm:min-h-[32rem]"
        data-testid="dialog-link-property"
      >
        <DialogHeader>
          <DialogTitle>{t("manage.client_transactions.link_title")}</DialogTitle>
          <DialogDescription>
            {t("manage.client_transactions.link_subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("manage.client_transactions.search_placeholder")}
            className="pl-9"
            data-testid="input-link-property-search"
          />
        </div>

        <div className="min-h-[min(50vh,24rem)] flex-1 space-y-3 overflow-auto px-2 py-2">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {t("common.loading")}
            </p>
          ) : filteredProperties.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-center"
              data-testid="link-property-empty-state"
            >
              <p className="text-sm text-muted-foreground">
                {t("manage.client_transactions.no_properties")}
              </p>
            </div>
          ) : (
            filteredProperties.map((property) => (
              <PropertyPreviewCard
                key={property.uuid}
                property={property}
                selected={selectedUuid === property.uuid}
                onClick={() => setSelectedUuid(property.uuid)}
                imageIndex={imageIndexes[property.uuid] ?? property.mainImageIndex ?? 0}
                onImageIndexChange={(index) =>
                  setImageIndexes((prev) => ({ ...prev, [property.uuid]: index }))
                }
                data-testid={`link-property-${property.uuid}`}
              />
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-link-property"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            disabled={!selectedProperty || isLinking}
            onClick={() => {
              if (selectedProperty) onLink(selectedProperty);
            }}
            data-testid="button-confirm-link-property"
          >
            {isLinking
              ? t("manage.client_transactions.linking")
              : t("manage.client_transactions.link_action")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
