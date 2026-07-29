import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/language-context";
import { useAutosave } from "@/hooks/use-autosave";
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
import { ArrowLeft, Check, ChevronsUpDown, CalendarIcon, Trash2, Eye, EyeOff, Sparkles, Search, X } from "lucide-react";
import { SavedIndicator } from "@/components/SavedIndicator";
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
import { useUser } from "@/contexts/user-context";
import { ImageUploader } from "./ImageUploader";
import { DraggableImageGallery } from "./DraggableImageGallery";
import { AddressValidator } from "./AddressValidator";
import { ALL_CITIES } from "@/utils/neighborhoods";
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

const propertyConditionOptions = ["Obra nueva", "Buen estado", "A reformar", "Reformado"] as const;

const managementStatusOptions = [
  "Creada",
  "Activa",
  "Reservada",
  "Alquilada",
  "Inactiva",
  "Vendida",
  "En reforma",
] as const;

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
  "Última planta": "manage.client_pref_option.floor.ultima_planta",
  "Plantas intermedias": "manage.client_pref_option.floor.planta_intermedia",
  Bajos: "manage.client_pref_option.floor.bajo",
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

// Escalera options
const escaleraOptions = ["A", "B", "C"] as const;

// Planta options
const plantaOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"] as const;

// Puerta options
const puertaOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;

const formSchema = z.object({
  reference: z.string().optional(),
  // Address fields from AddressValidator
  locality: z.string().optional(),
  streetName: z.string().optional(),
  streetNumber: z.string().optional(),
  address: z.string().min(1, "La dirección es obligatoria"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  hideAddress: z.boolean().default(true),
  // Campos adicionales de dirección (privados)
  escalera: z.enum(escaleraOptions).nullable().optional(),
  planta: z.enum(plantaOptions).nullable().optional(), 
  puerta: z.enum(puertaOptions).nullable().optional(),
  neighborhood: z.string().min(1, "Selecciona un barrio"),
  // Catalog city/district used for client↔property matching (not Google locality)
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  type: z.enum(propertyTypes, {
    required_error: "Selecciona el tipo de inmueble",
  }),
  housingType: z.enum(housingTypes, {
    required_error: "Selecciona el tipo de vivienda",
  }).optional(),
  floor: z.enum(floorOptions).optional(),
  operationType: z.enum(["Venta", "Alquiler"], {
    required_error: "Selecciona el tipo de operación",
  }),
  price: z.coerce.number().min(1, "El precio es obligatorio"),
  bedrooms: z.coerce.number()
    .int("Debe ser un número entero")
    .min(1, "Al menos 1")
    .optional()
    .nullable(),
  bathrooms: z.coerce.number()
    .int("Debe ser un número entero")
    .min(1, "Al menos 1")
    .optional()
    .nullable(),
  superficie: z.coerce.number()
    .min(1, "Debe ser mayor que 0")
    .optional()
    .nullable(),
  features: z.array(z.string()).default([]),
  availability: z.enum(availabilityOptions).default("Inmediatamente"),
  availabilityDate: z.date().optional(),
  propertyCondition: z.enum(propertyConditionOptions).optional(),
  housingStatus: z.enum(housingStatus).optional(),
  managementStatus: z.enum(managementStatusOptions).optional(),
  hasCedulaHabitabilidad: z.boolean().default(false),
  isActive: z.boolean().default(true),
  imageUrls: z.array(z.string()).default([]),
  mainImageIndex: z.number().default(-1),
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().min(1, "La descripción es obligatoria"),
}).refine(
  (data) => {
    // If type is "Vivienda", housingType is required
    if (data.type === "Vivienda" && !data.housingType) {
      return false;
    }
    return true;
  },
  {
    message: "El tipo de vivienda es obligatorio cuando el tipo de inmueble es Vivienda",
    path: ["housingType"],
  }
);

interface PropertyFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
  onClose: () => void;
  onBackToProperty?: () => void;
  initialData?: z.infer<typeof formSchema> & { id?: number; isActive?: boolean };
  isEditing?: boolean;
}

