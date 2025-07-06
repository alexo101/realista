import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Phone, Plus } from "lucide-react";
import { AgentEventForm } from "@/components/AgentEventForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { type AgentEvent } from "@shared/schema";

interface AgentCalendarProps {
  agentId: number;
}

export function AgentCalendar({ agentId }: AgentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"today" | "week">("today");
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgentEvent | null>(null);
  const queryClient = useQueryClient();

  // Calculate date range based on view mode
  const getDateRange = () => {
    if (viewMode === "today") {
      return {
        startDate: format(startOfDay(currentDate), "yyyy-MM-dd"),
        endDate: format(endOfDay(currentDate), "yyyy-MM-dd")
      };
    } else {
      return {
        startDate: format(startOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        endDate: format(endOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd")
      };
    }
  };

  const { startDate, endDate } = getDateRange();

  // Fetch agent events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["/api/agents", agentId, "events", startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/events?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    }
  });

  // Fetch properties to get addresses
  const { data: properties = [] } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const response = await fetch("/api/properties");
      if (!response.ok) throw new Error("Failed to fetch properties");
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
      const response = await apiRequest("POST", "/api/agent-events", eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId, "events"] });
      setShowEventForm(false);
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...eventData }: any) => {
      const response = await apiRequest("PATCH", `/api/agent-events/${id}`, eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId, "events"] });
      setSelectedEvent(null);
      setShowEventForm(false);
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const response = await apiRequest("DELETE", `/api/agent-events/${eventId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId, "events"] });
    }
  });

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "today") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
      setCurrentDate(newDate);
    } else {
      setCurrentDate(direction === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    }
  };

  const formatEventTime = (time: string) => {
    return format(new Date(`2000-01-01T${time}`), "HH:mm");
  };

  const getEventTypeColor = (eventType: string) => {
    return eventType === "Visita" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendario</h1>
          <p className="text-muted-foreground">
            Gestiona tus eventos y citas
          </p>
        </div>
        <Button onClick={() => setShowEventForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo evento
        </Button>
      </div>

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-xl font-semibold">
            {viewMode === "today" 
              ? format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })
              : `Semana del ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "dd MMM", { locale: es })} al ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "dd MMM", { locale: es })}`
            }
          </h2>
        </div>
        
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "today" | "week")}>
          <TabsList>
            <TabsTrigger value="today">Ver Hoy</TabsTrigger>
            <TabsTrigger value="week">Ver Semana</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Events Display */}
      <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Eventos</CardTitle>
            </CardHeader>
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
                    {events.map((event: AgentEvent) => {
                      const property = properties.find((p: any) => p.id === event.propertyId);
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
                            <Badge variant={event.status === "scheduled" ? "default" : "secondary"}>
                              {event.status === "scheduled" ? "Programado" : "Completado"}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setShowEventForm(true);
                                }}
                              >
                                Editar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => deleteEventMutation.mutate(event.id)}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
    </div>
  );
}