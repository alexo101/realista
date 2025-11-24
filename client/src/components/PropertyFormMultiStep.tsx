import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PropertyFormStepper } from "./PropertyFormStepper";
import { ImageUploader } from "./ImageUploader";
import { DraggableImageGallery } from "./DraggableImageGallery";
import { AddressValidator } from "./AddressValidator";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/user-context";
import { ALL_CITIES } from "@/utils/neighborhoods";
import { PROPERTY_FEATURES } from "@/utils/property-features";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, ChevronsUpDown, Sparkles, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

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

const escaleraOptions = ["A", "B", "C"] as const;
const plantaOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"] as const;
const puertaOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;
const availabilityOptions = ["Inmediatamente", "A partir de"] as const;

// Step 1 schema: Basic Information
const step1Schema = z.object({
  reference: z.string().optional(),
  type: z.enum(propertyTypes, { required_error: "Selecciona el tipo de inmueble" }),
  operationType: z.enum(["Venta", "Alquiler"], { required_error: "Selecciona el tipo de operación" }),
  price: z.coerce.number().min(1, "El precio es obligatorio"),
  bedrooms: z.coerce.number().int("Debe ser un número entero").min(1, "Al menos 1").optional().nullable(),
  bathrooms: z.coerce.number().int("Debe ser un número entero").min(1, "Al menos 1").optional().nullable(),
  superficie: z.coerce.number().min(1, "Debe ser mayor que 0").optional().nullable(),
});

