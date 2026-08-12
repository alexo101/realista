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
import { useLanguage } from "@/contexts/language-context";
import { ALL_CITIES } from "@/utils/neighborhoods";
import { PROPERTY_FEATURES } from "@/utils/property-features";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, ChevronsUpDown, Sparkles, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { enUS, es, fr, it } from "date-fns/locale";
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
const propertyConditionOptions = ["Obra nueva", "Buen estado", "A reformar", "Reformado"] as const;
const housingStatusOptions = ["Disponible sin limitación", "Sin cédula de habitabilidad", "Nuda propiedad", "Alquilada con inquilinos", "Ocupada ilegalmente", "De banco"] as const;

const PROPERTY_OPTION_KEYS: Record<string, string> = {
  Venta: "manage.client_pref_option.operation.venta",
  Alquiler: "manage.client_pref_option.operation.alquiler",
  Vivienda: "manage.client_pref_option.property_type.vivienda",
  Oficinas: "manage.client_pref_option.property_type.oficinas",
  Locales: "manage.client_pref_option.property_type.locales",
  Parking: "manage.client_pref_option.property_type.parking",
  Terrenos: "manage.client_pref_option.property_type.terrenos",
  Trasteros: "manage.client_pref_option.property_type.trasteros",
  Edificios: "manage.client_pref_option.property_type.edificios",
  Pisos: "manage.client_pref_option.housing_type.pisos",
  Áticos: "manage.client_pref_option.housing_type.aticos",
  Dúplex: "manage.client_pref_option.housing_type.duplex",
  "Casa o chalet independiente": "manage.client_pref_option.housing_type.casa_independiente",
  "Casa o chalet adosado": "manage.client_pref_option.housing_type.casa_adosada",
  "Casa o chalet pareado": "manage.client_pref_option.housing_type.casa_pareada",
  "Obra nueva": "manage.client_pref_option.condition.obra_nueva",
  "Buen estado": "manage.client_pref_option.condition.buen_estado",
  "A reformar": "manage.client_pref_option.condition.a_reformar",
  Reformado: "manage.client_pref_option.condition.reformado",
  Inmediatamente: "manage.client_pref_option.availability.inmediatamente",
  "A partir de": "manage.client_pref_option.availability.a_partir_de",
};

function getPropertyOptionLabel(value: string, t: (key: string) => string): string {
  return PROPERTY_OPTION_KEYS[value] ? t(PROPERTY_OPTION_KEYS[value]) : value;
}

