import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { DraggableImageGallery } from "./DraggableImageGallery";
import { NeighborhoodSelector } from "./NeighborhoodSelector";
import { BARCELONA_NEIGHBORHOODS, BARCELONA_DISTRICTS_AND_NEIGHBORHOODS } from "@/utils/neighborhoods";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

const propertyTypes = [
  "Vivienda",
  "Oficinas",
  "Locales",
  "Parking",
  "Terrenos",
  "Trasteros",
  "Edificios"
] as const;

const housingTypes = [
  "Pisos",
  "Áticos",
  "Dúplex",
  "Casa o chalet independiente",
  "Casa o chalet adosado",
  "Casa o chalet pareado"
] as const;

const housingStatus = [
  "Disponible sin limitación",
  "Sin cédula de habitabilidad",
  "Nuda propiedad",
  "Alquilada con inquilinos",
  "Ocupada ilegalmente",
  "De banco"
] as const;

const floorOptions = [
  "Última planta",
  "Plantas intermedias",
  "Bajos"
] as const;

const availabilityOptions = [
  "Inmediatamente",
  "A partir de"
] as const;

const features = [
  { id: "aire-acondicionado", label: "Aire acondicionado" },
  { id: "calefaccion", label: "Calefacción" },
  { id: "armarios-empotrados", label: "Armarios empotrados" },
  { id: "ascensor", label: "Ascensor" },
  { id: "terraza", label: "Terraza" },
  { id: "balcon", label: "Balcón" },
  { id: "exterior", label: "Exterior" },
  { id: "garaje", label: "Garaje" },
  { id: "jardin", label: "Jardín" },
  { id: "piscina", label: "Piscina" },
  { id: "trastero", label: "Trastero" },
  { id: "accesible", label: "Accesible" },
  { id: "permite-mascota", label: "Permite mascota" },
  { id: "vistas-mar", label: "Vistas al mar" },
  { id: "bien-conectado", label: "Bien conectado" },
  { id: "amueblado", label: "Amueblado" },
  { id: "electrodomesticos", label: "Electrodomésticos" },
  { id: "bano-suite", label: "Baño en-suite" }
];

const formSchema = z.object({
  reference: z.string().optional(), // Campo de referencia para identificación interna
  address: z.string().min(1, "La dirección es obligatoria"),
  type: z.enum(propertyTypes, {
    required_error: "Selecciona el tipo de inmueble",
  }),
  housingType: z.enum(housingTypes, {
    required_error: "Selecciona el tipo de vivienda",
  }).optional(),
  housingStatus: z.enum(housingStatus).optional(),
  floor: z.enum(floorOptions).optional(),
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
  features: z.array(z.string()).default([]),
  availability: z.enum(availabilityOptions).default("Inmediatamente"),
  availabilityDate: z.date().optional(),
});

interface PropertyFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
  onClose: () => void;
  initialData?: z.infer<typeof formSchema> & { id?: number; isActive?: boolean };
  isEditing?: boolean;
}

