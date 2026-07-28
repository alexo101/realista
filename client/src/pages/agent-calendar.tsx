import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import { enUS, es, fr, it } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronLeft, ChevronRight, MapPin, Plus, Pencil, Trash2, User, List, CalendarDays } from "lucide-react";
import { AgentEventForm } from "@/components/AgentEventForm";
import { EventStatusBadge } from "@/components/EventStatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { type AgentEvent } from "@shared/schema";
import { useLanguage } from "@/contexts/language-context";

interface AgentCalendarProps {
  agentId: number;
}

const MAX_VISIBLE_EVENTS = 3;

export function AgentCalendar({ agentId }: AgentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [displayMode, setDisplayMode] = useState<"list" | "calendar">("list");
  const [viewMode, setViewMode] = useState<"today" | "week" | "all">("today");
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 20;
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgentEvent | null>(null);
  const [defaultEventDate, setDefaultEventDate] = useState<string | undefined>();
  const [eventToDelete, setEventToDelete] = useState<AgentEvent | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const dateLocale = language === "en" ? enUS : language === "fr" ? fr : language === "it" ? it : es;
  const weekdayLabels = [
    t("calendar.week_mon"),
    t("calendar.week_tue"),
    t("calendar.week_wed"),
    t("calendar.week_thu"),
    t("calendar.week_fri"),
    t("calendar.week_sat"),
    t("calendar.week_sun"),
  ];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarGridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarGridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Calculate date range based on view mode / display mode
  const getDateRange = () => {
    if (displayMode === "calendar") {
      return {
        startDate: format(calendarGridStart, "yyyy-MM-dd"),
        endDate: format(calendarGridEnd, "yyyy-MM-dd"),
      };
    }
    if (viewMode === "today") {
      return {
        startDate: format(startOfDay(currentDate), "yyyy-MM-dd"),
        endDate: format(endOfDay(currentDate), "yyyy-MM-dd"),
      };
    }
    if (viewMode === "week") {
      return {
        startDate: format(startOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        endDate: format(endOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    }
    return { startDate: null, endDate: null };
  };

  const { startDate, endDate } = getDateRange();
  const useAllEvents = displayMode === "list" && viewMode === "all";

  // Fetch agent events
  const { data: eventsResponse = { events: [], total: 0 }, isLoading } = useQuery({
    queryKey: [
      "/api/agents",
      agentId,
      "events",
      displayMode,
      useAllEvents ? "all" : startDate,
      useAllEvents ? currentPage : endDate,
    ],
    queryFn: async () => {
      if (useAllEvents) {
        const response = await fetch(`/api/agents/${agentId}/events/all?page=${currentPage}&limit=${eventsPerPage}`);
        if (!response.ok) throw new Error("Failed to fetch events");
        return response.json();
      } else {
        const response = await fetch(`/api/agents/${agentId}/events?startDate=${startDate}&endDate=${endDate}`);
        if (!response.ok) throw new Error("Failed to fetch events");
        const events = await response.json();
        return { events, total: events.length };
      }
    },
  });

  const events = eventsResponse.events || [];
  const totalEvents = eventsResponse.total || 0;
  const totalPages = Math.ceil(totalEvents / eventsPerPage);

  // Fetch the agent's agency so event properties use the same complete
  // property source as the event form, including inactive and draft properties.
  const { data: agent } = useQuery<{ agencyId?: number | null }>({
    queryKey: ["/api/agents", agentId],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}`);
      if (!response.ok) throw new Error("Failed to fetch agent details");
      return response.json();
    },
  });

  // Fetch all agency properties to resolve event property UUIDs.
  const { data: properties = [] } = useQuery({
    queryKey: ["/api/agencies", agent?.agencyId, "properties"],
    enabled: !!agent?.agencyId,
    queryFn: async () => {
      const response = await fetch(`/api/agencies/${agent?.agencyId}/properties`);
      if (!response.ok) throw new Error("Failed to fetch agency properties");
      return response.json();
    },
  });

  // Fetch clients to get names
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/agents", agentId, "clients"],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/clients`);
      if (!response.ok) throw new Error("Failed to fetch clients");
      return response.json();
    },
  });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, AgentEvent[]>();
    for (const event of events as AgentEvent[]) {
      const key = event.eventDate;
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    map.forEach((list) => {
      list.sort((a, b) => a.eventTime.localeCompare(b.eventTime));
    });
    return map;
  }, [events]);

  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: calendarGridStart, end: calendarGridEnd }),
    [calendarGridStart, calendarGridEnd]
  );

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      return await apiRequest("POST", "/api/agent-events", eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "/api/agents" &&
          query.queryKey[1] === agentId &&
          query.queryKey[2] === "events",
      });
      setShowEventForm(false);
      setDefaultEventDate(undefined);
      toast({
        title: t("calendar.success"),
        description: t("calendar.created"),
      });
    },
    onError: () => {
      toast({
        title: t("calendar.error"),
        description: t("calendar.create_error"),
        variant: "destructive",
      });
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...eventData }: any) => {
      return await apiRequest("PATCH", `/api/agent-events/${id}`, eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "/api/agents" &&
          query.queryKey[1] === agentId &&
          query.queryKey[2] === "events",
      });
      setSelectedEvent(null);
      setShowEventForm(false);
      setDefaultEventDate(undefined);
      toast({
        title: t("calendar.success"),
        description: t("calendar.updated"),
      });
    },
    onError: () => {
      toast({
        title: t("calendar.error"),
        description: t("calendar.update_error"),
        variant: "destructive",
      });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return await apiRequest("DELETE", `/api/agent-events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "/api/agents" &&
          query.queryKey[1] === agentId &&
          query.queryKey[2] === "events",
      });
      setEventToDelete(null);
      toast({
        title: t("calendar.success"),
        description: t("calendar.deleted"),
      });
    },
    onError: () => {
      toast({
        title: t("calendar.error"),
        description: t("calendar.delete_error"),
        variant: "destructive",
      });
    },
  });

  const navigateDate = (direction: "prev" | "next") => {
    if (displayMode === "calendar") {
      setCurrentDate(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
      return;
    }
    if (viewMode === "today") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
      setCurrentDate(newDate);
    } else if (viewMode === "week") {
      setCurrentDate(direction === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    }
  };

  const navigatePage = (direction: "prev" | "next") => {
    if (direction === "next" && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleViewModeChange = (value: "today" | "week" | "all") => {
    setViewMode(value);
    if (value === "all") {
      setCurrentPage(1);
    }
  };

  const openNewEvent = (date?: string) => {
    setSelectedEvent(null);
    setDefaultEventDate(date);
    setShowEventForm(true);
  };

  const openEditEvent = (event: AgentEvent) => {
    setSelectedEvent(event);
    setDefaultEventDate(undefined);
    setShowEventForm(true);
  };

  const formatEventTime = (time: string) => {
    return format(new Date(`2000-01-01T${time}`), "HH:mm");
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case "Visita":
        return "bg-blue-100 text-blue-800";
      case "Llamada":
        return "bg-green-100 text-green-800";
      case "Seguimiento":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    if (eventType === "Visita") return t("calendar.visit");
    if (eventType === "Llamada") return t("calendar.call");
    if (eventType === "Seguimiento") return t("calendar.follow_up");
    return eventType;
  };

  const displayModeToggle = (
    <ToggleGroup
      type="single"
      value={displayMode}
      onValueChange={(value) => {
        if (value === "list" || value === "calendar") {
          setDisplayMode(value);
        }
      }}
      variant="outline"
      size="sm"
      className="justify-start"
    >
      <ToggleGroupItem
        value="list"
        aria-label={t("calendar.list_view_aria")}
        title={t("calendar.list_view")}
        className="gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground"
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">{t("calendar.list_view")}</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="calendar"
        aria-label={t("calendar.calendar_view_aria")}
        title={t("calendar.calendar_view")}
        className="gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground"
      >
        <CalendarDays className="h-4 w-4" />
        <span className="hidden sm:inline">{t("calendar.calendar_view")}</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t("calendar.title")}</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {t("calendar.subtitle")}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          {displayModeToggle}
          <Button
            onClick={() => openNewEvent()}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("calendar.new_event")}
          </Button>
        </div>
      </div>

      {/* Mobile controls */}
      <div className="flex md:hidden flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          {displayModeToggle}
        </div>
        <Button
          onClick={() => openNewEvent()}
          className="w-full flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("calendar.new_event")}
        </Button>
      </div>

      {displayMode === "list" ? (
        <>
          {/* List view controls */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {viewMode !== "all" ? (
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1 md:gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <h2 className="text-sm md:text-xl font-semibold truncate">
                  {viewMode === "today"
                    ? format(currentDate, "dd/MM/yyyy", { locale: dateLocale })
                    : `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "dd MMM", { locale: dateLocale })} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "dd MMM", { locale: dateLocale })}`}
                </h2>
                <span className="hidden md:inline text-muted-foreground">
                  {viewMode === "today" && format(currentDate, "EEEE", { locale: dateLocale })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 md:gap-4">
                <h2 className="text-lg md:text-xl font-semibold">{t("calendar.all_events")}</h2>
                <div className="text-sm text-muted-foreground">
                  {t("calendar.events_total", { count: totalEvents })}
                </div>
              </div>
            )}

            <Tabs value={viewMode} onValueChange={(value) => handleViewModeChange(value as "today" | "week" | "all")}>
              <TabsList className="w-full md:w-auto">
            <TabsTrigger value="today" className="flex-1 md:flex-none text-xs md:text-sm">{t("calendar.today")}</TabsTrigger>
            <TabsTrigger value="week" className="flex-1 md:flex-none text-xs md:text-sm">{t("calendar.week")}</TabsTrigger>
            <TabsTrigger value="all" className="flex-1 md:flex-none text-xs md:text-sm">{t("calendar.all")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Events Display */}
          <div className="space-y-4">
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {events.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {t("calendar.no_events")}
                  </CardContent>
                </Card>
              ) : (
                events.map((event: AgentEvent) => {
                  const property = properties.find((p: any) => p.uuid === event.propertyUuid);
                  const client = clients.find((c: any) => c.id === event.clientId);
                  return (
                    <Card key={event.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-semibold text-lg">
                              {format(new Date(event.eventDate), "dd/MM/yyyy")}
                            </div>
                            <div className="text-muted-foreground">
                              {formatEventTime(event.eventTime)}
                            </div>
                          </div>
                          <EventStatusBadge
                            status={event.status}
                            eventDate={event.eventDate}
                            eventTime={event.eventTime}
                          />
                        </div>

                        <div className="mb-3">
                          <Badge className={getEventTypeColor(event.eventType)}>
                              {getEventTypeLabel(event.eventType)}
                          </Badge>
                        </div>

                        {property && (
                          <div className="flex items-start gap-2 mb-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span>{property.address}</span>
                          </div>
                        )}

                        {client && (
                          <div className="flex items-center gap-2 mb-3 text-sm">
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span>{client.name} {client.surname || ""}</span>
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => openEditEvent(event)}
                            title={t("calendar.edit")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                            onClick={() => setEventToDelete(event)}
                            title={t("calendar.delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}

              {viewMode === "all" && totalPages > 1 && (
                <div className="flex items-center justify-between py-2">
                  <div className="text-sm text-muted-foreground">
                    {currentPage}/{totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigatePage("prev")}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigatePage("next")}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <Card className="hidden md:block">
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">{t("calendar.date")} {t("calendar.time").toLowerCase()}</th>
                        <th className="text-left p-2">{t("calendar.type")}</th>
                        <th className="text-left p-2">{t("calendar.property")}</th>
                        <th className="text-left p-2">{t("calendar.contact")}</th>
                        <th className="text-left p-2">{t("calendar.status")}</th>
                        <th className="text-left p-2">{t("calendar.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            {t("calendar.no_events")}
                          </td>
                        </tr>
                      ) : (
                        events.map((event: AgentEvent) => {
                          const property = properties.find((p: any) => p.uuid === event.propertyUuid);
                          const client = clients.find((c: any) => c.id === event.clientId);
                          return (
                            <tr key={event.id} className="border-b hover:bg-gray-50">
                              <td className="p-2">
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {format(new Date(event.eventDate), "dd/MM/yyyy")}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {formatEventTime(event.eventTime)}
                                  </span>
                                </div>
                              </td>
                              <td className="p-2">
                                <Badge className={getEventTypeColor(event.eventType)}>
                                  {getEventTypeLabel(event.eventType)}
                                </Badge>
                              </td>
                              <td className="p-2">
                                {property ? (
                                  <span className="text-sm">{property.address}</span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">{t("calendar.no_property")}</span>
                                )}
                              </td>
                              <td className="p-2">
                                {client ? (
                                  <span className="text-sm">
                                    {client.name} {client.surname || ""}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">{t("calendar.no_contact")}</span>
                                )}
                              </td>
                              <td className="p-2">
                                <EventStatusBadge
                                  status={event.status}
                                  eventDate={event.eventDate}
                                  eventTime={event.eventTime}
                                />
                              </td>
                              <td className="p-2">
                                <div className="flex gap-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    onClick={() => openEditEvent(event)}
                                    title={t("calendar.edit")}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                                    onClick={() => setEventToDelete(event)}
                                    title={t("calendar.delete")}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {viewMode === "all" && totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {t("calendar.page", { current: currentPage, total: totalPages, count: totalEvents })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigatePage("prev")}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {t("calendar.previous")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigatePage("next")}
                        disabled={currentPage === totalPages}
                      >
                        {t("calendar.next")}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Month navigation */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-1 md:gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-sm md:text-xl font-semibold capitalize">
              {format(currentDate, "MMMM yyyy", { locale: dateLocale })}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setCurrentDate(new Date())}
            >
              {t("calendar.today")}
            </Button>
          </div>

          {/* Month grid */}
          <Card>
            <CardContent className="p-2 md:p-4">
              {isLoading ? (
                <div className="py-12 text-center text-muted-foreground">{t("calendar.loading")}</div>
              ) : (
                <div className="grid grid-cols-7 gap-px rounded-md border bg-border overflow-hidden">
                  {weekdayLabels.map((label) => (
                    <div
                      key={label}
                      className="bg-muted/50 px-1 py-2 text-center text-xs font-medium text-muted-foreground md:text-sm"
                    >
                      {label}
                    </div>
                  ))}
                  {calendarDays.map((day) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const dayEvents = eventsByDate.get(dateKey) ?? [];
                    const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
                    const hiddenCount = dayEvents.length - visibleEvents.length;
                    const inCurrentMonth = isSameMonth(day, currentDate);

                    return (
                      <div
                        key={dateKey}
                        role="button"
                        tabIndex={0}
                        onClick={() => openNewEvent(dateKey)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openNewEvent(dateKey);
                          }
                        }}
                        className={cn(
                          "min-h-[72px] md:min-h-[110px] bg-background p-1 md:p-1.5 text-left align-top transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset cursor-pointer",
                          !inCurrentMonth && "bg-muted/30 text-muted-foreground"
                        )}
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span
                            className={cn(
                              "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium md:text-sm",
                              isToday(day) && "bg-primary text-primary-foreground",
                              !inCurrentMonth && "opacity-50"
                            )}
                          >
                            {format(day, "d")}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className="md:hidden text-[10px] text-muted-foreground">
                              {dayEvents.length}
                            </span>
                          )}
                        </div>

                        <div className="hidden md:flex flex-col gap-0.5">
                          {visibleEvents.map((event) => (
                            <button
                              key={event.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditEvent(event);
                              }}
                              className={cn(
                                "block w-full truncate rounded px-1 py-0.5 text-left text-[10px] leading-tight font-medium cursor-pointer hover:opacity-80",
                                getEventTypeColor(event.eventType)
                              )}
                              title={`${formatEventTime(event.eventTime)} · ${getEventTypeLabel(event.eventType)}`}
                            >
                              {formatEventTime(event.eventTime)} {getEventTypeLabel(event.eventType)}
                            </button>
                          ))}
                          {hiddenCount > 0 && (
                            <span className="px-1 text-[10px] text-muted-foreground">
                              {t("calendar.more_events", { count: hiddenCount })}
                            </span>
                          )}
                        </div>

                        {/* Mobile: colored dots for event types */}
                        <div className="md:hidden flex flex-wrap gap-0.5 mt-0.5">
                          {dayEvents.slice(0, 4).map((event) => (
                            <span
                              key={event.id}
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                event.eventType === "Visita" && "bg-blue-500",
                                event.eventType === "Llamada" && "bg-green-500",
                                event.eventType === "Seguimiento" && "bg-orange-500",
                                !["Visita", "Llamada", "Seguimiento"].includes(event.eventType) && "bg-gray-400"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-blue-100 border border-blue-300" />
                  {t("calendar.visit")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-green-100 border border-green-300" />
                  {t("calendar.call")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-orange-100 border border-orange-300" />
                  {t("calendar.follow_up")}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Event Form Dialog */}
      <Dialog
        open={showEventForm}
        onOpenChange={(open) => {
          setShowEventForm(open);
          if (!open) {
            setSelectedEvent(null);
            setDefaultEventDate(undefined);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-semibold">
              {selectedEvent ? t("calendar.edit_event") : t("calendar.schedule_event")}
            </DialogTitle>
          </DialogHeader>
          <AgentEventForm
            agentId={agentId}
            event={selectedEvent}
            defaultDate={selectedEvent ? undefined : defaultEventDate}
            onSubmit={(eventData) => {
              if (selectedEvent) {
                updateEventMutation.mutate({ id: selectedEvent.id, ...eventData });
              } else {
                createEventMutation.mutate({ agentId, ...eventData });
              }
            }}
            onCancel={() => {
              setShowEventForm(false);
              setSelectedEvent(null);
              setDefaultEventDate(undefined);
            }}
            isLoading={createEventMutation.isPending || updateEventMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Event Confirmation Dialog */}
      <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("calendar.confirm_delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {eventToDelete && (
                <>
                  {t("calendar.confirm_delete_description")}
                  <br />
                  <strong>{t("calendar.date")}</strong> {format(new Date(eventToDelete.eventDate), "dd/MM/yyyy", { locale: dateLocale })}
                  <br />
                  <strong>{t("calendar.time")}</strong> {formatEventTime(eventToDelete.eventTime)}
                  <br />
                  <strong>{t("calendar.type_label")}</strong> {getEventTypeLabel(eventToDelete.eventType)}
                  <br />
                  {t("calendar.irreversible")}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("calendar.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (eventToDelete) {
                  deleteEventMutation.mutate(eventToDelete.id);
                  setEventToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("calendar.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