// Step 2 schema: Location
const step2Schema = step1Schema.extend({
  locality: z.string().optional(),
  streetName: z.string().optional(),
  streetNumber: z.string().optional(),
  address: z.string().min(1, "La dirección es obligatoria"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  escalera: z.enum(escaleraOptions).nullable().optional(),
  planta: z.enum(plantaOptions).nullable().optional(),
  puerta: z.enum(puertaOptions).nullable().optional(),
  neighborhood: z.string().min(1, "Selecciona un barrio"),
});

// Step 3 schema: Features
const step3Schema = step2Schema.extend({
  features: z.array(z.string()).default([]),
  availability: z.enum(availabilityOptions).default("Inmediatamente"),
  availabilityDate: z.date().optional(),
});

// Step 4 schema: Images
const step4Schema = step3Schema.extend({
  imageUrls: z.array(z.string()).default([]),
  mainImageIndex: z.number().default(-1),
});

// Step 5 schema: Description (final)
const step5Schema = step4Schema.extend({
  title: z.string().optional(),
  description: z.string().min(1, "La descripción es obligatoria"),
});

interface PropertyFormMultiStepProps {
  onClose: () => void;
  initialData?: any;
  isEditing?: boolean;
}

export function PropertyFormMultiStep({ onClose, initialData, isEditing = false }: PropertyFormMultiStepProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user} = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [propertyId, setPropertyId] = useState<string | null>(initialData?.uuid || null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [localNeighborhood, setLocalNeighborhood] = useState<string | undefined>(initialData?.neighborhood);
  const [isAddressValid, setIsAddressValid] = useState<boolean>(!!initialData?.address);

  const steps = [
    { id: 1, name: "Información básica", completed: currentStep > 1 },
    { id: 2, name: "Ubicación", completed: currentStep > 2 },
    { id: 3, name: "Características", completed: currentStep > 3 },
    { id: 4, name: "Imágenes", completed: currentStep > 4 },
    { id: 5, name: "Descripción", completed: currentStep > 5 },
  ];

  const completionPercentage = ((currentStep - 1) / 5) * 100;

  const form = useForm<z.infer<typeof step5Schema>>({
    resolver: zodResolver(
      currentStep === 1
        ? step1Schema
        : currentStep === 2
        ? step2Schema
        : currentStep === 3
        ? step3Schema
        : currentStep === 4
        ? step4Schema
        : step5Schema
    ),
    defaultValues: initialData || {
      reference: "",
      type: undefined as any,
      operationType: undefined as any,
      price: "" as any,
      bedrooms: undefined,
      bathrooms: undefined,
      superficie: "" as any,
      locality: "",
      streetName: "",
      streetNumber: "",
      address: "",
      latitude: null,
      longitude: null,
      escalera: undefined,
      planta: undefined,
      puerta: undefined,
      neighborhood: undefined as any,
      features: [],
      availability: "Inmediatamente",
      availabilityDate: undefined,
      imageUrls: [],
      mainImageIndex: -1,
      title: "",
      description: "",
    },
  });

  // Create/update property mutation
  const savePropertyMutation = useMutation({
    mutationFn: async (data: any) => {
      if (propertyId) {
        // Update existing property
        return await apiRequest("PATCH", `/api/properties/${propertyId}`, data);
      } else {
        // Create new property (happens after step 2)
        return await apiRequest("POST", "/api/properties", data);
      }
    },
    onSuccess: (data) => {
      if (!propertyId) {
        // First time creating - save the UUID
        setPropertyId(data.uuid);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
  });

  // Generate description
  const generateDescription = async () => {
    try {
      setIsGeneratingDescription(true);
      const formValues = form.getValues();

      const data = await apiRequest("POST", "/api/generate-description", {
        propertyType: formValues.type,
        operationType: formValues.operationType,
        neighborhood: formValues.neighborhood,
        bedrooms: formValues.bedrooms,
        bathrooms: formValues.bathrooms,
        size: formValues.superficie,
        price: formValues.price,
        features: formValues.features || [],
      });

      console.log("Generated description:", data.description);

      // Update form with proper options to trigger re-render
      form.setValue("description", data.description, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });

      toast({
        title: "Descripción generada",
        description: "La descripción ha sido generada con éxito.",
      });
    } catch (error) {
      console.error("Error generating description:", error);
      toast({
        title: "Error",
        description: "No se pudo generar la descripción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Auto-save draft data (steps 3, 4 only - step 2 creates/saves initially)
  const autoSaveDraft = async () => {
    if (!propertyId) return; // No property to save yet
    
    const formData = form.getValues();
    const draftData = {
      ...formData,
      price: Number(formData.price),
      bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
      superficie: formData.superficie ? Number(formData.superficie) : undefined,
      agentId: user?.id,
      agencyId: null,
      isDraft: true,
      isActive: false,
      // Ensure description is never empty (required by schema)
      description: formData.description || "Borrador - Información pendiente",
    };

    try {
      await savePropertyMutation.mutateAsync(draftData);
    } catch (error) {
      console.error("Auto-save failed:", error);
      // Don't show error toast for auto-save failures
    }
  };

  // Navigation handlers
  const handleNext = async () => {
    // Validate only fields relevant to current step
    let fieldsToValidate: string[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ["type", "operationType", "price"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["address", "neighborhood"];
    }
    // Step 3, 4 have no required fields - skip validation
    
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate as any);
      if (!isValid) return;
    }

    // On Step 2, validate that a valid address was selected from suggestions
    if (currentStep === 2 && !isAddressValid) {
      toast({
        title: "Dirección requerida",
        description: "Por favor, selecciona una dirección de las sugerencias de Google Maps.",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 2) {
      // After step 2, create the property
      const formData = form.getValues();
      const propertyData = {
        ...formData,
        price: Number(formData.price),
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
        superficie: formData.superficie ? Number(formData.superficie) : undefined,
        agentId: user?.id,
        agencyId: null, // Set to null since User type doesn't have agencyId
        isDraft: true,
        isActive: false, // Drafts are not active
        description: "Borrador - Información pendiente", // Temporary description
      };

      try {
        await savePropertyMutation.mutateAsync(propertyData);
        toast({
          title: "Propiedad creada",
          description: "La propiedad ya está creada. Continúa llenando el resto de la información y el anuncio",
        });
        setCurrentStep(currentStep + 1);
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo crear la propiedad. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    } else if (currentStep < 5) {
      // Auto-save before moving to next step (steps 3, 4)
      if (currentStep >= 3) {
        await autoSaveDraft();
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = async () => {
    if (currentStep > 1) {
      // Auto-save before going back (steps 3, 4, 5)
      if (currentStep >= 3 && propertyId) {
        await autoSaveDraft();
      }
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const formData = form.getValues();
    const finalData = {
      ...formData,
      isDraft: false, // Mark as complete
      isActive: true, // Make it visible
    };

    try {
      await savePropertyMutation.mutateAsync(finalData);
      toast({
        title: "Propiedad publicada",
        description: "La propiedad ha sido publicada con éxito.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo publicar la propiedad. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  // Handler for URL-based image changes
  const handleImageUrlChange = (newImageUrls: string[], mainImageIndex: number) => {
    form.setValue("imageUrls", newImageUrls);
    form.setValue("mainImageIndex", mainImageIndex);
  };

  return (
    <div className="space-y-6">
      <PropertyFormStepper
        currentStep={currentStep}
        steps={steps}
        completionPercentage={completionPercentage}
      />
      <Form {...form}>
        <form className="space-y-6">
          {/* Step 1: Información básica */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Información básica</h2>

              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referencia</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Referencia interna para identificar la propiedad"
                        data-testid="input-reference"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de inmueble</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-type">
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-operation-type">
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
                        placeholder="Introduce el precio"
                        data-testid="input-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Habitaciones</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "" ? undefined : Number(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-bedrooms">
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}
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
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Baños</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "" ? undefined : Number(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-bathrooms">
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="superficie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Superficie (m²)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                        type="number"
                        placeholder="Superficie en m²"
                        data-testid="input-superficie"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 2: Ubicación */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Ubicación</h2>

              <AddressValidator
                onAddressValidated={(data) => {
                  form.setValue("locality", data.locality);
                  form.setValue("streetName", data.streetName);
                  form.setValue("streetNumber", data.streetNumber);
                  form.setValue("address", data.formattedAddress);
                  form.setValue("latitude", data.latitude);
                  form.setValue("longitude", data.longitude);
                  setIsAddressValid(true);
                }}
                onAddressInvalidated={() => {
                  setIsAddressValid(false);
                  form.setValue("address", "");
                  form.setValue("latitude", null);
                  form.setValue("longitude", null);
                }}
                initialLocality={form.getValues("locality")}
                initialStreetName={form.getValues("streetName")}
                initialStreetNumber={form.getValues("streetNumber")}
                initialFormattedAddress={form.getValues("address")}
                initialLatitude={form.getValues("latitude")}
                initialLongitude={form.getValues("longitude")}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="escalera"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escalera</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-escalera">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {escaleraOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-planta">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {plantaOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-puerta">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {puertaOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
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
                            className="w-full justify-between"
                            data-testid="button-neighborhood"
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
                            <CommandEmpty>No se encontró el barrio.</CommandEmpty>
                            {ALL_CITIES.map((cityData) => (
                              cityData.districts.map((district) => (
                                <CommandGroup key={`${cityData.city}-${district.district}`} heading={`${district.district} (${cityData.city})`}>
                                  {district.neighborhoods.map((neighborhood) => (
                                    <CommandItem
                                      key={`${cityData.city}-${district.district}-${neighborhood}`}
                                      value={neighborhood}
                                      onSelect={() => {
                                        form.setValue("neighborhood", neighborhood);
                                        setLocalNeighborhood(neighborhood);
                                      }}
                                      data-testid={`neighborhood-${neighborhood}`}
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
                              ))
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 3: Características */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Características</h2>

              {/* Comodidades */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Comodidades</h3>
                <FormField
                  control={form.control}
                  name="features"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { id: "aire-acondicionado", label: "Aire acondicionado" },
                          { id: "calefaccion", label: "Calefacción" },
                          { id: "ascensor", label: "Ascensor" },
                          { id: "terraza", label: "Terraza" },
                          { id: "balcon", label: "Balcón" },
                          { id: "jardin", label: "Jardín" },
                          { id: "piscina", label: "Piscina" },
                          { id: "armarios-empotrados", label: "Armarios empotrados" },
                        ].map((feature) => (
                          <FormField
                            key={feature.id}
                            control={form.control}
                            name="features"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(feature.id)}
                                    onCheckedChange={(checked) => {
                                      const updatedFeatures = checked
                                        ? [...(field.value || []), feature.id]
                                        : (field.value || []).filter((val) => val !== feature.id);
                                      field.onChange(updatedFeatures);
                                    }}
                                    data-testid={`checkbox-${feature.id}`}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">{feature.label}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Adicionales */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Adicionales</h3>
                <FormField
                  control={form.control}
                  name="features"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { id: "trastero", label: "Trastero" },
                          { id: "garaje", label: "Garaje" },
                          { id: "parking", label: "Parking" },
                          { id: "bien-conectado", label: "Bien conectado" },
                          { id: "exterior", label: "Exterior" },
                          { id: "amueblado", label: "Amueblado" },
                          { id: "electrodomesticos", label: "Electrodomésticos" },
                          { id: "bano-suite", label: "Baño en-suite" },
                        ].map((feature) => (
                          <FormField
                            key={feature.id}
                            control={form.control}
                            name="features"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(feature.id)}
                                    onCheckedChange={(checked) => {
                                      const updatedFeatures = checked
                                        ? [...(field.value || []), feature.id]
                                        : (field.value || []).filter((val) => val !== feature.id);
                                      field.onChange(updatedFeatures);
                                    }}
                                    data-testid={`checkbox-${feature.id}`}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">{feature.label}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Características especiales */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Características especiales</h3>
                <FormField
                  control={form.control}
                  name="features"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { id: "accesible", label: "Accesible" },
                          { id: "permite-mascota", label: "Permite mascota" },
                          { id: "vistas-mar", label: "Vistas al mar" },
                          { id: "security", label: "Seguridad 24h" },
                          { id: "gym", label: "Gimnasio" },
                          { id: "fireplace", label: "Chimenea" },
                        ].map((feature) => (
                          <FormField
                            key={feature.id}
                            control={form.control}
                            name="features"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(feature.id)}
                                    onCheckedChange={(checked) => {
                                      const updatedFeatures = checked
                                        ? [...(field.value || []), feature.id]
                                        : (field.value || []).filter((val) => val !== feature.id);
                                      field.onChange(updatedFeatures);
                                    }}
                                    data-testid={`checkbox-${feature.id}`}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">{feature.label}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Disponibilidad */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Disponibilidad</h3>
                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Inmediatamente" data-testid="radio-inmediatamente" />
                            </FormControl>
                            <FormLabel className="font-normal">Inmediatamente</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="A partir de" data-testid="radio-a-partir-de" />
                            </FormControl>
                            <FormLabel className="font-normal">A partir de</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("availability") === "A partir de" && (
                  <FormField
                    control={form.control}
                    name="availabilityDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col mt-4">
                        <FormLabel>Fecha de disponibilidad</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={`w-full pl-3 text-left font-normal ${
                                  !field.value && "text-muted-foreground"
                                }`}
                                data-testid="button-availability-date"
                              >
                                {field.value ? format(field.value, "PPP", { locale: es }) : "Selecciona una fecha"}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
          )}

          {/* Step 4: Imágenes */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Imágenes</h2>
              <p className="text-sm text-muted-foreground">
                Añade imágenes de alta calidad de tu propiedad. Puedes reorganizarlas arrastrándolas y seleccionar la imagen principal.
              </p>

              <ImageUploader
                onImageUploaded={(url) => {
                  const currentImages = form.getValues("imageUrls") || [];
                  form.setValue("imageUrls", [...currentImages, url]);
                }}
                onMultipleImagesUploaded={(urls) => {
                  const currentImages = form.getValues("imageUrls") || [];
                  form.setValue("imageUrls", [...currentImages, ...urls]);
                }}
                multiple={true}
                maxFiles={10}
                className="mb-6"
              />

              {form.watch("imageUrls") && form.watch("imageUrls").length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Organizar imágenes</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Arrastra las imágenes para reorganizarlas. Haz clic en el icono de check para establecer la imagen principal.
                  </p>
                  <DraggableImageGallery
                    images={form.watch("imageUrls")}
                    mainImageIndex={form.watch("mainImageIndex")}
                    onChange={handleImageUrlChange}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 5: Descripción */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Descripción</h2>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título del anuncio</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Título del anuncio"
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel>Descripción</FormLabel>
                      {user?.subscriptionPlan === "basica" ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled
                                data-testid="button-generate-disabled"
                              >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generar
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>La generación con IA está disponible en los planes Premium y Pro</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateDescription}
                          disabled={isGeneratingDescription}
                          data-testid="button-generate-description"
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          {isGeneratingDescription ? "Generando..." : "Generar"}
                        </Button>
                      )}
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe la propiedad de manera atractiva..."
                        rows={8}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center pt-10 pb-10 border-t" style={{ borderTopColor: "#0284c5e6" }}>
            <div className="flex gap-3">
              {/* Salir button - always visible */}
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-red-500 text-red-500 hover:bg-red-50"
                data-testid="button-exit"
              >
                <X className="mr-2 h-4 w-4" />
                Salir
              </Button>

              {/* Anterior button - always visible but disabled on step 1 */}
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                style={{ borderColor: "#0284c5e6", color: "#0284c5e6" }}
                className="hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-previous"
              >
                Anterior
              </Button>
            </div>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={savePropertyMutation.isPending}
                data-testid="button-next"
              >
                {savePropertyMutation.isPending ? "Guardando..." : "Siguiente"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleFinalSubmit}
                disabled={savePropertyMutation.isPending}
                data-testid="button-publish"
              >
                {savePropertyMutation.isPending ? "Publicando..." : "Publicar Propiedad"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
