import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { X } from "lucide-react";

// Esquema de validación para el formulario de agente
const agentFormSchema = z.object({
  agentName: z.string().min(2, { message: "El nombre es obligatorio" }),
  agentSurname: z.string().min(2, { message: "El apellido es obligatorio" }),
  agentEmail: z.string().email({ message: "Email no válido" }),
  agencyId: z.number().int().positive(),
});

type AgentFormValues = z.infer<typeof agentFormSchema>;

type AgencyAgentFormProps = {
  isOpen: boolean;
  onClose: () => void;
  agencyId: number;
};

export function AgencyAgentForm({ isOpen, onClose, agencyId }: AgencyAgentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Configurar el formulario con react-hook-form y zod
  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      agentName: "",
      agentSurname: "",
      agentEmail: "",
      agencyId: agencyId,
    },
  });

  // Mutación para crear el agente
  const createAgentMutation = useMutation({
    mutationFn: async (data: AgentFormValues) => {
      const response = await apiRequest("POST", "/api/agency-agents", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear el agente");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidar la consulta para actualizar la lista de agentes
      queryClient.invalidateQueries({ queryKey: ["/api/agency-agents", agencyId] });
      toast({
        title: "Agente añadido",
        description: "El agente ha sido añadido correctamente a la agencia",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el agente",
        variant: "destructive",
      });
    },
  });

  // Manejar el envío del formulario
  const onSubmit = (data: AgentFormValues) => {
    createAgentMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Añadir agente a la agencia</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Completa los datos del agente que quieres añadir a tu agencia
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
                  <FormLabel>Apellidos</FormLabel>
                  <FormControl>
                    <Input placeholder="Apellidos del agente" {...field} />
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

            <FormField
              control={form.control}
              name="agencyId"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input type="hidden" {...field} value={agencyId} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createAgentMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createAgentMutation.isPending}
              >
                {createAgentMutation.isPending ? "Añadiendo..." : "Añadir agente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}