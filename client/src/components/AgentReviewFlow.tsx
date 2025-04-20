import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Search, Home, ArrowLeft, Check, Star, AlertCircle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { FormProvider, useForm } from "react-hook-form";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

// Componente de calificación de estrellas interactivo
const StarRatingInput = ({ value, onChange, disabled = false }: StarRatingProps) => {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="flex gap-1 mt-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className={`text-2xl ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHoverValue(star)}
          onMouseLeave={() => !disabled && setHoverValue(0)}
        >
          <Star 
            className={`h-8 w-8 ${
              (hoverValue || value) >= star
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

interface Property {
  id: number;
  title: string | null;
  address: string;
  reference: string | null;
}

interface AgentProfile {
  id: number;
  name: string | null;
  surname: string | null;
  email: string;
  properties?: Property[];
}

interface ReviewStep {
  id: string;
  title: string;
  question: string;
  rating: number;
}

export interface AgentReviewFlowProps {
  agentId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function AgentReviewFlow({ agentId, isOpen, onClose }: AgentReviewFlowProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Formulario para datos del usuario
  const userForm = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: ""
    }
  });

  // Estados para el flujo
  const [step, setStep] = useState('verification');
  const [hasWorkedWithAgent, setHasWorkedWithAgent] = useState<boolean | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentReviewStep, setCurrentReviewStep] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: ""
  });
  
  // Pasos de la reseña
  const reviewSteps: ReviewStep[] = [
    {
      id: "zoneKnowledge",
      title: "Conocimientos de la zona",
      question: "¿Conocía las características del barrio (servicios, conexión con medios de transporte, sitios de ocio, etc)?",
      rating: 0
    },
    {
      id: "priceNegotiation",
      title: "Negociación del precio",
      question: "¿Te representó en la búsqueda de un mejor precio?",
      rating: 0
    },
    {
      id: "treatment",
      title: "Trato",
      question: "¿Recibiste un trato amable y cordial por parte de tu agente? ¿Escuchó tus necesidades y te dio respuestas apropiadas?",
      rating: 0
    },
    {
      id: "punctuality",
      title: "Puntualidad y tiempo de respuesta",
      question: "¿Llegó a tiempo a las citas pactadas? ¿Respondía rápidamente a tus solicitudes? ¿Se mostraba disponible dentro de horarios razonables?",
      rating: 0
    },
    {
      id: "propertyKnowledge",
      title: "Conocimiento de la propiedad",
      question: "¿Tenía dominio del inmueble? ¿Fue capaz de mostrarte el potencial y \"puntos débiles\" de la propiedad?",
      rating: 0
    }
  ];

  // Estado para guardar las calificaciones
  const [ratings, setRatings] = useState<Record<string, number>>(
    reviewSteps.reduce((acc, step) => ({ ...acc, [step.id]: 0 }), {})
  );

  // Consulta para obtener datos del agente
  const { data: agent, isLoading: isLoadingAgent } = useQuery<AgentProfile>({
    queryKey: [`/api/agents/${agentId}`],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch agent");
      }
      return response.json();
    },
    enabled: isOpen
  });

  // Mutación para enviar la reseña
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      const response = await fetch(`/api/agents/${agentId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });
      
      if (!response.ok) {
        throw new Error('Error al enviar la reseña');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${agentId}`] });
      toast({
        title: "Reseña enviada correctamente",
        description: "Gracias por compartir tu experiencia",
      });
      resetFlow();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error al enviar la reseña",
        description: "Ha ocurrido un problema, intenta nuevamente",
        variant: "destructive",
      });
    },
  });

  // Función para actualizar la calificación de un paso
  const handleRatingChange = (stepId: string, value: number) => {
    setRatings(prev => ({ ...prev, [stepId]: value }));
  };

  // Función para navegar al siguiente paso
  const goToNextStep = () => {
    if (currentReviewStep < reviewSteps.length - 1) {
      setCurrentReviewStep(currentReviewStep + 1);
    } else {
      setStep('commentStep');
    }
  };

  // Función para navegar al paso anterior
  const goToPreviousStep = () => {
    if (currentReviewStep > 0) {
      setCurrentReviewStep(currentReviewStep - 1);
    } else {
      // Si estamos en el primer paso y volvemos atrás, regresamos al paso de verificación
      if (hasWorkedWithAgent) {
        setStep('propertySelection');
      } else {
        setStep('verification');
      }
    }
  };

  // Función para manejar la selección de propiedad
  const handlePropertySelect = (propertyId: number) => {
    setSelectedPropertyId(propertyId);
  };

  // Manejador para el formulario de usuario
  const handleUserDataSubmit = (data: any) => {
    setUserData(data);
    handleSubmitReview(data);
  };

  // Función para generar iniciales del nombre
  const getInitials = (firstName: string, lastName: string): string => {
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    return `${firstInitial}.${lastInitial}.`;
  };
  
  // Función para enviar la reseña
  const handleSubmitReview = (userInfo?: any) => {
    const firstName = userInfo?.firstName || userData.firstName || "";
    const lastName = userInfo?.lastName || userData.lastName || "";
    
    // Generar iniciales para el autor
    const authorInitials = firstName && lastName ? 
                           getInitials(firstName, lastName) : 
                           "Usuario anónimo";
    
    const reviewData = {
      agentId: agentId,
      propertyId: selectedPropertyId,
      verified: hasWorkedWithAgent === true,
      ratings: {
        area_knowledge: ratings.zoneKnowledge,
        price_negotiation: ratings.priceNegotiation,
        treatment: ratings.treatment,
        punctuality: ratings.punctuality,
        property_knowledge: ratings.propertyKnowledge
      },
      comment: commentText.trim(),
      rating: calculateOverallRating(),
      author: authorInitials,
      email: userInfo?.email || userData.email || "",
      date: new Date().toISOString()
    };

    submitReviewMutation.mutate(reviewData);
  };

  // Función para calcular la calificación general
  const calculateOverallRating = () => {
    const totalRating = Object.values(ratings).reduce((sum, rating) => sum + rating, 0);
    return totalRating / Object.keys(ratings).length;
  };

  // Función para reiniciar el flujo
  const resetFlow = () => {
    setStep('verification');
    setHasWorkedWithAgent(null);
    setSelectedPropertyId(null);
    setSearchTerm("");
    setCurrentReviewStep(0);
    setCommentText("");
    setRatings(reviewSteps.reduce((acc, step) => ({ ...acc, [step.id]: 0 }), {}));
    setUserData({
      firstName: "",
      lastName: "",
      email: ""
    });
    userForm.reset({
      firstName: "",
      lastName: "",
      email: ""
    });
  };

  // Función para filtrar propiedades basadas en el término de búsqueda
  const filteredProperties = agent?.properties?.filter(
    property => 
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (property.title && property.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (property.reference && property.reference.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // Renderizado condicional según el paso actual
  const renderStep = () => {
    if (step === 'verification') {
      return (
        <div className="flex flex-col items-center text-center p-4">
          <MessageCircle className="h-16 w-16 text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-4">¿Has comprado o alquilado alguna propiedad con este agente?</h2>
          <div className="flex gap-4 mt-4">
            <Button 
              onClick={() => { 
                setHasWorkedWithAgent(true);
                setStep('propertySelection');
              }}
            >
              Sí
            </Button>
            <Button 
              variant="outline" 
              onClick={() => { 
                setHasWorkedWithAgent(false);
                setStep('verificationNotice');
              }}
            >
              No
            </Button>
          </div>
        </div>
      );
    } else if (step === 'verificationNotice') {
      return (
        <div className="flex flex-col items-center text-center p-4">
          <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-4">Puedes añadir una reseña pero no contará para la puntuación del agente.</h2>
          <Button 
            className="mt-4" 
            onClick={() => setStep('reviewFlow')}
          >
            Siguiente
          </Button>
        </div>
      );
    } else if (step === 'propertySelection') {
      return (
        <div className="flex flex-col p-4">
          <h2 className="text-xl font-semibold mb-4">Selecciona la propiedad</h2>
          <div className="relative mb-6">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por dirección o referencia..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <ScrollArea className="h-[200px]">
            {filteredProperties.length > 0 ? (
              <div className="space-y-2">
                {filteredProperties.map(property => (
                  <div 
                    key={property.id}
                    onClick={() => handlePropertySelect(property.id)}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedPropertyId === property.id 
                        ? 'bg-primary/10 border border-primary' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="font-medium">
                      {property.title || "Propiedad sin título"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {property.address}
                    </div>
                    {property.reference && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Ref: {property.reference}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No se encontraron propiedades que coincidan con la búsqueda
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-between mt-6">
            <Button 
              variant="link" 
              onClick={() => {
                setHasWorkedWithAgent(false);
                setStep('verificationNotice');
              }}
            >
              No la encuentro
            </Button>
            <Button 
              disabled={selectedPropertyId === null}
              onClick={() => setStep('reviewFlow')}
            >
              Siguiente
            </Button>
          </div>
        </div>
      );
    } else if (step === 'reviewFlow') {
      const currentStep = reviewSteps[currentReviewStep];
      
      return (
        <div className="flex flex-col p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">{currentStep.title}</h2>
          </div>
          
          <p className="mb-6 text-muted-foreground">{currentStep.question}</p>
          
          <div className="flex justify-center mb-8">
            <StarRatingInput 
              value={ratings[currentStep.id]} 
              onChange={(value) => handleRatingChange(currentStep.id, value)}
            />
          </div>
          
          <div className="flex justify-between mt-auto">
            <Button 
              variant="outline" 
              onClick={goToPreviousStep}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <Button 
              disabled={ratings[currentStep.id] === 0}
              onClick={goToNextStep}
            >
              {currentReviewStep < reviewSteps.length - 1 ? (
                'Siguiente'
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Siguiente
                </>
              )}
            </Button>
          </div>
        </div>
      );
    } else if (step === 'commentStep') {
      return (
        <div className="flex flex-col p-4">
          <h2 className="text-xl font-semibold mb-4">Añadir comentario (opcional)</h2>
          
          <div className="mb-6">
            <Label htmlFor="comment" className="mb-2 block">
              ¿Quieres añadir algún comentario adicional sobre tu experiencia?
            </Label>
            <textarea
              id="comment"
              className="w-full min-h-[150px] p-3 border rounded-md"
              placeholder="Escribe aquí tu comentario..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
          </div>
          
          <div className="flex justify-between mt-auto">
            <Button 
              variant="outline" 
              onClick={() => {
                setStep('reviewFlow');
                setCurrentReviewStep(reviewSteps.length - 1);
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <Button 
              onClick={() => setStep('userIdentification')}
            >
              <Check className="mr-2 h-4 w-4" />
              Siguiente
            </Button>
          </div>
        </div>
      );
    } else if (step === 'userIdentification') {
      return (
        <div className="flex flex-col p-4">
          <h2 className="text-xl font-semibold mb-4">Información del revisor</h2>
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 text-sm">
            <p className="flex items-start">
              <AlertCircle className="h-4 w-4 text-amber-500 mr-2 mt-0.5" />
              <span>
                Tu reseña se mostrará de forma anónima. Solo se mostrarán tus iniciales (por ejemplo, M.G. para María García).
              </span>
            </p>
          </div>
          
          <form onSubmit={userForm.handleSubmit(handleUserDataSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="firstName" className="mb-1 block">Nombre</Label>
              <Input
                id="firstName"
                placeholder="Tu nombre"
                {...userForm.register('firstName', { required: "El nombre es obligatorio" })}
              />
              {userForm.formState.errors.firstName && (
                <p className="text-sm text-red-500 mt-1">{userForm.formState.errors.firstName.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="lastName" className="mb-1 block">Apellido</Label>
              <Input
                id="lastName"
                placeholder="Tu apellido"
                {...userForm.register('lastName', { required: "El apellido es obligatorio" })}
              />
              {userForm.formState.errors.lastName && (
                <p className="text-sm text-red-500 mt-1">{userForm.formState.errors.lastName.message}</p>
              )}
            </div>
            
            <div>
              <div className="flex items-center mb-1">
                <Label htmlFor="email" className="block">Email</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-2 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Nunca enviaremos spam. Tu email solo se usará para validar la autenticidad de la reseña.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="email"
                type="email"
                placeholder="tu.email@ejemplo.com"
                {...userForm.register('email', { 
                  required: "El email es obligatorio",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email inválido"
                  }
                })}
              />
              {userForm.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">{userForm.formState.errors.email.message}</p>
              )}
            </div>
            
            <div className="flex justify-between pt-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setStep('commentStep')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              <Button 
                type="submit"
                disabled={!userForm.formState.isValid || Object.keys(userForm.formState.errors).length > 0}
              >
                <Check className="mr-2 h-4 w-4" />
                Validar reseña
              </Button>
            </div>
          </form>
        </div>
      );
    }
  };

  // Función para obtener el paso actual (número)
  const getCurrentStepNumber = (): number => {
    if (step === 'verification') return 1;
    if (step === 'verificationNotice') return 2;
    if (step === 'propertySelection') return 2;
    if (step === 'reviewFlow') return 3 + currentReviewStep;
    if (step === 'commentStep') return 8;
    if (step === 'userIdentification') return 9;
    return 1;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        resetFlow();
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {!isLoadingAgent && agent ? (
              <>Escribir una reseña para {agent.name} {agent.surname}</>
            ) : (
              'Escribir una reseña'
            )}
          </DialogTitle>
          {/* Stepper */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center space-x-1">
              {Array.from({ length: 9 }).map((_, i) => {
                const isCurrent = getCurrentStepNumber() === i + 1;
                const isCompleted = getCurrentStepNumber() > i + 1;
                return (
                  <div 
                    key={i}
                    className={`h-1.5 rounded-full ${
                      isCurrent 
                        ? 'w-6 bg-primary' 
                        : isCompleted 
                          ? 'w-6 bg-primary/80' 
                          : 'w-6 bg-gray-200'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </DialogHeader>
        
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}