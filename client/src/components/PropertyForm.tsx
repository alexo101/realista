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
import { DraggableImageGallery } from "./DraggableImageGallery";

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
  reference: z.string().optional(), // Campo de referencia para identificación interna
  address: z.string().min(1, "La dirección es obligatoria"),
  type: z.enum(["Piso", "Casa"], {
    required_error: "Selecciona el tipo de inmueble",
  }),
  operationType: z.enum(["Venta", "Alquiler"], {
    required_error: "Selecciona el tipo de operación",
  }),
  description: z.string().min(1, "La descripción es obligatoria"),
  price: z.coerce.number()
    .min(1, "El precio es obligatorio"),
  neighborhood: z.enum(BARCELONA_NEIGHBORHOODS as [string, ...string[]], {
    required_error: "Selecciona un barrio",
  }),
  bedrooms: z.coerce.number()
    .int("El número de habitaciones debe ser un número entero")
    .min(1, "Debe tener al menos 1 habitación")
    .optional()
    .nullable(),
  bathrooms: z.coerce.number()
    .int("El número de baños debe ser un número entero")
    .min(1, "Debe tener al menos 1 baño")
    .optional()
    .nullable(),
  superficie: z.coerce.number()
    .min(1, "La superficie debe ser mayor que 0")
    .optional()
    .nullable(),
  title: z.string().optional(),
  images: z.array(z.string()).optional(),
  mainImageIndex: z.number().default(0),
});

interface PropertyFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
  onClose: () => void;
  initialData?: z.infer<typeof formSchema>;
  isEditing?: boolean;
}

export function PropertyForm({ onSubmit, onClose, initialData, isEditing = false }: PropertyFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      reference: "", // Nueva referencia interna
      address: "",
      type: undefined as any,
      operationType: undefined as any,
      description: "",
      price: "" as any, // Se convertirá a número en el validador
      bedrooms: 1 as any, // Default to 1 bedroom
      bathrooms: 1 as any, // Default to 1 bathroom
      superficie: "" as any, // Nuevo campo para superficie en m²
      neighborhood: undefined as any,
      title: "",
      images: [],
      mainImageIndex: 0,
    },
  });
  
  // Handler for image changes with main image index
  const handleImageChange = (newImages: string[], mainImageIndex: number) => {
    form.setValue("images", newImages);
    form.setValue("mainImageIndex", mainImageIndex);
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      toast({
        title: `La propiedad ha sido ${isEditing ? 'actualizada' : 'creada'}`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al guardar la propiedad.",
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
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Referencia interna para identificar la propiedad" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      placeholder="Introduce el precio"
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value || Number(value) > 0) {
                          field.onChange(value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Habitaciones</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Número de habitaciones"
                        value={field.value === null || field.value === undefined ? "" : field.value}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) {
                            field.onChange("");
                          } else if (Number(value) > 0 && Number.isInteger(Number(value))) {
                            field.onChange(Number(value));
                          }
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Baños</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Número de baños"
                        value={field.value === null || field.value === undefined ? "" : field.value}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) {
                            field.onChange("");
                          } else if (Number(value) > 0 && Number.isInteger(Number(value))) {
                            field.onChange(Number(value));
                          }
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="superficie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Superficie (m²)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Superficie en m²"
                        value={field.value === null || field.value === undefined ? "" : field.value}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) {
                            field.onChange("");
                          } else if (Number(value) > 0) {
                            field.onChange(Number(value));
                          }
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Título" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subir imágenes</FormLabel>
                  <FormControl>
                    <div className="flex flex-col space-y-2">
                      <div className="border-2 border-dashed border-gray-300 rounded-md p-4 hover:border-primary cursor-pointer">
                        <Input 
                          type="file" 
                          accept="image/*"
                          multiple
                          id="imageUpload" 
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) {
                              // Convert each file to base64
                              files.forEach(file => {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  const base64String = e.target?.result as string;
                                  field.onChange([...(field.value || []), base64String]);
                                };
                                reader.readAsDataURL(file);
                              });
                            }
                          }}
                        />
                        <label htmlFor="imageUpload" className="flex flex-col items-center justify-center cursor-pointer">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">Haz clic para subir o arrastra y suelta</p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                        </label>
                      </div>
                      {field.value && field.value.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Organiza las imágenes (arrastra para reordenar, haz clic en ✓ para establecer como imagen principal)</h4>
                          <DraggableImageGallery 
                            images={field.value} 
                            onChange={handleImageChange} 
                          />
                        </div>
                      )}
                    </div>
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
                disabled={isSubmitting}
              >
                {isEditing ? 'Actualizar' : 'Crear'} propiedad
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}