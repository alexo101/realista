import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { AgentEvent, Property, Client } from "@shared/schema";
import { insertAgentEventSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/user-context";

type ViewMode = "today" | "week" | "list";

const eventFormSchema = insertAgentEventSchema.extend({
  date: z.date(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
});

export function Calendar() {
  const { user } = useUser();
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      agentId: user?.id || 0,
      type: "Visita",
      date: new Date(),
      time: "09:00",
      clientId: undefined,
      propertyId: undefined,
      comments: "",
    },
  });

  // Get date range based on view mode
  const getDateRange = () => {
    if (viewMode === "today") {
      const today = format(currentDate, "yyyy-MM-dd");
      return { startDate: today, endDate: today };
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      return {
        startDate: format(weekStart, "yyyy-MM-dd"),
        endDate: format(weekEnd, "yyyy-MM-dd"),
      };
    }
    return { startDate: undefined, endDate: undefined };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["/api/agents/events", user?.id, startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      return apiRequest(`/api/agents/${user?.id}/events?${params}`);
    },
    enabled: !!user?.id,
  });

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: isDialogOpen,
  });

  // Fetch properties for dropdown  
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    enabled: isDialogOpen,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: (data: EventFormData) => {
      const formattedData = {
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
      };
      return apiRequest("/api/agents/events", {
        method: "POST",
        body: JSON.stringify(formattedData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents/events"] });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const handleSubmit = (data: EventFormData) => {
    createEventMutation.mutate(data);
  };

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "today") {
      setCurrentDate(prev => direction === "next" ? addDays(prev, 1) : addDays(prev, -1));
    } else if (viewMode === "week") {
      setCurrentDate(prev => direction === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1));
    }
  };

  const getEventTypeColor = (type: string) => {
    return type === "Llamada" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800";
  };

  const renderCalendarView = () => {
    if (viewMode === "today") {
      const todayEvents = events.filter((event: AgentEvent) => 
        isSameDay(parseISO(event.date), currentDate)
      );

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {todayEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay eventos programados para hoy</p>
            ) : (
              todayEvents.map((event: AgentEvent) => (
                <Card key={event.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={getEventTypeColor(event.type)}>
                          {event.type}
                        </Badge>
                        <div>
                          <p className="font-medium">{event.time}</p>
                          {event.comments && (
                            <p className="text-sm text-muted-foreground">{event.comments}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      );
    }

    if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Semana del {format(weekStart, "d 'de' MMMM", { locale: es })} al {format(addDays(weekStart, 6), "d 'de' MMMM 'de' yyyy", { locale: es })}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map(day => {
              const dayEvents = events.filter((event: AgentEvent) => 
                isSameDay(parseISO(event.date), day)
              );
              return (
                <Card key={day.toISOString()}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      {format(day, "EEE d", { locale: es })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {dayEvents.map((event: AgentEvent) => (
                      <div key={event.id} className="text-xs">
                        <Badge className={`${getEventTypeColor(event.type)} text-xs`}>
                          {event.time} - {event.type}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderListView = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Lista de eventos</h2>
      <div className="space-y-2">
        {events.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No hay eventos programados</p>
        ) : (
          events.map((event: AgentEvent) => (
            <Card key={event.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getEventTypeColor(event.type)}>
                      {event.type}
                    </Badge>
                    <div>
                      <p className="font-medium">
                        {format(parseISO(event.date), "d 'de' MMMM 'de' yyyy", { locale: es })} - {event.time}
                      </p>
                      {event.comments && (
                        <p className="text-sm text-muted-foreground">{event.comments}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  if (!user?.isAdmin) {
    return <div>Access denied</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with columns as shown in the image */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card className="text-center p-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Fecha y hora</CardTitle>
        </Card>
        <Card className="text-center p-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tipo de evento</CardTitle>
        </Card>
        <Card className="text-center p-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Propiedades</CardTitle>
        </Card>
        <Card className="text-center p-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Contactos</CardTitle>
        </Card>
        <Card className="text-center p-4 relative">
          <CardTitle className="text-sm font-medium text-muted-foreground">Acciones</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="absolute top-2 right-2" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo evento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Programar nuevo evento</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de evento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Visita">Visita</SelectItem>
                            <SelectItem value="Llamada">Llamada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, "d 'de' MMMM 'de' yyyy", { locale: es })
                                ) : (
                                  <span>Seleccionar fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarPicker
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar hora" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeSlots.map(time => (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contacto</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar contacto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="propertyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Propiedad</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar una propiedad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {properties.map(property => (
                              <SelectItem key={property.id} value={property.id.toString()}>
                                {property.address}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comentarios (opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Introduce comentarios sobre el evento"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createEventMutation.isPending || !form.formState.isValid}
                  >
                    {createEventMutation.isPending ? "Creando..." : "Crear Evento"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </Card>
      </div>

      {/* View mode toggles */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "today" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("today")}
        >
          Ver Hoy
        </Button>
        <Button
          variant={viewMode === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("week")}
        >
          Ver Semana
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("list")}
        >
          <List className="h-4 w-4 mr-2" />
          Lista
        </Button>
      </div>

      {/* Content area */}
      {isLoading ? (
        <div className="text-center py-8">Cargando eventos...</div>
      ) : viewMode === "list" ? (
        renderListView()
      ) : (
        renderCalendarView()
      )}
    </div>
  );
}