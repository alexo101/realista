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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { enUS, es, fr, it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { computeEffectiveStatus } from "@shared/event-status";
import { type AgentEvent } from "@shared/schema";
import { useLanguage } from "@/contexts/language-context";

const createEventFormSchema = (requiredDate: string, invalidTime: string, requiredProperty: string) => z.object({
  eventType: z.enum(["Llamada", "Visita", "Seguimiento"]),
  eventDate: z.string().min(1, requiredDate),
  eventTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, invalidTime),
  clientId: z.number().optional(),
  propertyUuid: z.string().optional(),
  status: z.enum(["scheduled", "due", "completed", "cancelled"]).optional(),
  comments: z.string().optional(),
}).refine((data) => {
  // Property is mandatory for "Visita" events
  if (data.eventType === "Visita" && !data.propertyUuid) {
    return false;
  }
  return true;
}, {
  message: requiredProperty,
  path: ["propertyUuid"],
});

type EventFormData = z.infer<ReturnType<typeof createEventFormSchema>>;

function getFormStatus(event?: AgentEvent | null): EventFormData["status"] {
  if (!event) return "scheduled";
  return computeEffectiveStatus(event).status as EventFormData["status"];
}

interface AgentEventFormProps {
  agentId: number;
  event?: AgentEvent | null;
  onSubmit: (data: Omit<EventFormData, "status"> & { status?: "scheduled" | "completed" | "cancelled" }) => void;
  onCancel: () => void;
  isLoading?: boolean;
  defaultClientId?: number;
  defaultDate?: string;
  hideClientField?: boolean;
}

