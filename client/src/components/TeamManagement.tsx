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
import { Plus, Users, UserPlus, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/user-context";

interface TeamAgent {
  id: number;
  name: string | null;
  surname: string | null;
  email: string;
  invitationStatus: string | null;
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
  const [pendingInvitation, setPendingInvitation] = useState<CreateAgentFormData | null>(null);
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
      return res.json();
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

  // Confirm and send invitation
  const confirmInvitation = () => {
    if (pendingInvitation) {
      createAgentMutation.mutate(pendingInvitation);
    }
  };

  const isFormValid = () => {
    const values = form.getValues();
    return values.name && values.surname && values.email;
  };

  // Helper to get status badge
  const getStatusBadge = (invitationStatus: string | null) => {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestionar mi equipo</h1>
          <p className="text-muted-foreground">
            Administra los agentes de tu equipo
          </p>
        </div>
        <Button onClick={() => setShowAddAgentForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Añadir agentes
        </Button>
      </div>

      

      {/* Agent List Table */}
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
              <p className="text-sm">Haz clic en "Añadir agentes" para invitar a nuevos miembros.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Apellido</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamAgents.map((agent) => (
                  <TableRow key={agent.id} data-testid={`row-agent-${agent.id}`}>
                    <TableCell className="font-medium">{agent.name || '-'}</TableCell>
                    <TableCell>{agent.surname || '-'}</TableCell>
                    <TableCell>{agent.email}</TableCell>
                    <TableCell>{getStatusBadge(agent.invitationStatus)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Agent Dialog */}
      <Dialog open={showAddAgentForm} onOpenChange={setShowAddAgentForm}>
        <DialogContent className="max-w-md">
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
              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddAgentForm(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={!isFormValid() || createAgentMutation.isPending}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar invitación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas enviar una invitación a <strong>{pendingInvitation?.name} {pendingInvitation?.surname}</strong> ({pendingInvitation?.email})?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingInvitation(null);
              }}
              disabled={createAgentMutation.isPending}
              data-testid="button-cancel-confirm"
            >
              No
            </Button>
            <Button 
              type="button" 
              onClick={confirmInvitation}
              disabled={createAgentMutation.isPending}
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
    </div>
  );
}