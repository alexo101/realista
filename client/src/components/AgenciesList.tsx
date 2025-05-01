import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/contexts/user-context";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus, Building, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AgencyForm, type Agency } from "./AgencyForm";
import { AgencyAgentsList } from "./AgencyAgentsList";

export function AgenciesList() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [isAddingAgency, setIsAddingAgency] = useState(false);

  // Obtener la lista de agencias del usuario
  const { data: agencies, isLoading } = useQuery<Agency[]>({
    queryKey: ['/api/agencies', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/agencies?adminAgentId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch agencies');
      return response.json();
    },
    enabled: !!user?.id && user?.isAdmin,
  });

  // Mutación para crear una nueva agencia
  const createAgencyMutation = useMutation({
    mutationFn: async (data: Partial<Agency>) => {
      const response = await apiRequest('POST', '/api/agencies', {
        ...data,
        adminAgentId: user!.id,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear la agencia');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agencies', user?.id] });
      setIsAddingAgency(false);
      toast({
        title: "Agencia creada",
        description: "La agencia se ha creado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "No se pudo crear la agencia",
        variant: "destructive",
      });
    },
  });

  // Mutación para actualizar una agencia existente
  const updateAgencyMutation = useMutation({
    mutationFn: async (data: Partial<Agency> & { id: number }) => {
      const { id, ...agencyData } = data;
      const response = await apiRequest('PATCH', `/api/agencies/${id}`, agencyData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar la agencia');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agencies', user?.id] });
      setEditingAgency(null);
      toast({
        title: "Agencia actualizada",
        description: "La agencia se ha actualizado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "No se pudo actualizar la agencia",
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar una agencia
  const deleteAgencyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/agencies/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar la agencia');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agencies', user?.id] });
      toast({
        title: "Agencia eliminada",
        description: "La agencia se ha eliminado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "No se pudo eliminar la agencia",
        variant: "destructive",
      });
    },
  });

  // Manejar la creación de una nueva agencia
  const handleCreateAgency = async (data: Partial<Agency>) => {
    await createAgencyMutation.mutate(data);
  };

  // Manejar la actualización de una agencia existente
  const handleUpdateAgency = async (data: Partial<Agency>) => {
    if (!editingAgency?.id) return;
    await updateAgencyMutation.mutate({ ...data, id: editingAgency.id });
  };

  // Manejar la eliminación de una agencia
  const handleDeleteAgency = async (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta agencia? Esta acción no se puede deshacer.")) {
      await deleteAgencyMutation.mutate(id);
    }
  };

  // Cancelar la edición o creación de agencias
  const handleCancel = () => {
    setEditingAgency(null);
    setIsAddingAgency(false);
  };

  return (
    <div className="space-y-6">
      {/* Botón para añadir una nueva agencia */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium">Agencias</h3>
        <Button
          onClick={() => setIsAddingAgency(true)}
          disabled={isAddingAgency || !!editingAgency}
        >
          <Plus className="mr-2 h-4 w-4" />
          Añadir agencia
        </Button>
      </div>

      {/* Formulario para añadir una nueva agencia */}
      {isAddingAgency && (
        <AgencyForm
          agency={null}
          onSubmit={handleCreateAgency}
          onCancel={handleCancel}
          isSubmitting={createAgencyMutation.isPending}
        />
      )}

      {/* Formulario para editar una agencia existente */}
      {editingAgency && (
        <AgencyForm
          agency={editingAgency}
          onSubmit={handleUpdateAgency}
          onCancel={handleCancel}
          isSubmitting={updateAgencyMutation.isPending}
        />
      )}

      {/* Lista de agencias */}
      {isLoading ? (
        <div className="text-center p-4">Cargando agencias...</div>
      ) : agencies && agencies.length > 0 ? (
        <div className="space-y-8">
          {agencies.map((agency) => (
            <Card key={agency.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{agency.agencyName}</CardTitle>
                    {agency.agencyAddress && (
                      <CardDescription>{agency.agencyAddress}</CardDescription>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAgency(agency)}
                      disabled={!!editingAgency || isAddingAgency}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pb-2 space-y-4">
                
                {agency.agencyInfluenceNeighborhoods && agency.agencyInfluenceNeighborhoods.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Barrios de influencia:</h4>
                    <div className="flex flex-wrap gap-1">
                      {agency.agencyInfluenceNeighborhoods.slice(0, 5).map((neighborhood, idx) => (
                        <span key={idx} className="text-xs bg-primary/10 text-primary rounded-full px-2 py-1">
                          {neighborhood}
                        </span>
                      ))}
                      {agency.agencyInfluenceNeighborhoods.length > 5 && (
                        <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-1">
                          +{agency.agencyInfluenceNeighborhoods.length - 5} más
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 border rounded-md bg-muted/20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-4">
            <Building className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No tienes agencias creadas</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crea tu primera agencia para empezar a gestionar propiedades y agentes.
          </p>
          <Button
            onClick={() => setIsAddingAgency(true)}
            disabled={isAddingAgency}
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir mi primera agencia
          </Button>
        </div>
      )}
    </div>
  );
}