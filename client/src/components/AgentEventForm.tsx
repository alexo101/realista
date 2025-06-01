import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { type AgentEvent } from "@shared/schema";

const eventFormSchema = z.object({
  eventType: z.enum(["Llamada", "Visita"]),
  eventDate: z.string().min(1, "La fecha es obligatoria"),
  eventTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
  clientId: z.number().optional(),
  propertyId: z.number().optional(),
  comments: z.string().optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface AgentEventFormProps {
  agentId: number;
  event?: AgentEvent | null;
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AgentEventForm({ agentId, event, onSubmit, onCancel, isLoading }: AgentEventFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      eventType: event?.eventType as "Llamada" | "Visita" || "Visita",
      eventDate: event?.eventDate || "",
      eventTime: event?.eventTime || "",
      clientId: event?.clientId || undefined,
      propertyId: event?.propertyId || undefined,
      comments: event?.comments || "",
    },
  });

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/agents", agentId, "clients"],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/clients`);
      if (!response.ok) throw new Error("Failed to fetch clients");
      return response.json();
    }
  });

  // Fetch properties for dropdown
  const { data: properties = [] } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const response = await fetch("/api/properties");
      if (!response.ok) throw new Error("Failed to fetch properties");
      return response.json();
    }
  });

  // Generate time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 19; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 19 && minute > 30) break;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    if (event?.eventDate) {
      setSelectedDate(new Date(event.eventDate));
    }
  }, [event]);

  const handleSubmit = (data: EventFormData) => {
    // Validate that all mandatory fields are filled
    if (!data.eventType || !data.eventDate || !data.eventTime) {
      return;
    }

    onSubmit(data);
  };

  const isFormValid = () => {
    const values = form.getValues();
    return values.eventType && values.eventDate && values.eventTime;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Event Type */}
        <FormField
          control={form.control}
          name="eventType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de evento</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de evento" />
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

        {/* Date */}
        <FormField
          control={form.control}
          name="eventDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(new Date(field.value), "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        field.onChange(format(date, "yyyy-MM-dd"));
                      }
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Time */}
        <FormField
          control={form.control}
          name="eventTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hora</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar hora" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Client */}
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contacto</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin contacto seleccionado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name || client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Property */}
        <FormField
          control={form.control}
          name="propertyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Propiedad</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin propiedad seleccionada" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {properties.map((property: any) => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      {property.reference} - {property.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Comments */}
        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comentarios (opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Introduce comentarios sobre el evento"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? "Guardando..." : (event ? "Actualizar Evento" : "Crear Evento")}
          </Button>
        </div>
      </form>
    </Form>
  );
}