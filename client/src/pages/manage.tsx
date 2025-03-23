import { useState } from "react";
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
import { Building2, Users, Star, UserCircle } from "lucide-react";
import { PropertyForm } from "@/components/PropertyForm";
import { ClientForm } from "@/components/ClientForm";
import { ReviewRequestForm } from "@/components/ReviewRequestForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { type Property, type Client } from "@shared/schema";

export default function ManagePage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [section, setSection] = useState("properties");
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isRequestingReview, setIsRequestingReview] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

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

  // Redirect non-agent users
  if (!user?.isAgent) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex">
      <SidebarProvider>
        <Sidebar className="pt-16 w-64 border-r">
          <SidebarContent>
            <div className="p-4 border-b">
              <h2 className="font-semibold mb-4">Mi perfil</h2>
              <div className="space-y-4">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-gray-100 mb-2 flex items-center justify-center">
                    <UserCircle className="w-12 h-12 text-gray-400" />
                  </div>
                  <Label htmlFor="picture" className="cursor-pointer text-sm text-primary">
                    Cambiar foto
                  </Label>
                  <Input
                    id="picture"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      // Handle profile picture upload
                      const file = e.target.files?.[0];
                      if (file) {
                        // TODO: Implement profile picture upload
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <SidebarMenu>
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
                  isActive={section === "clients"}
                  onClick={() => setSection("clients")}
                >
                  <Users className="h-4 w-4" />
                  <span>CRM clientes</span>
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
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 p-6 pt-20">
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
                  initialData={editingProperty || undefined}
                  isEditing={!!editingProperty}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isLoadingProperties ? (
                    Array(6).fill(0).map((_, i) => (
                      <div key={i} className="bg-gray-100 animate-pulse h-48 rounded-lg" />
                    ))
                  ) : properties?.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">Sin propiedades</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Empieza añadiendo una nueva propiedad.
                      </p>
                    </div>
                  ) : (
                    properties?.map((property) => (
                      <div 
                        key={property.id} 
                        className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setEditingProperty(property)}
                      >
                        <p className="font-medium">{property.address}</p>
                        <p className="text-sm text-gray-600">{property.type}</p>
                        <p className="text-primary font-semibold mt-2">{property.price}€</p>
                        <p className="text-sm text-gray-500 mt-1">{property.neighborhood}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          {section === "clients" && (
            <div className="space-y-4">
              <Button 
                onClick={() => {
                  setIsAddingClient(true);
                  setEditingClient(null);
                }} 
                size="lg"
              >
                Añadir cliente
              </Button>

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
                  initialData={editingClient || undefined}
                  isEditing={!!editingClient}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isLoadingClients ? (
                    Array(6).fill(0).map((_, i) => (
                      <div key={i} className="bg-gray-100 animate-pulse h-48 rounded-lg" />
                    ))
                  ) : clients?.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">Sin clientes</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Empieza añadiendo un nuevo cliente.
                      </p>
                    </div>
                  ) : (
                    clients?.map((client) => (
                      <div 
                        key={client.id} 
                        className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setEditingClient(client)}
                      >
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-gray-600">{client.email}</p>
                        <p className="text-sm text-gray-600">{client.phone}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          {section === "reviews" && (
            <div className="space-y-4">
              <Button onClick={() => setIsRequestingReview(true)} size="lg">
                Solicitar reseña
              </Button>

              {isRequestingReview ? (
                <ReviewRequestForm onClose={() => setIsRequestingReview(false)} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Reviews grid will go here */}
                </div>
              )}
            </div>
          )}
        </main>
      </SidebarProvider>
    </div>
  );
}