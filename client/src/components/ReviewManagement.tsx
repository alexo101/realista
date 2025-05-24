import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
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
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Responder a la reseña</DialogTitle>
          <DialogDescription>
            Tu respuesta será visible públicamente en el perfil.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4 p-4 bg-gray-50 rounded-md">
            <div className="flex items-center mb-2">
              <StarRating rating={review.rating} />
              <span className="ml-2 text-sm text-gray-500">
                por {review.author || "Cliente anónimo"} • {new Date(review.date).toLocaleDateString('es-ES')}
              </span>
            </div>
            <p className="text-gray-700">{review.comment}</p>
          </div>
          
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Escribe tu respuesta a esta reseña..."
            className="min-h-[100px]"
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!response.trim()}>
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
  onRespond 
}: { 
  review: Review; 
  onRespond: (review: Review) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2">
            <div className="rounded-full bg-gray-100 p-2">
              {review.targetType === 'agent' ? (
                <User className="h-6 w-6 text-gray-600" />
              ) : (
                <Building className="h-6 w-6 text-gray-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">
                Reseña para {review.targetName || `${review.targetType === 'agent' ? 'Agente' : 'Agencia'} #${review.targetId}`}
              </CardTitle>
              <CardDescription>
                {review.author || "Cliente anónimo"} • {new Date(review.date).toLocaleDateString('es-ES')}
              </CardDescription>
            </div>
          </div>
          <StarRating rating={review.rating} />
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="space-y-2">
          {review.comment && (
            <div>
              <p className="text-gray-700">{review.comment}</p>
            </div>
          )}
          
          {review.agentResponse && (
            <div className="mt-3 pl-4 border-l-2 border-primary">
              <p className="text-sm font-medium text-primary">Tu respuesta:</p>
              <p className="text-gray-700">{review.agentResponse}</p>
              <p className="text-xs text-gray-500 mt-1">
                {review.responseDate && new Date(review.responseDate).toLocaleDateString('es-ES')}
              </p>
            </div>
          )}
          
          {expanded && (
            <>
              <Separator className="my-2" />
              <div className="grid grid-cols-2 gap-2 text-sm">
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
                <div className="flex items-center mt-2 text-sm">
                  <Home className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
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
      
      <CardFooter className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
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
        
        <div className="flex gap-2">
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
          
          <Button
            size="sm"
            variant={review.agentResponse ? "outline" : "default"}
            onClick={() => onRespond(review)}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            {review.agentResponse ? "Editar respuesta" : "Responder"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export function ReviewManagement({ userId, userType }: { userId: number, userType: string }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'agent' | 'agency'>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  
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
  
  // Filtrar reseñas según la pestaña activa
  const filteredReviews = reviews.filter((review: Review) => {
    if (activeTab === 'all') return true;
    return review.targetType === activeTab;
  });
  
  // Handler para abrir el diálogo de respuesta
  const handleRespond = (review: Review) => {
    setSelectedReview(review);
    setIsResponseDialogOpen(true);
  };
  
  // Handler para enviar la respuesta
  const handleSubmitResponse = (id: number, response: string) => {
    respondMutation.mutate({ id, response });
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Reseñas</h2>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList>
            <TabsTrigger value="all">
              Todas ({reviews.length})
            </TabsTrigger>
            <TabsTrigger value="agent">
              Agente ({reviews.filter((r: Review) => r.targetType === 'agent').length})
            </TabsTrigger>
            <TabsTrigger value="agency">
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
              {activeTab === 'all'
                ? 'Aún no has recibido ninguna reseña.'
                : `Aún no has recibido reseñas como ${activeTab === 'agent' ? 'agente' : 'agencia'}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              Las reseñas de clientes aparecerán aquí cuando las recibas. 
              Puedes mejorar tu visibilidad completando tu perfil y proporcionando 
              un excelente servicio a tus clientes.
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
            />
          ))}
        </div>
      )}
      
      {selectedReview && (
        <ReviewResponseDialog
          review={selectedReview}
          isOpen={isResponseDialogOpen}
          onClose={() => setIsResponseDialogOpen(false)}
          onSubmit={handleSubmitResponse}
        />
      )}
    </div>
  );
}