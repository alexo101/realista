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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const BARCELONA_NEIGHBORHOODS = [
  "Barceloneta",
  "Born",
  "Eixample",
  "El Raval",
  "Gràcia",
  "Les Corts",
  "Poble Sec",
  "Poblenou",
  "Sagrada Familia",
  "Sant Andreu",
  "Sant Antoni",
  "Sant Martí",
  "Sants",
  "Sarrià-Sant Gervasi"
];

const formSchema = z.object({
  address: z.string().min(1, "La dirección es obligatoria"),
  type: z.enum(["Piso", "Casa"], {
    required_error: "Selecciona el tipo de inmueble",
  }),
  operationType: z.enum(["Venta", "Alquiler"], {
    required_error: "Selecciona el tipo de operación",
  }),
  description: z.string().min(1, "La descripción es obligatoria"),
  price: z.string().min(1, "El precio es obligatorio").transform(Number),
  neighborhood: z.enum(BARCELONA_NEIGHBORHOODS as [string, ...string[]], {
    required_error: "Selecciona un barrio",
  }),
});

interface PropertyFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
  onClose: () => void;
}

export function PropertyForm({ onSubmit, onClose }: PropertyFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      type: undefined,
      operationType: undefined,
      description: "",
      price: "",
      neighborhood: undefined,
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      toast({
        title: "La propiedad ha sido creada",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al crear la propiedad.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Introduce la dirección" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de inmueble</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Piso">Piso</SelectItem>
                        <SelectItem value="Casa">Casa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de operación</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la operación" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Venta">Venta</SelectItem>
                        <SelectItem value="Alquiler">Alquiler</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Describe la propiedad" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio (€)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="Introduce el precio" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="neighborhood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barrio</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el barrio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BARCELONA_NEIGHBORHOODS.map((neighborhood) => (
                        <SelectItem key={neighborhood} value={neighborhood}>
                          {neighborhood}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                Crear propiedad
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}