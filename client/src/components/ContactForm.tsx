import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

const formSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email("Dirección de correo electrónico inválida"),
  phone: z.string().min(6, "El número de teléfono es obligatorio"),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

interface ContactFormProps {
  propertyId: number;
  agentId?: number;
}

export function ContactForm({ propertyId, agentId }: ContactFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Si no tenemos el agentId, obtenemos primero los datos de la propiedad
      let targetAgentId = agentId;
      
      if (!targetAgentId) {
        const propertyResponse = await fetch(`/api/properties/${propertyId}`);
        if (!propertyResponse.ok) {
          throw new Error("No se pudo obtener la información de la propiedad");
        }
        const propertyData = await propertyResponse.json();
        targetAgentId = propertyData.agentId;
        
        if (!targetAgentId) {
          throw new Error("No se pudo identificar el agente para esta propiedad");
        }
      }
      
      // Enviar la consulta
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          propertyId,
          agentId: targetAgentId,
          status: "pendiente" // El servidor transformará esto a "pending" si es necesario
        }),
      });
      
      console.log("Respuesta al enviar consulta:", await response.clone().text());
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al enviar la consulta");
      }
      
      // Éxito
      toast({
        title: "Consulta enviada con éxito",
        description: "¡Nos pondremos en contacto contigo pronto!",
      });
      form.reset();
    } catch (error) {
      console.error("Error al enviar consulta:", error);
      toast({
        title: "Error al enviar consulta",
        description: (error as Error).message || "Por favor, inténtalo de nuevo más tarde",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensaje</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          Enviar mensaje
        </Button>
      </form>
    </Form>
  );
}
