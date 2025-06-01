import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/user-context";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();

  // Fetch agencies managed by the admin agent
  const { data: agencies = [], isLoading: agenciesLoading } = useQuery({
    queryKey: ["/api/agents", user?.id, "agencies"],
    queryFn: () => fetch(`/api/agents/${user?.id}/agencies`).then(res => res.json()),
    enabled: !!user?.id && user?.isAdmin,
  });

  const form = useForm<CreateAgentFormData>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      agencyId: "",
    },
  });

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: async (agentData: CreateAgentFormData) => {
      return apiRequest("/api/agents", "POST", {
        ...agentData,
        password: "defaultPassword123", // Default password, agent can change later
        agencyId: agentData.agencyId || null,
        isAdmin: false,
      });
    },
    onSuccess: () => {
      toast({
        title: "Agente creado exitosamente",
        description: "El nuevo agente ha sido añadido al equipo.",
      });
      form.reset();
      setShowAddAgentForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear agente",
        description: error.message || "No se pudo crear el agente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CreateAgentFormData) => {
    createAgentMutation.mutate(data);
  };

  const isFormValid = () => {
    const values = form.getValues();
    return values.name && values.surname && values.email;
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

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Agentes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              +2 desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Agentes Activos
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">
              80% del equipo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nuevos este mes
            </CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Incorporados recientemente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agent List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Agentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            La lista de agentes se mostrará aquí una vez que se implemente la funcionalidad de consulta.
          </div>
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
                          <SelectValue placeholder="Seleccionar agencia (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin agencia</SelectItem>
                        {agenciesLoading ? (
                          <SelectItem value="" disabled>
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
                >
                  {createAgentMutation.isPending ? "Creando..." : "Crear agente"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}