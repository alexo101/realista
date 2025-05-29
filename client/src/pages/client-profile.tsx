import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Mail, Phone, MapPin, Building, Euro, User, MessageSquare, Star } from "lucide-react";

// Tipos para los datos del cliente
interface FavoriteAgent {
  id: number;
  name: string;
  surname: string;
  email: string;
  avatar?: string;
  description?: string;
  influenceNeighborhoods?: string[];
  yearsOfExperience?: number;
}

interface FavoriteProperty {
  id: number;
  title: string;
  address: string;
  price: number;
  operationType: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  superficie?: number;
  images?: string[];
  mainImageIndex?: number;
  neighborhood: string;
}

interface Message {
  id: number;
  fromName: string;
  fromType: 'agent' | 'agency';
  subject: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export default function ClientProfilePage() {
  // Estados para los datos del cliente
  const [favoriteAgents] = useState<FavoriteAgent[]>([]);
  const [favoriteProperties] = useState<FavoriteProperty[]>([]);
  const [messages] = useState<Message[]>([]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header del perfil */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" alt="Cliente" />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
              <p className="text-gray-600">Gestiona tus favoritos y mensajes</p>
            </div>
          </div>
        </div>

        {/* Tabs principales */}
        <Tabs defaultValue="agents" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Agentes favoritos
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Propiedades favoritas
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensajes
            </TabsTrigger>
          </TabsList>

          {/* Agentes favoritos */}
          <TabsContent value="agents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Agentes favoritos</CardTitle>
                <CardDescription>
                  Aquí aparecerán los agentes que hayas marcado como favoritos
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
                      Explora nuestra lista de agentes y marca como favoritos a los que más te interesen
                    </p>
                    <Button>
                      Buscar agentes
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {favoriteAgents.map((agent) => (
                      <Card key={agent.id} className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={agent.avatar} alt={agent.name} />
                            <AvatarFallback>
                              {agent.name?.[0]}{agent.surname?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold">
                                  {agent.name} {agent.surname}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  {agent.description}
                                </p>
                                {agent.yearsOfExperience && (
                                  <Badge variant="secondary" className="mb-2">
                                    {agent.yearsOfExperience} años de experiencia
                                  </Badge>
                                )}
                                {agent.influenceNeighborhoods && agent.influenceNeighborhoods.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {agent.influenceNeighborhoods.slice(0, 3).map((neighborhood, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {neighborhood}
                                      </Badge>
                                    ))}
                                    {agent.influenceNeighborhoods.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{agent.influenceNeighborhoods.length - 3} más
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  <Mail className="h-4 w-4 mr-1" />
                                  Contactar
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Heart className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Propiedades favoritas */}
          <TabsContent value="properties" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Propiedades favoritas</CardTitle>
                <CardDescription>
                  Aquí aparecerán las propiedades que hayas marcado como favoritas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {favoriteProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tienes propiedades favoritas
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Explora nuestro catálogo de propiedades y marca como favoritas las que más te interesen
                    </p>
                    <Button>
                      Buscar propiedades
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {favoriteProperties.map((property) => (
                      <Card key={property.id} className="overflow-hidden">
                        <div className="aspect-video bg-gray-200 relative">
                          {property.images && property.images.length > 0 ? (
                            <img
                              src={property.images[property.mainImageIndex || 0]}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Building className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            className="absolute top-2 right-2"
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline">{property.operationType}</Badge>
                            <p className="font-bold text-lg">
                              {property.price.toLocaleString()}€
                            </p>
                          </div>
                          <h4 className="font-semibold mb-1">{property.title}</h4>
                          <p className="text-sm text-gray-600 mb-2 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {property.address}
                          </p>
                          <div className="flex gap-4 text-sm text-gray-600">
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mensajes */}
          <TabsContent value="messages" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Mensajes</CardTitle>
                <CardDescription>
                  Comunicaciones con agentes y agencias
                </CardDescription>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tienes mensajes
                    </h3>
                    <p className="text-gray-500">
                      Aquí aparecerán los mensajes de agentes y agencias
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <Card key={message.id} className={`p-4 ${!message.isRead ? 'border-blue-200 bg-blue-50' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {message.fromName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{message.fromName}</p>
                              <p className="text-xs text-gray-500">
                                {message.fromType === 'agent' ? 'Agente' : 'Agencia'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {new Date(message.createdAt).toLocaleDateString()}
                            </p>
                            {!message.isRead && (
                              <Badge variant="default" className="text-xs">
                                Nuevo
                              </Badge>
                            )}
                          </div>
                        </div>
                        <h4 className="font-semibold mb-2">{message.subject}</h4>
                        <p className="text-gray-700 text-sm">{message.content}</p>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline">
                            Responder
                          </Button>
                          <Button size="sm" variant="ghost">
                            Marcar como leído
                          </Button>
                        </div>
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