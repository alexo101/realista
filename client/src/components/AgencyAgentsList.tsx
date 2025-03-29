import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AgencyAgentForm } from "./AgencyAgentForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Pencil, Trash2, Plus, Mail, UserCircle } from "lucide-react";
import { useUser } from "@/contexts/user-context";

// Tipo de agente de agencia
type AgencyAgent = {
  id: number;
  agencyId: number;
  agentName: string;
  agentSurname: string;
  agentEmail: string;
  createdAt: string;
};

export function AgencyAgentsList() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const agencyId = user?.id;
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Consultar la lista de agentes de la agencia
  const { data: agents = [], isLoading, isError } = useQuery<AgencyAgent[]>({
    queryKey: ["/api/agency-agents", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const response = await apiRequest("GET", `/api/agency-agents/${agencyId}`);
      return response.json();
    },
    enabled: !!agencyId && !user?.isAgent, // Solo hacer la consulta si el usuario es una agencia
  });

  // Mutación para eliminar un agente
  const deleteAgentMutation = useMutation({
    mutationFn: (agentId: number) => 
      apiRequest("DELETE", `/api/agency-agents/${agentId}`),
    onSuccess: () => {
      // Invalidar la consulta para actualizar la lista
      queryClient.invalidateQueries({ queryKey: ["/api/agency-agents", agencyId] });
      toast({
        title: "Agente eliminado",
        description: "El agente ha sido eliminado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el agente. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  });

  const handleDeleteAgent = (agentId: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este agente?")) {
      deleteAgentMutation.mutate(agentId);
    }
  };

  // Si el usuario no está autenticado o no es una agencia, no mostrar nada
  if (!user || user.isAgent) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Agentes de la Agencia</h3>
        <Button 
          onClick={() => setIsFormOpen(true)}
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" /> Añadir Agente
        </Button>
      </div>
      
      <Separator className="my-4" />
      
      {isLoading ? (
        <p>Cargando agentes...</p>
      ) : isError ? (
        <p className="text-red-500">Error al cargar los agentes</p>
      ) : agents.length === 0 ? (
        <div className="bg-muted/50 p-4 rounded-lg text-center">
          <p>No hay agentes registrados en esta agencia.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Haz clic en "Añadir Agente" para añadir tu primer agente.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 mt-4">
          {agents.map((agent: AgencyAgent) => (
            <Card key={agent.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <UserCircle className="mr-2 h-5 w-5" />
                      {agent.agentName} {agent.agentSurname}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Mail className="mr-2 h-4 w-4" />
                      {agent.agentEmail}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAgent(agent.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
      
      <AgencyAgentForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        agencyId={agencyId as number} 
      />
    </div>
  );
}