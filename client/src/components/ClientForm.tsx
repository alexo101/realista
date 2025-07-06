import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AppointmentsManager } from "./AppointmentForm";

const formSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "El nombre es obligatorio"),
  surname: z.string().optional(),
  phone: z.string()
    .min(1, "El número de teléfono es obligatorio")
    .superRefine((val, ctx) => {
      if (!/^[0-9]*$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El teléfono solo debe contener números",
        });
      } else if (val.length > 0 && val.length < 9) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Faltan ${9 - val.length} dígitos para completar el número`,
        });
      } else if (val.length > 9) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El número tiene demasiados dígitos",
        });
      } else if (val.length === 9 && !/^[67|89][0-9]{8}$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Los teléfonos españoles deben empezar por 6, 7, 8 o 9",
        });
      }
    }),
  email: z.string().email("Por favor, introduce un email válido"),
});

interface ClientFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
  onClose: () => void;
  initialData?: z.infer<typeof formSchema>;
  isEditing?: boolean;
}

export function ClientForm({ onSubmit, onClose, initialData, isEditing = false }: ClientFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      id: undefined,
      name: "",
      phone: "",
      email: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      toast({
        title: `El cliente ha sido ${isEditing ? 'actualizado' : 'creado'}`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al guardar el cliente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Introduce el nombre" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="surname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Introduce el apellido" />
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
                    <FormLabel>Número de teléfono</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          {...field} 
                          placeholder="Introduce el número de teléfono" 
                          type="tel"
                          className={`${field.value && field.value.length > 0 ? 'pr-16' : ''}`}
                          onKeyPress={(e) => {
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                        />
                        {field.value && field.value.length > 0 && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500">
                            {field.value.length}/9
                          </div>
                        )}
                      </div>
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Introduce el email" type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  type="button"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!form.formState.isValid || isSubmitting}
                >
                  {isEditing ? 'Actualizar' : 'Crear'} cliente
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* El componente de Citas solo se muestra cuando estamos editando un cliente existente */}
      {isEditing && initialData?.id && (
        <AppointmentsManager clientId={initialData.id} />
      )}
    </div>
  );
}