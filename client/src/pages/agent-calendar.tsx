import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Phone, Plus, Pencil, Trash2, User } from "lucide-react";
import { AgentEventForm } from "@/components/AgentEventForm";
import { EventStatusBadge } from "@/components/EventStatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type AgentEvent } from "@shared/schema";

interface AgentCalendarProps {
  agentId: number;
}

export function AgentCalendar({ agentId }: AgentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"today" | "week" | "all">("today");
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 20;
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgentEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<AgentEvent | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Calculate date range based on view mode
  const getDateRange = () => {
    if (viewMode === "today") {
      return {
        startDate: format(startOfDay(currentDate), "yyyy-MM-dd"),
        endDate: format(endOfDay(currentDate), "yyyy-MM-dd")
      };
    } else if (viewMode === "week") {
      return {
        startDate: format(startOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        endDate: format(endOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd")
      };
    } else {
      // For "all" mode, we don't use date filtering
      return { startDate: null, endDate: null };
    }
  };

  const { startDate, endDate } = getDateRange();

  // Fetch agent events
  const { data: eventsResponse = { events: [], total: 0 }, isLoading } = useQuery({
    queryKey: ["/api/agents", agentId, "events", viewMode === "all" ? "all" : startDate, viewMode === "all" ? currentPage : endDate],
    queryFn: async () => {
      if (viewMode === "all") {
        const response = await fetch(`/api/agents/${agentId}/events/all?page=${currentPage}&limit=${eventsPerPage}`);
        if (!response.ok) throw new Error("Failed to fetch events");
        return response.json();
      } else {
        const response = await fetch(`/api/agents/${agentId}/events?startDate=${startDate}&endDate=${endDate}`);
        if (!response.ok) throw new Error("Failed to fetch events");
        const events = await response.json();
        return { events, total: events.length };
      }
    }
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
    }
  });

  // Fetch clients to get names
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/agents", agentId, "clients"],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/clients`);
      if (!response.ok) throw new Error("Failed to fetch clients");
      return response.json();
    }
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      return await apiRequest("POST", "/api/agent-events", eventData);
    },
    onSuccess: () => {
      // Invalidate all events queries for this agent
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === "/api/agents" && 
          query.queryKey[1] === agentId && 
          query.queryKey[2] === "events"
      });
      setShowEventForm(false);
      toast({
        title: "Éxito",
        description: "El evento ha sido creado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el evento. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...eventData }: any) => {
      return await apiRequest("PATCH", `/api/agent-events/${id}`, eventData);
    },
    onSuccess: () => {
      // Invalidate all events queries for this agent
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === "/api/agents" && 
          query.queryKey[1] === agentId && 
          query.queryKey[2] === "events"
      });
      setSelectedEvent(null);
      setShowEventForm(false);
      toast({
        title: "Éxito",
        description: "El evento ha sido actualizado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el evento. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return await apiRequest("DELETE", `/api/agent-events/${eventId}`);
    },
    onSuccess: () => {
      // Invalidate all events queries for this agent
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === "/api/agents" && 
          query.queryKey[1] === agentId && 
          query.queryKey[2] === "events"
      });
      setEventToDelete(null);
      toast({
        title: "Éxito",
        description: "El evento ha sido eliminado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  });

  const navigateDate = (direction: "prev" | "next") => {
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

  // Reset page when changing view modes
  const handleViewModeChange = (value: "today" | "week" | "all") => {
    setViewMode(value);
    if (value === "all") {
      setCurrentPage(1);
    }
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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Calendario</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Gestiona tus eventos y citas
          </p>
        </div>
        {/* Desktop button */}
        <Button onClick={() => {
          setSelectedEvent(null);
          setShowEventForm(true);
        }} className="hidden md:flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo evento
        </Button>
      </div>

      {/* Mobile full-width button */}
      <Button onClick={() => {
        setSelectedEvent(null);
        setShowEventForm(true);
      }} className="w-full md:hidden flex items-center justify-center gap-2">
        <Plus className="h-4 w-4" />
        Nuevo evento
      </Button>

      {/* View Controls */}
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
                ? format(currentDate, "dd/MM/yyyy", { locale: es })
                : `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "dd MMM", { locale: es })} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "dd MMM", { locale: es })}`
              }
            </h2>
            {/* Full date shown on desktop */}
            <span className="hidden md:inline text-muted-foreground">
              {viewMode === "today" && format(currentDate, "EEEE", { locale: es })}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 md:gap-4">
            <h2 className="text-lg md:text-xl font-semibold">Todos los eventos</h2>
            <div className="text-sm text-muted-foreground">
              {totalEvents} eventos en total
            </div>
          </div>
        )}
        
        <Tabs value={viewMode} onValueChange={(value) => handleViewModeChange(value as "today" | "week" | "all")}>
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="today" className="flex-1 md:flex-none text-xs md:text-sm">Ver Hoy</TabsTrigger>
            <TabsTrigger value="week" className="flex-1 md:flex-none text-xs md:text-sm">Ver Semana</TabsTrigger>
            <TabsTrigger value="all" className="flex-1 md:flex-none text-xs md:text-sm">Todos</TabsTrigger>
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
                No hay eventos programados
              </CardContent>
            </Card>
          ) : (
            events.map((event: AgentEvent) => {
              const property = properties.find((p: any) => p.uuid === event.propertyUuid);
              const client = clients.find((c: any) => c.id === event.clientId);
              return (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    {/* Header row: Date/Time and Status */}
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

                    {/* Event type badge */}
                    <div className="mb-3">
                      <Badge className={getEventTypeColor(event.eventType)}>
                        {event.eventType}
                      </Badge>
                    </div>

                    {/* Property with location icon */}
                    {property && (
                      <div className="flex items-start gap-2 mb-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span>{property.address}</span>
                      </div>
                    )}

                    {/* Client with user icon */}
                    {client && (
                      <div className="flex items-center gap-2 mb-3 text-sm">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>{client.name} {client.surname || ''}</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button 
                        size="icon" 
                        variant="ghost"
                        className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventForm(true);
                        }}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => setEventToDelete(event)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
          
          {/* Mobile Pagination */}
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
                    <th className="text-left p-2">Fecha y hora</th>
                    <th className="text-left p-2">Tipo de evento</th>
                    <th className="text-left p-2">Propiedades</th>
                    <th className="text-left p-2">Contactos</th>
                    <th className="text-left p-2">Estado</th>
                    <th className="text-left p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No hay eventos programados
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
                              {event.eventType}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {property ? (
                              <span className="text-sm">{property.address}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">Sin propiedad</span>
                            )}
                          </td>
                          <td className="p-2">
                            {client ? (
                              <span className="text-sm">
                                {client.name} {client.surname || ''}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">Sin contacto</span>
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
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setShowEventForm(true);
                                }}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                                onClick={() => setEventToDelete(event)}
                                title="Eliminar"
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
            
            {/* Desktop Pagination for "all" view */}
            {viewMode === "all" && totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages} ({totalEvents} eventos)
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigatePage("prev")}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigatePage("next")}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Form Dialog */}
      <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-semibold">
              {selectedEvent ? "Editar Evento" : "Programar nuevo evento"}
            </DialogTitle>
          </DialogHeader>
          <AgentEventForm
            agentId={agentId}
            event={selectedEvent}
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
            }}
            isLoading={createEventMutation.isPending || updateEventMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Event Confirmation Dialog */}
      <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              {eventToDelete && (
                <>
                  ¿Estás seguro de que quieres eliminar este evento?
                  <br />
                  <strong>Fecha:</strong> {format(new Date(eventToDelete.eventDate), "dd/MM/yyyy")}
                  <br />
                  <strong>Hora:</strong> {formatEventTime(eventToDelete.eventTime)}
                  <br />
                  <strong>Tipo:</strong> {eventToDelete.eventType}
                  <br />
                  Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (eventToDelete) {
                  deleteEventMutation.mutate(eventToDelete.id);
                  setEventToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}