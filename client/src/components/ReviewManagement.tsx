import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Star,
  MapPin,
  Building,
  User,
  Check,
  Home,
  Calendar,
  ChevronDown,
  ChevronUp,
  Pin,
  Send,
  Mail,
  Phone,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Definimos la estructura de una reseña
interface Review {
  id: number;
  targetId: number;
  targetType: 'agent' | 'agency';
  propertyId?: number;
  verified: boolean;
  pinned: boolean;
  comment: string;
  agentResponse?: string;
  responseDate?: string;
  areaKnowledge: number;
  priceNegotiation: number;
  treatment: number;
  punctuality: number;
  propertyKnowledge: number;
  rating: number;
  author?: string;
  date: string;
  // Campos adicionales para mostrar en el frontend
  targetName?: string;
  targetAvatar?: string;
  propertyTitle?: string;
  propertyAddress?: string;
}

// Definimos la estructura de un cliente elegible para solicitar reseña
interface EligibleClient {
  id: number;
  uuid: string;
  name: string;
  surname?: string;
  email: string;
  phone: string;
  source?: string;
  createdAt: string;
  reviewRequestSentAt?: string;
  reviewStatus?: 'enviada' | 'realizada' | 'abandonada' | null;
}

const ReviewStatusBadge = ({ status }: { status?: 'enviada' | 'realizada' | 'abandonada' | null }) => {
  if (!status) return <span className="text-xs text-gray-400">--</span>;
  
  const config = {
    enviada: { label: 'Enviada', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    realizada: { label: 'Realizada', className: 'bg-green-100 text-green-700 border-green-200' },
    abandonada: { label: 'Abandonada', className: 'bg-red-100 text-red-700 border-red-200' },
  };
  
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
};

// Componente para mostrar las estrellas de calificación
const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center text-yellow-500">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="h-4 w-4 fill-current" />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <Star className="h-4 w-4" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className="h-4 w-4 fill-current" />
          </div>
        </div>
      )}
      {Array.from({ length: 5 - fullStars - (hasHalfStar ? 1 : 0) }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-4 w-4" />
      ))}
      <span className="ml-1 text-sm text-gray-700">{typeof rating === 'number' ? rating.toFixed(1) : rating}</span>
    </div>
  );
};

