import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Heart, MessageCircle, User, Home, Mail, Phone, Star, MapPin, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Camera, Upload, Minus, Plus, CalendarDays } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { useLocation, Redirect } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ClientConversationalMessages } from "@/components/ClientConversationalMessages";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface FavoriteAgent {
  id: number;
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
  title: string;
  price: number;
  address: string;
  neighborhood: string;
  bedrooms?: number;
  bathrooms?: number;
  superficie?: number;
  images?: string[];
  operationType: string;
}

// Client profile form schema
const clientProfileSchema = z.object({
  name: z.string().min(1, "Nombre es obligatorio"),
  surname: z.string().min(1, "Apellidos es obligatorio"),
  phone: z.string().min(1, "Teléfono es obligatorio"),
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
  const { user } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [section, setSection] = useState("profile");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

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
      navigate("/login");
    }
  }, [user, navigate]);

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


  if (!user || !user.isClient) {
    return null;
  }

  const renderMainContent = () => {
    switch (section) {
      case "profile":
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
              <p className="text-gray-600">Gestiona tu información personal y preferencias</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Teléfono <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Tu número de teléfono" 
                                {...field}
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                defaultValue={field.value}
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
                                defaultValue={field.value}
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
                                defaultValue={field.value}
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

      case "agents":
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Agentes Favoritos</h1>
              <p className="text-gray-600">Agentes inmobiliarios que has marcado como favoritos</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Agentes favoritos ({favoriteAgents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {favoriteAgents.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tienes agentes favoritos
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Explora nuestros agentes y marca como favoritos los que más te interesen
                    </p>
                    <Button onClick={() => navigate("/search/agents")}>
                      Buscar agentes
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoriteAgents.map((agent) => (
                      <Card key={agent.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={agent.avatar} />
                              <AvatarFallback>
                                {agent.name?.[0]}{agent.surname?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">
                                {agent.name} {agent.surname}
                              </h3>
                              <p className="text-sm text-gray-500 mb-2">{agent.email}</p>
                              {agent.yearsOfExperience && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {agent.yearsOfExperience} años de experiencia
                                </p>
                              )}
                              {agent.influenceNeighborhoods && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {agent.influenceNeighborhoods.slice(0, 2).map((neighborhood) => (
                                    <Badge key={neighborhood} variant="secondary" className="text-xs">
                                      {neighborhood}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <Button 
                                size="sm" 
                                onClick={() => navigate(`/agentes/${agent.id}`)}
                              >
                                Ver perfil
                              </Button>
                            </div>
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

      case "properties":
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
                      <Button onClick={() => navigate("/search/buy")}>
                        Buscar en venta
                      </Button>
                      <Button variant="outline" onClick={() => navigate("/search/rent")}>
                        Buscar en alquiler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoriteProperties.map((property) => (
                      <Card key={property.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          {property.images && property.images.length > 0 && (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="w-full h-48 object-cover rounded-t-lg"
                            />
                          )}
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-gray-900 line-clamp-2">
                                {property.title}
                              </h3>
                              <Badge variant={property.operationType === "Venta" ? "default" : "secondary"}>
                                {property.operationType}
                              </Badge>
                            </div>
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
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => navigate(`/property/${property.id}`)}
                            >
                              Ver detalles
                            </Button>
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

      case "messages":
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mensajes</h1>
              <p className="text-gray-600">Conversaciones con agentes inmobiliarios</p>
            </div>

            <ClientConversationalMessages />
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
                  onClick={() => setSection("profile")}
                  isActive={section === "profile"}
                  className={`w-full justify-start ${sidebarCollapsed ? 'justify-center' : ''}`}
                  data-testid="sidebar-profile"
                >
                  <User className="h-4 w-4" />
                  {!sidebarCollapsed && <span>Mi Perfil</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Agents Section */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setSection("agents")}
                  isActive={section === "agents"}
                  className={`w-full justify-start ${sidebarCollapsed ? 'justify-center' : ''}`}
                  data-testid="sidebar-agents"
                >
                  <Heart className="h-4 w-4" />
                  {!sidebarCollapsed && <span>Agentes favoritos</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Properties Section */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setSection("properties")}
                  isActive={section === "properties"}
                  className={`w-full justify-start ${sidebarCollapsed ? 'justify-center' : ''}`}
                  data-testid="sidebar-properties"
                >
                  <Home className="h-4 w-4" />
                  {!sidebarCollapsed && <span>Propiedades favoritas</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Messages Section */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setSection("messages")}
                  isActive={section === "messages"}
                  className={`w-full justify-start ${sidebarCollapsed ? 'justify-center' : ''}`}
                  data-testid="sidebar-messages"
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