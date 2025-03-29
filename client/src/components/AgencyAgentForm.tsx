import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Esquema para validar el formulario
const formSchema = z.object({
  agentName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  agentSurname: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  agentEmail: z.string().email("Email inválido"),
  agencyId: z.number(),
});

type AgencyAgentFormProps = {
  isOpen: boolean;
  onClose: () => void;
  agencyId: number;
};

export function AgencyAgentForm({ isOpen, onClose, agencyId }: AgencyAgentFormProps) {
  const queryClient = useQueryClient();
  
  // Configuración del formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agentName: "",
      agentSurname: "",
      agentEmail: "",
      agencyId: agencyId,
    },
  });

  // Mutación para crear un nuevo agente
  const createAgentMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => 
      apiRequest("POST", "/api/agency-agents", data),
    onSuccess: () => {
      // Invalidar la consulta para refrescar la lista de agentes
      queryClient.invalidateQueries({ queryKey: ["/api/agency-agents", agencyId] });
      toast({
        title: "Agente añadido",
        description: "El agente ha sido añadido a la agencia correctamente",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      console.error("Error al crear agente:", error);
      toast({
        title: "Error",
        description: "No se pudo añadir el agente. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createAgentMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Agente a la Agencia</DialogTitle>
          <DialogDescription>
            Introduce los datos del agente que deseas añadir a tu agencia.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="agentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del agente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agentSurname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Apellido del agente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agentEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Email del agente" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="mr-2"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createAgentMutation.isPending}
              >
                {createAgentMutation.isPending ? "Añadiendo..." : "Añadir Agente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}