export function AgentEventForm({ agentId, event, onSubmit, onCancel, isLoading, defaultClientId, defaultDate, hideClientField }: AgentEventFormProps) {
  const { language, t } = useLanguage();
  const dateLocale = language === "en" ? enUS : language === "fr" ? fr : language === "it" ? it : es;
  const eventFormSchema = createEventFormSchema(
    t("calendar.form.required_date"),
    t("calendar.form.invalid_time"),
    t("calendar.form.required_property"),
  );
  const initialDate = event?.eventDate || defaultDate || "";
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDate ? new Date(initialDate) : undefined
  );
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState("");

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      eventType: event?.eventType as "Llamada" | "Visita" | "Seguimiento" || "Visita",
      eventDate: initialDate,
      eventTime: event?.eventTime || "",
      clientId: event?.clientId || defaultClientId || undefined,
      propertyUuid: event?.propertyUuid || undefined,
      status: getFormStatus(event),
      comments: event?.comments || "",
    },
  });

  // Fetch agent details to get agency information
  const { data: agentData } = useQuery({
    queryKey: ["/api/agents", agentId],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}`);
      if (!response.ok) throw new Error("Failed to fetch agent");
      return response.json();
    }
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

  // Fetch properties for dropdown - filtered by agent's agency
  const { data: properties = [] } = useQuery({
    queryKey: ["/api/agencies", agentData?.agencyId, "properties"],
    enabled: !!agentData?.agencyId,
    queryFn: async () => {
      const response = await fetch(`/api/agencies/${agentData.agencyId}/properties`);
      if (!response.ok) throw new Error("Failed to fetch properties");
      return response.json();
    }
  });

  useEffect(() => {
    const dateValue = event?.eventDate || defaultDate || "";
    form.reset({
      eventType: event?.eventType as "Llamada" | "Visita" | "Seguimiento" || "Visita",
      eventDate: dateValue,
      eventTime: event?.eventTime || "",
      clientId: event?.clientId || defaultClientId || undefined,
      propertyUuid: event?.propertyUuid || undefined,
      status: getFormStatus(event),
      comments: event?.comments || "",
    });
    if (dateValue) {
      setSelectedDate(new Date(dateValue));
    } else {
      setSelectedDate(undefined);
    }
  }, [defaultClientId, defaultDate, event, form]);

  const watchedDate = form.watch("eventDate");
  const watchedTime = form.watch("eventTime");
  const watchedStatus = form.watch("status");

  useEffect(() => {
    if (!watchedDate || !watchedTime) return;
    if (watchedStatus === "completed" || watchedStatus === "cancelled") return;

    const effective = computeEffectiveStatus({
      status: "scheduled",
      eventDate: watchedDate,
      eventTime: watchedTime,
    }).status;

    if (effective !== watchedStatus) {
      form.setValue("status", effective as EventFormData["status"]);
    }
  }, [watchedDate, watchedTime, watchedStatus, form]);

  const handleSubmit = (data: EventFormData) => {
    // Validate that all mandatory fields are filled
    if (!data.eventType || !data.eventDate || !data.eventTime) {
      return;
    }

    const { status, ...rest } = data;
    // "due" is computed server-side and must never be written to the DB.
    const payload =
      status && status !== "due"
        ? { ...rest, status }
        : rest;

    onSubmit(payload);
  };

  const isFormValid = () => {
    const values = form.getValues();
    return values.eventType && values.eventDate && values.eventTime;
  };

  return (
    <div className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Event Type */}
        <FormField
          control={form.control}
          name="eventType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("calendar.form.event_type")}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-row space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Visita" id="visita" />
                    <FormLabel htmlFor="visita" className="font-normal cursor-pointer">
                      {t("calendar.form.visit")}
                    </FormLabel>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Llamada" id="llamada" />
                    <FormLabel htmlFor="llamada" className="font-normal cursor-pointer">
                      {t("calendar.form.call")}
                    </FormLabel>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Seguimiento" id="seguimiento" />
                    <FormLabel htmlFor="seguimiento" className="font-normal cursor-pointer">
                      {t("calendar.form.follow_up")}
                    </FormLabel>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Client */}
        {!hideClientField && (
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("calendar.form.contact")}</FormLabel>
              <Popover open={contactOpen} onOpenChange={setContactOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? (() => {
                            const selectedClient = clients.find((client: any) => client.id === field.value);
                            if (selectedClient) {
                              const fullName = `${selectedClient.name || ''} ${selectedClient.surname || ''}`.trim();
                              return fullName || selectedClient.email || t("calendar.form.selected_client");
                            }
                            return t("calendar.form.selected_client");
                          })()
                        : t("calendar.form.no_contact")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[200px] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder={t("calendar.form.search_contact")}
                      value={contactSearch}
                      onValueChange={setContactSearch}
                    />
                    <CommandList>
                      <CommandEmpty>{t("calendar.form.no_contacts")}</CommandEmpty>
                      <CommandGroup>
                        {clients
                          .filter((client: any) => {
                            const searchTerm = contactSearch.toLowerCase();
                            const fullName = `${client.name || ''} ${client.surname || ''}`.toLowerCase();
                            const email = (client.email || '').toLowerCase();
                            return fullName.includes(searchTerm) || email.includes(searchTerm);
                          })
                          .map((client: any) => (
                            <CommandItem
                              key={client.id}
                              value={client.id.toString()}
                              onSelect={() => {
                                field.onChange(client.id);
                                setContactOpen(false);
                                setContactSearch("");
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === client.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {client.name ? `${client.name} ${client.surname || ''}`.trim() : client.email}
                                </span>
                                {client.name && client.email && (
                                  <span className="text-sm text-muted-foreground">{client.email}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        )}

        {/* Date */}
        <FormField
          control={form.control}
          name="eventDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("calendar.form.date")}</FormLabel>
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
                        format(new Date(field.value), "PPP", { locale: dateLocale })
                      ) : (
                        <span>{t("calendar.form.select_date")}</span>
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
                    disabled={(date) =>
                      !event && date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                    locale={dateLocale}
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
              <FormLabel>{t("calendar.form.time")}</FormLabel>
              <FormControl>
                <Input type="time" step="60" className="event-time-input text-primary accent-primary" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Property */}
        <FormField
          control={form.control}
          name="propertyUuid"
          render={({ field }) => {
            const currentEventType = form.watch("eventType");
            const isPropertyMandatory = currentEventType === "Visita";
            
            return (
              <FormItem>
                <FormLabel>
                  {t("calendar.form.property")} {isPropertyMandatory && <span className="text-red-500">*</span>}
                </FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value || undefined)} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isPropertyMandatory ? t("calendar.form.select_property") : t("calendar.form.no_property")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {properties.map((property: any) => (
                      <SelectItem key={property.uuid} value={property.uuid}>
                        {property.reference} - {property.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {/* Status — edit only; new events are always created as scheduled */}
        {event && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("calendar.form.status")}</FormLabel>
                <Select
                  value={field.value || "scheduled"}
                  onValueChange={(value) => {
                    if (value === "due") return;
                    field.onChange(value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-event-status">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="scheduled">{t("calendar.status.scheduled")}</SelectItem>
                    <SelectItem value="due" disabled>
                      {t("calendar.status.due")}
                    </SelectItem>
                    <SelectItem value="completed">{t("calendar.status.completed")}</SelectItem>
                    <SelectItem value="cancelled">{t("calendar.status.cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Comments */}
        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("calendar.form.comments")}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t("calendar.form.comments_placeholder")}
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
            {t("calendar.form.cancel")}
          </Button>
          <Button 
            type="submit" 
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? t("calendar.form.saving") : (event ? t("calendar.form.update") : t("calendar.form.create"))}
          </Button>
        </div>
      </form>
    </Form>
    </div>
  );
}