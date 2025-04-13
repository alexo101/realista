import { useState, useEffect } from "react";
import { Redirect } from "wouter";
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
import { Building2, Users, Star, UserCircle, Building, MessageSquare, CheckCircle, Plus, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PropertyForm } from "@/components/PropertyForm";
import { ClientForm } from "@/components/ClientForm";
import { ReviewRequestForm } from "@/components/ReviewRequestForm";
import { NeighborhoodSelector } from "@/components/NeighborhoodSelector";
import { AgencyAgentsList } from "@/components/AgencyAgentsList";
import { InquiriesList } from "@/components/InquiriesList";
import { CentralAppointmentsManager } from "@/components/CentralAppointmentsManager";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { type Property, type Client } from "@shared/schema";

export default function ManagePage() {
  const { user, setUser } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [section, setSection] = useState("agent-profile");
  
  // Estados para la gestión de propiedades y clientes
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isRequestingReview, setIsRequestingReview] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Estados para los campos de perfil de agente
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [description, setDescription] = useState("");
  const [influenceNeighborhoods, setInfluenceNeighborhoods] = useState<string[]>([]);
  
  // Estados para los campos de perfil de agencia
  const [agencyName, setAgencyName] = useState("");
  const [agencyAddress, setAgencyAddress] = useState("");
  const [agencyDescription, setAgencyDescription] = useState("");
  const [agencyPhone, setAgencyPhone] = useState("");
  const [agencyWebsite, setAgencyWebsite] = useState("");
  const [agencyInfluenceNeighborhoods, setAgencyInfluenceNeighborhoods] = useState<string[]>([]);
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  
  // Estado para mostrar indicador de guardado exitoso
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  
  // Cargar valores iniciales cuando el usuario cambia
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setSurname(user.surname || "");
      setDescription(user.description || "");
      setInfluenceNeighborhoods(user.influenceNeighborhoods || []);
      setAgencyName(user.agencyName || "");
      setAgencyAddress(user.agencyAddress || "");
      setAgencyDescription(user.agencyDescription || "");
      setAgencyPhone(user.agencyPhone || "");
      setAgencyWebsite(user.agencyWebsite || "");
      setAgencyInfluenceNeighborhoods(user.agencyInfluenceNeighborhoods || []);
      
      // Cargar redes sociales si existen
      const socialMedia = user.agencySocialMedia as Record<string, string> | undefined;
      if (socialMedia) {
        setFacebookUrl(socialMedia.facebook || "");
        setInstagramUrl(socialMedia.instagram || "");
        setTwitterUrl(socialMedia.twitter || "");
        setLinkedinUrl(socialMedia.linkedin || "");
      }
    }
  }, [user]);

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
    enabled: section === 'clients' && Boolean(user?.id),
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

  // Redireccionar si el usuario no está autenticado
  if (!user) {
    return <Redirect to="/" />;
  }
  
  return (
    <div className="min-h-screen flex">
      <SidebarProvider>
        <Sidebar className="pt-16 w-64 border-r">
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={section === "agent-profile"}
                  onClick={() => setSection("agent-profile")}
                >
                  <UserCircle className="h-4 w-4" />
                  <span>Mi perfil de agente</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={section === "agency-profile"}
                  onClick={() => setSection("agency-profile")}
                >
                  <Building className="h-4 w-4" />
                  <span>Perfil agencia</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={section === "properties"}
                  onClick={() => setSection("properties")}
                >
                  <Building2 className="h-4 w-4" />
                  <span>Gestionar propiedades</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={section === "clients" || section === "appointments"}
                  onClick={() => setSection("clients")}
                >
                  <Users className="h-4 w-4" />
                  <span>CRM clientes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem className="ml-6">
                <SidebarMenuButton
                  isActive={section === "clients"}
                  onClick={() => setSection("clients")}
                >
                  <UserCircle className="h-4 w-4" />
                  <span>Clientes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem className="ml-6">
                <SidebarMenuButton
                  isActive={section === "appointments"}
                  onClick={() => setSection("appointments")}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Citas</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={section === "reviews"}
                  onClick={() => setSection("reviews")}
                >
                  <Star className="h-4 w-4" />
                  <span>Gestionar reseñas</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={section === "messages"}
                  onClick={() => setSection("messages")}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Mensajes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 p-6 pt-20">
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
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="surname">Apellidos</Label>
                  <Input 
                    id="surname" 
                    placeholder="Tus apellidos" 
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción pública</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Escribe una breve descripción sobre ti que verán tus clientes"
                    className="min-h-[100px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="w-full">
                  <Label htmlFor="influence-neighborhoods">Barrios de influencia</Label>
                  <div className="mt-1">
                    <NeighborhoodSelector
                      selectedNeighborhoods={influenceNeighborhoods}
                      onChange={setInfluenceNeighborhoods}
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
                    influenceNeighborhoods
                  })}
                  disabled={updateProfileMutation.isPending}
                >
                  {showSavedIndicator && (
                    <CheckCircle className="w-4 h-4 absolute -left-6 text-green-500" />
                  )}
                  Guardar cambios
                </Button>
              </div>
            </div>
          )}

          {section === "agency-profile" && (
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
                    onChange={(e) => setAgencyName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="agency-address">Dirección completa de la agencia</Label>
                  <Input 
                    id="agency-address" 
                    placeholder="Dirección física completa" 
                    value={agencyAddress}
                    onChange={(e) => setAgencyAddress(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="agency-description">Descripción pública</Label>
                  <Textarea 
                    id="agency-description" 
                    placeholder="Describe tu agencia inmobiliaria a clientes potenciales"
                    className="min-h-[120px]"
                    value={agencyDescription}
                    onChange={(e) => setAgencyDescription(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="agency-phone">Número de teléfono</Label>
                  <Input 
                    id="agency-phone" 
                    placeholder="Teléfono de contacto" 
                    value={agencyPhone}
                    onChange={(e) => setAgencyPhone(e.target.value)}
                  />
                </div>
                <div className="w-full">
                  <Label htmlFor="agency-influence-neighborhoods">Barrios de influencia</Label>
                  <div className="mt-1">
                    <NeighborhoodSelector
                      selectedNeighborhoods={agencyInfluenceNeighborhoods}
                      onChange={setAgencyInfluenceNeighborhoods}
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
                    <AgencyAgentsList hideAddButton={true} />
                  </div>
                )}

                <div>
                  <Label htmlFor="agency-website">Sitio web</Label>
                  <Input 
                    id="agency-website" 
                    placeholder="URL de tu sitio web (con https://)" 
                    value={agencyWebsite}
                    onChange={(e) => setAgencyWebsite(e.target.value)}
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
                        onChange={(e) => setFacebookUrl(e.target.value)}
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
                        onChange={(e) => setInstagramUrl(e.target.value)}
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
                        onChange={(e) => setTwitterUrl(e.target.value)}
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
                        onChange={(e) => setLinkedinUrl(e.target.value)}
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
                    agencySocialMedia: {
                      facebook: facebookUrl,
                      instagram: instagramUrl,
                      twitter: twitterUrl,
                      linkedin: linkedinUrl
                    }
                  })}
                  disabled={updateProfileMutation.isPending}
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
                    title: editingProperty.title,
                    description: editingProperty.description,
                    price: editingProperty.price,
                    address: editingProperty.address,
                    size: editingProperty.size,
                    bedrooms: editingProperty.bedrooms,
                    bathrooms: editingProperty.bathrooms,
                    images: editingProperty.images || [],
                    propertyType: editingProperty.propertyType,
                    neighborhood: editingProperty.neighborhood,
                    reference: editingProperty.reference,
                    operationType: editingProperty.operationType,
                    features: editingProperty.features || [],
                    status: editingProperty.status || "disponible"
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
                              <p className="text-sm text-gray-500 truncate">{property.address}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-lg">{property.price?.toLocaleString('es-ES')}{property.operationType === 'alquiler' ? '€/mes' : '€'}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-4 mt-2 text-sm text-gray-500">
                            {property.size && (
                              <div>{property.size} m²</div>
                            )}
                            {property.bedrooms && (
                              <div>{property.bedrooms} hab.</div>
                            )}
                            {property.bathrooms && (
                              <div>{property.bathrooms} baños</div>
                            )}
                          </div>
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
                          setEditingClient(client);
                          setIsAddingClient(false);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-medium">{client.name}</h3>
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
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsRequestingReview(true);
                            }}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Solicitar reseña
                          </Button>
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
              <h2 className="text-2xl font-bold mb-6">Gestión de Reseñas</h2>
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <Star className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Funcionalidad en desarrollo</h3>
                <p className="mt-1 text-gray-500">
                  Esta sección estará disponible próximamente.
                </p>
              </div>
            </div>
          )}
          
          {section === "messages" && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Gestión de Mensajes</h2>
              <InquiriesList />
            </div>
          )}
          
          {section === "appointments" && (
            <div className="max-w-4xl mx-auto">
              <CentralAppointmentsManager />
            </div>
          )}
        </main>
      </SidebarProvider>
    </div>
  );
}