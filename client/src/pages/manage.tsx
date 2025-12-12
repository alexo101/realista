import { useState, useEffect } from "react";
import { Redirect, useLocation, useRoute, Link } from "wouter";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Star, UserCircle, Building, MessageSquare, CheckCircle, Plus, Calendar, ChevronLeft, ChevronRight, Mail, Phone, Pencil, Trash2, List, LayoutGrid, Eye, Send, Network, CreditCard, Enter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { PropertyForm } from "@/components/PropertyForm";
import { PropertyFormMultiStep } from "@/components/PropertyFormMultiStep";
import { ClientForm } from "@/components/ClientForm";
import { AddClientModal } from "@/components/AddClientModal";
import { ClientHistoryTimeline } from "@/components/ClientHistoryTimeline";
import { ClientsKanban } from "@/components/ClientsKanban";
import { ReviewRequestForm } from "@/components/ReviewRequestForm";
import { NeighborhoodSelector } from "@/components/NeighborhoodSelector";
import { getCities } from "@/utils/neighborhoods";
import { AgencyAgentsList } from "@/components/AgencyAgentsList";
import { AgenciesList } from "@/components/AgenciesList";

import { ConversationalMessages } from "@/components/ConversationalMessages";
import { ReviewManagement } from "@/components/ReviewManagement";
import { AgentCalendar } from "@/pages/agent-calendar";
import { TeamManagement } from "@/components/TeamManagement";
import { NetworkManagement } from "@/components/NetworkManagement";
import { BillingTab } from "@/components/BillingTab";
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

// Valid dashboard sections
const VALID_SECTIONS = [
  'calendario', 
  'perfil-agente', 
  'perfil-agencia', 
  'propiedades', 
  'clientes', 
  'mensajes', 
  'resenas', 
  'equipo',
  'red',
  'facturacion'
] as const;

type DashboardSection = typeof VALID_SECTIONS[number];

// Client status options with colors
const CLIENT_STATUSES = [
  { value: "Nuevo", label: "Nuevo", color: "bg-blue-100 text-blue-900" },
  { value: "Seguimiento", label: "Seguimiento", color: "bg-blue-300 text-blue-900" },
  { value: "En visitas", label: "En visitas", color: "bg-blue-500 text-white" },
  { value: "Cerrando", label: "Cerrando", color: "bg-blue-700 text-white" },
  { value: "Ganado", label: "Ganado", color: "bg-blue-900 text-white" },
  { value: "Perdido", label: "Perdido", color: "bg-gray-500 text-white" }
] as const;