function createStepSchemas(t: (key: string) => string) {
  const step1Schema = z.object({
    reference: z.string().optional(),
    type: z.enum(propertyTypes, { required_error: t("propertyForm.validation.required") }),
    housingType: z.enum(housingTypes).optional().nullable(),
    operationType: z.enum(["Venta", "Alquiler"], { required_error: t("propertyForm.validation.required") }),
    price: z.coerce.number({
      required_error: t("propertyForm.validation.required"),
      invalid_type_error: t("propertyForm.validation.required"),
    }).min(1, t("propertyForm.validation.price_required")),
    bedrooms: z.coerce.number()
      .int(t("propertyForm.validation.integer"))
      .min(1, t("propertyForm.validation.minimum_one"))
      .optional()
      .nullable(),
    bathrooms: z.coerce.number()
      .int(t("propertyForm.validation.integer"))
      .min(1, t("propertyForm.validation.minimum_one"))
      .optional()
      .nullable(),
    superficie: z.coerce.number()
      .min(1, t("propertyForm.validation.greater_than_zero"))
      .optional()
      .nullable(),
  });

  const step2Schema = step1Schema.extend({
    locality: z.string().optional(),
    streetName: z.string().optional(),
    streetNumber: z.string().optional(),
    address: z.string({ required_error: t("propertyForm.validation.required") })
      .min(1, t("propertyForm.validation.address_required")),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    hideAddress: z.boolean().default(true),
    escalera: z.enum(escaleraOptions).nullable().optional(),
    planta: z.enum(plantaOptions).nullable().optional(),
    puerta: z.enum(puertaOptions).nullable().optional(),
    neighborhood: z.string({ required_error: t("propertyForm.validation.required") })
      .min(1, t("propertyForm.validation.neighborhood_required")),
    city: z.string().optional().nullable(),
    district: z.string().optional().nullable(),
  });

  const step3Schema = step2Schema.extend({
    features: z.array(z.string()).default([]),
    availability: z.enum(availabilityOptions).default("Inmediatamente"),
    availabilityDate: z.union([
      z.date(),
      z.string().transform((val) => new Date(val)),
    ]).optional().nullable(),
    propertyCondition: z.enum(propertyConditionOptions).optional(),
    housingStatus: z.enum(housingStatusOptions).optional(),
    isActive: z.boolean().default(true),
  });

  const step4Schema = step3Schema.extend({
    imageUrls: z.array(z.string()).default([]),
    mainImageIndex: z.number().default(-1),
  });

  const step5Schema = step4Schema.extend({
    title: z.string({ required_error: t("propertyForm.validation.required") })
      .min(1, t("propertyForm.validation.title_required"))
      .refine(val => !val.includes("Borrador - Título pendiente"), {
        message: t("propertyForm.validation.title_custom"),
      }),
    description: z.string({ required_error: t("propertyForm.validation.required") })
      .min(1, t("propertyForm.validation.description_required"))
      .refine(val => !val.includes("Borrador - Información pendiente"), {
        message: t("propertyForm.validation.description_custom"),
      }),
  });

  return { step1Schema, step2Schema, step3Schema, step4Schema, step5Schema };
}

interface PropertyFormMultiStepProps {
  onClose: () => void;
  initialData?: any;
  isEditing?: boolean;
}

