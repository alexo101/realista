import { useState, useEffect } from "react";
import { Redirect, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/contexts/user-context";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Users, Star, UserCircle, Building, MessageSquare, CheckCircle, Plus, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PropertyForm } from "@/components/PropertyForm";
import { ClientForm } from "@/components/ClientForm";
import { ClientHistoryTimeline } from "@/components/ClientHistoryTimeline";
import { ReviewRequestForm } from "@/components/ReviewRequestForm";
import { NeighborhoodSelector } from "@/components/NeighborhoodSelector";
import { AgencyAgentsList } from "@/components/AgencyAgentsList";
import { AgenciesList } from "@/components/AgenciesList";

import { ConversationalMessages } from "@/components/ConversationalMessages";
import { ReviewManagement } from "@/components/ReviewManagement";
import { AgentCalendar } from "@/pages/agent-calendar";
import { TeamManagement } from "@/components/TeamManagement";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { type Property, type Client } from "@shared/schema";

export default function ManagePage() {
  const { user, setUser } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location] = useLocation();

  // Obtener el parámetro 'tab' de la URL si existe
  const getInitialSection = () => {
    const params = new URLSearchParams(location.split('?')[1]);
    const tabParam = params.get('tab');

    // Si es un administrador de agencia y hay un parámetro tab=agency-profile, 
    // o si es un administrador y no hay perfil de agente
    if ((user?.isAdmin && tabParam === 'agency-profile') || 
        (user?.isAdmin && !user?.name)) {
      return 'agency-profile';
    }

    // Validar que el tab sea uno de los valores permitidos
    const validTabs = ['calendar', 'agent-profile', 'agency-profile', 'properties', 'clients', 'inquiries', 'team'];
    return validTabs.includes(tabParam || '') ? tabParam : 'calendar';
  };

  const [section, setSection] = useState(getInitialSection);

  // Estados para la gestión de propiedades y clientes
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isRequestingReview, setIsRequestingReview] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);
  const [reviewRequestClient, setReviewRequestClient] = useState<{ id: number; name: string } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Estados para los campos de perfil de agente
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [description, setDescription] = useState("");
  const [influenceNeighborhoods, setInfluenceNeighborhoods] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState<number | undefined>(undefined);
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>([]);

  // Estados para los campos de perfil de agencia
  const [agencyName, setAgencyName] = useState("");
  const [agencyAddress, setAgencyAddress] = useState("");
  const [agencyDescription, setAgencyDescription] = useState("");
  const [agencyPhone, setAgencyPhone] = useState("");
  const [agencyWebsite, setAgencyWebsite] = useState("");
  const [agencyInfluenceNeighborhoods, setAgencyInfluenceNeighborhoods] = useState<string[]>([]);
  const [yearEstablished, setYearEstablished] = useState<number | undefined>(undefined);
  const [agencyLanguagesSpoken, setAgencyLanguagesSpoken] = useState<string[]>([]);
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Estado para mostrar indicador de guardado exitoso
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [hasAgentChanges, setHasAgentChanges] = useState(false); // Added
  const [hasAgencyChanges, setHasAgencyChanges] = useState(false); // Added


  // Cargar valores iniciales cuando el usuario cambia y actualizar sección inicial
  useEffect(() => {
    if (user) {
      // Cargar datos de perfil
      setName(user.name || "");
      setSurname(user.surname || "");
      setDescription(user.description || "");
      setInfluenceNeighborhoods(user.influenceNeighborhoods || []);
      setYearsOfExperience(user.yearsOfExperience);
      setLanguagesSpoken(user.languagesSpoken || []);

      setAgencyName(user.agencyName || "");
      setAgencyAddress(user.agencyAddress || "");
      setAgencyDescription(user.agencyDescription || "");
      setAgencyPhone(user.agencyPhone || "");
      setAgencyWebsite(user.agencyWebsite || "");
      setAgencyInfluenceNeighborhoods(user.agencyInfluenceNeighborhoods || []);
      setYearEstablished(user.yearEstablished);
      setAgencyLanguagesSpoken(user.agencyLanguagesSpoken || []);

      // Cargar redes sociales si existen
      const socialMedia = user.agencySocialMedia as Record<string, string> | undefined;
      if (socialMedia) {
        setFacebookUrl(socialMedia.facebook || "");
        setInstagramUrl(socialMedia.instagram || "");
        setTwitterUrl(socialMedia.twitter || "");
        setLinkedinUrl(socialMedia.linkedin || "");
      }

      // Actualizar la sección según la URL y tipo de usuario
      setSection(getInitialSection());
    }
  }, [user, location]);

  const { data: properties, isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: ['/api/properties', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/properties?agentId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
    enabled: section === 'properties' && Boolean(user?.id),
  });

  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ['/api/clients', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/clients?agentId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    },
    enabled: (section === 'clients' || section === 'reviews') && Boolean(user?.id),
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/properties', {
        ...data,
        agentId: user!.id,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create property');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties', user?.id] });
      setIsAddingProperty(false);
      setEditingProperty(null);
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/properties/${editingProperty?.id}`, {
        ...data,
        agentId: user!.id,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update property');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties', user?.id] });
      setEditingProperty(null);
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/clients', {
        ...data,
        agentId: user!.id,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create client');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', user?.id] });
      setIsAddingClient(false);
      setEditingClient(null);
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/clients/${editingClient?.id}`, {
        ...data,
        agentId: user!.id,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update client');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', user?.id] });
      setEditingClient(null);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user) return null;

      const response = await apiRequest('PATCH', `/api/users/${user.id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar el perfil');
      }
      return response.json();
    },
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        setUser(updatedUser);
        setShowSavedIndicator(true);
        setHasAgencyChanges(false); // Added
        setHasAgentChanges(false); // Added
        toast({
          title: "Perfil actualizado",
          description: "Los cambios se han guardado correctamente",
        });

        setTimeout(() => {
          setShowSavedIndicator(false);
        }, 3000);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    }
  });

  // Mutation for sending review requests
  const sendReviewRequestMutation = useMutation({
    mutationFn: async ({ clientId, agentId }: { clientId: number; agentId: number }) => {
      const response = await apiRequest('POST', '/api/review-requests', {
        clientId,
        agentId,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al enviar la solicitud');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitud enviada",
        description: "Se ha enviado la solicitud de reseña por email al cliente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "No se pudo enviar la solicitud",
        variant: "destructive",
      });
    }
  });

  // Function to handle review request confirmation
  const handleRequestReview = (clientId: number, clientName: string) => {
    setReviewRequestClient({ id: clientId, name: clientName });
  };

  // Function to confirm and send review request
  const confirmSendReviewRequest = () => {
    if (reviewRequestClient) {
      sendReviewRequestMutation.mutate({ 
        clientId: reviewRequestClient.id, 
        agentId: user!.id 
      });
      setReviewRequestClient(null);
    }
  };

  // Redireccionar si el usuario no está autenticado
  if (!user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex">
      <SidebarProvider>
        <Sidebar className={`pt-16 border-r hidden md:block transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
          <SidebarContent>
            {/* Collapse/Expand Button */}
            <div className="flex justify-end p-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-8 w-8 p-0"
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
            <SidebarMenu>
              {/* CRM Section */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={section === "clients" || section === "appointments"}
                  onClick={() => setSection("clients")}
                  className="relative group"
                  title={sidebarCollapsed ? "CRM" : ""}
                >
                  <Users className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>CRM</span>}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                      CRM
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className={sidebarCollapsed ? "ml-0" : "ml-6"}>
                <SidebarMenuButton
                  isActive={section === "calendar"}
                  onClick={() => setSection("calendar")}
                  className="relative group"
                  title={sidebarCollapsed ? "Calendario" : ""}
                >
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Calendario</span>}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                      Calendario
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className={sidebarCollapsed ? "ml-0" : "ml-6"}>
                <SidebarMenuButton
                  isActive={section === "clients"}
                  onClick={() => setSection("clients")}
                  className="relative group"
                  title={sidebarCollapsed ? "Clientes" : ""}
                >
                  <UserCircle className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Clientes</span>}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                      Clientes
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className={sidebarCollapsed ? "ml-0" : "ml-6"}>
                <SidebarMenuButton
                  isActive={section === "messages"}
                  onClick={() => setSection("messages")}
                  className="relative group"
                  title={sidebarCollapsed ? "Mensajes" : ""}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Mensajes</span>}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                      Mensajes
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={section === "agent-profile"}
                  onClick={() => setSection("agent-profile")}
                  className="relative group"
                  title={sidebarCollapsed ? "Mi perfil de agente" : ""}
                >
                  <UserCircle className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Mi perfil de agente</span>}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                      Mi perfil de agente
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Only show agency profile option for agency admins */}
              {user?.isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={section === "agency-profile"}
                    onClick={() => setSection("agency-profile")}
                    className="relative group"
                    title={sidebarCollapsed ? "Gestionar agencia" : ""}
                  >
                    <Building className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && <span>Gestionar agencia</span>}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                        Gestionar agencia
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={section === "properties"}
                  onClick={() => setSection("properties")}
                  className="relative group"
                  title={sidebarCollapsed ? "Gestionar propiedades" : ""}
                >
                  <Building2 className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Gestionar propiedades</span>}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                      Gestionar propiedades
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={section === "reviews"}
                  onClick={() => setSection("reviews")}
                  className="relative group"
                  title={sidebarCollapsed ? "Gestionar reseñas" : ""}
                >
                  <Star className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Gestionar reseñas</span>}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                      Gestionar reseñas
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Only show team management for admin agents */}
              {user?.isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={section === "team"}
                    onClick={() => setSection("team")}
                    className="relative group"
                    title={sidebarCollapsed ? "Gestionar mi equipo" : ""}
                  >
                    <Users className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && <span>Gestionar mi equipo</span>}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                        Gestionar mi equipo
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        {/* Mobile navigation */}
        <div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b z-40">
          <div className="flex overflow-x-auto p-2 gap-2">
            <Button
              variant={section === "clients" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSection("clients")}
              className="whitespace-nowrap"
            >
              <Users className="h-4 w-4 mr-1" />
              CRM
            </Button>
            <Button
              variant={section === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSection("calendar")}
              className="whitespace-nowrap"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Calendario
            </Button>
            <Button
              variant={section === "agent-profile" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSection("agent-profile")}
              className="whitespace-nowrap"
            >
              <UserCircle className="h-4 w-4 mr-1" />
              Perfil
            </Button>
            <Button
              variant={section === "properties" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSection("properties")}
              className="whitespace-nowrap"
            >
              <Building2 className="h-4 w-4 mr-1" />
              Propiedades
            </Button>
            <Button
              variant={section === "inquiries" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSection("inquiries")}
              className="whitespace-nowrap"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Consultas
            </Button>
            <Button
              variant={section === "reviews" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSection("reviews")}
              className="whitespace-nowrap"
            >
              <Star className="h-4 w-4 mr-1" />
              Reseñas
            </Button>
            {user?.isAgency && (
              <>
                <Button
                  variant={section === "agency-profile" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSection("agency-profile")}
                  className="whitespace-nowrap"
                >
                  <Building className="h-4 w-4 mr-1" />
                  Agencia
                </Button>
                <Button
                  variant={section === "team" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSection("team")}
                  className="whitespace-nowrap"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Equipo
                </Button>
                <Button
                  variant={section === "agencies" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSection("agencies")}
                  className="whitespace-nowrap"
                >
                  <Building2 className="h-4 w-4 mr-1" />
                  Multi-agencia
                </Button>
              </>
            )}
          </div>
        </div>

        <main className="flex-1 p-4 md:p-6 pt-24 md:pt-20">
          {section === "calendar" && user?.id && (
            <div className="max-w-6xl mx-auto">
              <AgentCalendar agentId={user.id} />
            </div>
          )}

          {section === "agent-profile" && (
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-gray-100 mb-4 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.name || ''} ${user.surname || ''}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <Label htmlFor="picture" className="cursor-pointer text-sm text-primary">
                  Gestionar foto
                </Label>
                <Input
                  id="picture"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          const base64String = event.target.result.toString();
                          updateProfileMutation.mutate({
                            avatar: base64String
                          });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input 
                    id="name" 
                    placeholder="Tu nombre" 
                    value={name}
                    onChange={(e) => {setName(e.target.value); setHasAgentChanges(true);}} // Added change detection
                  />
                </div>
                <div>
                  <Label htmlFor="surname">Apellidos</Label>
                  <Input 
                    id="surname" 
                    placeholder="Tus apellidos" 
                    value={surname}
                    onChange={(e) => {setSurname(e.target.value); setHasAgentChanges(true);}} // Added change detection
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción pública</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Escribe una breve descripción sobre ti que verán tus clientes"
                    className="min-h-[100px]"
                    value={description}
                    onChange={(e) => {setDescription(e.target.value); setHasAgentChanges(true);}} // Added change detection
                  />
                </div>
                <div>
                  <Label htmlFor="yearsOfExperience">Años de experiencia</Label>
                  <Input 
                    id="yearsOfExperience" 
                    type="number"
                    placeholder="Introduce tus años de experiencia" 
                    value={yearsOfExperience !== undefined ? yearsOfExperience : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setYearsOfExperience(undefined);
                      } else {
                        const numValue = parseInt(value, 10);
                        if (!isNaN(numValue) && numValue >= 0) {
                          setYearsOfExperience(numValue);
                        }
                      }
                      setHasAgentChanges(true); // Added change detection
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="languagesSpoken">Idiomas que hablas</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['español', 'català', 'english', 'français', 'deutsch', 'italiano', 'português', 'русский', '中文', '日本語', 'العربية'].map((lang) => (
                      <Button 
                        key={lang}
                        type="button" 
                        variant={languagesSpoken.includes(lang) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (languagesSpoken.includes(lang)) {
                            setLanguagesSpoken(languagesSpoken.filter(l => l !== lang));
                          } else {
                            setLanguagesSpoken([...languagesSpoken, lang]);
                          }
                          setHasAgentChanges(true); // Added change detection
                        }}
                      >
                        {lang}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="w-full">
                  <Label htmlFor="influence-neighborhoods">Barrios de influencia</Label>
                  <div className="mt-1">
                    <NeighborhoodSelector
                      selectedNeighborhoods={influenceNeighborhoods}
                      onChange={(e) => {setInfluenceNeighborhoods(e); setHasAgentChanges(true);}} // Added change detection
                      buttonText="Selecciona los barrios donde trabajas habitualmente"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Estos barrios se utilizarán para relacionar tu perfil con las búsquedas de los clientes.
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  className="relative"
                  onClick={() => updateProfileMutation.mutate({
                    name,
                    surname,
                    description,
                    influenceNeighborhoods,
                    yearsOfExperience,
                    languagesSpoken
                  })}
                  disabled={updateProfileMutation.isPending || !hasAgentChanges} // Added disable logic
                >
                  {showSavedIndicator && (
                    <CheckCircle className="w-4 h-4 absolute -left-6 text-green-500" />
                  )}
                  Guardar cambios
                </Button>
              </div>
            </div>
          )}

          {section === "agency-profile" && user?.isAdmin && (
            <div>
              <AgenciesList />
            </div>
          )}

          {section === "agency-profile-old" && (!user?.isAgent || user?.agencyName) && (
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="flex flex-col items-center">
                <div className="w-48 h-48 rounded-md bg-gray-100 mb-4 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                  {user?.agencyLogo ? (
                    <img
                      src={user.agencyLogo}
                      alt={user.agencyName || 'Logo de agencia'}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Building className="w-24 h-24 text-gray-400" />
                  )}
                </div>
                <Label htmlFor="agency-logo" className="cursor-pointer text-sm text-primary">
                  Gestionar logo
                </Label>
                <Input
                  id="agency-logo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          const base64String = event.target.result.toString();
                          updateProfileMutation.mutate({
                            agencyLogo: base64String
                          });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="agency-name">Nombre de la agencia</Label>
                  <Input 
                    id="agency-name" 
                    placeholder="Nombre de tu agencia inmobiliaria" 
                    value={agencyName}
                    onChange={(e) => {setAgencyName(e.target.value); setHasAgencyChanges(true);}} // Added change detection
                  />
                </div>
                <div>
                  <Label htmlFor="agency-address">Dirección completa de la agencia</Label>
                  <Input 
                    id="agency-address" 
                    placeholder="Dirección física completa" 
                    value={agencyAddress}
                    onChange={(e) => {setAgencyAddress(e.target.value); setHasAgencyChanges(true);}} // Added change detection
                  />
                </div>
                <div>
                  <Label htmlFor="agency-description">Descripción pública</Label>
                  <Textarea 
                    id="agency-description" 
                    placeholder="Describe tu agencia inmobiliaria a clientes potenciales"
                    className="min-h-[120px]"
                    value={agencyDescription}
                    onChange={(e) => {setAgencyDescription(e.target.value); setHasAgencyChanges(true);}} // Added change detection
                  />
                </div>
                <div>
                  <Label htmlFor="agency-phone">Número de teléfono</Label>
                  <Input 
                    id="agency-phone" 
                    placeholder="Teléfono de contacto" 
                    value={agencyPhone}
                    onChange={(e) => {setAgencyPhone(e.target.value); setHasAgencyChanges(true);}} // Added change detection
                  />
                </div>
                <div className="w-full">
                  <Label htmlFor="agency-influence-neighborhoods">Barrios de influencia</Label>
                  <div className="mt-1">
                    <NeighborhoodSelector
                      selectedNeighborhoods={agencyInfluenceNeighborhoods}
                      onChange={(e) => {setAgencyInfluenceNeighborhoods(e); setHasAgencyChanges(true);}} // Added change detection
                      buttonText="Selecciona los barrios donde opera tu agencia"
                      title="ZONAS DE OPERACIÓN DE LA AGENCIA"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Estos barrios se utilizarán para relacionar tu agencia con las búsquedas de los clientes.
                  </p>
                </div>

                {/* Componente de gestión de agentes para agencias */}
                {user && !user.isAgent && (
                  <div className="pt-4 pb-2 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Agentes de la agencia</h3>
                      <Button 
                        onClick={() => {
                          // Obtener referencia al componente AgencyAgentsList
                          const agencyAgentsListElement = document.querySelector('.agency-agents-list-button');
                          // Simular clic en el botón de añadir agente
                          agencyAgentsListElement?.dispatchEvent(new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                          }));
                        }}
                        size="sm"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Añadir Agente
                      </Button>
                    </div>
                    <AgencyAgentsList hideAddButton={true} agencyId={user?.id || 0} />
                  </div>
                )}

                <div>
                  <Label htmlFor="yearEstablished">Año de fundación</Label>
                  <Select
                    value={yearEstablished ? yearEstablished.toString() : 'none'}
                    onValueChange={(value) => {
                      if (value === 'none') {
                        setYearEstablished(undefined);
                      } else {
                        setYearEstablished(parseInt(value, 10));
                      }
                      setHasAgencyChanges(true); // Added change detection
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el año de fundación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Seleccionar año --</SelectItem>
                      {(() => {
                        const currentYear = new Date().getFullYear();
                        const years = [];
                        for (let year = currentYear; year >= 1900; year--) {
                          years.push(year);
                        }
                        return years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="agencyLanguagesSpoken">Idiomas que se hablan en la agencia</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['español', 'català', 'english', 'français', 'deutsch', 'italiano', 'português', 'русский', '中文', '日本語', 'العربية'].map((lang) => (
                      <Button 
                        key={lang}
                        type="button" 
                        variant={agencyLanguagesSpoken.includes(lang) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (agencyLanguagesSpoken.includes(lang)) {
                            setAgencyLanguagesSpoken(agencyLanguagesSpoken.filter(l => l !== lang));
                          } else {
                            setAgencyLanguagesSpoken([...agencyLanguagesSpoken, lang]);
                          }
                          setHasAgencyChanges(true); // Added change detection
                        }}
                      >
                        {lang}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="agency-website">Sitio web</Label>
                  <Input 
                    id="agency-website" 
                    placeholder="URL de tu sitio web (con https://)" 
                    value={agencyWebsite}
                    onChange={(e) => {setAgencyWebsite(e.target.value); setHasAgencyChanges(true);}} // Added change detection
                  />
                </div>

                <div>
                  <Label>Enlaces a redes sociales</Label>
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                      </div>
                      <Input 
                        placeholder="URL de Facebook" 
                        value={facebookUrl}
                        onChange={(e) => {setFacebookUrl(e.target.value); setHasAgencyChanges(true);}} // Added change detection
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                      </div>
                      <Input 
                        placeholder="URL de Instagram" 
                        value={instagramUrl}
                        onChange={(e) => {setInstagramUrl(e.target.value); setHasAgencyChanges(true);}} // Added change detection
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                        </svg>
                      </div>
                      <Input 
                        placeholder="URL de Twitter" 
                        value={twitterUrl}
                        onChange={(e) => {setTwitterUrl(e.target.value); setHasAgencyChanges(true);}} // Added change detection
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                          <rect x="2" y="9" width="4" height="12"></rect>
                          <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                      </div>
                      <Input 
                        placeholder="URL de LinkedIn" 
                        value={linkedinUrl}
                        onChange={(e) => {setLinkedinUrl(e.target.value); setHasAgencyChanges(true);}} // Added change detection
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  className="relative"
                  onClick={() => updateProfileMutation.mutate({
                    agencyName,
                    agencyAddress,
                    agencyDescription,
                    agencyPhone,
                    agencyWebsite,
                    agencyInfluenceNeighborhoods,
                    yearEstablished,
                    agencyLanguagesSpoken,
                    agencySocialMedia: {
                      facebook: facebookUrl,
                      instagram: instagramUrl,
                      twitter: twitterUrl,
                      linkedin: linkedinUrl
                    }
                  })}
                  disabled={updateProfileMutation.isPending || !hasAgencyChanges} // Added disable logic
                >
                  {showSavedIndicator && (
                    <CheckCircle className="w-4 h-4 absolute -left-6 text-green-500" />
                  )}
                  Guardar cambios
                </Button>
              </div>
            </div>
          )}

          {section === "properties" && (
            <div className="space-y-4">
              <Button 
                onClick={() => {
                  setIsAddingProperty(true);
                  setEditingProperty(null);
                }} 
                size="lg"
              >
                Añadir propiedad
              </Button>

              {(isAddingProperty || editingProperty) ? (
                <PropertyForm 
                  onSubmit={async (data) => {
                    if (editingProperty) {
                      await updatePropertyMutation.mutateAsync(data);
                    } else {
                      await createPropertyMutation.mutateAsync(data);
                    }
                  }}
                  onClose={() => {
                    setIsAddingProperty(false);
                    setEditingProperty(null);
                  }}
                  initialData={editingProperty ? {
                    id: editingProperty.id,
                    isActive: editingProperty.isActive,
                    title: editingProperty.title,
                    description: editingProperty.description,
                    price: editingProperty.price,
                    address: editingProperty.address,
                    superficie: editingProperty.superficie,
                    bedrooms: editingProperty.bedrooms,
                    bathrooms: editingProperty.bathrooms,
                    images: editingProperty.images || [],
                    type: editingProperty.type,
                    housingType: editingProperty.housingType || undefined,
                    housingStatus: editingProperty.housingStatus || undefined,
                    floor: editingProperty.floor || undefined,
                    neighborhood: editingProperty.neighborhood,
                    reference: editingProperty.reference,
                    operationType: editingProperty.operationType,
                    features: editingProperty.features || [],
                    availability: editingProperty.availability || "Inmediatamente",
                    availabilityDate: editingProperty.availabilityDate ? new Date(editingProperty.availabilityDate) : undefined,
                    mainImageIndex: editingProperty.mainImageIndex || 0
                  } : undefined}
                  isEditing={!!editingProperty}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isLoadingProperties ? (
                    <div className="col-span-full text-center py-8">
                      <p>Cargando propiedades...</p>
                    </div>
                  ) : !properties?.length ? (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
                      <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">Sin propiedades</h3>
                      <p className="mt-1 text-gray-500">
                        Empieza añadiendo tu primera propiedad
                      </p>
                    </div>
                  ) : (
                    properties.map((property) => (
                      <div 
                        key={property.id} 
                        className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                        onClick={() => {
                          setEditingProperty(property);
                          setIsAddingProperty(false);
                        }}
                      >
                        <div className="h-48 overflow-hidden relative">
                          {property.images && property.images.length > 0 ? (
                            <img 
                              src={property.images[0]} 
                              alt={property.title || property.address}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <Building2 className="h-12 w-12 text-gray-400" />
                            </div>
                          )}

                          {property.operationType && (
                            <div className="absolute top-0 left-0 bg-primary text-white px-2 py-1 text-xs m-2 rounded-sm">
                              {property.operationType === 'Venta' || property.operationType === 'venta' ? 'Venta' : 'Alquiler'}
                            </div>
                          )}

                          {property.reference && (
                            <div className="absolute bottom-0 right-0 bg-black/70 text-white px-2 py-1 text-xs m-2 rounded-sm">
                              Ref: {property.reference}
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium truncate">{property.title || property.address}</h3>
                              {property.neighborhood && (
                                <p className="text-sm text-blue-600 font-medium truncate">{property.neighborhood}</p>
                              )}
                              <p className="text-sm text-gray-500 truncate">{property.address}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-lg">{property.price?.toLocaleString('es-ES')}{property.operationType === 'alquiler' ? '€/mes' : '€'}</span>
                            </div>
                          </div>

                          <div className="flex gap-4 mt-2 text-sm text-gray-500">
                            {property.superficie ? (
                              <div>{property.superficie} m²</div>
                            ) : property.size ? (
                              <div>{property.size} m²</div>
                            ) : null}
                            {property.bedrooms && (
                              <div>{property.bedrooms} hab.</div>
                            )}
                            {property.bathrooms && (
                              <div>{property.bathrooms} baños</div>
                            )}
                          </div>

                          {property.previousPrice && property.previousPrice > property.price && (
                            <div className="mt-2 text-sm text-red-600">
                              Antes: {property.previousPrice.toLocaleString('es-ES')}€ 
                              <span className="ml-2 font-medium">
                                ({Math.round(((property.previousPrice - property.price) / property.previousPrice) * 100)}% ↓)
                              </span>
                            </div>
                          )}

                          {property.features && property.features.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {property.features.slice(0, 3).map(feature => (
                                <span key={feature} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                  {feature}
                                </span>
                              ))}
                              {property.features.length > 3 && (
                                <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                  +{property.features.length - 3}
                                </span>
                              )}
                            </div>
                          )}


                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {section === "clients" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Gestión de Clientes</h2>
                <Button 
                  onClick={() => {
                    setIsAddingClient(true);
                    setEditingClient(null);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir cliente
                </Button>
              </div>

              {(isAddingClient || editingClient) ? (
                <ClientForm 
                  onSubmit={async (data) => {
                    if (editingClient) {
                      await updateClientMutation.mutateAsync(data);
                    } else {
                      await createClientMutation.mutateAsync(data);
                    }
                  }}
                  onClose={() => {
                    setIsAddingClient(false);
                    setEditingClient(null);
                  }}
                  initialData={editingClient ? {
                    name: editingClient.name,
                    surname: editingClient.surname || "",
                    email: editingClient.email,
                    phone: editingClient.phone,
                    notes: editingClient.notes,
                    preferredNeighborhoods: editingClient.preferredNeighborhoods || [],
                    budget: editingClient.budget || undefined,
                    propertyType: editingClient.propertyType || undefined,
                    minBedrooms: editingClient.minBedrooms || undefined,
                    minBathrooms: editingClient.minBathrooms || undefined,
                    minSize: editingClient.minSize || undefined,
                    preferredFeatures: editingClient.preferredFeatures || [],
                    operationType: editingClient.operationType || undefined,
                  } : undefined}
                  isEditing={!!editingClient}
                />
              ) : selectedClientForHistory ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {selectedClientForHistory.name} {selectedClientForHistory.surname || ''}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedClientForHistory.email} • {selectedClientForHistory.phone}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setEditingClient(selectedClientForHistory);
                          setSelectedClientForHistory(null);
                        }}
                      >
                        Editar cliente
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedClientForHistory(null)}
                      >
                        Volver
                      </Button>
                    </div>
                  </div>
                  
                  {user?.id && (
                    <ClientHistoryTimeline 
                      clientId={selectedClientForHistory.id} 
                      agentId={user.id}
                    />
                  )}
                </div>
              ) : (
                <div className="grid gap-6">
                  {isLoadingClients ? (
                    <div className="text-center py-8">
                      <p>Cargando clientes...</p>
                    </div>
                  ) : !clients?.length ? (
                    <div className="text-center py-16 bg-gray-50 rounded-lg">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">Sin clientes</h3>
                      <p className="mt-1 text-gray-500">
                        Empieza añadiendo tu primer cliente al CRM
                      </p>
                    </div>
                  ) : (
                    clients.map((client) => (
                      <div 
                        key={client.id} 
                        className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                        onClick={() => {
                          setSelectedClientForHistory(client);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-medium">
                              {client.name} {client.surname || ''}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">Email: {client.email} • Teléfono: {client.phone}</p>

                            {client.operationType && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                                  {client.operationType === 'venta' ? 'Compra' : 'Alquiler'}
                                </span>
                                {client.propertyType && (
                                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                    {client.propertyType}
                                  </span>
                                )}
                                {client.budget && (
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                    Hasta {client.budget.toLocaleString('es-ES')}€{client.operationType === 'alquiler' ? '/mes' : ''}
                                  </span>
                                )}
                              </div>
                            )}

                            {client.preferredNeighborhoods && client.preferredNeighborhoods.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500">Zonas de interés:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {client.preferredNeighborhoods.slice(0, 3).map((neighborhood, idx) => (
                                    <span key={idx} className="bg-gray-100 text-xs px-2 py-0.5 rounded">
                                      {neighborhood}
                                    </span>
                                  ))}
                                  {client.preferredNeighborhoods.length > 3 && (
                                    <span className="text-xs text-gray-500">
                                      +{client.preferredNeighborhoods.length - 3} más
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {isRequestingReview && (
                <ReviewRequestForm
                  onClose={() => setIsRequestingReview(false)}
                />
              )}
            </div>
          )}

          {section === "reviews" && (
            <div className="max-w-4xl mx-auto">
              {user ? (
                <Tabs defaultValue="management" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="management">Gestión de reseñas</TabsTrigger>
                    <TabsTrigger value="request">Solicitar reseñas</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="management" className="mt-6">
                    <ReviewManagement userId={user.id} userType={user.isAdmin ? "admin" : "agent"} />
                  </TabsContent>
                  
                  <TabsContent value="request" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Solicitar reseñas a clientes</CardTitle>
                        <CardDescription>
                          Envía solicitudes de reseña por email a tus clientes
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingClients ? (
                          <div className="text-center py-8">
                            <p>Cargando clientes...</p>
                          </div>
                        ) : !clients?.length ? (
                          <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <Users className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-lg font-medium text-gray-900">Sin clientes</h3>
                            <p className="mt-1 text-gray-500">
                              Añade clientes para poder solicitar reseñas
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {clients.map((client) => (
                              <div
                                key={client.id}
                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center space-x-4">
                                    <div className="flex-1">
                                      <h3 className="font-medium text-gray-900">
                                        {client.name} {client.surname || ''}
                                      </h3>
                                      <div className="mt-1 text-sm text-gray-500">
                                        <p>Email: {client.email}</p>
                                        <p>Teléfono: {client.phone}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRequestReview(client.id, client.name)}
                                  className="ml-4"
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  Solicitar reseña
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                  <Star className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Necesitas iniciar sesión</h3>
                  <p className="mt-1 text-gray-500">
                    Por favor inicia sesión para gestionar tus reseñas.
                  </p>
                </div>
              )}
            </div>
          )}

          {section === "messages" && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Gestión de Mensajes</h2>
              <ConversationalMessages />
            </div>
          )}

          {section === "team" && user?.isAdmin && (
            <div className="max-w-6xl mx-auto">
              <TeamManagement agencyId={user.agencyId ? parseInt(user.agencyId) : undefined} />
            </div>
          )}

          
        </main>
      </SidebarProvider>

      {/* Review Request Confirmation Dialog */}
      <Dialog open={reviewRequestClient !== null} onOpenChange={(open) => !open && setReviewRequestClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar solicitud de reseña</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres solicitar una reseña a {reviewRequestClient?.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setReviewRequestClient(null)}
              disabled={sendReviewRequestMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmSendReviewRequest}
              disabled={sendReviewRequestMutation.isPending}
            >
              {sendReviewRequestMutation.isPending ? 'Enviando...' : 'Enviar solicitud'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}