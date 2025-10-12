import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/contexts/user-context";
import { Building } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AgencyForm, type Agency } from "./AgencyForm";

export function AgenciesList() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener la agencia del usuario (solo puede tener una)
  const { data: agencies, isLoading } = useQuery<Agency[]>({
    queryKey: ['/api/agencies', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/agencies?adminAgentId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch agencies');
      return response.json();
    },
    enabled: !!user?.id && user?.isAdmin,
  });

  const currentAgency = agencies?.[0] || null;

  // Mutación para actualizar la agencia
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

  // Manejar la actualización de la agencia
  const handleUpdateAgency = async (data: Partial<Agency>) => {
    if (!currentAgency?.id) return;
    await updateAgencyMutation.mutateAsync({ ...data, id: currentAgency.id });
  };

  return (
    <div className="space-y-6">
      {/* Mostrar formulario de edición directamente */}
      {isLoading ? (
        <div className="text-center p-4">Cargando agencia...</div>
      ) : currentAgency ? (
        <AgencyForm
          agency={currentAgency}
          onSubmit={handleUpdateAgency}
          onCancel={() => {}} // No hay cancelación porque siempre mostramos el formulario
          isSubmitting={updateAgencyMutation.isPending}
        />
      ) : (
        <div className="text-center p-8 border rounded-md bg-muted/20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-4">
            <Building className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No tienes agencia asignada</h3>
          <p className="text-sm text-muted-foreground">
            Contacta con el soporte para configurar tu agencia.
          </p>
        </div>
      )}
    </div>
  );
}