import type { AgentEvent } from "./schema";
import { EVENT_STATUSES, type EventStatus } from "./schema";

const EVENT_TIME_ZONE = "Europe/Madrid";

/** Current wall-clock time in Europe/Madrid as `YYYY-MM-DDTHH:mm`. */
export function getMadridNowKey(now: Date = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: EVENT_TIME_ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(now)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  ) as Record<string, string>;

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function getEventDateTimeKey(eventDate: string, eventTime: string): string | null {
  const match = /^(\d{4}-\d{2}-\d{2})[T ]?(\d{2}:\d{2})/.exec(`${eventDate}T${eventTime}`);
  if (!match) return null;
  return `${match[1]}T${match[2]}`;
}

/**
 * Derive the effective event status.
 * "due" is never stored — it is computed when status is still "scheduled"
 * and the event's Madrid wall-clock datetime is in the past.
 */
export function computeEffectiveStatus<T extends Pick<AgentEvent, "status" | "eventDate" | "eventTime">>(
  event: T,
  now: Date = new Date(),
): T & { status: EventStatus | string } {
  const stored = EVENT_STATUSES.includes(event.status as EventStatus)
    ? (event.status as EventStatus)
    : "scheduled";

  if (stored !== "scheduled" && stored !== "due") {
    return { ...event, status: stored };
  }

  const eventKey = getEventDateTimeKey(event.eventDate, event.eventTime);
  if (!eventKey) {
    return { ...event, status: stored === "due" ? "scheduled" : stored };
  }

  if (eventKey < getMadridNowKey(now)) {
    return { ...event, status: "due" };
  }

  return { ...event, status: "scheduled" };
}