export function PropertyForm({ onSubmit, onClose, initialData, isEditing = false }: PropertyFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [localNeighborhood, setLocalNeighborhood] = useState<string | undefined>(
    initialData?.neighborhood
  );
  
  // Actualizar el barrio local cuando cambia el initialData
  useEffect(() => {
    if (initialData?.neighborhood) {
      setLocalNeighborhood(initialData.neighborhood);
    }
    if (initialData?.isActive !== undefined) {
      setIsActive(initialData.isActive);
    }
  }, [initialData]);

  // Mutations for property management
  const deleteMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      const response = await apiRequest("DELETE", `/api/properties/${propertyId}`);
      if (!response.ok) {
        throw new Error("Error al eliminar la propiedad");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Propiedad eliminada",
        description: "La propiedad ha sido eliminada permanentemente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la propiedad.",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ propertyId, isActive }: { propertyId: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/properties/${propertyId}/toggle-status`, {
        isActive,
      });
      if (!response.ok) {
        throw new Error("Error al cambiar el estado de la propiedad");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setIsActive(data.isActive);
      toast({
        title: data.isActive ? "Propiedad activada" : "Propiedad desactivada",
        description: data.isActive 
          ? "La propiedad ahora es visible para los clientes." 
          : "La propiedad está oculta para los clientes.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de la propiedad.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      reference: "", // Nueva referencia interna
      address: "",
      type: undefined as any,
      operationType: undefined as any,
      housingType: undefined,
      housingStatus: undefined,
      floor: undefined,
      description: "",
      price: "" as any, // Se convertirá a número en el validador
      bedrooms: 1 as any, // Default to 1 bedroom
      bathrooms: 1 as any, // Default to 1 bathroom
      superficie: "" as any, // Nuevo campo para superficie en m²
      neighborhood: undefined as any,
      title: "",
      images: [],
      mainImageIndex: 0,
      features: [],
      availability: "Inmediatamente",
      availabilityDate: undefined,
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
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Si cambia a un valor que no es "Vivienda", limpiar los campos relacionados
                        if (value !== "Vivienda") {
                          form.setValue("housingType", undefined);
                          form.setValue("housingStatus", undefined);
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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

            {/* Campos que aparecen solo cuando el tipo es "Vivienda" */}
            {form.watch("type") === "Vivienda" && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="housingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de vivienda</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo de vivienda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {housingTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
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
                  name="housingStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situación de la vivienda</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona la situación" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {housingStatus.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Campo de planta */}
            {form.watch("type") === "Vivienda" && (
              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planta</FormLabel>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      {floorOptions.map((option) => (
                        <FormItem key={option} className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value={option} />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {option}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                  <FormControl>
                    <Select
                      onValueChange={(value) => {
                        // Actualizar el formulario con el valor seleccionado
                        field.onChange(value);
                        // Actualizar el estado local
                        setLocalNeighborhood(value);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un barrio" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {BARCELONA_DISTRICTS_AND_NEIGHBORHOODS.map((district) => (
                          <div key={district.district}>
                            {/* Encabezado del distrito (no seleccionable) */}
                            <div className="font-bold px-2 py-1 text-sm text-gray-500">
                              {district.district}
                            </div>
                            
                            {/* Barrios del distrito */}
                            {district.neighborhoods.map((neighborhood) => (
                              <SelectItem key={neighborhood} value={neighborhood}>
                                {neighborhood}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
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
            
            {/* Sección de Características */}
            <FormField
              control={form.control}
              name="features"
              render={() => (
                <FormItem>
                  <FormLabel>Características</FormLabel>
                  <div className="border rounded-md p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {features.map((feature) => (
                        <FormField
                          key={feature.id}
                          control={form.control}
                          name="features"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={feature.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(feature.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, feature.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== feature.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {feature.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Sección de Disponibilidad */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Disponibilidad</FormLabel>
                    <div className="flex flex-col space-y-1">
                      <RadioGroup
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value === "Inmediatamente") {
                            form.setValue("availabilityDate", undefined);
                          }
                        }}
                        value={field.value}
                        className="flex flex-col space-y-2"
                      >
                        {availabilityOptions.map((option) => (
                          <FormItem key={option} className="flex flex-row items-center space-x-3">
                            <FormControl>
                              <RadioGroupItem value={option} />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {option}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch("availability") === "A partir de" && (
                <FormField
                  control={form.control}
                  name="availabilityDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de disponibilidad</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value && "text-muted-foreground"
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Property Management Section - Only for editing existing properties */}
            {isEditing && initialData?.id && (
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Gestión de propiedad</h3>
                  
                  <div className="space-y-4">
                    {/* Toggle Property Status */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {isActive ? (
                          <Eye className="h-5 w-5 text-green-600" />
                        ) : (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <p className="font-medium">
                            {isActive ? "Propiedad visible" : "Propiedad oculta"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {isActive 
                              ? "Los clientes pueden ver esta propiedad en las búsquedas" 
                              : "Esta propiedad está oculta para los clientes"}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={(checked) => {
                          if (initialData?.id) {
                            toggleStatusMutation.mutate({
                              propertyId: initialData.id,
                              isActive: checked,
                            });
                          }
                        }}
                        disabled={toggleStatusMutation.isPending}
                      />
                    </div>

                    {/* Delete Property */}
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-center space-x-3">
                        <Trash2 className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium text-red-900">Eliminar propiedad</p>
                          <p className="text-sm text-red-700">
                            Esta acción no se puede deshacer
                          </p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará permanentemente la propiedad y no se puede deshacer.
                              Toda la información y las imágenes asociadas se perderán.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                if (initialData?.id) {
                                  deleteMutation.mutate(initialData.id);
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Sí, eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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