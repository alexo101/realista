import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, ChevronsUpDown, CalendarIcon, Trash2, Eye, EyeOff, Sparkles } from "lucide-react";
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
import { AddressAutocomplete } from "./AddressAutocomplete";
import { BARCELONA_NEIGHBORHOODS, BARCELONA_DISTRICTS_AND_NEIGHBORHOODS } from "@/utils/neighborhoods";
import { PROPERTY_FEATURES } from "@/utils/property-features";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

// Escalera options
const escaleraOptions = ["A", "B", "C"] as const;

// Planta options
const plantaOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"] as const;

// Puerta options
const puertaOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;

const formSchema = z.object({
  reference: z.string().optional(), // Campo de referencia para identificación interna
  address: z.string().min(1, "La dirección es obligatoria"),
  // Campos adicionales de dirección (privados)
  escalera: z.enum(escaleraOptions).optional(),
  planta: z.enum(plantaOptions).optional(), 
  puerta: z.enum(puertaOptions).optional(),
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
  mainImageIndex: z.number().default(-1),
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
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
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
      // Update state only from server response to avoid conflicts
      setIsActive(data.isActive);
      toast({
        title: data.isActive ? "Propiedad activada" : "Propiedad desactivada",
        description: data.isActive 
          ? "La propiedad ahora es visible para los clientes." 
          : "La propiedad está oculta para los clientes.",
      });
      // Invalidate queries to refresh the property list
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties", initialData?.id] });
      // Also invalidate search results to update neighborhood results
      queryClient.invalidateQueries({ queryKey: ["/api/search"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de la propiedad.",
        variant: "destructive",
      });
    },
  });

  const generateDescription = async () => {
    try {
      setIsGeneratingDescription(true);
      
      // Get current form values
      const formValues = form.getValues();
      
      const response = await apiRequest('POST', '/api/generate-description', {
        propertyType: formValues.type,
        operationType: formValues.operationType,
        neighborhood: formValues.neighborhood,
        bedrooms: formValues.bedrooms,
        bathrooms: formValues.bathrooms,
        size: formValues.superficie,
        price: formValues.price,
        features: formValues.features || [],
      });
      
      if (!response.ok) {
        throw new Error('Error generating description');
      }
      
      const data = await response.json();
      form.setValue('description', data.description);
      
      toast({
        title: "Descripción generada",
        description: "La descripción ha sido generada con éxito.",
      });
      
    } catch (error) {
      console.error('Error generating description:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la descripción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

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
      mainImageIndex: -1,
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
                    <AddressAutocomplete
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Escribe la dirección y selecciona de las sugerencias..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campos adicionales de dirección (privados) */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="escalera"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escalera</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {escaleraOptions.map((escalera) => (
                          <SelectItem key={escalera} value={escalera}>
                            {escalera}
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
                name="planta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planta</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {plantaOptions.map((planta) => (
                          <SelectItem key={planta} value={planta}>
                            {planta}
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
                name="puerta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puerta</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {puertaOptions.map((puerta) => (
                          <SelectItem key={puerta} value={puerta}>
                            {puerta}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              * Los campos Escalera, Planta y Puerta son opcionales y no se mostrarán públicamente
            </p>

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
                        value={field.value || undefined}
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
                        value={field.value || undefined}
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
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio (€)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Introduce el precio"
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      onKeyPress={(e) => {
                        // Only allow numbers
                        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow numeric values
                        if (value === '' || /^\d+$/.test(value)) {
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
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Número de habitaciones"
                        value={field.value === null || field.value === undefined ? "" : field.value}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'Enter') {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) {
                            field.onChange("");
                          } else if (/^\d+$/.test(value) && Number(value) > 0 && Number.isInteger(Number(value))) {
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
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Número de baños"
                        value={field.value === null || field.value === undefined ? "" : field.value}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'Enter') {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) {
                            field.onChange("");
                          } else if (/^\d+$/.test(value) && Number(value) > 0 && Number.isInteger(Number(value))) {
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
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Superficie en m²"
                        value={field.value === null || field.value === undefined ? "" : field.value}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'Enter') {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) {
                            field.onChange("");
                          } else if (/^\d+$/.test(value) && Number(value) > 0) {
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={`w-full justify-between ${!field.value && "text-muted-foreground"}`}
                        >
                          {field.value || "Buscar barrio..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar barrio..." />
                        <CommandList>
                          <CommandEmpty>No se encontró ningún barrio.</CommandEmpty>
                          {BARCELONA_DISTRICTS_AND_NEIGHBORHOODS.map((district) => (
                            <CommandGroup key={district.district} heading={district.district}>
                              {district.neighborhoods.map((neighborhood) => (
                                <CommandItem
                                  key={neighborhood}
                                  value={neighborhood}
                                  onSelect={() => {
                                    field.onChange(neighborhood);
                                    setLocalNeighborhood(neighborhood);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      field.value === neighborhood ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  {neighborhood}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                              const currentImages = field.value || [];
                              const newImages: string[] = [];

                              let loadedCount = 0;
                              const totalFiles = files.length;

                              // Convert each file to base64
                              files.forEach(file => {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  const base64String = e.target?.result as string;
                                  newImages.push(base64String);
                                  loadedCount++;

                                  // Update the form once all files are loaded
                                  if (loadedCount === totalFiles) {
                                    field.onChange([...currentImages, ...newImages]);
                                    // Reset mainImageIndex to -1 (no main image selected)
                                    form.setValue("mainImageIndex", -1);
                                  }
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
                            mainImageIndex={form.watch("mainImageIndex")}
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
                      {PROPERTY_FEATURES.map((feature) => (
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

            {/* Estado de la Propiedad - Only for editing existing properties */}
            {isEditing && initialData?.id && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Estado de la Propiedad</h3>

                {/* Property Visibility */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visibilidad</label>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div className="text-sm text-gray-700">
                      Esta propiedad está actualmente: {' '}
                      <span className={isActive ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {isActive ? "Visible" : "No Visible"}
                      </span>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (initialData?.id) {
                                toggleStatusMutation.mutate({
                                  propertyId: initialData.id,
                                  isActive: !isActive,
                                });
                              }
                            }}
                            disabled={toggleStatusMutation.isPending}
                            className={`h-8 w-8 p-0 hover:bg-transparent ${
                              isActive ? "text-blue-600 hover:text-blue-700" : "text-gray-400 hover:text-gray-500"
                            }`}
                          >
                            {isActive ? (
                              <Eye className="h-5 w-5" />
                            ) : (
                              <EyeOff className="h-5 w-5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isActive ? "Ocultar de los clientes" : "Mostrar a los clientes"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Textarea {...field} placeholder="Describe la propiedad" className="pr-20" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={generateDescription}
                        disabled={isGeneratingDescription}
                        className="absolute top-2 right-2 h-8 px-3 text-primary hover:text-primary/80"
                      >
                        {isGeneratingDescription ? (
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-1" />
                            <span className="text-xs">Generar</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between items-center">
              {/* Delete button - only show when editing */}
              {isEditing && initialData?.id ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-50"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar Propiedad
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
              ) : (
                <div></div>
              )}
              
              {/* Right side buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  type="button"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || 
                    ((form.watch("images")?.length || 0) > 0 && (form.watch("mainImageIndex") ?? -1) === -1)
                  }
                >
                  {isSubmitting 
                    ? 'Guardando...' 
                    : ((form.watch("images")?.length || 0) > 0 && (form.watch("mainImageIndex") ?? -1) === -1)
                      ? 'Selecciona imagen principal'
                      : `${isEditing ? 'Actualizar' : 'Crear'} propiedad`
                  }
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}