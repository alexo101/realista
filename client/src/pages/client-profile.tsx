import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, User, Home, Mail, Phone, Star, MapPin, Calendar } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { useLocation } from "wouter";

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

interface Message {
  id: number;
  fromAgent: {
    id: number;
    name: string;
    surname: string;
    avatar?: string;
  };
  subject: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export default function ClientProfile() {
  const { user } = useUser();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("agents");

  // Redirect if not logged in or not a client
  useEffect(() => {
    if (!user || !user.isClient) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user || !user.isClient) {
    return null;
  }

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
    enabled: !!user?.isClient
  });

  // Mock data for demonstration - replace with actual API calls
  const favoriteProperties: FavoriteProperty[] = [];
  const messages: Message[] = [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Agentes favoritos
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Propiedades favoritas
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Mensajes
            </TabsTrigger>
          </TabsList>

          {/* Agentes favoritos */}
          <TabsContent value="agents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Agentes favoritos
                </CardTitle>
                <CardDescription>
                  Agentes inmobiliarios que has marcado como favoritos
                </CardDescription>
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
          </TabsContent>

          {/* Propiedades favoritas */}
          <TabsContent value="properties" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-500" />
                  Propiedades favoritas
                </CardTitle>
                <CardDescription>
                  Propiedades que has guardado para revisar más tarde
                </CardDescription>
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
          </TabsContent>

          {/* Mensajes */}
          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  Mensajes
                </CardTitle>
                <CardDescription>
                  Conversaciones con agentes inmobiliarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tienes mensajes
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Los mensajes de los agentes aparecerán aquí cuando te contacten
                    </p>
                    <Button onClick={() => navigate("/search/agents")}>
                      Contactar agentes
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <Card key={message.id} className={`${!message.isRead ? 'border-primary' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={message.fromAgent.avatar} />
                              <AvatarFallback>
                                {message.fromAgent.name?.[0]}{message.fromAgent.surname?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-gray-900">
                                  {message.fromAgent.name} {message.fromAgent.surname}
                                </h3>
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(message.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h4 className="font-medium text-gray-800 mb-2">
                                {message.subject}
                              </h4>
                              <p className="text-gray-600 line-clamp-3">
                                {message.content}
                              </p>
                              {!message.isRead && (
                                <Badge className="mt-2">Nuevo</Badge>
                              )}
                              <Button size="sm" className="mt-3">
                                Responder
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}