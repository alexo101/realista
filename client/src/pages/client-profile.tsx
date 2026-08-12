import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heart, MessageCircle, User, Home, Mail, Phone, Star, MapPin, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Camera, Upload, Minus, Plus, CalendarDays, CheckCircle, Building2, Bookmark, Edit2, Trash2, Share2, Copy, Eye } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/contexts/user-context";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { useAutosave } from "@/hooks/use-autosave";
import { SavedIndicator } from "@/components/SavedIndicator";
import { ClientConversationalMessages } from "@/components/ClientConversationalMessages";
import { MobileClientNav } from "@/components/MobileClientNav";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { enUS, es, fr, it } from "date-fns/locale";

interface FavoriteAgent {
  id: number;
  slug?: string;
  name: string;
  surname: string;
  email: string;
  avatar?: string;
  yearsOfExperience?: number;
  influenceNeighborhoods?: string[];
  rating?: number;
}

interface FavoriteProperty {
  id: number;
  uuid: string;
  title: string;
  price: number;
  address: string;
  neighborhood: string;
  bedrooms?: number;
  bathrooms?: number;
  superficie?: number;
  imageUrls?: string[];
  operationType: string;
}

interface FavoriteAgency {
  id: number;
  uuid: string;
  slug?: string;
  agencyName: string;
  email: string;
  agencyLogo?: string;
  agencyAddress?: string;
  agencyInfluenceNeighborhoods?: string[];
  reviewCount?: number;
  reviewAverage?: number;
}

// Valid dashboard sections
const VALID_SECTIONS = [
  'perfil',
  'busquedas',
  'favoritos',
  'mensajes'
] as const;

type DashboardSection = typeof VALID_SECTIONS[number];

