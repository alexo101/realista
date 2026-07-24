import { Badge } from "@/components/ui/badge";
import { computeEffectiveStatus } from "@shared/event-status";
import { EVENT_STATUSES, type EventStatus } from "@shared/schema";

const STATUS_LABELS: Record<EventStatus, string> = {
  scheduled: "Programado",
  due: "Vencido",
  completed: "Completado",
  cancelled: "Cancelado",
};

const STATUS_CLASSES: Record<EventStatus, string> = {
  scheduled: "border-blue-200 bg-blue-50 text-blue-700",
  due: "border-amber-200 bg-amber-50 text-amber-700",
  completed: "border-green-200 bg-green-50 text-green-700",
  cancelled: "border-muted bg-muted text-muted-foreground",
};

interface EventStatusBadgeProps {
  status: string;
  eventDate?: string;
  eventTime?: string;
}

export function EventStatusBadge({ status, eventDate, eventTime }: EventStatusBadgeProps) {
  const resolved =
    eventDate && eventTime
      ? computeEffectiveStatus({ status, eventDate, eventTime }).status
      : status;

  const effectiveStatus: EventStatus = EVENT_STATUSES.includes(resolved as EventStatus)
    ? (resolved as EventStatus)
    : "scheduled";

  return (
    <Badge variant="outline" className={STATUS_CLASSES[effectiveStatus]}>
      {STATUS_LABELS[effectiveStatus]}
    </Badge>
  );
}
