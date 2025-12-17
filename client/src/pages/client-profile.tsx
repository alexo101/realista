import { useState, useEffect } from "react";
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
import { Heart, MessageCircle, User, Home, Mail, Phone, Star, MapPin, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Camera, Upload, Minus, Plus, CalendarDays, CheckCircle, Building2, Bookmark, Edit2, Trash2, Share2 } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ClientConversationalMessages } from "@/components/ClientConversationalMessages";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
  agencyName: string;
  email: string;
  agencyLogo?: string;
  agencyAddress?: string;
  agencyInfluenceNeighborhoods?: string[];
}

// Valid dashboard sections
const VALID_SECTIONS = [
  'perfil',
  'busquedas',
  'citas',
  'favoritos',
  'mensajes'
] as const;

type DashboardSection = typeof VALID_SECTIONS[number];

// Client profile form schema
const clientProfileSchema = z.object({
  name: z.string().min(1, "Nombre es obligatorio"),
  surname: z.string().min(1, "Apellidos es obligatorio"),
  phone: z.string()
    .min(9, "El teléfono debe tener exactamente 9 dígitos")
    .max(9, "El teléfono debe tener exactamente 9 dígitos")
    .regex(/^[6-9]\d{8}$/, "Ingresa un número de teléfono español válido (9 dígitos, comenzando con 6, 7, 8 o 9)"),
  avatar: z.string().optional(),
  employmentStatus: z.string().optional(),
  position: z.string().optional(),
  yearsAtPosition: z.number().optional(),
  monthlyIncome: z.number().optional(),
  numberOfPeople: z.number().optional(),
  relationship: z.string().optional(),
  hasMinors: z.boolean().default(false),
  hasAdolescents: z.boolean().default(false),
  petsStatus: z.string().optional(),
  petsDescription: z.string().optional(),
  moveInTiming: z.string().optional(),
  moveInDate: z.date().optional(),
});

type ClientProfileFormData = z.infer<typeof clientProfileSchema>;


