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
  price: z.string()
    .min(1, "El precio es obligatorio")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "El precio debe ser un número positivo",
    })
    .transform(Number),
  neighborhood: z.enum(BARCELONA_NEIGHBORHOODS as [string, ...string[]], {
    required_error: "Selecciona un barrio",
  }),
  title: z.string().optional(),
  images: z.array(z.string()).optional(),
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
      address: "",
      type: undefined as any,
      operationType: undefined as any,
      description: "",
      price: "" as any, // Se convertirá a número en el validador
      neighborhood: undefined as any,
      title: "",
      images: [],
    },
  });

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
                            // En un caso real, aquí subiríamos la imagen a un servicio
                            // Por ahora, solo actualizamos el campo con URLs ficticias basadas en nombres de archivos
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) {
                              const fileNames = files.map((file, index) => 
                                `https://example.com/images/${file.name}`
                              );
                              field.onChange([...(field.value || []), ...fileNames]);
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
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {field.value.map((url, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                                <img src={url} alt={`Property ${index}`} className="object-cover w-full h-full" onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/150';
                                }} />
                              </div>
                              <button 
                                type="button"
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  if (field.value) {
                                    const newImages = [...field.value];
                                    newImages.splice(index, 1);
                                    field.onChange(newImages);
                                  }
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
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
                disabled={!form.formState.isValid || isSubmitting}
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