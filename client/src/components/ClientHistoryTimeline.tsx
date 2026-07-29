import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { es, enUS, fr, it } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Phone, Home, Users, UserCheck, Pencil, Trash2, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { type AgentEvent, type PropertyVisitRequest, type Client, type ContactHistoryEntry } from "@shared/schema";
import { EventStatusBadge } from "@/components/EventStatusBadge";
import { getClientStatuses } from "@/utils/clientStatuses";

interface ClientHistoryTimelineProps {
  clientId: number;
  agentId: number;
  headerAction?: React.ReactNode;
  children?: React.ReactNode;
  onEditEvent?: (event: AgentEvent) => void;
  onDeleteEvent?: (event: AgentEvent) => void;
}

interface TimelineEvent {
  id: string;
  type: "event" | "visit_request" | "client_created" | "status_change";
  date: string;
  time?: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status?: string;
  eventType?: string;
  property?: {
    uuid: string;
    reference: string;
    address: string;
  };
}

const DATE_LOCALES = {
  es,
  en: enUS,
  fr,
  it,
} as const;

const DATE_FORMATS = {
  es: "d 'de' MMMM 'de' yyyy",
  en: "MMMM d, yyyy",
  fr: "d MMMM yyyy",
  it: "d MMMM yyyy",
} as const;