// Componente para responder a una reseña
const ReviewResponseDialog = ({ 
  review, 
  isOpen, 
  onClose,
  onSubmit
}: { 
  review: Review; 
  isOpen: boolean; 
  onClose: () => void;
  onSubmit: (id: number, response: string) => void;
}) => {
  const [response, setResponse] = useState(review.agentResponse || "");

  const handleSubmit = () => {
    onSubmit(review.id, response);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Responder a la reseña</DialogTitle>
          <DialogDescription className="text-sm">
            Tu respuesta será visible públicamente en el perfil.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2 md:py-4">
          <div className="mb-4 p-3 md:p-4 bg-gray-50 rounded-md">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center mb-2">
              <StarRating rating={review.rating} />
              <span className="text-xs sm:text-sm text-gray-500 sm:ml-2">
                por {review.author || "Cliente anónimo"} • {new Date(review.date).toLocaleDateString('es-ES')}
              </span>
            </div>
            <p className="text-gray-700 text-sm md:text-base">{review.comment}</p>
          </div>
          
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Escribe tu respuesta a esta reseña..."
            className="min-h-[100px] text-sm md:text-base"
          />
        </div>
        
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!response.trim()} className="w-full sm:w-auto">
            {review.agentResponse ? "Actualizar respuesta" : "Publicar respuesta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Componente para mostrar los detalles de una reseña
const ReviewDetails = ({ 
  review, 
  onRespond,
  onPin 
}: { 
  review: Review; 
  onRespond: (review: Review) => void;
  onPin: (review: Review) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-start">
          <div className="flex items-start gap-2">
            <div className="rounded-full bg-gray-100 p-2 shrink-0">
              {review.targetType === 'agent' ? (
                <User className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
              ) : (
                <Building className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
              )}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base md:text-lg break-words">
                Reseña para {review.targetName || `${review.targetType === 'agent' ? 'Agente' : 'Agencia'} #${review.targetId}`}
              </CardTitle>
              <CardDescription className="text-sm">
                {review.author || "Cliente anónimo"} • {new Date(review.date).toLocaleDateString('es-ES')}
              </CardDescription>
            </div>
          </div>
          <div className="ml-9 md:ml-0">
            <StarRating rating={review.rating} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="space-y-2">
          {review.comment && (
            <div>
              <p className="text-gray-700 text-sm md:text-base">{review.comment}</p>
            </div>
          )}
          
          {review.agentResponse && (
            <div className="mt-3 pl-4 border-l-2 border-primary">
              <p className="text-sm font-medium text-primary">Tu respuesta:</p>
              <p className="text-gray-700 text-sm md:text-base">{review.agentResponse}</p>
              <p className="text-xs text-gray-500 mt-1">
                {review.responseDate && new Date(review.responseDate).toLocaleDateString('es-ES')}
              </p>
            </div>
          )}
          
          {expanded && (
            <>
              <Separator className="my-2" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="font-medium">Conocimiento del área</p>
                  <StarRating rating={review.areaKnowledge} />
                </div>
                <div>
                  <p className="font-medium">Negociación de precios</p>
                  <StarRating rating={review.priceNegotiation} />
                </div>
                <div>
                  <p className="font-medium">Trato personal</p>
                  <StarRating rating={review.treatment} />
                </div>
                <div>
                  <p className="font-medium">Puntualidad</p>
                  <StarRating rating={review.punctuality} />
                </div>
                <div>
                  <p className="font-medium">Conocimiento de propiedades</p>
                  <StarRating rating={review.propertyKnowledge} />
                </div>
              </div>
              
              {review.propertyTitle && (
                <div className="flex items-start mt-2 text-sm">
                  <Home className="h-4 w-4 mr-2 text-gray-500 shrink-0 mt-0.5" />
                  <span className="break-words">
                    <span className="font-medium">Propiedad: </span>
                    {review.propertyTitle}
                    {review.propertyAddress && ` - ${review.propertyAddress}`}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-3 pt-2 md:flex-row md:justify-between">
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="w-full md:w-auto">
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" /> Menos detalles
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" /> Más detalles
            </>
          )}
        </Button>
        
        <div className="flex flex-wrap gap-2 justify-center md:justify-end w-full md:w-auto">
          {review.verified ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    <Check className="h-3 w-3 mr-1" /> Verificada
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Esta reseña ha sido verificada</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
          
          {review.pinned ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                    <Pin className="h-3 w-3 mr-1" /> Destacada
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Esta reseña está destacada</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={review.pinned ? "default" : "outline"}
                  onClick={() => onPin(review)}
                  className="text-xs md:text-sm"
                >
                  <Pin className={`h-4 w-4 mr-1 ${review.pinned ? 'text-white' : ''}`} />
                  <span className="hidden sm:inline">{review.pinned ? "Quitar destaque" : "Destacar"}</span>
                  <span className="sm:hidden">{review.pinned ? "Quitar" : "Destacar"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{review.pinned ? "Quitar reseña destacada" : "Mostrar esta reseña como pública en el perfil del agente"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            size="sm"
            variant={review.agentResponse ? "outline" : "default"}
            onClick={() => onRespond(review)}
            className="text-xs md:text-sm"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{review.agentResponse ? "Editar respuesta" : "Responder"}</span>
            <span className="sm:hidden">{review.agentResponse ? "Editar" : "Responder"}</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export function ReviewManagement({ userId, userType }: { userId: number, userType: string }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'reviews' | 'request'>('reviews');
  const [reviewFilterTab, setReviewFilterTab] = useState<'all' | 'agent' | 'agency'>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [sendingRequestTo, setSendingRequestTo] = useState<number | null>(null);
  const [reviewConfirmClient, setReviewConfirmClient] = useState<{id: number, name: string} | null>(null);
  
  // Consulta para obtener las reseñas
  const {
    data: reviews = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["/api/reviews/manage", userId],
    queryFn: async () => {
      const response = await fetch(`/api/reviews/manage?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Error al cargar las reseñas");
      }
      return response.json();
    },
  });
  
  // Consulta para obtener clientes elegibles para solicitar reseña
  const {
    data: eligibleClients = [],
    isLoading: clientsLoading,
  } = useQuery<EligibleClient[]>({
    queryKey: ["/api/agents", userId, "clients"],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${userId}/clients`);
      if (!response.ok) {
        throw new Error("Error al cargar los clientes");
      }
      return response.json();
    },
  });
  
  // Mutación para enviar solicitud de reseña
  const sendReviewRequestMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const client = eligibleClients.find(c => c.id === clientId);
      if (!client) throw new Error("Cliente no encontrado");
      
      return apiRequest("POST", `/api/agents/${userId}/review-request`, {
        clientEmail: client.email,
        clientName: `${client.name} ${client.surname || ''}`.trim(),
        clientId: client.id
      });
    },
    onSuccess: (_, clientId) => {
      toast({
        title: "Solicitud enviada",
        description: "Se ha enviado una solicitud de reseña al cliente.",
      });
      setSendingRequestTo(null);
      queryClient.invalidateQueries({ queryKey: ["/api/agents", userId, "clients"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message?.replace(/^\d+:\s*/, '') || "No se pudo enviar la solicitud",
        variant: "destructive",
      });
      setSendingRequestTo(null);
    },
  });
  
  // Mutación para responder a una reseña
  const respondMutation = useMutation({
    mutationFn: async ({ id, response }: { id: number; response: string }) => {
      const res = await fetch(`/api/reviews/${id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });
      
      if (!res.ok) {
        throw new Error("Error al guardar la respuesta");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/manage", userId] });
      toast({
        title: "Respuesta guardada",
        description: "Tu respuesta ha sido publicada correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo guardar la respuesta: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutación para destacar/quitar destaque de una reseña
  const pinMutation = useMutation({
    mutationFn: async ({ id, pinned }: { id: number; pinned: boolean }) => {
      const res = await fetch(`/api/reviews/${id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned }),
      });
      
      if (!res.ok) {
        throw new Error("Error al actualizar el estado de la reseña");
      }
      
      return res.json();
    },
    onSuccess: (_, { pinned }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/manage", userId] });
      toast({
        title: pinned ? "Reseña destacada" : "Destaque removido",
        description: pinned ? "La reseña ahora aparece como destacada." : "La reseña ya no está destacada.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar la reseña: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Filtrar reseñas según la pestaña activa
  const filteredReviews = reviews.filter((review: Review) => {
    if (reviewFilterTab === 'all') return true;
    return review.targetType === reviewFilterTab;
  });
  
  // Handler para abrir confirmación de solicitud de reseña
  const handleOpenReviewConfirm = (clientId: number, clientName: string) => {
    setReviewConfirmClient({ id: clientId, name: clientName });
  };

  // Handler para enviar solicitud de reseña (después de confirmar)
  const handleConfirmReviewRequest = () => {
    if (reviewConfirmClient) {
      setSendingRequestTo(reviewConfirmClient.id);
      sendReviewRequestMutation.mutate(reviewConfirmClient.id, {
        onSettled: () => {
          setReviewConfirmClient(null);
        }
      });
    }
  };
  
  // Traducir el source a español
  const getSourceLabel = (source?: string) => {
    switch (source) {
      case "property_inquiry": return "Consulta de propiedad";
      case "agent_contact": return "Contacto directo";
      case "agency_contact": return "Contacto con agencia";
      case "manual": return "Añadido manualmente";
      default: return "Origen desconocido";
    }
  };
  
  // Handler para abrir el diálogo de respuesta
  const handleRespond = (review: Review) => {
    setSelectedReview(review);
    setIsResponseDialogOpen(true);
  };
  
  // Handler para enviar la respuesta
  const handleSubmitResponse = (id: number, response: string) => {
    respondMutation.mutate({ id, response });
  };

  // Handler para destacar/quitar destaque de una reseña
  const handlePin = (review: Review) => {
    pinMutation.mutate({ id: review.id, pinned: !review.pinned });
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-60 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-60 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isError) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-500">Error</CardTitle>
          <CardDescription>
            No se pudieron cargar las reseñas. Por favor, inténtalo de nuevo más tarde.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/reviews/manage", userId] })}
          >
            Reintentar
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl md:text-2xl font-bold">Gestión de Reseñas</h2>
        
        {/* Main tabs: Received reviews vs Request reviews */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'reviews' | 'request')}>
          <TabsList className="grid w-full grid-cols-2 md:max-w-md">
            <TabsTrigger value="reviews" data-testid="tab-reviews-received" className="text-xs sm:text-sm">
              <Star className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Reseñas recibidas</span>
              <span className="sm:hidden">Reseñas</span>
              <span className="ml-1">({reviews.length})</span>
            </TabsTrigger>
            <TabsTrigger value="request" data-testid="tab-request-reviews" className="text-xs sm:text-sm">
              <Send className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Solicitar reseñas</span>
              <span className="sm:hidden">Solicitar</span>
              <span className="ml-1">({eligibleClients.length})</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="reviews" className="mt-4">
            {/* Filter tabs for reviews */}
            <div className="flex justify-center md:justify-end mb-4">
              <Tabs value={reviewFilterTab} onValueChange={(value) => setReviewFilterTab(value as any)}>
                <TabsList className="grid grid-cols-3 w-full md:w-auto">
                  <TabsTrigger value="all" className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">Todas</span>
                    <span className="sm:hidden">Todo</span>
                    <span className="ml-1">({reviews.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="agent" className="text-xs sm:text-sm">
                    Agente ({reviews.filter((r: Review) => r.targetType === 'agent').length})
                  </TabsTrigger>
                  <TabsTrigger value="agency" className="text-xs sm:text-sm">
                    Agencia ({reviews.filter((r: Review) => r.targetType === 'agency').length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {filteredReviews.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No hay reseñas todavía</CardTitle>
                  <CardDescription>
                    {reviewFilterTab === 'all'
                      ? 'Aún no has recibido ninguna reseña.'
                      : `Aún no has recibido reseñas como ${reviewFilterTab === 'agent' ? 'agente' : 'agencia'}.`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">
                    Las reseñas de clientes aparecerán aquí cuando las recibas. 
                    Puedes solicitar reseñas a tus clientes en la pestaña "Solicitar reseñas".
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredReviews.map((review: Review) => (
                  <ReviewDetails
                    key={review.id}
                    review={review}
                    onRespond={handleRespond}
                    onPin={handlePin}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="request" className="mt-4">
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Users className="h-5 w-5" />
                  <span className="hidden sm:inline">Clientes disponibles para solicitar reseña</span>
                  <span className="sm:hidden">Clientes disponibles</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  <span className="hidden sm:inline">Estos son tus clientes que han contactado contigo. Puedes enviarles una solicitud de reseña por email.</span>
                  <span className="sm:hidden">Envía solicitudes de reseña a tus clientes.</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientsLoading ? (
                  <div className="space-y-2">
                    <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : eligibleClients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">No tienes clientes todavía</p>
                    <p className="text-sm mt-1">
                      Los clientes que te contacten o hagan consultas aparecerán aquí automáticamente.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile card view */}
                    <div className="block md:hidden space-y-3">
                      {eligibleClients.map((client: EligibleClient) => (
                        <Card key={client.id} className="p-4" data-testid={`card-client-${client.id}`}>
                          <div className="flex items-start gap-3">
                            <div className="rounded-full bg-gray-100 p-2 shrink-0">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{client.name} {client.surname || ''}</p>
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(client.createdAt).toLocaleDateString('es-ES')}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {getSourceLabel(client.source)}
                            </Badge>
                          </div>
                          
                          <div className="mt-3 space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{client.email}</span>
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-2">
                            <ReviewStatusBadge status={client.reviewStatus} />
                          </div>
                          
                          <Button
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => handleOpenReviewConfirm(client.id, `${client.name} ${client.surname || ''}`.trim())}
                            disabled={sendingRequestTo === client.id}
                            data-testid={`button-request-review-mobile-${client.id}`}
                          >
                            {sendingRequestTo === client.id ? (
                              <>
                                <span className="animate-spin mr-2">⏳</span>
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-1" />
                                Solicitar reseña
                              </>
                            )}
                          </Button>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Desktop table view */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Contacto</TableHead>
                            <TableHead>Origen</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {eligibleClients.map((client: EligibleClient) => (
                            <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="rounded-full bg-gray-100 p-2">
                                    <User className="h-4 w-4 text-gray-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{client.name} {client.surname || ''}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {client.email}
                                  </span>
                                  {client.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {client.phone}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {getSourceLabel(client.source)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {new Date(client.createdAt).toLocaleDateString('es-ES')}
                              </TableCell>
                              <TableCell>
                                <ReviewStatusBadge status={client.reviewStatus} />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenReviewConfirm(client.id, `${client.name} ${client.surname || ''}`.trim())}
                                  disabled={sendingRequestTo === client.id}
                                  data-testid={`button-request-review-${client.id}`}
                                >
                                  {sendingRequestTo === client.id ? (
                                    <>
                                      <span className="animate-spin mr-2">⏳</span>
                                      Enviando...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-4 w-4 mr-1" />
                                      Solicitar reseña
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {selectedReview && (
        <ReviewResponseDialog
          review={selectedReview}
          isOpen={isResponseDialogOpen}
          onClose={() => setIsResponseDialogOpen(false)}
          onSubmit={handleSubmitResponse}
        />
      )}

      <Dialog open={reviewConfirmClient !== null} onOpenChange={(open) => !open && !sendReviewRequestMutation.isPending && setReviewConfirmClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar solicitud de reseña</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres solicitar una reseña a {reviewConfirmClient?.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setReviewConfirmClient(null)}
              disabled={sendReviewRequestMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmReviewRequest}
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