function optionalNumber() {
  return z.preprocess((value) => {
    if (value === null || value === undefined || value === "" || Number.isNaN(value)) {
      return undefined;
    }
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, z.number().optional());
}

function createClientProfileSchema(t: (key: string) => string) {
  const isUsablePhone = (value: string) => /^[6-9]\d{8}$/.test(value);

  return z.object({
    name: z.string().min(1, t("clientProfile.validation.name_required")),
    surname: z.string().optional(),
    phone: z.string().refine(
      (value) => {
        const digits = (value || "").replace(/\D/g, "");
        if (!digits || digits === "000000000") return true;
        return isUsablePhone(digits);
      },
      { message: t("clientProfile.validation.phone_invalid") },
    ),
    avatar: z.string().optional(),
    employmentStatus: z.string().optional(),
    position: z.string().optional(),
    yearsAtPosition: optionalNumber(),
    monthlyIncome: optionalNumber(),
    numberOfPeople: z.number().optional(),
    relationship: z.string().optional(),
    hasMinors: z.boolean().default(false),
    hasAdolescents: z.boolean().default(false),
    petsStatus: z.string().optional(),
    petsDescription: z.string().optional(),
    moveInTiming: z.string().optional(),
    moveInDate: z.date().optional(),
  });
}

type ClientProfileFormData = z.infer<ReturnType<typeof createClientProfileSchema>>;


export default function ClientProfile() {
  const { user, isLoading } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const clientProfileSchema = createClientProfileSchema(t);
  const dateLocale = { es, en: enUS, fr, it }[language];

  // Extract route parameters
  const [match, params] = useRoute("/perfil-cliente/:clientUuid/:section");
  const urlClientUuid = params?.clientUuid;
  const urlSection = params?.section as DashboardSection | undefined;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [formReady, setFormReady] = useState(false);
  const [phoneFieldFocused, setPhoneFieldFocused] = useState(false);
  const profileInitializedRef = useRef(false);

  // Route guards
  useEffect(() => {
    // Wait for user context to load before applying guards
    if (isLoading) {
      return;
    }

    if (!user) {
      // Not authenticated - redirect to login
      navigate("/iniciar-sesion");
      return;
    }

    if (!user.isClient) {
      // Agents should use their own dashboard
      if (user.agentUuid) {
        navigate(`/gestionar/${user.agentUuid}/calendario`);
      } else {
        navigate("/");
      }
      return;
    }

    if (!user.clientUuid) {
      // Client without UUID - something is wrong
      toast({
        title: t("common.error"),
        description: t("clientProfile.toast.invalid_profile"),
        variant: "destructive"
      });
      return;
    }

    // Check if accessing without UUID in URL (backward compatibility)
    if (!match) {
      // Redirect to UUID-based URL with default section
      navigate(`/perfil-cliente/${user.clientUuid}/perfil`);
      return;
    }

    // Validate UUID matches logged-in user
    if (urlClientUuid !== user.clientUuid) {
      // Attempting to access another client's dashboard
      toast({
        title: t("common.access_denied"),
        description: t("clientProfile.toast.other_profile_denied"),
        variant: "destructive"
      });
      navigate(`/perfil-cliente/${user.clientUuid}/perfil`);
      return;
    }

    // Validate section is valid
    if (!urlSection || !VALID_SECTIONS.includes(urlSection)) {
      // Invalid section - redirect to perfil
      navigate(`/perfil-cliente/${user.clientUuid}/perfil`);
      return;
    }
  }, [user, match, urlClientUuid, urlSection, navigate, toast, isLoading]);

  // Determine current section from URL or default to perfil
  const currentSection = urlSection && VALID_SECTIONS.includes(urlSection) ? urlSection : 'perfil';

  // Query to fetch existing client profile data
  const { data: clientProfileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: [`/api/clients/${user?.id}`],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/clients/${user.id}`);
      if (!response.ok) {
        return null;
      }
      return response.json();
    },
    enabled: !!user?.id && !!user?.isClient,
  });

  // Form initialization
  const form = useForm<ClientProfileFormData>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: {
      name: user?.name || "",
      surname: user?.surname || "",
      phone: user?.phone && user.phone !== "000000000" ? user.phone : "",
      avatar: user?.avatar || "",
      employmentStatus: "",
      position: "",
      yearsAtPosition: undefined,
      monthlyIncome: undefined,
      numberOfPeople: 1,
      relationship: "",
      hasMinors: false,
      hasAdolescents: false,
      petsStatus: "",
      petsDescription: "",
      moveInTiming: "",
      moveInDate: undefined,
    },
  });

  // Redirect if not logged in or not a client
  useEffect(() => {
    if (!user || !user.isClient) {
      navigate("/iniciar-sesion");
    }
  }, [user, navigate]);

  // Load profile data once so later autosaves do not overwrite in-progress edits
  useEffect(() => {
    if (profileInitializedRef.current) return;
    if (isLoadingProfile || !user?.id) return;

    if (clientProfileData) {
      form.reset({
        name: clientProfileData.name || user?.name || "",
        surname: clientProfileData.surname || user?.surname || "",
        phone: clientProfileData.phone && clientProfileData.phone !== "000000000"
          ? clientProfileData.phone
          : user?.phone && user.phone !== "000000000"
            ? user.phone
            : "",
        avatar: clientProfileData.avatar || user?.avatar || "",
        employmentStatus: clientProfileData.employmentStatus || "",
        position: clientProfileData.position || "",
        yearsAtPosition: clientProfileData.yearsAtPosition ?? undefined,
        monthlyIncome: clientProfileData.monthlyIncome ?? undefined,
        numberOfPeople: clientProfileData.numberOfPeople || 1,
        relationship: clientProfileData.relationship || "",
        hasMinors: clientProfileData.hasMinors || false,
        hasAdolescents: clientProfileData.hasAdolescents || false,
        petsStatus: clientProfileData.petsStatus || "",
        petsDescription: clientProfileData.petsDescription || "",
        moveInTiming: clientProfileData.moveInTiming || "",
        moveInDate: clientProfileData.moveInDate ? new Date(clientProfileData.moveInDate) : undefined,
      });

      setNumberOfPeople(clientProfileData.numberOfPeople || 1);
      setProfilePicture(clientProfileData.avatar || null);
    }

    profileInitializedRef.current = true;
    setFormReady(true);
  }, [clientProfileData, isLoadingProfile, user, form]);

  const saveProfile = useCallback(async (data: ClientProfileFormData) => {
    if (!user?.id) {
      throw new Error("NO_USER");
    }

    const name = (data.name || "").trim();
    if (!name) {
      throw new Error("VALIDATION");
    }

    const phoneDigits = (data.phone || "").replace(/\D/g, "");
    const payload: Record<string, unknown> = {
      name,
      surname: (data.surname || "").trim(),
      employmentStatus: data.employmentStatus || null,
      position: data.position || null,
      numberOfPeople: Number.isFinite(data.numberOfPeople) ? data.numberOfPeople : 1,
      relationship: data.relationship || null,
      hasMinors: Boolean(data.hasMinors),
      hasAdolescents: Boolean(data.hasAdolescents),
      petsStatus: data.petsStatus || null,
      petsDescription: data.petsDescription || null,
      moveInTiming: data.moveInTiming || null,
    };

    if (/^[6-9]\d{8}$/.test(phoneDigits)) {
      payload.phone = phoneDigits;
    } else if (!phoneDigits || phoneDigits === "000000000") {
      payload.phone = "";
    }

    if (data.avatar) {
      payload.avatar = data.avatar;
    }
    if (Number.isFinite(data.yearsAtPosition)) {
      payload.yearsAtPosition = data.yearsAtPosition;
    }
    if (Number.isFinite(data.monthlyIncome)) {
      payload.monthlyIncome = data.monthlyIncome;
    }
    if (data.moveInDate) {
      payload.moveInDate = data.moveInDate instanceof Date
        ? data.moveInDate.toISOString()
        : data.moveInDate;
    }

    try {
      await apiRequest("PUT", `/api/clients/${user.id}/profile`, payload);

      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${user.id}`] });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: t("common.error"),
        description: t("clientProfile.toast.profile_update_error"),
        variant: "destructive",
      });
      throw error;
    }
  }, [user?.id, queryClient, toast, t]);

  const watchedValues = form.watch();

  const autosaveFn = useCallback(
    async (data: ClientProfileFormData) => {
      await saveProfile(data);
    },
    [saveProfile],
  );

  const { savedFields } = useAutosave(watchedValues, autosaveFn, {
    enabled: formReady && currentSection === "perfil",
  });

  // Handle photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setProfilePicture(base64String);
        form.setValue("avatar", base64String, { shouldDirty: true, shouldTouch: true });
      };
      reader.readAsDataURL(file);
    }
  };

  // Query para obtener agentes favoritos
  const { data: favoriteAgents = [] } = useQuery<FavoriteAgent[]>({
    queryKey: [`/api/clients/${user?.id}/favorites/agents`],
    queryFn: async () => {
      if (!user || !user.isClient) return [];

      const response = await fetch(`/api/clients/${user.id}/favorites/agents`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!user?.isClient,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  // Query para obtener propiedades favoritas
  const { data: favoriteProperties = [] } = useQuery<FavoriteProperty[]>({
    queryKey: [`/api/clients/${user?.id}/favorites/properties`],
    queryFn: async () => {
      if (!user || !user.isClient) return [];

      const response = await fetch(`/api/clients/${user.id}/favorites/properties`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!user?.isClient,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  // Query para obtener agencias favoritas
  const { data: favoriteAgencies = [] } = useQuery<FavoriteAgency[]>({
    queryKey: [`/api/clients/${user?.id}/favorites/agencies`],
    queryFn: async () => {
      if (!user || !user.isClient) return [];

      const response = await fetch(`/api/clients/${user.id}/favorites/agencies`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!user?.isClient,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  // Query para obtener búsquedas guardadas
  const { data: savedSearches = [] } = useQuery<any[]>({
    queryKey: ["/api/saved-searches"],
    queryFn: async () => {
      if (!user || !user.isClient) return [];

      const response = await fetch("/api/saved-searches");
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!user?.isClient,
    staleTime: 30000,
    gcTime: 300000,
  });

  // Mutation for deleting saved search
  const deleteSavedSearchMutation = useMutation({
    mutationFn: async (searchId: number) => {
      await apiRequest("DELETE", `/api/saved-searches/${searchId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-searches"] });
      toast({
        title: t("clientProfile.toast.search_deleted"),
        description: t("clientProfile.toast.search_deleted_desc"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("clientProfile.toast.search_delete_error"),
        variant: "destructive",
      });
    },
  });

  // Mutation for updating saved search name
  const updateSavedSearchMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const response = await apiRequest("PUT", `/api/saved-searches/${id}`, { name });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-searches"] });
      toast({
        title: t("clientProfile.toast.search_updated"),
        description: t("clientProfile.toast.search_updated_desc"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("clientProfile.toast.search_update_error"),
        variant: "destructive",
      });
    },
  });

  // Mutation for toggling favorite property
  const toggleFavoritePropertyMutation = useMutation({
    mutationFn: async (propertyUuid: string): Promise<{ isFavorite: boolean; message: string }> => {
      return await apiRequest("POST", `/api/clients/favorites/properties/${propertyUuid}`, {
        clientId: user?.id
      });
    },
    onSuccess: (data) => {
      // Invalidate favorite properties query to refetch
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${user?.id}/favorites/properties`] });
      toast({
        title: data.isFavorite ? t("clientProfile.toast.favorite_added_title") : t("clientProfile.toast.favorite_removed_title"),
        description: data.isFavorite 
          ? t("clientProfile.toast.favorite_added_property")
          : t("clientProfile.toast.favorite_removed_property")
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: (error as Error).message || t("clientProfile.toast.favorite_update_error"),
        variant: "destructive",
      });
    },
  });

  // Mutation for toggling favorite agency
  const toggleFavoriteAgencyMutation = useMutation({
    mutationFn: async (agencyUuid: string): Promise<{ isFavorite: boolean; message: string }> => {
      return await apiRequest("POST", `/api/clients/favorites/agencies/${agencyUuid}`, {
        clientId: user?.id
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${user?.id}/favorites/agencies`] });
      toast({
        title: data.isFavorite ? t("clientProfile.toast.favorite_added_title") : t("clientProfile.toast.favorite_removed_title"),
        description: data.isFavorite 
          ? t("clientProfile.toast.favorite_added_agency")
          : t("clientProfile.toast.favorite_removed_agency")
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: (error as Error).message || t("clientProfile.toast.favorite_update_error"),
        variant: "destructive",
      });
    },
  });

  // Helper function for sharing agencies
  const handleShareAgency = (agency: FavoriteAgency, platform: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const url = `${window.location.origin}/agencias/${agency.slug || agency.id}`;
    const text = t("clientProfile.favorites.agency_share_text", { name: agency.agencyName });
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} - ${url}`)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast({
          title: t("clientProfile.toast.link_copied"),
          description: t("clientProfile.toast.agency_link_copied"),
        });
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`, '_blank');
        break;
    }
  };

  // State for edit mode
  const [editingSearchId, setEditingSearchId] = useState<number | null>(null);
  const [editingSearchName, setEditingSearchName] = useState("");
  const [deletingSearchId, setDeletingSearchId] = useState<number | null>(null);
  const [removingFavoriteProperty, setRemovingFavoriteProperty] = useState<FavoriteProperty | null>(null);
  const [removingFavoriteAgency, setRemovingFavoriteAgency] = useState<FavoriteAgency | null>(null);

  // Show loading spinner while user context is loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render anything if guards haven't passed yet
  if (!user || !user.isClient) {
    return null;
  }

  const labelWithSaved = (field: string, text: React.ReactNode, className = "text-sm font-medium text-gray-700") => (
    <FormLabel className={cn("inline-flex items-center", className)}>
      {text}
      <SavedIndicator visible={savedFields.has(field)} />
    </FormLabel>
  );

  const renderMainContent = () => {
    switch (currentSection) {
      case "perfil":
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("clientProfile.title")}</h1>
              <p className="text-gray-600">{t("clientProfile.subtitle")}</p>
            </div>
            <Form {...form}>
              <form onSubmit={(event) => event.preventDefault()} className="space-y-8 pb-8">
                {/* Photo Upload Section */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={profilePicture || user?.avatar} />
                          <AvatarFallback className="text-lg bg-gray-100">
                            <Camera className="h-8 w-8 text-gray-400" />
                          </AvatarFallback>
                        </Avatar>
                        <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                          <Upload className="h-6 w-6" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            data-testid="input-photo-upload"
                          />
                        </label>
                      </div>
                      <p className="text-sm text-gray-600 text-center max-w-xs inline-flex items-center justify-center">
                        {t("clientProfile.photo_hint")}
                        <SavedIndicator visible={savedFields.has("avatar")} />
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Datos Personales Section */}
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-6 text-gray-900">{t("clientProfile.personal_info")}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            {labelWithSaved(
                              "name",
                              <>
                                {t("clientProfile.name")} <span className="text-red-500">*</span>
                              </>,
                            )}
                            <FormControl>
                              <Input 
                                placeholder={t("clientProfile.name_placeholder")}
                                {...field}
                                data-testid="input-name"
                              />
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
                            {labelWithSaved(
                              "surname",
                              <>
                                {t("clientProfile.surname")} <span className="text-red-500">*</span>
                              </>,
                            )}
                            <FormControl>
                              <Input 
                                placeholder={t("clientProfile.surname_placeholder")}
                                {...field}
                                data-testid="input-surname"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => {
                          const isPhoneValid = Boolean(field.value && /^[6-9]\d{8}$/.test(field.value));
                          const showPhoneFeedback = phoneFieldFocused && Boolean(field.value);
                          
                          return (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700 inline-flex items-center gap-2">
                                {t("clientProfile.phone")} <span className="text-red-500">*</span>
                                {showPhoneFeedback && isPhoneValid && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                                <SavedIndicator visible={savedFields.has("phone")} />
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="tel"
                                  placeholder={t("clientProfile.phone_placeholder")}
                                  maxLength={9}
                                  {...field}
                                  className={cn(
                                    showPhoneFeedback && isPhoneValid && "border-green-500 focus:border-green-600",
                                    showPhoneFeedback && !isPhoneValid && "border-red-500 focus:border-red-600"
                                  )}
                                  onFocus={() => setPhoneFieldFocused(true)}
                                  onBlur={() => {
                                    field.onBlur();
                                    setPhoneFieldFocused(false);
                                  }}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    field.onChange(value);
                                  }}
                                  data-testid="input-phone"
                                />
                              </FormControl>
                              {showPhoneFeedback && isPhoneValid && (
                                <div className="text-sm text-green-600 flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  {t("clientProfile.phone_valid")}
                                </div>
                              )}
                              {showPhoneFeedback && !isPhoneValid && (
                                <div className="text-sm text-muted-foreground">
                                  {t("clientProfile.phone_format")}
                                </div>
                              )}
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Employment Information Section */}
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-6 text-gray-900">{t("clientProfile.employment")}</h2>
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="employmentStatus"
                        render={({ field }) => (
                          <FormItem>
                            {labelWithSaved("employmentStatus", t("clientProfile.employment_status"))}
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-employment-status">
                                  <SelectValue placeholder={t("clientProfile.employment_placeholder")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="jornada-completa">{t("clientProfile.employment.full_time")}</SelectItem>
                                <SelectItem value="jornada-parcial">{t("clientProfile.employment.part_time")}</SelectItem>
                                <SelectItem value="autonomo">{t("clientProfile.employment.self_employed")}</SelectItem>
                                <SelectItem value="desempleado">{t("clientProfile.employment.unemployed")}</SelectItem>
                                <SelectItem value="estudiante">{t("clientProfile.employment.student")}</SelectItem>
                                <SelectItem value="pensionista">{t("clientProfile.employment.retired")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="position"
                          render={({ field }) => (
                            <FormItem>
                              {labelWithSaved("position", t("clientProfile.position"))}
                              <FormControl>
                                <Input 
                                  placeholder={t("clientProfile.position_placeholder")}
                                  {...field}
                                  data-testid="input-position"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="yearsAtPosition"
                          render={({ field }) => (
                            <FormItem>
                              {labelWithSaved("yearsAtPosition", t("clientProfile.years_at_position"))}
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder={t("clientProfile.years_at_position_placeholder")}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))}
                                  data-testid="input-years-position"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="monthlyIncome"
                        render={({ field }) => (
                          <FormItem>
                            {labelWithSaved("monthlyIncome", t("clientProfile.monthly_income"))}
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder={t("clientProfile.monthly_income_placeholder")}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))}
                                data-testid="input-monthly-income"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Housing Questions Section */}
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-6 text-gray-900">{t("clientProfile.housing_preferences")}</h2>
                    <div className="space-y-8">
                      {/* Number of People */}
                      <div className="space-y-3">
                        {labelWithSaved("numberOfPeople", t("clientProfile.people_question"))}
                        <div className="flex items-center space-x-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newValue = Math.max(1, numberOfPeople - 1);
                              setNumberOfPeople(newValue);
                              form.setValue("numberOfPeople", newValue, { shouldDirty: true, shouldTouch: true });
                            }}
                            data-testid="button-decrease-people"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-20 text-center font-medium">{t("clientProfile.people_count", { count: numberOfPeople })}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newValue = numberOfPeople + 1;
                              setNumberOfPeople(newValue);
                              form.setValue("numberOfPeople", newValue, { shouldDirty: true, shouldTouch: true });
                            }}
                            data-testid="button-increase-people"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Relationship */}
                      <FormField
                        control={form.control}
                        name="relationship"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            {labelWithSaved("relationship", t("clientProfile.relationship_question"))}
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="space-y-2"
                                data-testid="radio-relationship"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="amigos" id="amigos" />
                                  <label htmlFor="amigos" className="text-sm">{t("clientProfile.relationship.friends")}</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="familia" id="familia" />
                                  <label htmlFor="familia" className="text-sm">{t("clientProfile.relationship.family")}</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="otra" id="otra" />
                                  <label htmlFor="otra" className="text-sm">{t("clientProfile.relationship.other")}</label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Minors */}
                      <div className="space-y-3">
                        {labelWithSaved("hasMinors", t("clientProfile.minors_question"))}
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name="hasMinors"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="checkbox-minors"
                                  />
                                </FormControl>
                                {labelWithSaved("hasMinors", t("clientProfile.children"), "text-sm")}
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="hasAdolescents"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="checkbox-adolescents"
                                  />
                                </FormControl>
                                {labelWithSaved("hasAdolescents", t("clientProfile.adolescents"), "text-sm")}
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Pets */}
                      <FormField
                        control={form.control}
                        name="petsStatus"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            {labelWithSaved("petsStatus", t("clientProfile.pets_question"))}
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="space-y-2"
                                data-testid="radio-pets"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="no-tengo-mascota" id="no-pets" />
                                  <label htmlFor="no-pets" className="text-sm">{t("clientProfile.pets.none")}</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="tengo-mascota" id="has-pets" />
                                  <label htmlFor="has-pets" className="text-sm">{t("clientProfile.pets.has")}</label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Pet Description - Show only if they have pets */}
                      {form.watch("petsStatus") === "tengo-mascota" && (
                        <FormField
                          control={form.control}
                          name="petsDescription"
                          render={({ field }) => (
                            <FormItem>
                              {labelWithSaved("petsDescription", t("clientProfile.pet_example"))}
                              <FormControl>
                                <Input 
                                  placeholder={t("clientProfile.pet_description_placeholder")}
                                  maxLength={50}
                                  {...field}
                                  data-testid="input-pets-description"
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">{t("clientProfile.characters", { count: (field.value || "").length })}</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Move-in Timing */}
                      <FormField
                        control={form.control}
                        name="moveInTiming"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            {labelWithSaved("moveInTiming", t("clientProfile.move_in_question"))}
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="space-y-2"
                                data-testid="radio-move-timing"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="lo-antes-posible" id="asap" />
                                  <label htmlFor="asap" className="text-sm">{t("clientProfile.move_in.asap")}</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="tengo-flexibilidad" id="flexible" />
                                  <label htmlFor="flexible" className="text-sm">{t("clientProfile.move_in.flexible")}</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="fecha-exacta" id="exact-date" />
                                  <label htmlFor="exact-date" className="text-sm">{t("clientProfile.move_in.exact")}</label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Specific Date - Show only if exact date is selected */}
                      {form.watch("moveInTiming") === "fecha-exacta" && (
                        <FormField
                          control={form.control}
                          name="moveInDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              {labelWithSaved("moveInDate", t("clientProfile.move_in_date"))}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-[240px] pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                      data-testid="button-move-date"
                                    >
                                      {field.value ? (
                                        format(field.value, "dd/MM/yyyy")
                                      ) : (
                                        <span>{t("clientProfile.select_date")}</span>
                                      )}
                                      <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date < new Date() || date < new Date("1900-01-01")
                                    }
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
                  </CardContent>
                </Card>

              </form>
            </Form>
          </div>
        );

      case "favoritos":
        return (
          <div className="space-y-6">
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t("clientProfile.favorites.title")}</h1>
              <p className="text-gray-600 text-sm md:text-base">{t("clientProfile.favorites.subtitle")}</p>
            </div>

            <Tabs defaultValue="propiedades" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-4">
                <TabsTrigger value="propiedades" data-testid="tab-propiedades">
                  <Home className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">{t("clientProfile.favorites.properties")}</span>
                  <span className="sm:hidden">{t("clientProfile.favorites.properties_short")}</span>
                </TabsTrigger>
                <TabsTrigger value="agentes" data-testid="tab-agentes">
                  <Star className="h-4 w-4 mr-1 md:mr-2" />
                  <span>{t("clientProfile.favorites.agents")}</span>
                </TabsTrigger>
                <TabsTrigger value="agencias" data-testid="tab-agencias">
                  <Building2 className="h-4 w-4 mr-1 md:mr-2" />
                  <span>{t("clientProfile.favorites.agencies")}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="propiedades">
                {favoriteProperties.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {t("clientProfile.favorites.no_properties")}
                      </h3>
                      <p className="text-gray-500">
                        {t("clientProfile.favorites.no_properties_desc")}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoriteProperties.map((property) => {
                      const propertyImages = (property.imageUrls && property.imageUrls.length > 0)
                        ? property.imageUrls
                        : [];
                      
                      return (
                        <Card key={property.uuid} className="hover:shadow-md transition-shadow h-full flex flex-col">
                          <CardContent className="p-0 flex flex-col flex-1">
                            {propertyImages.length > 0 && (
                              <img
                                src={propertyImages[0]}
                                alt={property.title}
                                className="w-full h-48 object-cover rounded-t-lg"
                              />
                            )}
                            <div className="p-4 flex flex-col flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
                                  {property.title}
                                </h3>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1 h-7 w-7 hover:bg-gray-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRemovingFavoriteProperty(property);
                                    }}
                                    data-testid={`button-unfavorite-property-${property.uuid}`}
                                  >
                                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1 h-7 w-7 hover:bg-gray-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const propertyUrl = `${window.location.origin}/property/${property.uuid}`;
                                      if (navigator.share) {
                                        navigator.share({
                                          title: property.title,
                                          text: t("clientProfile.favorites.share_property_text", { title: property.title }),
                                          url: propertyUrl,
                                        });
                                      } else {
                                        navigator.clipboard.writeText(propertyUrl);
                                        toast({
                                          title: t("clientProfile.toast.link_copied"),
                                          description: t("clientProfile.toast.property_link_copied"),
                                        });
                                      }
                                    }}
                                    data-testid={`button-share-property-${property.uuid}`}
                                  >
                                    <Share2 className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                                  </Button>
                                </div>
                              </div>
                              <Badge variant={property.operationType === "Venta" ? "default" : "secondary"} className="w-fit mb-2">
                                {property.operationType === "Venta" ? t("home.tab_sale") : t("home.tab_rent")}
                              </Badge>
                              <p className="text-2xl font-bold text-primary mb-2">
                                €{property.price.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {property.neighborhood}
                              </p>
                              <div className="flex gap-4 text-sm text-gray-500 mb-3">
                                {property.bedrooms && <span>{t("clientProfile.favorites.bedrooms", { count: property.bedrooms })}</span>}
                                {property.bathrooms && <span>{t("clientProfile.favorites.bathrooms", { count: property.bathrooms })}</span>}
                                {property.superficie && <span>{t("clientProfile.favorites.area", { area: property.superficie })}</span>}
                              </div>
                              <div className="flex-1" />
                              <Button 
                                size="sm" 
                                className="w-full mt-auto"
                                onClick={() => navigate(`/property/${property.uuid}`)}
                              >
                                {t("clientProfile.favorites.details")}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="agentes">
                {favoriteAgents.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {t("clientProfile.favorites.no_agents")}
                      </h3>
                      <p className="text-gray-500">
                        {t("clientProfile.favorites.no_agents_desc")}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {favoriteAgents.map((agent) => (
                      <Card 
                        key={agent.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/agente/${agent.slug || agent.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={agent.avatar} />
                              <AvatarFallback>
                                {agent.name[0]}{agent.surname[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {agent.name} {agent.surname}
                              </h3>
                              <p className="text-sm text-gray-500 truncate">
                                {agent.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            {agent.yearsOfExperience && (
                              <span className="text-sm text-gray-600">
                                {t("clientProfile.favorites.years_experience", { count: agent.yearsOfExperience })}
                              </span>
                            )}
                            {agent.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{agent.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          {agent.influenceNeighborhoods && agent.influenceNeighborhoods.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {agent.influenceNeighborhoods.slice(0, 3).map((neighborhood, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {neighborhood}
                                </Badge>
                              ))}
                              {agent.influenceNeighborhoods.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{agent.influenceNeighborhoods.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="agencias">
                {favoriteAgencies.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {t("clientProfile.favorites.no_agencies")}
                      </h3>
                      <p className="text-gray-500">
                        {t("clientProfile.favorites.no_agencies_desc")}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {favoriteAgencies.map((agency) => (
                      <Card 
                        key={agency.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer relative"
                        onClick={() => navigate(`/agencias/${agency.slug || agency.id}`)}
                        data-testid={`card-favorite-agency-${agency.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setRemovingFavoriteAgency(agency);
                              }}
                              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                              data-testid={`button-remove-agency-${agency.id}`}
                              aria-label={t("clientProfile.favorites.remove")}
                            >
                              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                            </button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                  data-testid={`button-share-agency-${agency.id}`}
                                  aria-label={t("clientProfile.favorites.share_agency")}
                                >
                                  <Share2 className="w-4 h-4 text-gray-400 hover:text-primary" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => handleShareAgency(agency, 'whatsapp', e)} data-testid="share-whatsapp">
                                  <SiWhatsapp className="w-4 h-4 mr-2 text-green-500" />
                                  WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => handleShareAgency(agency, 'email', e)} data-testid="share-email">
                                  <Mail className="w-4 h-4 mr-2" />
                                  Email
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => handleShareAgency(agency, 'copy', e)} data-testid="share-copy">
                                  <Copy className="w-4 h-4 mr-2" />
                                  {t("clientProfile.favorites.copy_link")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="flex items-center gap-3 mb-3 pr-16">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={agency.agencyLogo} />
                              <AvatarFallback>
                                <Building2 className="h-6 w-6" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {agency.agencyName}
                              </h3>
                              <p className="text-sm text-gray-500 truncate">
                                {agency.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium">
                                {agency.reviewAverage && agency.reviewAverage > 0 ? agency.reviewAverage.toFixed(1) : t("clientProfile.favorites.no_rating")}
                              </span>
                            </div>
                            {agency.reviewCount !== undefined && agency.reviewCount > 0 && (
                              <span className="text-sm text-gray-500">
                                ({agency.reviewCount} {agency.reviewCount === 1 ? t("clientProfile.favorites.review") : t("clientProfile.favorites.reviews")})
                              </span>
                            )}
                          </div>

                          {agency.agencyAddress && (
                            <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                              <MapPin className="h-3 w-3" />
                              {agency.agencyAddress}
                            </p>
                          )}
                          {agency.agencyInfluenceNeighborhoods && agency.agencyInfluenceNeighborhoods.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {agency.agencyInfluenceNeighborhoods.slice(0, 3).map((neighborhood, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {neighborhood}
                                </Badge>
                              ))}
                              {agency.agencyInfluenceNeighborhoods.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{agency.agencyInfluenceNeighborhoods.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        );

      case "mensajes":
        return (
          <div className="h-full flex flex-col">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("messages.title")}</h1>
              <p className="text-gray-600">{t("messages.conversations_with_agents")}</p>
            </div>

            <div className="flex-1 min-h-0">
              <ClientConversationalMessages />
            </div>
          </div>
        );

      case "busquedas":
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("clientProfile.searches.title")}</h1>
              <p className="text-gray-600">{t("clientProfile.searches.subtitle")}</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-blue-500" />
                  {t("clientProfile.searches.saved", { count: savedSearches.length })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedSearches.length === 0 ? (
                  <div className="text-center py-12">
                    <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {t("clientProfile.searches.empty")}
                    </h3>
                    <p className="text-gray-500">
                      {t("clientProfile.searches.empty_desc")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedSearches.map((search) => (
                      <Card key={search.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-3">
                            {/* Title - full width */}
                            {editingSearchId === search.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingSearchName}
                                  onChange={(e) => setEditingSearchName(e.target.value)}
                                  className="flex-1"
                                  data-testid={`input-edit-search-${search.id}`}
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    updateSavedSearchMutation.mutate({
                                      id: search.id,
                                      name: editingSearchName,
                                    });
                                    setEditingSearchId(null);
                                  }}
                                  data-testid={`button-save-edit-${search.id}`}
                                >
                                  {t("clientProfile.searches.save")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingSearchId(null);
                                    setEditingSearchName("");
                                  }}
                                  data-testid={`button-cancel-edit-${search.id}`}
                                >
                                  {t("clientProfile.searches.cancel")}
                                </Button>
                              </div>
                            ) : (
                              <>
                                <h3 className="font-semibold text-gray-900 w-full">
                                  {search.name}
                                </h3>
                                
                                {/* Filter pills - show only smallest location */}
                                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                  {/* Location: show only the smallest region */}
                                  {search.neighborhood ? (
                                    <Badge variant="secondary">{search.neighborhood}</Badge>
                                  ) : search.district ? (
                                    <Badge variant="secondary">{search.district}</Badge>
                                  ) : search.city ? (
                                    <Badge variant="secondary">{search.city}</Badge>
                                  ) : null}
                                  {search.operationType && (
                                    <Badge variant="outline">
                                      {search.operationType === "Venta" ? t("home.tab_sale") : t("home.tab_rent")}
                                    </Badge>
                                  )}
                                  {search.priceMin && search.priceMax && (
                                    <Badge variant="outline">
                                      {search.priceMin.toLocaleString()} - {search.priceMax.toLocaleString()} €
                                    </Badge>
                                  )}
                                  {search.bedrooms && (
                                    <Badge variant="outline">{t("clientProfile.searches.bedrooms", { count: search.bedrooms })}</Badge>
                                  )}
                                  {search.bathrooms && (
                                    <Badge variant="outline">{t("clientProfile.searches.bathrooms", { count: search.bathrooms })}</Badge>
                                  )}
                                </div>

                                {/* Actions - at bottom */}
                                <div className="flex items-center gap-2 pt-2 border-t mt-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      // Build search URL with filters
                                      const params = new URLSearchParams();
                                      if (search.operationType) params.append("operationType", search.operationType);
                                      if (search.priceMin) params.append("minPrice", search.priceMin.toString());
                                      if (search.priceMax) params.append("maxPrice", search.priceMax.toString());
                                      if (search.bedrooms) params.append("bedrooms", search.bedrooms.toString());
                                      if (search.bathrooms) params.append("bathrooms", search.bathrooms.toString());
                                      
                                      let url = "/";
                                      if (search.neighborhood) {
                                        const neighborhood = search.district 
                                          ? `${search.neighborhood}, ${search.district}, ${search.city}` 
                                          : search.neighborhood;
                                        url = `/neighborhood/${encodeURIComponent(neighborhood)}/properties?${params.toString()}`;
                                      } else if (search.district) {
                                        url = `/neighborhood/${encodeURIComponent(`${search.district}, ${search.city}`)}/properties?${params.toString()}`;
                                      } else if (search.city) {
                                        url = `/neighborhood/${encodeURIComponent(search.city)}/properties?${params.toString()}`;
                                      }
                                      
                                      navigate(url);
                                    }}
                                    data-testid={`button-apply-search-${search.id}`}
                                    title={t("clientProfile.searches.view_results")}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {deletingSearchId === search.id ? (
                                    <div className="flex items-center gap-1 ml-auto">
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                          deleteSavedSearchMutation.mutate(search.id);
                                          setDeletingSearchId(null);
                                        }}
                                        className="text-xs px-2"
                                        data-testid={`button-confirm-delete-${search.id}`}
                                      >
                                        {t("clientProfile.searches.confirm")}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setDeletingSearchId(null)}
                                        className="text-xs px-2"
                                        data-testid={`button-cancel-delete-${search.id}`}
                                      >
                                        {t("clientProfile.searches.no")}
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 ml-auto">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingSearchId(search.id);
                                          setEditingSearchName(search.name);
                                        }}
                                        data-testid={`button-edit-search-${search.id}`}
                                        title={t("clientProfile.searches.edit_name")}
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setDeletingSearchId(search.id)}
                                        data-testid={`button-delete-search-${search.id}`}
                                        title={t("clientProfile.searches.delete")}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarProvider>
        <Sidebar className={`border-r hidden md:block transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} pt-16`}>
          <SidebarContent className="pt-4">
            <SidebarMenu>
              {/* Profile Section */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate(`/perfil-cliente/${user?.clientUuid}/perfil`)}
                  isActive={currentSection === "perfil"}
                  className={`w-full justify-start ${sidebarCollapsed ? 'justify-center' : ''}`}
                  data-testid="sidebar-perfil"
                >
                  <User className="h-4 w-4" />
                  {!sidebarCollapsed && <span>{t("clientProfile.nav.profile")}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Searches Section */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate(`/perfil-cliente/${user?.clientUuid}/busquedas`)}
                  isActive={currentSection === "busquedas"}
                  className={`w-full justify-start ${sidebarCollapsed ? 'justify-center' : ''}`}
                  data-testid="sidebar-busquedas"
                >
                  <Bookmark className="h-4 w-4" />
                  {!sidebarCollapsed && <span>{t("clientProfile.nav.searches")}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Favorites Section */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate(`/perfil-cliente/${user?.clientUuid}/favoritos`)}
                  isActive={currentSection === "favoritos"}
                  className={`w-full justify-start ${sidebarCollapsed ? 'justify-center' : ''}`}
                  data-testid="sidebar-favoritos"
                >
                  <Heart className="h-4 w-4" />
                  {!sidebarCollapsed && <span>{t("clientProfile.nav.favorites")}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Messages Section */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate(`/perfil-cliente/${user?.clientUuid}/mensajes`)}
                  isActive={currentSection === "mensajes"}
                  className={`w-full justify-start ${sidebarCollapsed ? 'justify-center' : ''}`}
                  data-testid="sidebar-mensajes"
                >
                  <MessageCircle className="h-4 w-4" />
                  {!sidebarCollapsed && <span>{t("clientProfile.nav.messages")}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        {/* Sidebar Toggle Button - Positioned at the border like manage page (hidden on mobile) */}
        <div className={`hidden md:block fixed top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${sidebarCollapsed ? 'left-14' : 'left-60'}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8 p-0 bg-white shadow-md border rounded-full"
            data-testid="sidebar-toggle"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Main content area */}
        <main className={`absolute inset-0 pt-20 md:pt-24 pb-20 md:pb-6 transition-all duration-300 ${
          currentSection === "mensajes"
            ? `p-2 md:p-3 ${sidebarCollapsed ? "md:left-16 md:pl-2" : "md:left-64"}`
            : `p-4 md:p-6 md:right-40 ${sidebarCollapsed ? "md:left-16" : "md:left-64"}`
        }`}>
          <div className={currentSection === "mensajes" ? "w-full h-full" : "max-w-6xl mx-auto"}>
            {renderMainContent()}
          </div>
        </main>
      </SidebarProvider>

      {/* Mobile Bottom Navigation */}
      <MobileClientNav currentSection={currentSection} />

      {/* Confirmation dialog for removing favorite property */}
      <AlertDialog open={!!removingFavoriteProperty} onOpenChange={(open) => !open && setRemovingFavoriteProperty(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("clientProfile.dialog.remove_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("clientProfile.dialog.remove_property", { title: removingFavoriteProperty?.title || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-remove-favorite">{t("clientProfile.searches.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removingFavoriteProperty) {
                  toggleFavoritePropertyMutation.mutate(removingFavoriteProperty.uuid);
                  setRemovingFavoriteProperty(null);
                }
              }}
              data-testid="button-confirm-remove-favorite"
            >
              {t("clientProfile.searches.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation dialog for removing favorite agency */}
      <AlertDialog open={!!removingFavoriteAgency} onOpenChange={(open) => !open && setRemovingFavoriteAgency(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("clientProfile.dialog.remove_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("clientProfile.dialog.remove_agency", { name: removingFavoriteAgency?.agencyName || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-remove-agency-favorite">{t("clientProfile.searches.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removingFavoriteAgency) {
                  toggleFavoriteAgencyMutation.mutate(removingFavoriteAgency.uuid);
                  setRemovingFavoriteAgency(null);
                }
              }}
              data-testid="button-confirm-remove-agency-favorite"
            >
              {t("clientProfile.searches.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}