export function ClientHistoryTimeline({
  clientId,
  agentId,
  headerAction,
  children,
  onEditEvent,
  onDeleteEvent,
}: ClientHistoryTimelineProps) {
  const { t, language } = useLanguage();
  const dateLocale = DATE_LOCALES[language];
  const dateFormat = DATE_FORMATS[language];
  const clientStatuses = getClientStatuses(t);
  const [eventToDelete, setEventToDelete] = useState<AgentEvent | null>(null);

  const { data: events = [] } = useQuery<AgentEvent[]>({
    queryKey: ["/api/agents", agentId, "events", "client", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/events?clientId=${clientId}`);
      if (!response.ok) throw new Error("Failed to fetch client events");
      return response.json();
    },
  });

  const { data: visitRequests = [] } = useQuery<PropertyVisitRequest[]>({
    queryKey: ["/api/clients", clientId, "visit-requests"],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/visit-requests`);
      if (!response.ok) throw new Error("Failed to fetch visit requests");
      return response.json();
    },
  });

  const { data: client } = useQuery<Client>({
    queryKey: ["/api/clients", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) throw new Error("Failed to fetch client details");
      return response.json();
    },
  });

  const { data: agent } = useQuery<{ agencyId?: number | null }>({
    queryKey: ["/api/agents", agentId],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}`);
      if (!response.ok) throw new Error("Failed to fetch agent details");
      return response.json();
    },
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["/api/agencies", agent?.agencyId, "properties"],
    enabled: !!agent?.agencyId,
    queryFn: async () => {
      const response = await fetch(`/api/agencies/${agent?.agencyId}/properties`);
      if (!response.ok) throw new Error("Failed to fetch agency properties");
      return response.json();
    },
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case "Visita":
        return <Home className="h-4 w-4" />;
      case "Llamada":
        return <Phone className="h-4 w-4" />;
      case "Seguimiento":
        return <Users className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    const key = `manage.client_history.event_title.${type}`;
    const translated = t(key);
    return translated === key ? type : translated;
  };

  const getEventTypeBadge = (type: string) => {
    const key = `manage.client_history.event_type.${type}`;
    const translated = t(key);
    return translated === key ? type : translated;
  };

  const getStatusLabel = (status: string) => {
    return clientStatuses.find((item) => item.value === status)?.label || status;
  };

  const contactHistory: ContactHistoryEntry[] = Array.isArray(client?.contactHistory)
    ? (client!.contactHistory as ContactHistoryEntry[])
    : [];

  const timelineEvents: TimelineEvent[] = [
    ...events.map((event) => {
      const property = properties.find((p: { uuid: string }) => p.uuid === event.propertyUuid);
      return {
        id: `event-${event.id}`,
        type: "event" as const,
        date: event.eventDate,
        time: event.eventTime,
        title: getEventTypeLabel(event.eventType),
        description:
          event.comments ||
          (property
            ? t("manage.client_history.property", { address: property.address })
            : t("manage.client_history.no_description")),
        icon: getEventIcon(event.eventType),
        status: event.status,
        eventType: event.eventType,
        property: property
          ? {
              uuid: property.uuid,
              reference: property.reference,
              address: property.address,
            }
          : undefined,
      };
    }),

    ...visitRequests.map((request) => {
      const property = properties.find((p: { uuid: string }) => p.uuid === request.propertyUuid);
      return {
        id: `visit-${request.id}`,
        type: "visit_request" as const,
        date: request.requestedDate.toString().split("T")[0],
        time: request.requestedTime,
        title: t("manage.client_history.visit_request"),
        description: property
          ? t("manage.client_history.property", { address: property.address })
          : t("manage.client_history.visit_request_desc"),
        icon: <Calendar className="h-4 w-4" />,
        property: property
          ? {
              uuid: property.uuid,
              reference: property.reference,
              address: property.address,
            }
          : undefined,
      };
    }),

    ...contactHistory
      .filter((entry) => entry.type === "status_change" || entry.note === "status_change" || !!entry.previousStatus)
      .map((entry) => {
        const timestamp = new Date(entry.timestamp);
        const isValidDate = !Number.isNaN(timestamp.getTime());
        return {
          id: `status-${entry.id}`,
          type: "status_change" as const,
          date: isValidDate
            ? timestamp.toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          time: isValidDate
            ? format(timestamp, "HH:mm")
            : undefined,
          title: t("manage.client_history.status_changed"),
          description: entry.previousStatus
            ? t("manage.client_history.status_changed_desc", {
                from: getStatusLabel(entry.previousStatus),
                to: getStatusLabel(entry.status),
              })
            : t("manage.client_history.status_set_desc", {
                status: getStatusLabel(entry.status),
              }),
          icon: <RefreshCw className="h-4 w-4" />,
          status: entry.status,
        };
      }),

    ...(client
      ? [
          {
            id: `client-created-${client.id}`,
            type: "client_created" as const,
            date: client.createdAt?.toString().split("T")[0] || new Date().toISOString().split("T")[0],
            title: t("manage.client_history.client_created"),
            description: t("manage.client_history.client_added"),
            icon: <UserCheck className="h-4 w-4" />,
          },
        ]
      : []),
  ];

  const sortedEvents = timelineEvents.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || "00:00"}`);
    const dateB = new Date(`${b.date}T${b.time || "00:00"}`);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <Card>
      <CardContent className="pt-6">
        {headerAction && (
          <div className="mb-4 flex justify-end">
            {headerAction}
          </div>
        )}
        {children}
        {sortedEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">{t("manage.client_history.empty_title")}</h3>
            <p className="mt-1 text-gray-500">{t("manage.client_history.empty_desc")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedEvents.map((event, index) => (
              <div key={event.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                    {event.icon}
                  </div>
                  {index < sortedEvents.length - 1 && (
                    <div className="w-px h-8 bg-gray-300 mt-2" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    {event.eventType && (
                      <Badge variant="outline" className="text-xs">
                        {getEventTypeBadge(event.eventType)}
                      </Badge>
                    )}
                    {event.type === "status_change" && event.status && (
                      <Badge
                        className={`text-xs ${
                          clientStatuses.find((item) => item.value === event.status)?.color ?? ""
                        }`}
                      >
                        {getStatusLabel(event.status)}
                      </Badge>
                    )}
                    {event.type === "event" && event.status && (
                      <EventStatusBadge
                        status={event.status}
                        eventDate={event.date}
                        eventTime={event.time}
                      />
                    )}
                    {event.type === "event" && (onEditEvent || onDeleteEvent) && (
                      <div className="ml-auto flex items-center gap-1">
                        {onEditEvent && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const sourceEvent = events.find((item) => `event-${item.id}` === event.id);
                              if (sourceEvent) onEditEvent(sourceEvent);
                            }}
                            aria-label={t("manage.client_history.edit_interaction")}
                            data-testid={`button-edit-client-event-${event.id.replace("event-", "")}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {onDeleteEvent && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => {
                              const sourceEvent = events.find((item) => `event-${item.id}` === event.id);
                              if (sourceEvent) setEventToDelete(sourceEvent);
                            }}
                            aria-label={t("manage.client_history.delete_interaction")}
                            data-testid={`button-delete-client-event-${event.id.replace("event-", "")}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{event.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>
                      {format(new Date(event.date), dateFormat, { locale: dateLocale })}
                    </span>
                    {event.time && (
                      <>
                        <span>•</span>
                        <span>{event.time}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("manage.client_history.delete_title", {
                type: eventToDelete ? getEventTypeBadge(eventToDelete.eventType) : "",
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("manage.client_history.delete_description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (eventToDelete && onDeleteEvent) onDeleteEvent(eventToDelete);
                setEventToDelete(null);
              }}
              data-testid="button-confirm-delete-client-event"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
