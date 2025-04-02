import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/contexts/user-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";

// Definir los tipos de citas
const appointmentTypes = [
  { id: "visita", name: "Visita" },
  { id: "llamada", name: "Llamada" }
];

// Horarios comunes para citas
const commonTimes = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", 
  "18:00", "18:30", "19:00", "19:30", "20:00"
];

// Esquema para la validación del formulario
const appointmentSchema = z.object({
  type: z.string({
    required_error: "El tipo de cita es obligatorio",
  }),
  date: z.date({
    required_error: "La fecha es obligatoria",
  }),
  time: z.string({
    required_error: "La hora es obligatoria",
  }),
  propertyId: z.number().optional(),
  comments: z.string().optional(),
});

// Tipo para las propiedades
interface Property {
  id: number;
  title?: string;
  address: string;
  reference?: string | null;
}

// Tipo para las citas
export interface Appointment {
  id?: number;
  clientId: number;
  agentId: number;
  type: string;
  date: Date;
  time: string;
  propertyId?: number | null;
  comments: string;
  createdAt?: Date;
  property?: Property;
}

interface AppointmentFormProps {
  clientId: number;
  appointment?: Appointment;
  onSave: (appointment: Appointment) => void;
  onCancel: () => void;
}

export function AppointmentForm({ clientId, appointment, onSave, onCancel }: AppointmentFormProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const agentId = user?.id || 0;
  
  // Obtener las propiedades del agente
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['/api/properties', { agentId }],
    queryFn: async () => {
      const res = await apiRequest(
        'GET',
        `/api/properties?agentId=${agentId}`
      );
      return res.json();
    },
    enabled: !!agentId
  });

  // Configurar el formulario con valores por defecto
  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: appointment 
      ? {
          type: appointment.type,
          date: new Date(appointment.date),
          time: appointment.time,
          propertyId: appointment.propertyId || undefined,
          comments: appointment.comments,
        }
      : {
          type: "",
          date: new Date(),
          time: "",
          propertyId: undefined,
          comments: "",
        },
  });

  // Obtener el tipo de cita seleccionado
  const appointmentType = form.watch("type");

  // Manejar el envío del formulario
  const handleSubmit = (data: z.infer<typeof appointmentSchema>) => {
    try {
      // Crear objeto de cita para guardar
      const appointmentData: Appointment = {
        clientId,
        agentId,
        type: data.type,
        date: data.date,
        time: data.time,
        propertyId: data.type === "visita" ? data.propertyId : null,
        comments: data.comments || "",
      };
      
      // Si estamos editando, incluir el ID
      if (appointment?.id) {
        appointmentData.id = appointment.id;
      }
      
      // Guardar la cita
      onSave(appointmentData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al guardar la cita.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {appointment ? "Editar Cita" : "Nueva Cita"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Tipo de cita */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de cita</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de cita" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {appointmentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fecha de la cita */}
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
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
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
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hora de la cita */}
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la hora" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {commonTimes.map((time) => (
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

            {/* Campo de propiedad, solo para visitas */}
            {appointmentType === "visita" && (
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Propiedad a visitar</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una propiedad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id.toString()}>
                            {property.reference ? `Ref: ${property.reference} - ` : ""}
                            {property.title || property.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Comentarios */}
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentarios</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Introduce los detalles de la cita"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={onCancel} type="button">
                Cancelar
              </Button>
              <Button type="submit">
                {appointment ? "Actualizar" : "Crear"} cita
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Componente para mostrar la lista de citas existentes
interface AppointmentListProps {
  clientId: number;
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointmentId: number) => void;
}

export function AppointmentList({ clientId, onEdit, onDelete }: AppointmentListProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const agentId = user?.id || 0;
  
  // Obtener las citas del cliente
  const { data: appointments = [], isLoading, refetch } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments/client', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const res = await apiRequest(
        'GET',
        `/api/appointments/client/${clientId}`
      );
      return res.json();
    },
    enabled: !!clientId
  });

  // Formatear la fecha para mostrar
  const formatDate = (date: Date) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: es });
  };

  if (isLoading) {
    return <div className="p-4 text-center">Cargando citas...</div>;
  }

  if (appointments.length === 0) {
    return <div className="p-4 text-center text-gray-500">No hay citas programadas</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 text-xs uppercase text-gray-700">
          <tr>
            <th className="px-6 py-3 text-left">Tipo de cita</th>
            <th className="px-6 py-3 text-left">Fecha</th>
            <th className="px-6 py-3 text-left">Hora</th>
            <th className="px-6 py-3 text-left">Comentarios</th>
            <th className="px-6 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {appointments.map((appointment) => (
            <tr 
              key={appointment.id}
              className="hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {appointment.type === "visita" ? "Visita" : "Llamada"}
                {appointment.type === "visita" && appointment.propertyId && (
                  <div className="text-xs mt-1 text-gray-500">
                    {appointment.property?.title || appointment.property?.address || "N/A"}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(new Date(appointment.date))}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {appointment.time}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                {appointment.comments}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                <div className="flex justify-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEdit(appointment)}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                      <path d="m15 5 4 4"></path>
                    </svg>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onDelete(appointment.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Componente principal que gestiona todas las citas
interface AppointmentsManagerProps {
  clientId: number;
}

export function AppointmentsManager({ clientId }: AppointmentsManagerProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
  
  // Obtener las citas del cliente
  const { data: appointments = [], refetch } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments/client', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const res = await apiRequest(
        'GET',
        `/api/appointments/client/${clientId}`
      );
      return res.json();
    },
    enabled: !!clientId
  });

  // Guardar una cita (nueva o existente)
  const handleSaveAppointment = async (appointmentData: Appointment) => {
    try {
      // Determinar si es una creación o actualización
      if (appointmentData.id) {
        // Actualizar cita existente
        await apiRequest(
          'PATCH',
          `/api/appointments/${appointmentData.id}`,
          appointmentData
        );
        toast({
          title: "Cita actualizada",
          description: "La cita se ha actualizado correctamente.",
        });
      } else {
        // Crear nueva cita
        await apiRequest(
          'POST',
          '/api/appointments',
          appointmentData
        );
        toast({
          title: "Cita creada",
          description: "La cita se ha creado correctamente.",
        });
      }
      
      // Limpiar formulario y refrescar datos
      setShowForm(false);
      setEditingAppointment(undefined);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al guardar la cita.",
        variant: "destructive",
      });
    }
  };

  // Comenzar a editar una cita
  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };

  // Variables para el diálogo de confirmación
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<number | null>(null);

  // Eliminar una cita
  const handleDeleteAppointment = (appointmentId: number) => {
    // Mostrar el diálogo de confirmación
    setAppointmentToDelete(appointmentId);
    setShowDeleteDialog(true);
  };

  // Confirmar la eliminación de cita
  const confirmDeleteAppointment = async () => {
    if (!appointmentToDelete) return;
    
    try {
      await apiRequest(
        'DELETE',
        `/api/appointments/${appointmentToDelete}`
      );
      
      toast({
        title: "Cita eliminada",
        description: "La cita se ha eliminado correctamente.",
      });
      
      refetch();
      setShowDeleteDialog(false);
      setAppointmentToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al eliminar la cita.",
        variant: "destructive",
      });
    }
  };

  // Cancelar edición o creación
  const handleCancel = () => {
    setShowForm(false);
    setEditingAppointment(undefined);
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Citas</h3>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        )}
      </div>
      
      {showForm ? (
        <div className="mb-6">
          <AppointmentForm
            clientId={clientId}
            appointment={editingAppointment}
            onSave={handleSaveAppointment}
            onCancel={handleCancel}
          />
        </div>
      ) : null}
      
      <Card>
        <CardContent className="p-4">
          <AppointmentList
            clientId={clientId}
            onEdit={handleEditAppointment}
            onDelete={handleDeleteAppointment}
          />
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para eliminar cita */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esta cita será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAppointment}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}