export function PropertyFormMultiStep({ onClose, initialData, isEditing = false }: PropertyFormMultiStepProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user} = useUser();
  const { t, language } = useLanguage();
  const dateLocale = { es, en: enUS, fr, it }[language];
  const schemas = createStepSchemas(t);
  const [currentStep, setCurrentStep] = useState(1);
  const [propertyId, setPropertyId] = useState<string | null>(initialData?.uuid || null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [localNeighborhood, setLocalNeighborhood] = useState<string | undefined>(initialData?.neighborhood);
  const [isAddressValid, setIsAddressValid] = useState<boolean>(!!initialData?.address);

  // Process initialData to ensure dates are Date objects
  const processedInitialData = initialData ? {
    ...initialData,
    availabilityDate: initialData.availabilityDate 
      ? (typeof initialData.availabilityDate === 'string' 
          ? new Date(initialData.availabilityDate) 
          : initialData.availabilityDate)
      : undefined,
  } : null;

  const steps = [
    { id: 1, name: t("propertyForm.section.basic_info"), completed: currentStep > 1 },
    { id: 2, name: t("propertyForm.section.location"), completed: currentStep > 2 },
    { id: 3, name: t("propertyForm.section.features"), completed: currentStep > 3 },
    { id: 4, name: t("propertyForm.section.images"), completed: currentStep > 4 },
    { id: 5, name: t("propertyForm.section.description"), completed: currentStep > 5 },
  ];

  const completionPercentage = ((currentStep - 1) / 5) * 100;

  const form = useForm<any>({
    resolver: zodResolver(
      currentStep === 1
        ? schemas.step1Schema
        : currentStep === 2
        ? schemas.step2Schema
        : currentStep === 3
        ? schemas.step3Schema
        : currentStep === 4
        ? schemas.step4Schema
        : schemas.step5Schema
    ),
    defaultValues: processedInitialData || {
      reference: "",
      type: undefined as any,
      housingType: undefined as any,
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
      hideAddress: true,
      escalera: undefined,
      planta: undefined,
      puerta: undefined,
      neighborhood: undefined as any,
      city: null,
      district: null,
      features: [],
      availability: "Inmediatamente",
      availabilityDate: undefined,
      propertyCondition: undefined,
      housingStatus: undefined,
      isActive: true,
      imageUrls: [],
      mainImageIndex: -1,
      title: "",
      description: "",
    },
  });

  // Create/update property mutation
  const savePropertyMutation = useMutation({
    mutationFn: async (data: any) => {
      // Ensure price is a number, agentId and agencyId are included
      const payload = {
        ...data,
        price: typeof data.price === 'string' ? Number(data.price) : data.price,
        agentId: user?.id,
        agencyId: user?.agencyId || null,
      };
      
      if (propertyId) {
        // Update existing property
        return await apiRequest("PATCH", `/api/properties/${propertyId}`, payload);
      } else {
        // Create new property (happens after step 2)
        return await apiRequest("POST", "/api/properties", payload);
      }
    },
    onSuccess: (data) => {
      if (!propertyId) {
        // First time creating - save the UUID
        setPropertyId(data.uuid);
      }
      // Invalidate ALL property-related queries using predicate to match complex query keys
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && (
            key.startsWith('/api/properties') ||
            key.includes('/properties')
          );
        }
      });
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
        title: t("propertyForm.toast.description_generated"),
        description: t("propertyForm.toast.description_generated_desc"),
      });
    } catch (error) {
      console.error("Error generating description:", error);
      toast({
        title: t("common.error"),
        description: t("propertyForm.toast.description_error"),
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
      agencyId: user?.agencyId || null,
      isDraft: true,
      isActive: false,
      title: formData.title || "Borrador - Título pendiente",
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
        title: t("propertyForm.toast.address_required"),
        description: t("propertyForm.toast.address_required_desc"),
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 2) {
      // After step 2, create the property (only if it doesn't exist yet)
      const isFirstTimeCreating = !propertyId;
      const formData = form.getValues();
      const propertyData = {
        ...formData,
        price: Number(formData.price),
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
        superficie: formData.superficie ? Number(formData.superficie) : undefined,
        agentId: user?.id,
        agencyId: user?.agencyId || null,
        isDraft: true,
        isActive: false,
        title: "Borrador - Título pendiente",
        description: "Borrador - Información pendiente",
      };

      try {
        await savePropertyMutation.mutateAsync(propertyData);
        
        // Only show toast when creating for the first time
        if (isFirstTimeCreating) {
          toast({
            title: t("propertyForm.toast.created"),
            description: t("propertyForm.toast.created_desc"),
          });
        }
        
        setCurrentStep(currentStep + 1);
      } catch (error) {
        toast({
          title: t("common.error"),
          description: t("propertyForm.toast.create_error"),
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
    const currentImages = form.getValues("imageUrls") || [];
    if (currentImages.length === 0) {
      toast({
        title: t("propertyForm.toast.image_required"),
        description: t("propertyForm.toast.image_required_desc"),
        variant: "destructive",
      });
      return;
    }

    // If availability is "Inmediatamente", set availabilityDate to current date BEFORE validation
    const currentAvailability = form.getValues("availability");
    if (currentAvailability === "Inmediatamente" && !form.getValues("availabilityDate")) {
      form.setValue("availabilityDate", new Date(), { shouldValidate: false });
    }
    
    // Check if housingType is required (when type is "Vivienda")
    const propertyType = form.getValues("type");
    const housingType = form.getValues("housingType");
    if (propertyType === "Vivienda" && !housingType) {
      toast({
        title: t("propertyForm.toast.incomplete_fields"),
        description: t("propertyForm.toast.housing_type_required"),
        variant: "destructive",
      });
      return;
    }
    
    // Trigger validation for all fields
    const isValid = await form.trigger();
    
    if (!isValid) {
      // Get form errors to show user what's missing
      const errors = form.formState.errors;
      console.log("Form validation errors:", errors);
      
      // Build a list of missing required fields
      const missingFields: string[] = [];
      if (errors.price) missingFields.push(t("propertyForm.label.price_eur"));
      if (errors.address) missingFields.push(t("common.address"));
      if (errors.neighborhood) missingFields.push(t("propertyForm.label.neighborhood"));
      if (errors.title) missingFields.push(t("propertyForm.label.title"));
      if (errors.description) missingFields.push(t("propertyForm.label.description"));
      
      // Show toast with specific missing fields or generic message
      const description = missingFields.length > 0
        ? t("propertyForm.toast.missing_fields", { fields: missingFields.join(", ") })
        : t("propertyForm.toast.required_fields");
      
      toast({
        title: t("propertyForm.toast.incomplete_fields"),
        description,
        variant: "destructive",
      });
      return;
    }

    const formData = form.getValues();
    const finalData = {
      ...formData,
      isDraft: false, // Mark as complete
      // isActive comes from form value (Visibilidad radio button)
    };

    try {
      await savePropertyMutation.mutateAsync(finalData);
      toast({
        title: t("propertyForm.toast.published"),
        description: t("propertyForm.toast.published_desc"),
      });
      onClose();
    } catch (error) {
      console.error("Error publishing property:", error);
      toast({
        title: t("common.error"),
        description: t("propertyForm.toast.publish_error"),
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
          {/* Step 1: Basic information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">{t("propertyForm.section.basic_info")}</h2>

              {/* Row 1: Referencia, Tipo de operación, Precio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.reference")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("propertyForm.placeholder.reference")}
                          data-testid="input-reference"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="operationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.operation_type")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-operation-type">
                            <SelectValue placeholder={t("propertyForm.placeholder.select")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Venta">{getPropertyOptionLabel("Venta", t)}</SelectItem>
                          <SelectItem value="Alquiler">{getPropertyOptionLabel("Alquiler", t)}</SelectItem>
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
                      <FormLabel>{t("propertyForm.label.price_eur")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder={t("propertyForm.placeholder.price")}
                          data-testid="input-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: Tipo de inmueble, Tipo de vivienda, Planta */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("propertyForm.label.property_type")}</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        if (value !== "Vivienda") {
                          form.setValue("housingType", undefined);
                        }
                      }} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue placeholder={t("propertyForm.placeholder.select_type")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {propertyTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {getPropertyOptionLabel(type, t)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("type") === "Vivienda" && (
                  <FormField
                    control={form.control}
                    name="housingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("propertyForm.label.housing_type")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                          <FormControl>
                            <SelectTrigger data-testid="select-housing-type">
                              <SelectValue placeholder={t("propertyForm.placeholder.select_housing_type")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {housingTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {getPropertyOptionLabel(type, t)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="planta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("propertyForm.label.floor")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                        <FormControl>
                          <SelectTrigger data-testid="select-planta">
                            <SelectValue placeholder={t("propertyForm.placeholder.choose")} />
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
              </div>

              {/* Row 3: Superficie, Habitaciones, Baños */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="superficie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("propertyForm.label.surface")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                          type="number"
                          placeholder={t("propertyForm.placeholder.surface")}
                          data-testid="input-superficie"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("propertyForm.label.bedrooms")}</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "" ? undefined : Number(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-bedrooms">
                            <SelectValue placeholder={t("propertyForm.placeholder.select")} />
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
                      <FormLabel>{t("propertyForm.label.bathrooms")}</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "" ? undefined : Number(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-bathrooms">
                            <SelectValue placeholder={t("propertyForm.placeholder.select")} />
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
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">{t("propertyForm.section.location")}</h2>

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

              <FormField
                control={form.control}
                name="hideAddress"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-hide-address"
                      />
                    </FormControl>
                    <div className="flex items-center gap-2">
                      <FormLabel className="font-medium cursor-pointer">
                        {t("propertyForm.label.hide_address")}
                      </FormLabel>
                      <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-yellow-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        <Sparkles className="h-3 w-3" />
                        <span>{t("propertyForm.badge.free")}</span>
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="escalera"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("propertyForm.label.staircase")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                        <FormControl>
                          <SelectTrigger data-testid="select-escalera">
                            <SelectValue placeholder={t("propertyForm.placeholder.choose")} />
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
                  name="puerta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("propertyForm.label.door")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                        <FormControl>
                          <SelectTrigger data-testid="select-puerta">
                            <SelectValue placeholder={t("propertyForm.placeholder.choose")} />
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
                {t("propertyForm.help.private_address_fields")}
              </p>

              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("propertyForm.label.neighborhood")}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                            data-testid="button-neighborhood"
                          >
                            {field.value || t("propertyForm.placeholder.search_neighborhood")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder={t("propertyForm.placeholder.search_neighborhood")} />
                          <CommandList>
                            <CommandEmpty>{t("propertyForm.empty.no_neighborhoods")}</CommandEmpty>
                            {ALL_CITIES.map((cityData) => (
                              cityData.districts.map((district) => (
                                <CommandGroup key={`${cityData.city}-${district.district}`} heading={`${district.district} (${cityData.city})`}>
                                  {district.neighborhoods.map((neighborhood) => (
                                    <CommandItem
                                      key={`${cityData.city}-${district.district}-${neighborhood}`}
                                      value={`${neighborhood} ${district.district} ${cityData.city}`}
                                      onSelect={() => {
                                        form.setValue("neighborhood", neighborhood);
                                        form.setValue("city", cityData.city);
                                        form.setValue("district", district.district);
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

          {/* Step 3: Features */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">{t("propertyForm.section.features")}</h2>

              {/* Comodidades */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{t("propertyForm.section.amenities")}</h3>
                <FormField
                  control={form.control}
                  name="features"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          "aire-acondicionado",
                          "calefaccion",
                          "ascensor",
                          "terraza",
                          "balcon",
                          "jardin",
                          "piscina",
                          "armarios-empotrados",
                        ].map((feature) => (
                          <FormField
                            key={feature}
                            control={form.control}
                            name="features"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(feature)}
                                    onCheckedChange={(checked) => {
                                      const updatedFeatures = checked
                                        ? [...(field.value || []), feature]
                                        : (field.value || []).filter((val: string) => val !== feature);
                                      field.onChange(updatedFeatures);
                                    }}
                                    data-testid={`checkbox-${feature}`}
                                  />
                                </FormControl>
                              <FormLabel className="font-normal">{t(`manage.property_feature.${feature}`)}</FormLabel>
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
                <h3 className="text-lg font-semibold mb-4">{t("propertyForm.section.extras")}</h3>
                <FormField
                  control={form.control}
                  name="features"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          "trastero",
                          "garaje",
                          "parking",
                          "bien-conectado",
                          "exterior",
                          "amueblado",
                          "electrodomesticos",
                          "bano-suite",
                        ].map((feature) => (
                          <FormField
                            key={feature}
                            control={form.control}
                            name="features"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(feature)}
                                    onCheckedChange={(checked) => {
                                      const updatedFeatures = checked
                                        ? [...(field.value || []), feature]
                                        : (field.value || []).filter((val: string) => val !== feature);
                                      field.onChange(updatedFeatures);
                                    }}
                                    data-testid={`checkbox-${feature}`}
                                  />
                                </FormControl>
                              <FormLabel className="font-normal">{t(`manage.property_feature.${feature}`)}</FormLabel>
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
                <h3 className="text-lg font-semibold mb-4">{t("propertyForm.section.special_features")}</h3>
                <FormField
                  control={form.control}
                  name="features"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          "accesible",
                          "permite-mascota",
                          "vistas-mar",
                          "security",
                          "gym",
                          "fireplace",
                        ].map((feature) => (
                          <FormField
                            key={feature}
                            control={form.control}
                            name="features"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(feature)}
                                    onCheckedChange={(checked) => {
                                      const updatedFeatures = checked
                                        ? [...(field.value || []), feature]
                                        : (field.value || []).filter((val: string) => val !== feature);
                                      field.onChange(updatedFeatures);
                                    }}
                                    data-testid={`checkbox-${feature}`}
                                  />
                                </FormControl>
                              <FormLabel className="font-normal">{t(`manage.property_feature.${feature}`)}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Disponibilidad y Visibilidad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Disponibilidad */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t("propertyForm.section.availability")}</h3>
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
                              <FormLabel className="font-normal">{getPropertyOptionLabel("Inmediatamente", t)}</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="A partir de" data-testid="radio-a-partir-de" />
                              </FormControl>
                              <FormLabel className="font-normal">{getPropertyOptionLabel("A partir de", t)}</FormLabel>
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
                          <FormLabel>{t("propertyForm.label.availability_date")}</FormLabel>
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
                                  {field.value ? format(field.value, "PPP", { locale: dateLocale }) : t("propertyForm.placeholder.select_date")}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ?? undefined}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                locale={dateLocale}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Visibilidad */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t("propertyForm.section.visibility")}</h3>
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "visible")}
                            value={field.value ? "visible" : "hidden"}
                            className="flex flex-col space-y-2"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="visible" data-testid="radio-visible" />
                              </FormControl>
                              <FormLabel className="font-normal">{t("propertyForm.visibility.visible")}</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="hidden" data-testid="radio-hidden" />
                              </FormControl>
                              <FormLabel className="font-normal">{t("propertyForm.visibility.hidden")}</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Estado de conservación */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{t("propertyForm.section.condition")}</h3>
                <FormField
                  control={form.control}
                  name="propertyCondition"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-property-condition">
                            <SelectValue placeholder={t("propertyForm.placeholder.select_condition")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {propertyConditionOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {getPropertyOptionLabel(option, t)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Situación de la vivienda */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{t("propertyForm.section.housing_situation")}</h3>
                <FormField
                  control={form.control}
                  name="housingStatus"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-housing-status">
                            <SelectValue placeholder={t("propertyForm.placeholder.select_housing_situation")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {housingStatusOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {t(`propertyForm.housingStatus.${option}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* Step 4: Images */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">{t("propertyForm.section.images")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("propertyForm.help.images_intro")}
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
                maxFiles={20}
                totalLimit={100}
                currentImageCount={(form.watch("imageUrls") || []).length}
                className="mb-6"
              />

              {form.watch("imageUrls") && form.watch("imageUrls").length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t("propertyForm.section.organize_images")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("propertyForm.help.organize_images")}
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

          {/* Step 5: Description */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">{t("propertyForm.section.description")}</h2>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("propertyForm.label.title")} *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("propertyForm.placeholder.title")}
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
                      <FormLabel>{t("propertyForm.label.description")} *</FormLabel>
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
                                {t("propertyForm.button.generate")}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("propertyForm.tooltip.ai_premium_only")}</p>
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
                          {isGeneratingDescription ? t("propertyForm.button.generating") : t("propertyForm.button.generate")}
                        </Button>
                      )}
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t("propertyForm.placeholder.description")}
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
              {/* Exit button - always visible */}
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-red-500 text-red-500 hover:bg-red-50"
                data-testid="button-exit"
              >
                <X className="mr-2 h-4 w-4" />
                {t("common.cancel")}
              </Button>

              {/* Previous button - always visible but disabled on step 1 */}
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                style={{ borderColor: "#0284c5e6", color: "#0284c5e6" }}
                className="hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-previous"
              >
                {t("common.previous")}
              </Button>
            </div>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={savePropertyMutation.isPending}
                data-testid="button-next"
              >
                {savePropertyMutation.isPending ? t("propertyForm.button.saving") : t("common.next")}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleFinalSubmit}
                disabled={savePropertyMutation.isPending}
                data-testid="button-publish"
              >
                {savePropertyMutation.isPending ? t("propertyForm.button.publishing") : t("propertyForm.button.publish")}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
