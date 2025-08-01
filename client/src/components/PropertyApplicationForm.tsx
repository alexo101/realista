import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/user-context";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Two-hour time intervals for visit scheduling
const TIME_INTERVALS = [
  { id: "09:00-11:00", label: "09:00 - 11:00" },
  { id: "11:00-13:00", label: "11:00 - 13:00" },
  { id: "13:00-15:00", label: "13:00 - 15:00" },
  { id: "15:00-17:00", label: "15:00 - 17:00" },
  { id: "17:00-19:00", label: "17:00 - 19:00" },
  { id: "19:00-21:00", label: "19:00 - 21:00" }
];

const applicationSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  phone: z.string().min(6, "El número de teléfono es obligatorio"),
  email: z.string().email("Dirección de correo electrónico inválida"),
  visitDate: z.date().optional(),
  visitTimeSlots: z.array(z.string()).max(3, "Máximo 3 horarios permitidos").optional(),
  message: z.string().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

interface PropertyApplicationFormProps {
  propertyId: number;
  agentId?: number;
}

export function PropertyApplicationForm({ propertyId, agentId }: PropertyApplicationFormProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      visitTimeSlots: [],
      message: "",
    },
  });

  const selectedTimeSlots = form.watch("visitTimeSlots") || [];
  const visitDate = form.watch("visitDate");

  const handleTimeSlotChange = (timeSlotId: string, checked: boolean) => {
    const currentSlots = selectedTimeSlots;
    if (checked) {
      if (currentSlots.length < 3) {
        form.setValue("visitTimeSlots", [...currentSlots, timeSlotId]);
      } else {
        toast({
          title: "Máximo de horarios alcanzado",
          description: "Solo puedes seleccionar hasta 3 horarios de visita",
          variant: "destructive",
        });
      }
    } else {
      form.setValue("visitTimeSlots", currentSlots.filter(slot => slot !== timeSlotId));
    }
  };

  const handleSubmit = async (data: ApplicationFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Get agent ID if not provided
      let targetAgentId = agentId;
      
      if (!targetAgentId) {
        const propertyResponse = await fetch(`/api/properties/${propertyId}`);
        if (!propertyResponse.ok) {
          throw new Error("No se pudo obtener la información de la propiedad");
        }
        const propertyData = await propertyResponse.json();
        targetAgentId = propertyData.agentId;
        
        if (!targetAgentId) {
          throw new Error("No se pudo identificar el agente para esta propiedad");
        }
      }

      // Prepare inquiry data
      const inquiryData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message || "",
        propertyId,
        agentId: targetAgentId,
        status: "pendiente"
      };

      // Send inquiry
      const inquiryResponse = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inquiryData),
      });
      
      if (!inquiryResponse.ok) {
        const errorData = await inquiryResponse.json();
        throw new Error(errorData.message || "Error al enviar la consulta");
      }

      // If visit date and time slots are provided, also create a visit request
      if (data.visitDate && data.visitTimeSlots && data.visitTimeSlots.length > 0) {
        if (!user || !user.isClient) {
          // For non-logged in users, we can't create visit requests
          // But we still send the inquiry with visit information in the message
          const visitInfo = `\n\nSolicitud de visita:\nFecha: ${format(data.visitDate, "PPP")}\nHorarios preferidos: ${data.visitTimeSlots.map(slot => 
            TIME_INTERVALS.find(t => t.id === slot)?.label
          ).join(", ")}`;
          
          // Update the inquiry with visit information
          await fetch("/api/inquiries", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...inquiryData,
              message: (data.message || "") + visitInfo
            }),
          });
        } else {
          // For logged in clients, create separate visit requests for each time slot
          for (const timeSlot of data.visitTimeSlots) {
            const visitRequestData = {
              propertyId,
              clientId: user.id,
              agentId: targetAgentId,
              requestedDate: data.visitDate.toISOString(),
              requestedTime: timeSlot,
              clientNotes: data.message || "",
            };

            const visitResponse = await fetch("/api/property-visit-requests", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(visitRequestData),
            });

            if (!visitResponse.ok) {
              console.warn("Error creating visit request for time slot:", timeSlot);
              // Continue with other time slots even if one fails
            }
          }
        }
      }
      
      // Success
      toast({
        title: "Solicitud enviada con éxito",
        description: data.visitDate && data.visitTimeSlots && data.visitTimeSlots.length > 0 
          ? "Tu consulta y solicitud de visita han sido enviadas. ¡Nos pondremos en contacto contigo pronto!"
          : "¡Nos pondremos en contacto contigo pronto!",
      });
      
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/property-visit-requests'] });
      
    } catch (error) {
      console.error("Error al enviar solicitud:", error);
      toast({
        title: "Error al enviar solicitud",
        description: (error as Error).message || "Por favor, inténtalo de nuevo más tarde",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visitDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha de visita (opcional)</FormLabel>
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
                        format(field.value, "PPP")
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date() || date < new Date("1900-01-01")
                    }
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
          name="visitTimeSlots"
          render={() => (
            <FormItem>
              <FormLabel>Hora de visita (opcional)</FormLabel>
              <div className="text-sm text-muted-foreground mb-2">
                Selecciona hasta 3 horarios de preferencia
              </div>
              <div className="grid grid-cols-1 gap-2">
                {TIME_INTERVALS.map((timeInterval) => (
                  <FormItem
                    key={timeInterval.id}
                    className="flex flex-row items-start space-x-3 space-y-0"
                  >
                    <FormControl>
                      <Checkbox
                        checked={selectedTimeSlots.includes(timeInterval.id)}
                        onCheckedChange={(checked) => 
                          handleTimeSlotChange(timeInterval.id, checked as boolean)
                        }
                        disabled={!visitDate || (selectedTimeSlots.length >= 3 && !selectedTimeSlots.includes(timeInterval.id))}
                      />
                    </FormControl>
                    <FormLabel className={cn(
                      "text-sm font-normal cursor-pointer",
                      (!visitDate || (selectedTimeSlots.length >= 3 && !selectedTimeSlots.includes(timeInterval.id))) && "text-muted-foreground"
                    )}>
                      {timeInterval.label}
                    </FormLabel>
                  </FormItem>
                ))}
              </div>
              {!visitDate && (
                <div className="text-xs text-muted-foreground">
                  Primero selecciona una fecha para habilitar los horarios
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensaje (opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Añade cualquier información adicional..."
                  className="resize-none"
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
          disabled={isSubmitting}
        >
          {isSubmitting ? "Enviando solicitud..." : "Enviar solicitud"}
        </Button>
      </form>
    </Form>
  );
}