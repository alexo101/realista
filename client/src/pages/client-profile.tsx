import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Heart, MessageCircle, User, Home, Mail, Phone, Star, MapPin, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { useLocation, Redirect } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ClientConversationalMessages } from "@/components/ClientConversationalMessages";

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


export default function ClientProfile() {
  const { user } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [section, setSection] = useState("profile");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect if not logged in or not a client
  useEffect(() => {
    if (!user || !user.isClient) {
      navigate("/login");
    }
  }, [user, navigate]);

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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  Información Personal
                </CardTitle>
                <CardDescription>
                  Tu información básica de cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-lg">
                      {user.name?.[0] || user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{user.name || "Cliente"}</h3>
                    <p className="text-gray-600 flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </p>
                    {user.phone && (
                      <p className="text-gray-600 flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {user.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Miembro desde:</p>
                  <p className="font-medium">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Fecha no disponible"}
                  </p>
                </div>
              </CardContent>
            </Card>
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