export default function ClientProfile() {
  const { user, isLoading } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Extract route parameters
  const [match, params] = useRoute("/perfil-cliente/:clientUuid/:section");
  const urlClientUuid = params?.clientUuid;
  const urlSection = params?.section as DashboardSection | undefined;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

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
        title: "Error",
        description: "Tu perfil no tiene un identificador válido. Contacta soporte.",
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
        title: "Acceso denegado",
        description: "No puedes acceder al perfil de otro cliente.",
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
      phone: user?.phone || "",
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

  // Update form with loaded profile data
  useEffect(() => {
    if (clientProfileData) {
      
      // Reset form with existing data
      form.reset({
        name: clientProfileData.name || user?.name || "",
        surname: clientProfileData.surname || user?.surname || "",
        phone: clientProfileData.phone || user?.phone || "",
        avatar: clientProfileData.avatar || user?.avatar || "",
        employmentStatus: clientProfileData.employmentStatus || "",
        position: clientProfileData.position || "",
        yearsAtPosition: clientProfileData.yearsAtPosition,
        monthlyIncome: clientProfileData.monthlyIncome,
        numberOfPeople: clientProfileData.numberOfPeople || 1,
        relationship: clientProfileData.relationship || "",
        hasMinors: clientProfileData.hasMinors || false,
        hasAdolescents: clientProfileData.hasAdolescents || false,
        petsStatus: clientProfileData.petsStatus || "",
        petsDescription: clientProfileData.petsDescription || "",
        moveInTiming: clientProfileData.moveInTiming || "",
        moveInDate: clientProfileData.moveInDate ? new Date(clientProfileData.moveInDate) : undefined,
      });

      // Update state variables
      setNumberOfPeople(clientProfileData.numberOfPeople || 1);
      setProfilePicture(clientProfileData.avatar || null);
    }
  }, [clientProfileData, user, form]);

  // Handle form submission
  const onSubmit = async (data: ClientProfileFormData) => {
    try {
      const response = await fetch(`/api/clients/${user?.id}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el perfil");
      }

      toast({
        title: "Éxito",
        description: "Tu perfil ha sido actualizado correctamente",
      });

      // Invalidate queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${user?.id}`] });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    }
  };

  // Handle photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setProfilePicture(base64String);
        form.setValue("avatar", base64String);
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
        title: "Búsqueda eliminada",
        description: "La búsqueda ha sido eliminada exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la búsqueda",
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
        title: "Búsqueda actualizada",
        description: "El nombre de la búsqueda ha sido actualizado",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el nombre de la búsqueda",
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
        title: data.isFavorite ? "Agregado a favoritos" : "Eliminado de favoritos",
        description: data.isFavorite 
          ? "La propiedad se ha agregado a tus favoritos."
          : "La propiedad se ha eliminado de tus favoritos."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "No se pudo actualizar favoritos",
        variant: "destructive",
      });
    },
  });

  // State for edit mode
  const [editingSearchId, setEditingSearchId] = useState<number | null>(null);
  const [editingSearchName, setEditingSearchName] = useState("");
  const [deletingSearchId, setDeletingSearchId] = useState<number | null>(null);

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

  const renderMainContent = () => {
    switch (currentSection) {
      case "perfil":
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
              <p className="text-gray-600">Gestiona tu información personal y preferencias</p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-12">
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
                      <p className="text-sm text-gray-600 text-center max-w-xs">
                        Candidatos con fotos transmiten más confianza
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Datos Personales Section */}
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-6 text-gray-900">Datos personales</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Nombre <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Tu nombre" 
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
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Apellidos <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Tus apellidos" 
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
                          // Real-time validation check
                          const isPhoneValid = field.value && /^[6-9]\d{8}$/.test(field.value);
                          
                          return (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                Teléfono <span className="text-red-500">*</span>
                                {isPhoneValid && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="tel"
                                  placeholder="Ej: 612345678"
                                  maxLength={9}
                                  {...field}
                                  className={cn(
                                    isPhoneValid && "border-green-500 focus:border-green-600",
                                    field.value && !isPhoneValid && "border-red-500 focus:border-red-600"
                                  )}
                                  onChange={(e) => {
                                    // Only allow digits
                                    const value = e.target.value.replace(/\D/g, '');
                                    field.onChange(value);
                                  }}
                                  data-testid="input-phone"
                                />
                              </FormControl>
                              {isPhoneValid && (
                                <div className="text-sm text-green-600 flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Número de teléfono válido
                                </div>
                              )}
                              {field.value && field.value.length > 0 && !isPhoneValid && (
                                <div className="text-sm text-muted-foreground">
                                  Formato: 9 dígitos comenzando con 6, 7, 8 o 9
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
                    <h2 className="text-xl font-semibold mb-6 text-gray-900">Información laboral</h2>
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="employmentStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Situación actual</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-employment-status">
                                  <SelectValue placeholder="Selecciona tu situación laboral" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="jornada-completa">Jornada completa</SelectItem>
                                <SelectItem value="jornada-parcial">Jornada parcial</SelectItem>
                                <SelectItem value="autonomo">Autónomo</SelectItem>
                                <SelectItem value="desempleado">Desempleado</SelectItem>
                                <SelectItem value="estudiante">Estudiante</SelectItem>
                                <SelectItem value="pensionista">Pensionista</SelectItem>
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
                              <FormLabel className="text-sm font-medium text-gray-700">Posición</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Tu puesto de trabajo" 
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
                              <FormLabel className="text-sm font-medium text-gray-700">Permanencia en años</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Años en tu puesto actual"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Ingresos mensuales de todos los aplicantes en €
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Ingresos totales mensuales"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                    <h2 className="text-xl font-semibold mb-6 text-gray-900">Preferencias de vivienda</h2>
                    <div className="space-y-8">
                      {/* Number of People */}
                      <div className="space-y-3">
                        <FormLabel className="text-sm font-medium text-gray-700">
                          ¿Personas que van a vivir en el inmueble?
                        </FormLabel>
                        <div className="flex items-center space-x-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newValue = Math.max(1, numberOfPeople - 1);
                              setNumberOfPeople(newValue);
                              form.setValue("numberOfPeople", newValue);
                            }}
                            data-testid="button-decrease-people"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-20 text-center font-medium">{numberOfPeople} personas</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newValue = numberOfPeople + 1;
                              setNumberOfPeople(newValue);
                              form.setValue("numberOfPeople", newValue);
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
                            <FormLabel className="text-sm font-medium text-gray-700">
                              ¿Relación entre vosotros?
                            </FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="space-y-2"
                                data-testid="radio-relationship"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="amigos" id="amigos" />
                                  <label htmlFor="amigos" className="text-sm">Amigos</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="familia" id="familia" />
                                  <label htmlFor="familia" className="text-sm">Familia</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="otra" id="otra" />
                                  <label htmlFor="otra" className="text-sm">Otra</label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Minors */}
                      <div className="space-y-3">
                        <FormLabel className="text-sm font-medium text-gray-700">¿Hay menores?</FormLabel>
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
                                <FormLabel className="text-sm">Niños (0 - 12 años)</FormLabel>
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
                                <FormLabel className="text-sm">Adolescentes (13 - 17 años)</FormLabel>
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
                            <FormLabel className="text-sm font-medium text-gray-700">¿Tenéis mascotas?</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="space-y-2"
                                data-testid="radio-pets"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="no-tengo-mascota" id="no-pets" />
                                  <label htmlFor="no-pets" className="text-sm">No tengo mascota</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="tengo-mascota" id="has-pets" />
                                  <label htmlFor="has-pets" className="text-sm">Tengo mascota</label>
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
                              <FormLabel className="text-sm font-medium text-gray-700">
                                Ej. Un perro pequeño
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Describe tu mascota"
                                  maxLength={50}
                                  {...field}
                                  data-testid="input-pets-description"
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">{(field.value || "").length}/50 caracteres</p>
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
                            <FormLabel className="text-sm font-medium text-gray-700">
                              ¿Cuándo tenéis pensado mudaros?
                            </FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="space-y-2"
                                data-testid="radio-move-timing"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="lo-antes-posible" id="asap" />
                                  <label htmlFor="asap" className="text-sm">Lo antes posible</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="tengo-flexibilidad" id="flexible" />
                                  <label htmlFor="flexible" className="text-sm">Tengo flexibilidad</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="fecha-exacta" id="exact-date" />
                                  <label htmlFor="exact-date" className="text-sm">En una fecha exacta</label>
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
                              <FormLabel className="text-sm font-medium text-gray-700">
                                Fecha de mudanza
                              </FormLabel>
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
                                        <span>Selecciona una fecha</span>
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

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    size="lg"
                    data-testid="button-save-profile"
                  >
                    Guardar perfil
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        );

      case "favoritos":
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Propiedades Favoritas</h1>
              <p className="text-gray-600">Propiedades que has guardado para revisar más tarde</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-500" />
                  Propiedades favoritas ({favoriteProperties.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {favoriteProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tienes propiedades favoritas
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Busca propiedades y guarda las que más te interesen para revisarlas después
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => navigate("/buscar/comprar")}>
                        Buscar en venta
                      </Button>
                      <Button variant="outline" onClick={() => navigate("/buscar/alquilar")}>
                        Buscar en alquiler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoriteProperties.map((property) => {
                      // Use imageUrls or empty array if none available
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
                                    // Toggle favorite - since this is already a favorite, clicking removes it
                                    toggleFavoritePropertyMutation.mutate(property.uuid);
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
                                    // Share property
                                    const propertyUrl = `${window.location.origin}/property/${property.uuid}`;
                                    if (navigator.share) {
                                      navigator.share({
                                        title: property.title,
                                        text: `Mira esta propiedad: ${property.title}`,
                                        url: propertyUrl,
                                      });
                                    } else {
                                      navigator.clipboard.writeText(propertyUrl);
                                      toast({
                                        title: "Enlace copiado",
                                        description: "El enlace de la propiedad se ha copiado al portapapeles",
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
                              {property.operationType}
                            </Badge>
                            <p className="text-2xl font-bold text-primary mb-2">
                              €{property.price.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {property.neighborhood}
                            </p>
                            <div className="flex gap-4 text-sm text-gray-500 mb-3">
                              {property.bedrooms && (
                                <span>{property.bedrooms} hab.</span>
                              )}
                              {property.bathrooms && (
                                <span>{property.bathrooms} baños</span>
                              )}
                              {property.superficie && (
                                <span>{property.superficie} m²</span>
                              )}
                            </div>
                            {/* Spacer to push button to bottom */}
                            <div className="flex-1" />
                            <Button 
                              size="sm" 
                              className="w-full mt-auto"
                              onClick={() => navigate(`/property/${property.uuid}`)}
                            >
                              Ver detalles
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "citas":
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Citas</h1>
              <p className="text-gray-600">Gestiona tus citas programadas con agentes</p>
            </div>
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Próximamente
                </h3>
                <p className="text-gray-500">
                  Esta sección estará disponible próximamente para gestionar tus citas
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "mensajes":
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mensajes</h1>
              <p className="text-gray-600">Conversaciones con agentes inmobiliarios</p>
            </div>

            <ClientConversationalMessages />
          </div>
        );

      case "busquedas":
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis búsquedas</h1>
              <p className="text-gray-600">Búsquedas que has guardado para acceder rápidamente</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-blue-500" />
                  Búsquedas guardadas ({savedSearches.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedSearches.length === 0 ? (
                  <div className="text-center py-12">
                    <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tienes búsquedas guardadas
                    </h3>
                    <p className="text-gray-500">
                      Cuando encuentres una búsqueda que te interese, guárdala para acceder a ella rápidamente
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedSearches.map((search) => (
                      <Card key={search.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
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
                                    Guardar
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
                                    Cancelar
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <h3 className="font-semibold text-gray-900 mb-2">
                                    {search.name}
                                  </h3>
                                  <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                    {search.city && (
                                      <Badge variant="secondary">{search.city}</Badge>
                                    )}
                                    {search.district && (
                                      <Badge variant="secondary">{search.district}</Badge>
                                    )}
                                    {search.neighborhood && (
                                      <Badge variant="secondary">{search.neighborhood}</Badge>
                                    )}
                                    {search.operationType && (
                                      <Badge variant="outline">{search.operationType}</Badge>
                                    )}
                                    {search.priceMin && search.priceMax && (
                                      <Badge variant="outline">
                                        {search.priceMin.toLocaleString()} - {search.priceMax.toLocaleString()} €
                                      </Badge>
                                    )}
                                    {search.bedrooms && (
                                      <Badge variant="outline">{search.bedrooms} hab.</Badge>
                                    )}
                                    {search.bathrooms && (
                                      <Badge variant="outline">{search.bathrooms} baños</Badge>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                            {editingSearchId !== search.id && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
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
                                >
                                  Ver resultados
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingSearchId(search.id);
                                    setEditingSearchName(search.name);
                                  }}
                                  data-testid={`button-edit-search-${search.id}`}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                {deletingSearchId === search.id ? (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        deleteSavedSearchMutation.mutate(search.id);
                                        setDeletingSearchId(null);
                                      }}
                                      data-testid={`button-confirm-delete-${search.id}`}
                                    >
                                      Confirmar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setDeletingSearchId(null)}
                                      data-testid={`button-cancel-delete-${search.id}`}
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDeletingSearchId(search.id)}
                                    data-testid={`button-delete-search-${search.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
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
                  {!sidebarCollapsed && <span>Mi Perfil</span>}
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
                  {!sidebarCollapsed && <span>Mis búsquedas</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Appointments Section */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate(`/perfil-cliente/${user?.clientUuid}/citas`)}
                  isActive={currentSection === "citas"}
                  className={`w-full justify-start ${sidebarCollapsed ? 'justify-center' : ''}`}
                  data-testid="sidebar-citas"
                >
                  <CalendarDays className="h-4 w-4" />
                  {!sidebarCollapsed && <span>Mis citas</span>}
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
                  {!sidebarCollapsed && <span>Propiedades favoritas</span>}
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
                  {!sidebarCollapsed && <span>Mensajes</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        {/* Sidebar Toggle Button - Positioned at the border like manage page */}
        <div className={`fixed top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${sidebarCollapsed ? 'left-14' : 'left-60'}`}>
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
        <main className={`absolute inset-0 p-4 md:p-6 pt-20 md:pt-24 transition-all duration-300 ${sidebarCollapsed ? 'md:left-16' : 'md:left-64'}`}>
          <div className="max-w-6xl mx-auto">
            {renderMainContent()}
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}