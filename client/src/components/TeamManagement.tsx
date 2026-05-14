import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Loader2, UserMinus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/user-context";

interface TeamAgent {
  agencyAgentId: number;
  id: number;
  name: string | null;
  surname: string | null;
  email: string;
  invitationStatus: string | null;
  isActive: boolean;
}

const createAgentSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  surname: z.string().min(1, "Los apellidos son obligatorios"),
  email: z.string().email("Email inválido").min(1, "El email es obligatorio"),
  agencyId: z.string().optional(),
});

type CreateAgentFormData = z.infer<typeof createAgentSchema>;

interface TeamManagementProps {
  agencyId?: number;
}

export function TeamManagement({ agencyId }: TeamManagementProps) {
  const [showAddAgentForm, setShowAddAgentForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showHardRemoveDialog, setShowHardRemoveDialog] = useState(false);
  const [pendingInvitation, setPendingInvitation] = useState<CreateAgentFormData | null>(null);
  const [agentToRemove, setAgentToRemove] = useState<TeamAgent | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();

  // Fetch agencies managed by the admin agent
  const { data: agencies = [], isLoading: agenciesLoading } = useQuery({
    queryKey: ["/api/agents", user?.id, "agencies"],
    queryFn: () => fetch(`/api/agents/${user?.id}/agencies`).then(res => res.json()),
    enabled: !!user?.id && user?.isAdmin,
  });

  // Fetch team agents for the agency
  const { data: teamAgents = [], isLoading: teamAgentsLoading } = useQuery<TeamAgent[]>({
    queryKey: ["/api/agency-agents", agencyId],
    queryFn: () => fetch(`/api/agency-agents/${agencyId}`).then(res => res.json()),
    enabled: !!agencyId,
  });

  const form = useForm<CreateAgentFormData>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      agencyId: agencyId?.toString() || "",
    },
  });

  // Create agent invitation mutation
  const createAgentMutation = useMutation({
    mutationFn: async (agentData: CreateAgentFormData) => {
      const res = await apiRequest("POST", "/api/agents/invite", {
        name: agentData.name,
        surname: agentData.surname,
        email: agentData.email,
        agencyId: agentData.agencyId || agencyId?.toString() || null,
      });
      return res;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Invitación enviada exitosamente",
        description: `Se ha enviado una invitación a ${pendingInvitation?.email || data.email} para unirse al equipo.`,
      });
      form.reset();
      setShowAddAgentForm(false);
      setShowConfirmDialog(false);
      setPendingInvitation(null);
      // Invalidate both queries to refresh the team list
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agency-agents", agencyId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al enviar invitación",
        description: error.message || "No se pudo enviar la invitación.",
        variant: "destructive",
      });
      setShowConfirmDialog(false);
      setPendingInvitation(null);
    },
  });

  // Handle form submit - show confirmation dialog
  const handleSubmit = (data: CreateAgentFormData) => {
    setPendingInvitation(data);
    setShowConfirmDialog(true);
  };

  const removeAccessMutation = useMutation({
    mutationFn: async ({ agentId, isActive }: { agentId: number; isActive: boolean }) => {
      const actionPath = isActive ? "deactivate" : "activate";
      return apiRequest("PATCH", `/api/agency-agents/${agentId}/${actionPath}`);
    },
    onSuccess: () => {
      const removedAgentName = agentToRemove
        ? `${agentToRemove.name || ""} ${agentToRemove.surname || ""}`.trim() || agentToRemove.email
        : "El agente";
      const wasActive = agentToRemove?.isActive ?? true;
      toast({
        title: wasActive
          ? "Acceso a la plataforma desactivado"
          : "Cuenta activada correctamente",
        description: wasActive
          ? `La cuenta de ${removedAgentName} fue desactivada. Ya no podrá iniciar sesión.`
          : `La cuenta de ${removedAgentName} se activó y ya puede volver a iniciar sesión.`,
      });
      setShowRemoveDialog(false);
      setAgentToRemove(null);
      queryClient.invalidateQueries({ queryKey: ["/api/agency-agents", agencyId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar acceso",
        description: error.message || "No se pudo eliminar el acceso del agente.",
        variant: "destructive",
      });
    },
  });

  const hardRemoveMutation = useMutation({
    mutationFn: async ({ agentId }: { agentId: number }) => {
      return apiRequest("DELETE", `/api/agency-agents/${agentId}/remove-completely`);
    },
    onSuccess: () => {
      const removedAgentName = agentToRemove
        ? `${agentToRemove.name || ""} ${agentToRemove.surname || ""}`.trim() || agentToRemove.email
        : "El agente";
      toast({
        title: "Cuenta eliminada completamente",
        description: `${removedAgentName} fue eliminado de la plataforma y sus datos se reasignaron al administrador.`,
      });
      setShowHardRemoveDialog(false);
      setAgentToRemove(null);
      queryClient.invalidateQueries({ queryKey: ["/api/agency-agents", agencyId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar completamente",
        description: error.message || "No se pudo eliminar completamente la cuenta del agente.",
        variant: "destructive",
      });
    },
  });

  // Confirm and send invitation
  const confirmInvitation = () => {
    if (pendingInvitation) {
      createAgentMutation.mutate(pendingInvitation);
    }
  };

  const openRemoveDialog = (agent: TeamAgent) => {
    setAgentToRemove(agent);
    setShowRemoveDialog(true);
  };

  const openHardRemoveDialog = (agent: TeamAgent) => {
    setAgentToRemove(agent);
    setShowHardRemoveDialog(true);
  };

  const confirmRemoveAccess = () => {
    if (!agentToRemove) {
      toast({
        title: "No se pudo quitar acceso",
        description: "No se encontró el agente seleccionado.",
        variant: "destructive",
      });
      return;
    }

    removeAccessMutation.mutate({
      agentId: agentToRemove.id,
      isActive: agentToRemove.isActive,
    });
  };

  const confirmHardRemove = () => {
    if (!agentToRemove) {
      toast({
        title: "No se pudo eliminar completamente",
        description: "No se encontró el agente seleccionado.",
        variant: "destructive",
      });
      return;
    }

    hardRemoveMutation.mutate({ agentId: agentToRemove.id });
  };

  const isFormValid = () => {
    const values = form.getValues();
    return values.name && values.surname && values.email;
  };

  // Helper to get status badge
  const getStatusBadge = (agent: TeamAgent) => {
    if (!agent.isActive) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300" data-testid="badge-status-inactive">
          Inactivo
        </Badge>
      );
    }

    const { invitationStatus } = agent;
    if (invitationStatus === 'pending') {
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300" data-testid="badge-status-pending">
          Pendiente
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300" data-testid="badge-status-active">
        Activo
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header - Stacks on mobile */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Gestionar mi equipo</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Administra los agentes de tu equipo
          </p>
        </div>
        <Button 
          onClick={() => setShowAddAgentForm(true)} 
          className="w-full md:w-auto flex items-center justify-center gap-2"
          data-testid="button-add-agent"
        >
          <Plus className="h-4 w-4" />
          Invitar miembro
        </Button>
      </div>

      {/* Agent List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Agentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamAgentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Cargando equipo...</span>
            </div>
          ) : teamAgents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay agentes en el equipo todavía.</p>
              <p className="text-sm">Haz clic en "Invitar miembro" para invitar a nuevos miembros.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table - Hidden on mobile */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Apellido</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamAgents.map((agent) => (
                      <TableRow key={agent.id} data-testid={`row-agent-${agent.id}`}>
                        <TableCell className="font-medium">{agent.name || '-'}</TableCell>
                        <TableCell>{agent.surname || '-'}</TableCell>
                        <TableCell>{agent.email}</TableCell>
                        <TableCell>{getStatusBadge(agent)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant={agent.isActive ? "destructive" : "default"}
                              size="sm"
                              onClick={() => openRemoveDialog(agent)}
                              disabled={removeAccessMutation.isPending || hardRemoveMutation.isPending}
                              className="h-8 px-2 text-xs"
                              data-testid={`button-remove-agent-${agent.id}`}
                            >
                              <UserMinus className="h-4 w-4 mr-1" />
                              {agent.isActive ? "Desactivar" : "Activar"}
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => openHardRemoveDialog(agent)}
                              disabled={removeAccessMutation.isPending || hardRemoveMutation.isPending}
                              className="h-8 px-2 text-xs"
                              data-testid={`button-hard-remove-agent-${agent.id}`}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View - Shown only on mobile */}
              <div className="block md:hidden space-y-3">
                {teamAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="border rounded-lg p-4 space-y-3"
                    data-testid={`card-agent-${agent.id}`}
                  >
                    {/* Name and Role */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-base">
                          {agent.name || '-'} {agent.surname || ''}
                        </p>
                        <p className="text-sm text-muted-foreground">Agente</p>
                      </div>
                      {getStatusBadge(agent)}
                    </div>
                    
                    {/* Email */}
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-sm break-all">{agent.email}</p>
                    </div>
                    <Button
                      type="button"
                      variant={agent.isActive ? "destructive" : "default"}
                      size="sm"
                      onClick={() => openRemoveDialog(agent)}
                      disabled={removeAccessMutation.isPending}
                      className="w-full h-8 px-2 text-xs"
                      data-testid={`button-remove-agent-mobile-${agent.id}`}
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      {agent.isActive ? "Desactivar" : "Activar"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => openHardRemoveDialog(agent)}
                      disabled={removeAccessMutation.isPending || hardRemoveMutation.isPending}
                      className="w-full h-8 px-2 text-xs"
                      data-testid={`button-hard-remove-agent-mobile-${agent.id}`}
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Agent Dialog */}
      <Dialog open={showAddAgentForm} onOpenChange={setShowAddAgentForm}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full mx-auto">
          <DialogHeader>
            <DialogTitle>Añadir nuevo agente</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Introduce el nombre"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Surname */}
              <FormField
                control={form.control}
                name="surname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellidos</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Introduce los apellidos"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="Introduce el email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Agency */}
              <FormField
                control={form.control}
                name="agencyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agencia</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin agencia asignada" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {agenciesLoading ? (
                          <SelectItem value="loading" disabled>
                            Cargando agencias...
                          </SelectItem>
                        ) : (
                          agencies.map((agency: any) => (
                            <SelectItem key={agency.id} value={agency.id.toString()}>
                              {agency.agencyName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddAgentForm(false)}
                  className="w-full sm:w-auto"
                  data-testid="button-cancel-add"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={!isFormValid() || createAgentMutation.isPending}
                  className="w-full sm:w-auto"
                  data-testid="button-submit-invitation"
                >
                  {createAgentMutation.isPending ? "Enviando invitación..." : "Continuar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full mx-auto">
          <DialogHeader>
            <DialogTitle>Confirmar invitación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas enviar una invitación a <strong>{pendingInvitation?.name} {pendingInvitation?.surname}</strong> ({pendingInvitation?.email})?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingInvitation(null);
              }}
              disabled={createAgentMutation.isPending}
              className="w-full sm:w-auto"
              data-testid="button-cancel-confirm"
            >
              No
            </Button>
            <Button 
              type="button" 
              onClick={confirmInvitation}
              disabled={createAgentMutation.isPending}
              className="w-full sm:w-auto"
              data-testid="button-confirm-invitation"
            >
              {createAgentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Sí, enviar invitación"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Access Confirmation Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full mx-auto">
          <DialogHeader>
            <DialogTitle>
              {agentToRemove?.isActive
                ? "Eliminar acceso del agente a la plataforma"
                : "Activar la cuenta del agente"}
            </DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas{" "}
              {agentToRemove?.isActive ? "desactivar la cuenta de " : "activar la cuenta de "}
              <strong>
                {agentToRemove
                  ? `${agentToRemove.name || ""} ${agentToRemove.surname || ""}`.trim() || agentToRemove.email
                  : "este agente"}
              </strong>
              ?{" "}
              {agentToRemove?.isActive ? (
                <>
                  Esta acción desactivará su cuenta en la plataforma: no podrá iniciar sesión ni acceder a su panel.
                  Sus datos históricos (propiedades, clientes, mensajes, reseñas y citas) se conservarán.
                </>
              ) : (
                <>
                  Esta acción activará su cuenta en la plataforma y podrá volver a iniciar sesión con normalidad.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowRemoveDialog(false);
                setAgentToRemove(null);
              }}
              disabled={removeAccessMutation.isPending || hardRemoveMutation.isPending}
              className="w-full sm:w-auto"
              data-testid="button-cancel-remove-access"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant={agentToRemove?.isActive ? "destructive" : "default"}
              onClick={confirmRemoveAccess}
              disabled={removeAccessMutation.isPending || hardRemoveMutation.isPending}
              className="w-full sm:w-auto"
              data-testid="button-confirm-remove-access"
            >
              {removeAccessMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {agentToRemove?.isActive ? "Desactivando..." : "Activando..."}
                </>
              ) : (
                agentToRemove?.isActive ? "Sí, desactivar cuenta" : "Sí, activar la cuenta"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Remove Confirmation Dialog */}
      <Dialog open={showHardRemoveDialog} onOpenChange={setShowHardRemoveDialog}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full mx-auto">
          <DialogHeader>
            <DialogTitle>Eliminar completamente de la plataforma</DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas eliminar permanentemente la cuenta de{" "}
              <strong>
                {agentToRemove
                  ? `${agentToRemove.name || ""} ${agentToRemove.surname || ""}`.trim() || agentToRemove.email
                  : "este agente"}
              </strong>
              ? Esta acción no se puede deshacer. Sus datos se reasignarán al administrador de la agencia.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowHardRemoveDialog(false);
                setAgentToRemove(null);
              }}
              disabled={hardRemoveMutation.isPending || removeAccessMutation.isPending}
              className="w-full sm:w-auto"
              data-testid="button-cancel-hard-remove"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmHardRemove}
              disabled={hardRemoveMutation.isPending || removeAccessMutation.isPending}
              className="w-full sm:w-auto"
              data-testid="button-confirm-hard-remove"
            >
              {hardRemoveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando cuenta...
                </>
              ) : (
                "Sí, eliminar completamente"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}