export function PropertyForm({
  onSubmit,
  onClose,
  onBackToProperty,
  initialData,
  isEditing = false,
}: PropertyFormProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [neighborhoodSearchTerm, setNeighborhoodSearchTerm] = useState("");
  const [neighborhoodDropdownOpen, setNeighborhoodDropdownOpen] = useState(false);
  const [localNeighborhood, setLocalNeighborhood] = useState<string | undefined>(
    initialData?.neighborhood
  );
  const [isAddressValid, setIsAddressValid] = useState<boolean>(!!initialData?.address);
  const didInitializeState = useRef(false);

  // Initialize state only once per property, don't overwrite after mutations
  useEffect(() => {
    if (didInitializeState.current) return;
    
    if (initialData?.neighborhood) {
      setLocalNeighborhood(initialData.neighborhood);
    }
    if (initialData?.isActive !== undefined) {
      setIsActive(initialData.isActive);
    }
    didInitializeState.current = true;
  }, [initialData?.id]); // Only re-initialize when property ID changes

  // Mutations for property management
  const deleteMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      return await apiRequest("DELETE", `/api/properties/${propertyId}`);
    },
    onSuccess: () => {
      toast({
        title: t("propertyForm.toast.deleted"),
        description: t("propertyForm.toast.deleted_desc"),
      });
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
      onClose();
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("propertyForm.toast.delete_error"),
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ propertyUuid, isActive }: { propertyUuid: string; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/properties/${propertyUuid}/toggle-status`, {
        isActive,
      });
    },
    onSuccess: (data) => {
      // Update local state with server response
      setIsActive(data.isActive);
      
      toast({
        title: data.isActive ? t("propertyForm.toast.activated") : t("propertyForm.toast.deactivated"),
        description: data.isActive 
          ? t("propertyForm.toast.activated_desc")
          : t("propertyForm.toast.deactivated_desc"),
      });
      
      // Invalidate ALL property-related queries to refresh all lists
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && (
            key.startsWith('/api/properties') ||
            key.includes('/properties') ||
            key.startsWith('/api/search')
          );
        }
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("propertyForm.toast.toggle_error"),
        variant: "destructive",
      });
    },
  });

  const generateDescription = async () => {
    try {
      setIsGeneratingDescription(true);
      
      // Get current form values
      const formValues = form.getValues();
      
      const data = await apiRequest('POST', '/api/generate-description', {
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
      form.setValue('description', data.description, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      
      toast({
        title: t("propertyForm.toast.description_generated"),
        description: t("propertyForm.toast.description_generated_desc"),
      });
      
    } catch (error) {
      console.error('Error generating description:', error);
      toast({
        title: t("common.error"),
        description: t("propertyForm.toast.description_error"),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reference: initialData?.reference || "",
      locality: initialData?.locality || "",
      streetName: initialData?.streetName || "",
      streetNumber: initialData?.streetNumber || "",
      address: initialData?.address || "",
      latitude: initialData?.latitude || null,
      longitude: initialData?.longitude || null,
      hideAddress: initialData?.hideAddress ?? true,
      escalera: initialData?.escalera || undefined,
      planta: initialData?.planta || undefined,
      puerta: initialData?.puerta || undefined,
      neighborhood: initialData?.neighborhood || (undefined as any),
      city: initialData?.city || null,
      district: initialData?.district || null,
      type: initialData?.type || (undefined as any),
      housingType: initialData?.housingType || undefined,
      floor: initialData?.floor || undefined,
      operationType: initialData?.operationType || (undefined as any),
      price: initialData?.price || ("" as any),
      bedrooms: initialData?.bedrooms || undefined,
      bathrooms: initialData?.bathrooms || undefined,
      superficie: initialData?.superficie || ("" as any),
      features: initialData?.features || [],
      availability: initialData?.availability || "Inmediatamente",
      availabilityDate: initialData?.availabilityDate || undefined,
      propertyCondition: initialData?.propertyCondition || undefined,
      housingStatus: initialData?.housingStatus || undefined,
      managementStatus: initialData?.managementStatus || undefined,
      hasCedulaHabitabilidad: initialData?.hasCedulaHabitabilidad ?? false,
      isActive: initialData?.isActive ?? true,
      imageUrls: initialData?.imageUrls || [],
      mainImageIndex: initialData?.mainImageIndex ?? -1,
      title: initialData?.title || "",
      description: initialData?.description || "",
    },
  });

  // Handler for URL-based image changes with main image index
  const handleImageUrlChange = (newImageUrls: string[], mainImageIndex: number) => {
    form.setValue("imageUrls", newImageUrls, { shouldDirty: true });
    form.setValue("mainImageIndex", mainImageIndex, { shouldDirty: true });
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      toast({
        title: t("propertyForm.toast.created"),
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("propertyForm.toast.save_error"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormError = (errors: any) => {
    console.log('Form validation errors:', errors);
    toast({
      title: t("propertyForm.toast.validation_error"),
      description: t("propertyForm.toast.validation_error_desc"),
      variant: "destructive",
    });
  };

  const watchedValues = form.watch();

  const autosaveFn = useCallback(
    async (data: z.infer<typeof formSchema>) => {
      const valid = await form.trigger();
      if (!valid) {
        throw new Error("VALIDATION");
      }
      await onSubmit(data);
    },
    [form, onSubmit],
  );

  const { savedFields } = useAutosave(watchedValues, autosaveFn, {
    enabled: isEditing,
  });

  const labelWithSaved = (field: string, text: React.ReactNode) => (
    <FormLabel className="inline-flex items-center">
      {text}
      <SavedIndicator visible={savedFields.has(field)} />
    </FormLabel>
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={
              isEditing
                ? (event) => event.preventDefault()
                : form.handleSubmit(handleSubmit, handleFormError)
            }
            className="space-y-8"
          >
            {isEditing && onBackToProperty && (
              <div className="flex justify-start">
                <Button
                  variant="outline"
                  onClick={onBackToProperty}
                  type="button"
                  data-testid="button-back-to-property"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("common.back")}
                </Button>
              </div>
            )}
            {/* SECTION 1: INFORMACIÓN BÁSICA */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold border-b pb-2">{t("propertyForm.section.basic_info")}</h2>

              {/* Row 1: Referencia, Tipo de operación, Precio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      {labelWithSaved("reference", t("common.reference"))}
                      <FormControl>
                        <Input {...field} placeholder={t("propertyForm.placeholder.reference")} data-testid="input-reference" />
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
                      {labelWithSaved("operationType", t("common.operation_type"))}
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
                      {labelWithSaved("price", t("propertyForm.label.price_eur"))}
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
                      {labelWithSaved("type", t("propertyForm.label.property_type"))}
                      <Select onValueChange={field.onChange} value={field.value}>
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
                        {labelWithSaved("housingType", t("propertyForm.label.housing_type"))}
                        <Select onValueChange={field.onChange} value={field.value}>
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
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      {labelWithSaved("floor", t("propertyForm.label.floor_category"))}
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-floor">
                            <SelectValue placeholder={t("propertyForm.placeholder.select_floor")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {floorOptions.map((option) => (
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

              {/* Row 3: Superficie, Habitaciones, Baños */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="superficie"
                  render={({ field }) => (
                    <FormItem>
                      {labelWithSaved("superficie", t("propertyForm.label.surface"))}
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
                      {labelWithSaved("bedrooms", t("propertyForm.label.bedrooms"))}
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
                      {labelWithSaved("bathrooms", t("propertyForm.label.bathrooms"))}
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

            {/* SECTION 2: LOCATION */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold border-b pb-2">{t("propertyForm.section.location")}</h2>

              <AddressValidator
                onAddressValidated={(data) => {
                  const opts = { shouldDirty: true } as const;
                  form.setValue("locality", data.locality, opts);
                  form.setValue("streetName", data.streetName, opts);
                  form.setValue("streetNumber", data.streetNumber, opts);
                  form.setValue("address", data.formattedAddress, opts);
                  form.setValue("latitude", data.latitude, opts);
                  form.setValue("longitude", data.longitude, opts);
                  setIsAddressValid(true);
                }}
                onAddressInvalidated={() => {
                  setIsAddressValid(false);
                  const opts = { shouldDirty: true } as const;
                  form.setValue("address", "", opts);
                  form.setValue("latitude", null, opts);
                  form.setValue("longitude", null, opts);
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
                      <FormLabel className="font-medium cursor-pointer inline-flex items-center">
                        {t("propertyForm.label.hide_address")}
                        <SavedIndicator visible={savedFields.has("hideAddress")} />
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
                      {labelWithSaved("escalera", t("propertyForm.label.staircase"))}
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
                  name="planta"
                  render={({ field }) => (
                    <FormItem>
                      {labelWithSaved("planta", t("propertyForm.label.floor"))}
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

                <FormField
                  control={form.control}
                  name="puerta"
                  render={({ field }) => (
                    <FormItem>
                      {labelWithSaved("puerta", t("propertyForm.label.door"))}
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
                render={({ field }) => {
                  const allNeighborhoods = ALL_CITIES.flatMap((cityData) =>
                    cityData.districts.flatMap((district) =>
                      district.neighborhoods.map((neighborhood) => ({
                        neighborhood,
                        district: district.district,
                        city: cityData.city,
                      }))
                    )
                  );
                  
                  const filteredNeighborhoods = allNeighborhoods.filter((item) =>
                    item.neighborhood.toLowerCase().includes(neighborhoodSearchTerm.toLowerCase()) ||
                    item.district.toLowerCase().includes(neighborhoodSearchTerm.toLowerCase()) ||
                    item.city.toLowerCase().includes(neighborhoodSearchTerm.toLowerCase())
                  ).slice(0, 50);

                  return (
                    <FormItem>
                      {labelWithSaved("neighborhood", t("propertyForm.label.neighborhood"))}
                      <div className="relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="neighborhood-search"
                            placeholder={t("propertyForm.placeholder.search_neighborhood")}
                            value={neighborhoodDropdownOpen ? neighborhoodSearchTerm : (field.value || "")}
                            onChange={(e) => {
                              setNeighborhoodSearchTerm(e.target.value);
                              if (!neighborhoodDropdownOpen) setNeighborhoodDropdownOpen(true);
                            }}
                            onFocus={() => {
                              setNeighborhoodDropdownOpen(true);
                              setNeighborhoodSearchTerm("");
                            }}
                            className="pl-9 pr-8 min-h-[44px] w-full"
                            data-testid="input-neighborhood-search"
                          />
                          {field.value && !neighborhoodDropdownOpen && (
                            <button
                              type="button"
                              onClick={() => {
                                form.setValue("neighborhood", "", { shouldDirty: true });
                                form.setValue("city", null, { shouldDirty: true });
                                form.setValue("district", null, { shouldDirty: true });
                                setLocalNeighborhood(undefined);
                                setNeighborhoodDropdownOpen(true);
                                setNeighborhoodSearchTerm("");
                              }}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {neighborhoodDropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => {
                                setNeighborhoodDropdownOpen(false);
                                setNeighborhoodSearchTerm("");
                              }}
                            />
                            <div className="absolute left-0 z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                              {filteredNeighborhoods.length > 0 ? (
                                filteredNeighborhoods.map((item, index) => (
                                  <button
                                    key={`${item.city}-${item.district}-${item.neighborhood}-${index}`}
                                    type="button"
                                    className={`w-full px-4 py-3 min-h-[44px] text-left text-sm hover:bg-gray-100 ${
                                      field.value === item.neighborhood ? 'bg-primary/10 text-primary font-medium' : ''
                                    }`}
                                    onClick={() => {
                                      form.setValue("neighborhood", item.neighborhood, { shouldDirty: true });
                                      form.setValue("city", item.city, { shouldDirty: true });
                                      form.setValue("district", item.district, { shouldDirty: true });
                                      setLocalNeighborhood(item.neighborhood);
                                      setNeighborhoodDropdownOpen(false);
                                      setNeighborhoodSearchTerm("");
                                    }}
                                    data-testid={`neighborhood-option-${item.neighborhood}`}
                                  >
                                    <div className="font-medium">{item.neighborhood}</div>
                                    <div className="text-xs text-gray-500">{item.district}, {item.city}</div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-sm text-gray-500">
                                  {t("propertyForm.empty.no_neighborhoods")}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* SECTION 3: CARACTERÍSTICAS */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold border-b pb-2">{t("propertyForm.section.features")}</h2>

              {/* Comodidades */}
              <div>
                <h3 className="text-lg font-semibold mb-4 inline-flex items-center">
                  {t("propertyForm.section.amenities")}
                  <SavedIndicator visible={savedFields.has("features")} />
                </h3>
                <FormField
                  control={form.control}
                  name="features"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-3 gap-4">
                        {PROPERTY_FEATURES.filter(f => 
                          ["aire-acondicionado", "calefaccion", "ascensor", "terraza", "balcon", "jardin", "piscina", "armarios-empotrados"].includes(f.id)
                        ).map((feature) => (
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
                                <FormLabel className="font-normal">{t(`manage.property_feature.${feature.id}`)}</FormLabel>
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
                        {PROPERTY_FEATURES.filter(f => 
                          ["trastero", "garaje", "parking", "bien-conectado", "exterior", "amueblado", "electrodomesticos", "bano-suite"].includes(f.id)
                        ).map((feature) => (
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
                                <FormLabel className="font-normal">{t(`manage.property_feature.${feature.id}`)}</FormLabel>
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
                        {PROPERTY_FEATURES.filter(f => 
                          ["accesible", "permite-mascota", "vistas-mar", "security", "gym", "fireplace"].includes(f.id)
                        ).map((feature) => (
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
                                <FormLabel className="font-normal">{t(`manage.property_feature.${feature.id}`)}</FormLabel>
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
                  <h3 className="text-lg font-semibold mb-4 inline-flex items-center">
                    {t("propertyForm.section.availability")}
                    <SavedIndicator visible={savedFields.has("availability") || savedFields.has("availabilityDate")} />
                  </h3>
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
                          {labelWithSaved("availabilityDate", t("propertyForm.label.availability_date"))}
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
                                  {field.value ? format(field.value, "PPP", { locale: es }) : t("propertyForm.placeholder.select_date")}
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

                {/* Visibilidad */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 inline-flex items-center">
                    {t("propertyForm.section.visibility")}
                    <SavedIndicator visible={savedFields.has("isActive")} />
                  </h3>
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
                <h3 className="text-lg font-semibold mb-4 inline-flex items-center">
                  {t("propertyForm.section.condition")}
                  <SavedIndicator visible={savedFields.has("propertyCondition")} />
                </h3>
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
                <h3 className="text-lg font-semibold mb-4 inline-flex items-center">
                  {t("propertyForm.section.housing_situation")}
                  <SavedIndicator visible={savedFields.has("housingStatus")} />
                </h3>
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
                          {housingStatus.map((option) => (
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

              {/* Cédula de habitabilidad */}
              <div>
                <h3 className="text-lg font-semibold mb-4 inline-flex items-center">
                  {t("propertyForm.section.cedula")}
                  <SavedIndicator visible={savedFields.has("hasCedulaHabitabilidad")} />
                </h3>
                <FormField
                  control={form.control}
                  name="hasCedulaHabitabilidad"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={(value) => field.onChange(value === "yes")}
                        value={field.value ? "yes" : "no"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-has-cedula-habitabilidad">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes" data-testid="option-cedula-yes">{t("propertyForm.cedula.yes")}</SelectItem>
                          <SelectItem value="no" data-testid="option-cedula-no">{t("common.no")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SECTION 4: IMÁGENES */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold border-b pb-2">{t("propertyForm.section.images")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("propertyForm.help.images_intro")}
              </p>

              <ImageUploader
                onImageUploaded={(url) => {
                  const currentImages = form.getValues("imageUrls") || [];
                  form.setValue("imageUrls", [...currentImages, url], { shouldDirty: true });
                }}
                onMultipleImagesUploaded={(urls) => {
                  const currentImages = form.getValues("imageUrls") || [];
                  form.setValue("imageUrls", [...currentImages, ...urls], { shouldDirty: true });
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

            {/* SECTION 5: DESCRIPCIÓN */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold border-b pb-2">{t("propertyForm.section.description")}</h2>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    {labelWithSaved("title", <>{t("propertyForm.label.title")} *</>)}
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
                render={({ field }) => {
                  const { user } = useUser();
                  return (
                    <FormItem>
                      <div className="flex items-center justify-between mb-2">
                        {labelWithSaved("description", <>{t("propertyForm.label.description")} *</>)}
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
                  );
                }}
              />
            </div>

            {/* Footer actions */}
            <div className="flex justify-between items-center pt-6 border-t">
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
                      {t("propertyForm.button.delete")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{t("propertyForm.dialog.delete_title")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("propertyForm.dialog.delete_desc")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          if (initialData?.id) {
                            deleteMutation.mutate(initialData.id);
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {t("propertyForm.dialog.delete_confirm")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <div></div>
              )}
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  type="button"
                >
                  {t("common.cancel")}
                </Button>
                {!isEditing && (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    data-testid="button-submit"
                  >
                    {isSubmitting ? t("propertyForm.button.saving") : t("propertyForm.button.create")}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
