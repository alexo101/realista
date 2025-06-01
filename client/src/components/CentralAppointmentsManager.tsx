import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/contexts/user-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, Check, ChevronsUpDown, Plus, Trash2, User, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AppointmentForm, Appointment, AppointmentList } from "./AppointmentForm";
import { cn } from "@/lib/utils";

// Tipo para cliente
export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
}

// Componente para gestión central de citas
export interface CentralAppointmentsManagerProps {
  preSelectedClientId?: number;
}

export function CentralAppointmentsManager({ preSelectedClientId }: CentralAppointmentsManagerProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(preSelectedClientId);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [openClientSelector, setOpenClientSelector] = useState(false);
  
  // Obtener todos los clientes del agente
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients', user?.id],
    queryFn: async () => {
      const res = await apiRequest(
        'GET',
        `/api/clients?agentId=${user?.id}`
      );
      return res.json();
    },
    enabled: !!user?.id
  });
  
  // Filtrar clientes según término de búsqueda
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );
  
  // Obtener las citas para todos los clientes o el cliente seleccionado
  const { data: appointments = [], refetch } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments', selectedClientId],
    queryFn: async () => {
      if (selectedClientId) {
        const res = await apiRequest(
          'GET',
          `/api/appointments/client/${selectedClientId}`
        );
        return res.json();
      } else {
        // Si no hay cliente seleccionado, obtener todas las citas del agente
        const res = await apiRequest(
          'GET',
          `/api/appointments/agent/${user?.id}`
        );
        return res.json();
      }
    },
    enabled: !!user?.id
  });

  // Guardar una cita (nueva o existente)
  const handleSaveAppointment = async (appointmentData: Appointment) => {
    try {
      if (!selectedClientId) {
        toast({
          title: "Error",
          description: "Debes seleccionar un cliente para crear una cita.",
          variant: "destructive",
        });
        return;
      }
      
      // Asegurarse de que la cita tenga el cliente seleccionado
      appointmentData.clientId = selectedClientId;
      appointmentData.agentId = user?.id || 0;
      
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
    setSelectedClientId(appointment.clientId);
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

  // Determinar si hay un cliente seleccionado
  const selectedClient = clients.find(client => client.id === selectedClientId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Citas</h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} disabled={!selectedClientId}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        )}
      </div>
      
      <div className="bg-slate-50 p-4 rounded-md">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-5 w-5 text-primary/60" />
          <span className="font-medium">Cliente:</span>
        </div>
        
        <Popover open={openClientSelector} onOpenChange={setOpenClientSelector}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openClientSelector}
              className="w-full justify-between"
            >
              {selectedClient ? (
                <span>{selectedClient.name} <span className="text-gray-500 text-sm ml-2">({selectedClient.email})</span></span>
              ) : (
                <span className="text-muted-foreground">Seleccionar cliente</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0">
            <Command>
              <CommandInput 
                placeholder="Buscar cliente..." 
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList>
                <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                <CommandGroup heading="Clientes">
                  {filteredClients.map((client) => (
                    <CommandItem
                      key={client.id}
                      value={client.id.toString()}
                      onSelect={(value) => {
                        setSelectedClientId(parseInt(value));
                        setOpenClientSelector(false);
                      }}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <span>{client.name}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {client.email}
                        </span>
                      </div>
                      {selectedClientId === client.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      {showForm && selectedClientId ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingAppointment ? "Editar cita" : "Nueva cita"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentForm
              clientId={selectedClientId}
              appointment={editingAppointment}
              onSave={handleSaveAppointment}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      ) : null}
      
      {selectedClientId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Citas programadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentList
              clientId={selectedClientId}
              onEdit={handleEditAppointment}
              onDelete={handleDeleteAppointment}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Selecciona un cliente para ver sus citas</h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            Para gestionar citas, primero debes seleccionar un cliente de la lista.
          </p>
        </div>
      )}
      
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