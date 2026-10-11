import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import type { FeatureTourCard } from "@/lib/feature-tour";

const POPOVER_WIDTH = 320;
const POPOVER_HEIGHT_ESTIMATE = 220;
const GAP = 14;
const SYNC_INTERVAL_MS = 200;
const HIGHLIGHT_PADDING = 6;

type Box = { top: number; left: number; width: number; height: number };

function toBox(el: HTMLElement): Box {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function sameBox(a: Box | null, b: Box | null): boolean {
  if (!a || !b) return a === b;
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

function popoverPosition(box: Box | null): { top: number; left: number } | null {
  if (!box) return null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = box.left + box.width + GAP;
  if (left + POPOVER_WIDTH > vw - 8) {
    left = box.left - GAP - POPOVER_WIDTH;
  }
  if (left < 8) {
    left = Math.min(Math.max(8, box.left), vw - POPOVER_WIDTH - 8);
  }
  const top = Math.min(Math.max(8, box.top), vh - POPOVER_HEIGHT_ESTIMATE - 8);
  return { top, left };
}

interface TourSpotlightProps {
  card: FeatureTourCard;
  stepIndex: number;
  onStepChange: (index: number) => void;
  /** Finished the last step: the card is completed and removed from the widget. */
  onFinish: () => void;
  /** Closed early: the card stays in the widget. */
  onClose: () => void;
}

/**
 * Walks through a card's steps. Each step highlights the element tagged with
 * `data-tour={step.target}`. If the element is not on screen, the popover is
 * centered instead.
 */
export function TourSpotlight({
  card,
  stepIndex,
  onStepChange,
  onFinish,
  onClose,
}: TourSpotlightProps) {
  const { t } = useLanguage();
  const step = card.steps[stepIndex];
  const total = card.steps.length;
  const isLast = stepIndex === total - 1;

  const targetRef = useRef<HTMLElement | null>(null);
  const scrolledForRef = useRef<string | null>(null);
  const [box, setBox] = useState<Box | null>(null);

  // Keep the highlight in sync with the target: resolves it when it mounts,
  // follows layout changes, and clears it when the target leaves the DOM.
  useEffect(() => {
    targetRef.current = null;
    scrolledForRef.current = null;
    setBox(null);

    const sync = () => {
      let el = targetRef.current;
      if (!el || !el.isConnected) {
        el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
        targetRef.current = el;
      }
      if (el && scrolledForRef.current !== step.target) {
        scrolledForRef.current = step.target;
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
      const next = el ? toBox(el) : null;
      setBox((current) => (sameBox(current, next) ? current : next));
    };

    sync();
    const timer = window.setInterval(sync, SYNC_INTERVAL_MS);
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [step.target]);

  // Escape closes the tour without completing it.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const position = popoverPosition(box);

  return (
    <>
      {box ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[80] rounded-md ring-2 ring-primary transition-all duration-200"
          style={{
            top: box.top - HIGHLIGHT_PADDING,
            left: box.left - HIGHLIGHT_PADDING,
            width: box.width + HIGHLIGHT_PADDING * 2,
            height: box.height + HIGHLIGHT_PADDING * 2,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
          }}
        />
      ) : (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[80] bg-black/40" />
      )}

      <div
        role="dialog"
        aria-modal="false"
        aria-label={t(card.titleKey)}
        data-testid="feature-tour-spotlight"
        className={
          position
            ? "fixed z-[81] w-80 rounded-lg border bg-background p-4 shadow-xl"
            : "fixed left-1/2 top-1/2 z-[81] w-80 -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-4 shadow-xl"
        }
        style={position ? { top: position.top, left: position.left } : undefined}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {t("tour.step_counter", { current: stepIndex + 1, total })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
            aria-label={t("tour.close")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <h4 className="text-sm font-semibold">{t(step.titleKey)}</h4>
        <p className="mt-1 text-sm text-muted-foreground">{t(step.bodyKey)}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStepChange(stepIndex - 1)}
            disabled={stepIndex === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t("tour.back")}
          </Button>
          {isLast ? (
            <Button size="sm" onClick={onFinish}>
              {t("tour.done")}
            </Button>
          ) : (
            <Button size="sm" onClick={() => onStepChange(stepIndex + 1)}>
              {t("tour.next_step")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