export default function ManagePage() {
  const { user, setUser, isLoading } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  
  // Extract route parameters
  const [match, params] = useRoute("/gestionar/:agentUuid/:section");
  const urlAgentUuid = params?.agentUuid;
  const urlSection = params?.section as DashboardSection | undefined;

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

    if (user.isClient) {
      // Clients should use their own profile page
      navigate("/perfil-cliente");
      return;
    }

    // Network admins have their own dedicated panel
    if (user.agentType === 'network_admin') {
      navigate("/admin-red");
      return;
    }

    if (!user.agentUuid) {
      // Agent without UUID - something is wrong
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
      navigate(`/gestionar/${user.agentUuid}/calendario`);
      return;
    }

    // Validate UUID matches logged-in user
    if (urlAgentUuid !== user.agentUuid) {
      // Attempting to access another agent's dashboard
      toast({
        title: "Acceso denegado",
        description: "No puedes acceder al panel de otro agente.",
        variant: "destructive"
      });
      navigate(`/gestionar/${user.agentUuid}/calendario`);
      return;
    }

    // Validate section is valid
    if (!urlSection || !VALID_SECTIONS.includes(urlSection)) {
      // Invalid section - redirect to calendar
      navigate(`/gestionar/${user.agentUuid}/calendario`);
      return;
    }
  }, [user, match, urlAgentUuid, urlSection, navigate, toast, isLoading]);

  // Determine current section from URL or default to calendar
  const currentSection = urlSection && VALID_SECTIONS.includes(urlSection) ? urlSection : 'calendario';

  // Estados para la gestión de propiedades y clientes
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isRequestingReview, setIsRequestingReview] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);
  const [reviewRequestClient, setReviewRequestClient] = useState<{ id: number; name: string } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Estados para los campos de perfil de agente
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Barcelona");
  const [influenceNeighborhoods, setInfluenceNeighborhoods] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState<number | undefined>(undefined);
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>([]);
  const [agentFacebookUrl, setAgentFacebookUrl] = useState("");
  const [agentInstagramUrl, setAgentInstagramUrl] = useState("");
  const [agentLinkedinUrl, setAgentLinkedinUrl] = useState("");

  // Estados para los campos de perfil de agencia
  const [agencyName, setAgencyName] = useState("");
  const [agencyAddress, setAgencyAddress] = useState("");
  const [agencyDescription, setAgencyDescription] = useState("");
  const [agencyPhone, setAgencyPhone] = useState("");
  const [agencyWebsite, setAgencyWebsite] = useState("");
  const [agencyCity, setAgencyCity] = useState("Barcelona");
  const [agencyInfluenceNeighborhoods, setAgencyInfluenceNeighborhoods] = useState<string[]>([]);
  const [yearEstablished, setYearEstablished] = useState<number | undefined>(undefined);
  const [agencySupportedLanguages, setAgencySupportedLanguages] = useState<string[]>([]);
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Estado para mostrar indicador de guardado exitoso
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingAgencyLogo, setIsUploadingAgencyLogo] = useState(false);
  const [hasAgentChanges, setHasAgentChanges] = useState(false); // Added
  const [hasAgencyChanges, setHasAgencyChanges] = useState(false); // Added

  // Clients view mode (list or kanban)
  const [clientsView, setClientsView] = useState<'list' | 'kanban'>(() => {
    const saved = localStorage.getItem('clientsView');
    return (saved === 'kanban' || saved === 'list') ? saved : 'list';
  });

  // Selected clients for bulk actions
  const [selectedClientIds, setSelectedClientIds] = useState<Set<number>>(new Set());

  // Send properties modal state
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendModalStep, setSendModalStep] = useState<1 | 2>(1);
  const [propertySearch, setPropertySearch] = useState("");
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<string>>(new Set());
  const [emailMessage, setEmailMessage] = useState("");

  // Properties view mode (grid or table)
  const [propertiesView, setPropertiesView] = useState<'grid' | 'table'>(() => {
    const saved = localStorage.getItem('propertiesView');
    return (saved === 'grid' || saved === 'table') ? saved : 'grid';
  });

  // Persist clients view preference
  useEffect(() => {
    localStorage.setItem('clientsView', clientsView);
  }, [clientsView]);

  // Persist properties view preference
  useEffect(() => {
    localStorage.setItem('propertiesView', propertiesView);
  }, [propertiesView]);


  // Cargar valores iniciales cuando el usuario cambia
  useEffect(() => {
    if (user) {
      // Cargar datos de perfil de agente
      setName(user.name || "");
      setSurname(user.surname || "");
      setDescription(user.description || "");
      setPhone(user.phone || "");
      setCity(user.city || "Barcelona");
      setInfluenceNeighborhoods(user.influenceNeighborhoods || []);
      setYearsOfExperience(user.yearsOfExperience);
      setLanguagesSpoken(user.languagesSpoken || []);
      
      // Cargar redes sociales si existen
      const socialMedia = (user as any).socialMedia || {};
      setAgentFacebookUrl(socialMedia.facebook || "");
      setAgentInstagramUrl(socialMedia.instagram || "");
      setAgentLinkedinUrl(socialMedia.linkedin || "");
    }
  }, [user]);

  // Fetch agencies for admin user
  const { data: agencies } = useQuery<any[]>({
    queryKey: [`/api/agencies?adminAgentId=${user?.id}`],
    enabled: Boolean(user?.isAdmin && user?.id),
  });

  // Get the first agency for this admin (most admins manage one agency)
  const currentAgency = agencies && agencies.length > 0 ? agencies[0] : null;

  // Cargar datos de agencia cuando se obtenga la agencia
  useEffect(() => {
    if (currentAgency) {
      setAgencyName(currentAgency.agencyName || "");
      setAgencyAddress(currentAgency.agencyAddress || "");
      setAgencyDescription(currentAgency.agencyDescription || "");
      setAgencyPhone(currentAgency.agencyPhone || "");
      setAgencyWebsite(currentAgency.agencyWebsite || "");
      setAgencyCity(currentAgency.city || "Barcelona");
      setAgencyInfluenceNeighborhoods(currentAgency.agencyInfluenceNeighborhoods || []);
      setYearEstablished(currentAgency.agencyActiveSince ? parseInt(currentAgency.agencyActiveSince) : undefined);
      setAgencySupportedLanguages(currentAgency.agencySupportedLanguages || []);

      // Cargar redes sociales si existen
      const socialMedia = currentAgency.agencySocialMedia as Record<string, string> | undefined;
      if (socialMedia) {
        setFacebookUrl(socialMedia.facebook || "");
        setInstagramUrl(socialMedia.instagram || "");
        setTwitterUrl(socialMedia.twitter || "");
        setLinkedinUrl(socialMedia.linkedin || "");
      }
    }
  }, [currentAgency]);

  const { data: properties, isLoading: isLoadingProperties} = useQuery<Property[]>({
    queryKey: [`/api/properties?agentId=${user?.id}&includeInactive=true`],
    enabled: currentSection === 'propiedades' && Boolean(user?.id),
  });

  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: [`/api/clients?agentId=${user?.id}`],
    enabled: (currentSection === 'clientes' || currentSection === 'resenas') && Boolean(user?.id),
  });

  // Fetch agency properties for sending to clients (includes all active agency properties)
  const { data: agencyProperties, isLoading: isLoadingAgencyProperties } = useQuery<Property[]>({
    queryKey: ['/api/properties', { agencyId: currentAgency?.id, forSending: true }],
    queryFn: async () => {
      const url = currentAgency?.id 
        ? `/api/properties?agencyId=${currentAgency.id}`
        : `/api/properties?agentId=${user?.id}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
    enabled: isSendModalOpen && Boolean(user?.id),
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (data: any) => {
      // apiRequest already returns parsed JSON data, not a Response object
      return await apiRequest('POST', '/api/properties', {
        ...data,
        agentId: user!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/properties?agentId=${user?.id}&includeInactive=true`] });
      setIsAddingProperty(false);
      setEditingProperty(null);
      toast({
        title: "Propiedad creada",
        description: "La propiedad se ha añadido correctamente",
      });
    },
    onError: (error) => {
      console.error('Error creating property:', error);
      toast({
        title: "Error al crear propiedad",
        description: (error as Error).message || "No se pudo crear la propiedad",
        variant: "destructive",
      });
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async (data: any) => {
      // apiRequest already returns parsed JSON data, not a Response object
      return await apiRequest('PATCH', `/api/properties/${editingProperty?.uuid}`, {
        ...data,
        agentId: user!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/properties?agentId=${user?.id}&includeInactive=true`] });
      setEditingProperty(null);
      toast({
        title: "Propiedad actualizada",
        description: "Los cambios se han guardado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error updating property:', error);
      toast({
        title: "Error al actualizar",
        description: (error as Error).message || "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    },
  });

  const fetchPropertyForEditMutation = useMutation({
    mutationFn: async (uuid: string) => {
      // Fetch full property data including description
      return await apiRequest('GET', `/api/properties/${uuid}`, undefined);
    },
    onSuccess: (fullProperty) => {
      setEditingProperty(fullProperty);
      setIsAddingProperty(false);
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: any) => {
      // apiRequest already returns parsed JSON data, not a Response object
      return await apiRequest('POST', '/api/clients', {
        ...data,
        agentId: user!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients?agentId=${user?.id}`] });
      setIsAddingClient(false);
      setEditingClient(null);
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async (data: any) => {
      // apiRequest already returns parsed JSON data, not a Response object
      return await apiRequest('PATCH', `/api/clients/${data.id}`, {
        ...data,
        agentId: user!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients?agentId=${user?.id}`] });
      setEditingClient(null);
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: number) => {
      return await apiRequest('DELETE', `/api/clients/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients?agentId=${user?.id}`] });
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente",
        variant: "destructive",
      });
    },
  });

  // Send properties to clients via email
  const sendPropertiesMutation = useMutation({
    mutationFn: async (data: { clientIds: number[]; propertyUuids: string[]; message: string }) => {
      return await apiRequest('POST', '/api/clients/send-properties', data);
    },
    onSuccess: (result: any) => {
      toast({
        title: "Correos enviados",
        description: `Se han enviado ${result.sentCount || selectedClientIds.size} correos correctamente`,
      });
      // Reset modal state
      setIsSendModalOpen(false);
      setSendModalStep(1);
      setSelectedPropertyIds(new Set());
      setEmailMessage("");
      setSelectedClientIds(new Set());
    },
    onError: (error) => {
      toast({
        title: "Error al enviar correos",
        description: (error as Error).message || "No se pudieron enviar los correos",
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user) return null;
      
      // apiRequest already returns parsed JSON data, not a Response object
      return await apiRequest('PATCH', `/api/users/${user.id}`, data);
    },
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        setUser(updatedUser);
        setShowSavedIndicator(true);
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

  const updateAgencyMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!currentAgency) return null;

      // apiRequest already returns parsed JSON data, not a Response object
      return await apiRequest('PATCH', `/api/agencies/${currentAgency.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agencies?adminAgentId=${user?.id}`] });
      setShowSavedIndicator(true);
      setHasAgencyChanges(false);
      toast({
        title: "Agencia actualizada",
        description: "Los cambios se han guardado correctamente",
      });

      setTimeout(() => {
        setShowSavedIndicator(false);
      }, 3000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "No se pudo actualizar la agencia",
        variant: "destructive",
      });
    }
  });

  // Mutation for sending review requests
  const sendReviewRequestMutation = useMutation({
    mutationFn: async ({ clientId, agentId }: { clientId: number; agentId: number }) => {
      // apiRequest already returns parsed JSON data, not a Response object
      return await apiRequest('POST', '/api/review-requests', {
        clientId,
        agentId,
      });
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

  // Show loading state while user context is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Route guards will handle redirects - no need for redirect here
  return (
    <div className="min-h-screen flex">
      <SidebarProvider>
        <Sidebar className={`border-r hidden md:block transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} pt-16`}>
          <SidebarContent className="pt-4">
            <SidebarMenu>
              {/* CRM Section */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentSection === "clientes"}
                  onClick={() => navigate(`/gestionar/${user?.agentUuid}/clientes`)}
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
                  isActive={currentSection === "calendario"}
                  onClick={() => navigate(`/gestionar/${user?.agentUuid}/calendario`)}
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
                  isActive={currentSection === "clientes"}
                  onClick={() => navigate(`/gestionar/${user?.agentUuid}/clientes`)}
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
                  isActive={currentSection === "mensajes"}
                  onClick={() => navigate(`/gestionar/${user?.agentUuid}/mensajes`)}
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
                  isActive={currentSection === "perfil-agente"}
                  onClick={() => navigate(`/gestionar/${user?.agentUuid}/perfil-agente`)}
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
                    isActive={currentSection === "perfil-agencia"}
                    onClick={() => navigate(`/gestionar/${user?.agentUuid}/perfil-agencia`)}
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
                  isActive={currentSection === "propiedades"}
                  onClick={() => navigate(`/gestionar/${user?.agentUuid}/propiedades`)}
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
                  isActive={currentSection === "resenas"}
                  onClick={() => navigate(`/gestionar/${user?.agentUuid}/resenas`)}
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
                    isActive={currentSection === "equipo"}
                    onClick={() => navigate(`/gestionar/${user?.agentUuid}/equipo`)}
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

              {/* Only show network management for network admins */}
              {user?.agentType === "network_admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={currentSection === "red"}
                    onClick={() => navigate(`/gestionar/${user?.agentUuid}/red`)}
                    className="relative group"
                    title={sidebarCollapsed ? "Gestionar mi red" : ""}
                  >
                    <Network className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && <span>Gestionar mi red</span>}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                      Gestionar mi red
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

              {/* Billing section - visible to agency admins and individual agents */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentSection === "facturacion"}
                  onClick={() => navigate(`/gestionar/${user?.agentUuid}/facturacion`)}
                  className="relative group"
                  title={sidebarCollapsed ? "Suscripción y facturación" : ""}
                >
                  <CreditCard className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Suscripción y facturación</span>}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                      Suscripción y facturación
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        {/* Mobile navigation */}
        <div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b z-40">
          <div className="flex overflow-x-auto p-2 gap-2">
            <Button
              variant={currentSection === "clientes" ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(`/gestionar/${user?.agentUuid}/clientes`)}
              className="whitespace-nowrap"
            >
              <Users className="h-4 w-4 mr-1" />
              CRM
            </Button>
            <Button
              variant={currentSection === "calendario" ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(`/gestionar/${user?.agentUuid}/calendario`)}
              className="whitespace-nowrap"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Calendario
            </Button>
            <Button
              variant={currentSection === "perfil-agente" ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(`/gestionar/${user?.agentUuid}/perfil-agente`)}
              className="whitespace-nowrap"
            >
              <UserCircle className="h-4 w-4 mr-1" />
              Perfil
            </Button>
            <Button
              variant={currentSection === "propiedades" ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(`/gestionar/${user?.agentUuid}/propiedades`)}
              className="whitespace-nowrap"
            >
              <Building2 className="h-4 w-4 mr-1" />
              Propiedades
            </Button>
            <Button
              variant={currentSection === "mensajes" ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(`/gestionar/${user?.agentUuid}/mensajes`)}
              className="whitespace-nowrap"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Consultas
            </Button>
            <Button
              variant={currentSection === "resenas" ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(`/gestionar/${user?.agentUuid}/resenas`)}
              className="whitespace-nowrap"
            >
              <Star className="h-4 w-4 mr-1" />
              Reseñas
            </Button>
            {user?.isAdmin && (
              <>
                <Button
                  variant={currentSection === "perfil-agencia" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(`/gestionar/${user?.agentUuid}/perfil-agencia`)}
                  className="whitespace-nowrap"
                >
                  <Building className="h-4 w-4 mr-1" />
                  Agencia
                </Button>
                <Button
                  variant={currentSection === "equipo" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(`/gestionar/${user?.agentUuid}/equipo`)}
                  className="whitespace-nowrap"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Equipo
                </Button>
              </>
            )}
            {user?.agentType === "network_admin" && (
              <Button
                variant={currentSection === "red" ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate(`/gestionar/${user?.agentUuid}/red`)}
                className="whitespace-nowrap"
              >
                <Network className="h-4 w-4 mr-1" />
                Red
              </Button>
            )}
            <Button
              variant={currentSection === "facturacion" ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(`/gestionar/${user?.agentUuid}/facturacion`)}
              className="whitespace-nowrap"
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Facturación
            </Button>
          </div>
        </div>

        {/* Sidebar Toggle Button - Positioned at the border */}
        <div className={`fixed top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${sidebarCollapsed ? 'left-14' : 'left-60'}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8 p-0 bg-white shadow-md border rounded-full"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <main className={`absolute inset-0 p-4 md:p-6 pt-20 md:pt-24 transition-all duration-300 ${sidebarCollapsed ? 'md:left-16' : 'md:left-64'}`}>
          {currentSection === "calendario" && user?.id && (
            <div className="max-w-6xl mx-auto">
              <AgentCalendar agentId={user.id} />
            </div>
          )}

          {currentSection === "perfil-agente" && (
            <div className="max-w-2xl mx-auto space-y-8 pb-16">
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
                <Label htmlFor="picture" className={`cursor-pointer text-sm ${isUploadingAvatar ? 'text-gray-400' : 'text-primary'}`}>
                  {isUploadingAvatar ? 'Subiendo foto...' : 'Gestionar foto'}
                </Label>
                <Input
                  id="picture"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIsUploadingAvatar(true);
                      try {
                        // Upload image to cloud storage
                        const formData = new FormData();
                        formData.append('image', file);

                        const response = await fetch('/api/property-images/upload-direct', {
                          method: 'POST',
                          body: formData,
                        });

                        if (!response.ok) {
                          throw new Error('Failed to upload image');
                        }

                        // Validate response is JSON
                        const contentType = response.headers.get('content-type');
                        if (!contentType || !contentType.includes('application/json')) {
                          throw new Error('Server returned non-JSON response');
                        }

                        const data = await response.json();
                        
                        if (!data.imageUrl) {
                          throw new Error('No image URL in response');
                        }

                        // Update profile with cloud storage URL
                        updateProfileMutation.mutate({
                          avatar: data.imageUrl
                        });
                        
                        toast({
                          title: "Éxito",
                          description: "Foto actualizada correctamente",
                        });
                      } catch (error) {
                        console.error('Error uploading avatar:', error);
                        toast({
                          title: "Error",
                          description: "No se pudo cargar la imagen. Por favor intenta de nuevo.",
                          variant: "destructive"
                        });
                      } finally {
                        setIsUploadingAvatar(false);
                      }
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
                  <Label htmlFor="agent-phone">Número de teléfono</Label>
                  <Input 
                    id="agent-phone" 
                    placeholder="Teléfono de contacto (ej: 612345678)" 
                    value={phone}
                    onChange={(e) => {setPhone(e.target.value); setHasAgentChanges(true);}}
                    data-testid="input-agent-phone"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Formato válido: +34 612 345 678, 612345678, etc.
                  </p>
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
                <div>
                  <Label htmlFor="city">Ciudad donde trabajas</Label>
                  <Select
                    value={city}
                    onValueChange={(value) => {
                      setCity(value);
                      setInfluenceNeighborhoods([]); // Clear neighborhoods when city changes
                      setHasAgentChanges(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCities().map((cityOption) => (
                        <SelectItem key={cityOption} value={cityOption}>
                          {cityOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full">
                  <Label htmlFor="influence-neighborhoods">Barrios de influencia</Label>
                  <div className="mt-1">
                    <NeighborhoodSelector
                      selectedNeighborhoods={influenceNeighborhoods}
                      city={city}
                      onChange={(e) => {setInfluenceNeighborhoods(e); setHasAgentChanges(true);}} // Added change detection
                      buttonText="Selecciona los barrios donde trabajas habitualmente"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Estos barrios se utilizarán para relacionar tu perfil con las búsquedas de los clientes.
                  </p>
                </div>

                <div className="space-y-4">
                  <Label>Redes sociales</Label>
                  <p className="text-sm text-gray-500">
                    Añade tus perfiles de redes sociales para que aparezcan en tu perfil público.
                  </p>
                  
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                      </div>
                      <Input
                        placeholder="URL de Facebook"
                        value={agentFacebookUrl}
                        onChange={(e) => {setAgentFacebookUrl(e.target.value); setHasAgentChanges(true);}}
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
                        value={agentInstagramUrl}
                        onChange={(e) => {setAgentInstagramUrl(e.target.value); setHasAgentChanges(true);}}
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
                        value={agentLinkedinUrl}
                        onChange={(e) => {setAgentLinkedinUrl(e.target.value); setHasAgentChanges(true);}}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  className="relative"
                  onClick={() => {
                    // Validate phone number if provided
                    if (phone && phone.trim() !== '') {
                      const phoneRegex = /^(\+34|0034|34)?[\s\-]?[6789]\d{2}[\s\-]?\d{3}[\s\-]?\d{3}$/;
                      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
                        toast({
                          title: "Número de teléfono inválido",
                          description: "Por favor, introduce un número de teléfono español válido (ej: 612345678 o +34 612 345 678)",
                          variant: "destructive",
                        });
                        return;
                      }
                    }

                    // Crear el objeto de redes sociales
                    const socialMedia: Record<string, string> = {};
                    if (agentFacebookUrl) socialMedia.facebook = agentFacebookUrl;
                    if (agentInstagramUrl) socialMedia.instagram = agentInstagramUrl;
                    if (agentLinkedinUrl) socialMedia.linkedin = agentLinkedinUrl;

                    updateProfileMutation.mutate({
                      name,
                      surname,
                      description,
                      phone,
                      city,
                      influenceNeighborhoods,
                      yearsOfExperience,
                      languagesSpoken,
                      socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : undefined
                    });
                  }}
                  disabled={updateProfileMutation.isPending || !hasAgentChanges} // Added disable logic
                  data-testid="button-save-agent-profile"
                >
                  {showSavedIndicator && (
                    <CheckCircle className="w-4 h-4 absolute -left-6 text-green-500" />
                  )}
                  Guardar cambios
                </Button>
              </div>
            </div>
          )}

          {currentSection === "perfil-agencia" && user?.isAdmin && (
            <div>
              <AgenciesList />
            </div>
          )}

          {currentSection === "agency-profile-old" && (!user?.isAgent || user?.agencyName) && (
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
                <Label htmlFor="agency-logo" className={`cursor-pointer text-sm ${isUploadingAgencyLogo ? 'text-gray-400' : 'text-primary'}`}>
                  {isUploadingAgencyLogo ? 'Subiendo logo...' : 'Gestionar logo'}
                </Label>
                <Input
                  id="agency-logo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIsUploadingAgencyLogo(true);
                      try {
                        // Upload image to cloud storage
                        const formData = new FormData();
                        formData.append('image', file);

                        const response = await fetch('/api/property-images/upload-direct', {
                          method: 'POST',
                          body: formData,
                        });

                        if (!response.ok) {
                          throw new Error('Failed to upload image');
                        }

                        // Validate response is JSON
                        const contentType = response.headers.get('content-type');
                        if (!contentType || !contentType.includes('application/json')) {
                          throw new Error('Server returned non-JSON response');
                        }

                        const data = await response.json();
                        
                        if (!data.imageUrl) {
                          throw new Error('No image URL in response');
                        }

                        // Update profile with cloud storage URL
                        updateProfileMutation.mutate({
                          agencyLogo: data.imageUrl
                        });
                        
                        toast({
                          title: "Éxito",
                          description: "Logo actualizado correctamente",
                        });
                      } catch (error) {
                        console.error('Error uploading agency logo:', error);
                        toast({
                          title: "Error",
                          description: "No se pudo cargar el logo. Por favor intenta de nuevo.",
                          variant: "destructive"
                        });
                      } finally {
                        setIsUploadingAgencyLogo(false);
                      }
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
                  <Label htmlFor="agencySupportedLanguages">Idiomas que se hablan en la agencia</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['español', 'català', 'english', 'français', 'deutsch', 'italiano', 'português', 'русский', '中文', '日本語', 'العربية'].map((lang) => (
                      <Button 
                        key={lang}
                        type="button" 
                        variant={agencySupportedLanguages.includes(lang) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (agencySupportedLanguages.includes(lang)) {
                            setAgencySupportedLanguages(agencySupportedLanguages.filter(l => l !== lang));
                          } else {
                            setAgencySupportedLanguages([...agencySupportedLanguages, lang]);
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
                  onClick={() => updateAgencyMutation.mutate({
                    agencyName,
                    agencyAddress,
                    agencyDescription,
                    agencyPhone,
                    agencyWebsite,
                    city: agencyCity,
                    agencyInfluenceNeighborhoods,
                    yearEstablished,
                    agencySupportedLanguages,
                    agencySocialMedia: {
                      facebook: facebookUrl,
                      instagram: instagramUrl,
                      twitter: twitterUrl,
                      linkedin: linkedinUrl
                    }
                  })}
                  disabled={updateAgencyMutation.isPending || !hasAgencyChanges || !currentAgency} // Added disable logic
                >
                  {showSavedIndicator && (
                    <CheckCircle className="w-4 h-4 absolute -left-6 text-green-500" />
                  )}
                  Guardar cambios
                </Button>
              </div>
            </div>
          )}

          {currentSection === "propiedades" && (
            <div className="space-y-4">
              {!(isAddingProperty || editingProperty) && (
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Gestión de Propiedades</h2>
                  <div className="flex items-center gap-2">
                    {/* View Toggle Buttons */}
                    <div className="flex border rounded-md">
                      <Button
                        variant={propertiesView === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPropertiesView('grid')}
                        className="rounded-r-none"
                        data-testid="button-view-grid"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={propertiesView === 'table' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPropertiesView('table')}
                        className="rounded-l-none"
                        data-testid="button-view-table"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button 
                      onClick={() => {
                        setIsAddingProperty(true);
                        setEditingProperty(null);
                      }} 
                      size="lg"
                    >
                      Añadir propiedad
                    </Button>
                  </div>
                </div>
              )}

              {(isAddingProperty || editingProperty || fetchPropertyForEditMutation.isPending) ? (
                <>
                  {fetchPropertyForEditMutation.isPending ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Cargando propiedad...</p>
                      </div>
                    </div>
                  ) : (isAddingProperty && !editingProperty) || (editingProperty?.isDraft) ? (
                    <PropertyFormMultiStep
                      onClose={() => {
                        if (isAddingProperty) {
                          setIsAddingProperty(false);
                        } else {
                          setEditingProperty(null);
                        }
                      }}
                      initialData={editingProperty || undefined}
                      isEditing={!!editingProperty}
                    />
                  ) : (
                    /* Use regular form for editing published properties */
                    <PropertyForm 
                      onSubmit={async (data) => {
                        await updatePropertyMutation.mutateAsync(data);
                      }}
                      onClose={() => {
                        setEditingProperty(null);
                      }}
                      initialData={editingProperty ? {
                        isActive: editingProperty.isActive,
                        title: editingProperty.title,
                        description: editingProperty.description,
                        price: editingProperty.price,
                        address: editingProperty.address,
                        locality: editingProperty.locality || "",
                        streetName: editingProperty.streetName || "",
                        streetNumber: editingProperty.streetNumber || "",
                        latitude: editingProperty.latitude,
                        longitude: editingProperty.longitude,
                        escalera: editingProperty.escalera || undefined,
                        planta: editingProperty.planta || undefined,
                        puerta: editingProperty.puerta || undefined,
                        superficie: editingProperty.superficie,
                        bedrooms: editingProperty.bedrooms,
                        bathrooms: editingProperty.bathrooms,
                        imageUrls: editingProperty.imageUrls || [],
                        type: editingProperty.type as any,
                        housingType: editingProperty.housingType || undefined,
                        housingStatus: editingProperty.housingStatus || undefined,
                        propertyCondition: editingProperty.propertyCondition || undefined,
                        floor: editingProperty.floor || undefined,
                        neighborhood: editingProperty.neighborhood,
                        reference: editingProperty.reference,
                        operationType: editingProperty.operationType as "Venta" | "Alquiler",
                        features: editingProperty.features || [],
                        availability: editingProperty.availability || "Inmediatamente",
                        availabilityDate: editingProperty.availabilityDate ? new Date(editingProperty.availabilityDate) : undefined,
                        mainImageIndex: editingProperty.mainImageIndex || 0
                      } : undefined}
                      isEditing={true}
                    />
                  )}
                </>
              ) : (
                <>
                  {isLoadingProperties ? (
                    <div className="text-center py-8">
                      <p>Cargando propiedades...</p>
                    </div>
                  ) : !properties?.length ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">Sin propiedades</h3>
                      <p className="mt-1 text-gray-500">
                        Empieza añadiendo tu primera propiedad
                      </p>
                    </div>
                  ) : propertiesView === 'table' ? (
                    /* Table View */
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[120px]">Referencia</TableHead>
                            <TableHead>Dirección</TableHead>
                            <TableHead className="w-[120px]">Precio</TableHead>
                            <TableHead className="w-[100px] text-center">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {properties.map((property) => (
                            <TableRow key={property.uuid} className="hover:bg-gray-50">
                              <TableCell className="font-medium">
                                {property.reference || '-'}
                              </TableCell>
                              <TableCell>
                                <div className="line-clamp-1">{property.address}</div>
                              </TableCell>
                              <TableCell className="font-semibold text-primary">
                                €{property.price?.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fetchPropertyForEditMutation.mutate(property.uuid)}
                                    data-testid={`button-edit-property-${property.uuid}`}
                                  >
                                    <Enter className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    /* Grid View */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                      {properties.map((property) => {
                        const propertyImages = (property.imageUrls && property.imageUrls.length > 0)
                          ? property.imageUrls
                          : [];
                        
                        return (
                          <div 
                            key={property.uuid} 
                            className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                            onClick={() => {
                              fetchPropertyForEditMutation.mutate(property.uuid);
                            }}
                          >
                            <div className="h-48 overflow-hidden relative">
                              {propertyImages.length > 0 ? (
                                <img 
                                  src={propertyImages[0]} 
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

                            <div className="p-3 md:p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-base line-clamp-1 flex-1 mr-2">{property.title || property.address}</h3>
                              </div>

                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-xl md:text-2xl font-bold text-primary">€{property.price?.toLocaleString()}</p>
                                {property.previousPrice && property.previousPrice > property.price && (
                                  <span className="text-sm font-medium text-red-600">
                                    {Math.round(((property.previousPrice - property.price) / property.previousPrice) * 100)}% ↓
                                  </span>
                                )}
                              </div>
                              
                              {property.superficie && (
                                <p className="text-sm font-medium text-gray-800 mb-2">
                                  {Math.round(property.price / property.superficie)}€/m²
                                </p>
                              )}
                              
                              <div className="flex items-center gap-2 md:gap-4 text-sm text-gray-600 mb-2 flex-wrap">
                                <span className="truncate">{property.type}</span>
                                {property.housingType && <span className="truncate">{property.housingType}</span>}
                                <span className="truncate">{property.neighborhood}</span>
                              </div>
                              
                              <p className="text-sm text-gray-600 line-clamp-1 mb-3">{property.address}</p>

                              <div className="flex gap-2 md:gap-4 text-sm text-gray-500 mb-3 flex-wrap">
                                {property.superficie && (
                                  <div className="whitespace-nowrap">{property.superficie}m²</div>
                                )}
                                {property.bedrooms && (
                                  <div className="whitespace-nowrap">{property.bedrooms} hab.</div>
                                )}
                                {property.bathrooms && (
                                  <div className="whitespace-nowrap">{property.bathrooms} baños</div>
                                )}
                                {property.reference && (
                                  <div className="text-gray-400 whitespace-nowrap">Ref: {property.reference}</div>
                                )}
                              </div>

                              {property.features && property.features.length > 0 && (
                                <div className="flex flex-wrap gap-1">
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
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {currentSection === "clientes" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Gestión de Clientes</h2>
                <div className="flex items-center gap-2">
                  {/* View toggle buttons */}
                  <div className="flex items-center border rounded-md">
                    <Button 
                      variant={clientsView === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setClientsView('list')}
                      className="rounded-r-none"
                      data-testid="button-view-list"
                    >
                      <List className="h-4 w-4 mr-1" />
                      Lista
                    </Button>
                    <Button 
                      variant={clientsView === 'kanban' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setClientsView('kanban')}
                      className="rounded-l-none"
                      data-testid="button-view-kanban"
                    >
                      <LayoutGrid className="h-4 w-4 mr-1" />
                      Panel
                    </Button>
                  </div>
                  
                  {/* Container for Enviar button sliding animation */}
                  <div className="relative flex items-center">
                    {/* Enviar button - slides out from behind Añadir cliente */}
                    <div 
                      className={`flex items-center overflow-hidden transition-all duration-300 ease-out ${
                        selectedClientIds.size > 0 
                          ? 'max-w-[150px] opacity-100 mr-2 pointer-events-auto' 
                          : 'max-w-0 opacity-0 mr-0 pointer-events-none'
                      }`}
                    >
                      <Button 
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-white whitespace-nowrap"
                        onClick={() => {
                          setIsSendModalOpen(true);
                          setSendModalStep(1);
                          setPropertySearch("");
                          setSelectedPropertyIds(new Set());
                          setEmailMessage("");
                        }}
                        data-testid="button-send-to-clients"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Enviar a {selectedClientIds.size}
                      </Button>
                    </div>
                    
                    <Button 
                      onClick={() => {
                        setIsAddingClient(true);
                        setEditingClient(null);
                      }}
                      data-testid="button-add-client"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Añadir cliente
                    </Button>
                  </div>
                </div>
              </div>

              <AddClientModal
                isOpen={isAddingClient || !!editingClient}
                onClose={() => {
                  setIsAddingClient(false);
                  setEditingClient(null);
                }}
                onSubmit={async (data) => {
                  if (editingClient) {
                    await updateClientMutation.mutateAsync({
                      ...data,
                      id: editingClient.id
                    });
                  } else {
                    await createClientMutation.mutateAsync(data);
                  }
                  setIsAddingClient(false);
                  setEditingClient(null);
                }}
                isSubmitting={editingClient ? updateClientMutation.isPending : createClientMutation.isPending}
                initialData={editingClient ? {
                  name: editingClient.name,
                  surname: editingClient.surname || "",
                  email: editingClient.email,
                  phone: editingClient.phone,
                  status: editingClient.status,
                  contactHistory: (editingClient.contactHistory as any) || []
                } : undefined}
                isEditing={!!editingClient}
              />

              {/* Conditional rendering based on view mode */}
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
              ) : clientsView === 'kanban' ? (
                <ClientsKanban
                  clients={clients}
                  onEditClient={setEditingClient}
                  onUpdateClientStatus={async (clientId, newStatus) => {
                    const client = clients.find(c => c.id === clientId);
                    if (client) {
                      await updateClientMutation.mutateAsync({
                        ...client,
                        status: newStatus
                      });
                    }
                  }}
                />
              ) : (
                <div className="bg-white border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={clients.length > 0 && selectedClientIds.size === clients.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedClientIds(new Set(clients.map(c => c.id)));
                              } else {
                                setSelectedClientIds(new Set());
                              }
                            }}
                            data-testid="checkbox-select-all-clients"
                          />
                        </TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Apellido</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => {
                        const statusConfig = CLIENT_STATUSES.find(s => s.value === client.status);
                        const isSelected = selectedClientIds.has(client.id);
                        return (
                          <TableRow 
                            key={client.id} 
                            data-testid={`row-client-${client.id}`}
                            className={isSelected ? 'bg-primary/5' : ''}
                          >
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  const newSelected = new Set(selectedClientIds);
                                  if (checked) {
                                    newSelected.add(client.id);
                                  } else {
                                    newSelected.delete(client.id);
                                  }
                                  setSelectedClientIds(newSelected);
                                }}
                                data-testid={`checkbox-client-${client.id}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>{client.surname || '-'}</TableCell>
                            <TableCell>{client.email}</TableCell>
                            <TableCell>{client.phone}</TableCell>
                            <TableCell>
                              {statusConfig && (
                                <Badge className={`${statusConfig.color}`}>
                                  {statusConfig.label}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingClient(client)}
                                  data-testid={`button-edit-client-${client.id}`}
                                >
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setClientToDelete(client)}
                                  data-testid={`button-delete-client-${client.id}`}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Eliminar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              <Dialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Eliminar cliente</DialogTitle>
                    <DialogDescription>
                      ¿Estás seguro de que quieres eliminar a {clientToDelete?.name} {clientToDelete?.surname || ''}? 
                      Esta acción es permanente y no se puede deshacer.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setClientToDelete(null)}
                      data-testid="button-cancel-delete"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (clientToDelete) {
                          deleteClientMutation.mutate(clientToDelete.id);
                          setClientToDelete(null);
                        }
                      }}
                      disabled={deleteClientMutation.isPending}
                      data-testid="button-confirm-delete"
                    >
                      {deleteClientMutation.isPending ? "Eliminando..." : "Eliminar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Send Properties Modal - 2 Step Flow */}
              <Dialog 
                open={isSendModalOpen} 
                onOpenChange={(open) => {
                  if (!open) {
                    setIsSendModalOpen(false);
                    setSendModalStep(1);
                    setPropertySearch("");
                    setSelectedPropertyIds(new Set());
                    setEmailMessage("");
                  }
                }}
              >
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                  {sendModalStep === 1 ? (
                    <>
                      <DialogHeader>
                        <DialogTitle>Seleccionar Propiedades</DialogTitle>
                      </DialogHeader>
                      
                      <div className="flex-1 overflow-hidden flex flex-col">
                        {/* Search input */}
                        <div className="mb-4">
                          <div className="relative">
                            <Input
                              placeholder="Buscar propiedades..."
                              value={propertySearch}
                              onChange={(e) => setPropertySearch(e.target.value)}
                              className="pl-10"
                              data-testid="input-search-properties"
                            />
                            <svg
                              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <circle cx="11" cy="11" r="8" />
                              <path d="m21 21-4.35-4.35" />
                            </svg>
                          </div>
                        </div>

                        {/* Properties table */}
                        <div className="flex-1 overflow-auto border rounded-lg">
                          {isLoadingAgencyProperties ? (
                            <div className="flex items-center justify-center h-48">
                              <p className="text-muted-foreground">Cargando propiedades...</p>
                            </div>
                          ) : !agencyProperties?.length ? (
                            <div className="flex items-center justify-center h-48">
                              <p className="text-muted-foreground">No hay propiedades disponibles</p>
                            </div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[50px]">
                                    <Checkbox
                                      checked={agencyProperties.filter(p => 
                                        !propertySearch || 
                                        p.title?.toLowerCase().includes(propertySearch.toLowerCase()) ||
                                        p.address?.toLowerCase().includes(propertySearch.toLowerCase()) ||
                                        p.type?.toLowerCase().includes(propertySearch.toLowerCase())
                                      ).length > 0 && 
                                      agencyProperties.filter(p => 
                                        !propertySearch || 
                                        p.title?.toLowerCase().includes(propertySearch.toLowerCase()) ||
                                        p.address?.toLowerCase().includes(propertySearch.toLowerCase()) ||
                                        p.type?.toLowerCase().includes(propertySearch.toLowerCase())
                                      ).every(p => selectedPropertyIds.has(p.uuid))}
                                      onCheckedChange={(checked) => {
                                        const filteredProps = agencyProperties.filter(p => 
                                          !propertySearch || 
                                          p.title?.toLowerCase().includes(propertySearch.toLowerCase()) ||
                                          p.address?.toLowerCase().includes(propertySearch.toLowerCase()) ||
                                          p.type?.toLowerCase().includes(propertySearch.toLowerCase())
                                        );
                                        if (checked) {
                                          setSelectedPropertyIds(new Set([...Array.from(selectedPropertyIds), ...filteredProps.map(p => p.uuid)]));
                                        } else {
                                          const newSet = new Set(selectedPropertyIds);
                                          filteredProps.forEach(p => newSet.delete(p.uuid));
                                          setSelectedPropertyIds(newSet);
                                        }
                                      }}
                                      data-testid="checkbox-select-all-properties"
                                    />
                                  </TableHead>
                                  <TableHead>Referencia</TableHead>
                                  <TableHead>Dirección</TableHead>
                                  <TableHead className="text-right">Precio</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {agencyProperties
                                  .filter(property => 
                                    !propertySearch || 
                                    property.title?.toLowerCase().includes(propertySearch.toLowerCase()) ||
                                    property.address?.toLowerCase().includes(propertySearch.toLowerCase()) ||
                                    property.type?.toLowerCase().includes(propertySearch.toLowerCase())
                                  )
                                  .map((property) => {
                                    const isSelected = selectedPropertyIds.has(property.uuid);
                                    return (
                                      <TableRow 
                                        key={property.uuid}
                                        className={isSelected ? 'bg-primary/5' : ''}
                                        data-testid={`row-property-${property.uuid}`}
                                      >
                                        <TableCell>
                                          <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={(checked) => {
                                              const newSet = new Set(selectedPropertyIds);
                                              if (checked) {
                                                newSet.add(property.uuid);
                                              } else {
                                                newSet.delete(property.uuid);
                                              }
                                              setSelectedPropertyIds(newSet);
                                            }}
                                            data-testid={`checkbox-property-${property.uuid}`}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <div>
                                            <p className="font-medium">{property.title || 'Sin título'}</p>
                                            <p className="text-sm text-muted-foreground">{property.type || 'Vivienda'}</p>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                          {property.address || 'Sin dirección'}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                          {property.price ? `$${property.price.toLocaleString()}` : '-'}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      </div>

                      <DialogFooter className="mt-4">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setIsSendModalOpen(false);
                            setSendModalStep(1);
                            setSelectedPropertyIds(new Set());
                          }}
                          data-testid="button-cancel-send"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={() => setSendModalStep(2)}
                          disabled={selectedPropertyIds.size === 0}
                          data-testid="button-continue-send"
                        >
                          Continuar
                        </Button>
                      </DialogFooter>
                    </>
                  ) : (
                    <>
                      <DialogHeader>
                        <DialogTitle>Confirmar Envío</DialogTitle>
                      </DialogHeader>
                      
                      <div className="flex-1 overflow-auto space-y-4">
                        {/* Selected Clients */}
                        <div>
                          <h4 className="font-medium mb-2">Clientes ({selectedClientIds.size})</h4>
                          <div className="space-y-2 max-h-32 overflow-auto">
                            {clients?.filter(c => selectedClientIds.has(c.id)).map((client) => (
                              <div 
                                key={client.id} 
                                className="p-3 border rounded-lg"
                                data-testid={`selected-client-${client.id}`}
                              >
                                <p className="font-medium">{client.name} {client.surname || ''}</p>
                                <p className="text-sm text-muted-foreground">{client.email}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Selected Properties */}
                        <div>
                          <h4 className="font-medium mb-2">Propiedades ({selectedPropertyIds.size})</h4>
                          <div className="space-y-2 max-h-32 overflow-auto">
                            {agencyProperties?.filter(p => selectedPropertyIds.has(p.uuid)).map((property) => (
                              <div 
                                key={property.uuid} 
                                className="p-3 border rounded-lg"
                                data-testid={`selected-property-${property.uuid}`}
                              >
                                <p className="font-medium">{property.title || 'Sin título'}</p>
                                <p className="text-sm text-muted-foreground">{property.address || 'Sin dirección'}</p>
                                <p className="text-sm font-medium text-primary">
                                  {property.price ? `$${property.price.toLocaleString()}` : '-'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Email Message */}
                        <div>
                          <Label htmlFor="emailMessage" className="font-medium">Mensaje del correo</Label>
                          <Textarea
                            id="emailMessage"
                            placeholder="Escribe el mensaje que se enviará a los clientes junto con las propiedades seleccionadas..."
                            value={emailMessage}
                            onChange={(e) => setEmailMessage(e.target.value)}
                            className="mt-2 min-h-[100px]"
                            data-testid="textarea-email-message"
                          />
                        </div>
                      </div>

                      <DialogFooter className="mt-4 flex justify-between">
                        <Button
                          variant="ghost"
                          onClick={() => setSendModalStep(1)}
                          className="mr-auto"
                          data-testid="button-back-send"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Volver
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setIsSendModalOpen(false);
                              setSendModalStep(1);
                              setSelectedPropertyIds(new Set());
                              setEmailMessage("");
                            }}
                            data-testid="button-cancel-confirm"
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={() => {
                              sendPropertiesMutation.mutate({
                                clientIds: Array.from(selectedClientIds),
                                propertyUuids: Array.from(selectedPropertyIds),
                                message: emailMessage,
                              });
                            }}
                            disabled={sendPropertiesMutation.isPending}
                            data-testid="button-confirm-send"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {sendPropertiesMutation.isPending ? "Enviando..." : "Confirmar Envío"}
                          </Button>
                        </div>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>

              {isRequestingReview && (
                <ReviewRequestForm
                  onClose={() => setIsRequestingReview(false)}
                />
              )}
            </div>
          )}

          {currentSection === "resenas" && (
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

          {currentSection === "mensajes" && (
            <div className="max-w-6xl mx-auto">
              <ConversationalMessages />
            </div>
          )}

          {currentSection === "equipo" && user?.isAdmin && (
            <div className="max-w-6xl mx-auto">
              <TeamManagement agencyId={user.agencyId ? parseInt(user.agencyId) : undefined} />
            </div>
          )}

          {currentSection === "red" && user?.agentType === "network_admin" && (
            <NetworkManagement networkId={user.networkId} />
          )}

          {currentSection === "facturacion" && user?.id && (
            <BillingTab 
              entityType={user.isAdmin ? 'agency' : 'agent'} 
              entityId={user.isAdmin ? (user.agencyId || user.id) : user.id}
              agentUuid={user.agentUuid || ''}
            />
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