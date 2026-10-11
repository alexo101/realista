import { useEffect, useState } from "react";
import {
  Building,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  KeyRound,
  MessageSquare,
  Plug,
  Star,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import type { FeatureTourCard } from "@/lib/feature-tour";
import type { FeatureTourCardId } from "@shared/feature-tour";
import { cn } from "@/lib/utils";

const CARD_ICONS: Record<FeatureTourCardId, LucideIcon> = {
  calendario: CalendarDays,
  clientes: Users,
  mensajes: MessageSquare,
  propiedades: Building2,
  servicios: Plug,
  "perfil-agente": User,
  resenas: Star,
  "control-jornada": Clock,
  "control-ausencias": CalendarDays,
  "perfil-agencia": Building,
  equipo: KeyRound,
  facturacion: CreditCard,
};

interface TourCardsProps {
  cards: FeatureTourCard[];
  sidebarCollapsed: boolean;
  onStart: (card: FeatureTourCard) => void;
  onSkipCard: (card: FeatureTourCard) => void;
  onSkipAll: () => void;
}

/**
 * Bottom-left widget with one card per sidebar tab. It sits just right of the
 * sidebar so it never covers the sidebar items.
 */
export function TourCards({
  cards,
  sidebarCollapsed,
  onStart,
  onSkipCard,
  onSkipAll,
}: TourCardsProps) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);

  // Keep the index valid when a card is skipped and the list shrinks.
  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(cards.length - 1, 0)));
  }, [cards.length]);

  if (cards.length === 0) return null;

  const safeIndex = Math.min(index, cards.length - 1);
  const card = cards[safeIndex];
  const Icon = CARD_ICONS[card.id];
  const hasMany = cards.length > 1;

  return (
    <div
      role="region"
      aria-label={t("tour.widget_label")}
      data-tour="feature-tour-cards"
      className={cn(
        "fixed bottom-4 z-40 hidden w-80 md:block transition-all duration-300",
        sidebarCollapsed ? "left-[5rem]" : "left-[17rem]",
      )}
    >
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-0">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIndex((safeIndex - 1 + cards.length) % cards.length)}
              disabled={!hasMany}
              aria-label={t("tour.prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[4.5rem] text-center text-xs text-muted-foreground">
              {t("tour.counter", { current: safeIndex + 1, total: cards.length })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIndex((safeIndex + 1) % cards.length)}
              disabled={!hasMany}
              aria-label={t("tour.next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 p-3">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
            <h3 className="text-sm font-semibold">{t(card.titleKey)}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{t(card.descriptionKey)}</p>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-2 p-3 pt-0">
          <Button size="sm" onClick={() => onStart(card)} data-testid={`tour-start-${card.id}`}>
            {t("tour.start")}
          </Button>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSkipCard(card)}
              data-testid={`tour-skip-${card.id}`}
            >
              {t("tour.skip_this")}
            </Button>
            <Button size="sm" variant="ghost" onClick={onSkipAll} data-testid="tour-skip-all">
              {t("tour.skip_all")}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
