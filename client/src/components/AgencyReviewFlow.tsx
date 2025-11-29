import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, Search, ArrowLeft, Check, Star, AlertCircle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

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
  uuid: string;
  title: string | null;
  address: string;
  reference: string | null;
}

interface AgencyProfile {
  id: number;
  agencyName: string;
  email: string;
}

interface ReviewStep {
  id: string;
  title: string;
  question: string;
  rating: number;
}

export interface AgencyReviewFlowProps {
  agencyId: number;
  agencyName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AgencyReviewFlow({ agencyId, agencyName, isOpen, onClose }: AgencyReviewFlowProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const userForm = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: ""
    }
  });

  const [step, setStep] = useState('verification');
  const [hasWorkedWithAgency, setHasWorkedWithAgency] = useState<boolean | null>(null);
  const [selectedPropertyUuid, setSelectedPropertyUuid] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentReviewStep, setCurrentReviewStep] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: ""
  });

  const reviewSteps: ReviewStep[] = [
    {
      id: "areaKnowledge",
      title: "Conocimientos de la zona",
      question: "¿Los agentes de la agencia conocían las características del barrio (servicios, conexión con medios de transporte, sitios de ocio, etc)?",
      rating: 0
    },
    {
      id: "priceNegotiation",
      title: "Negociación del precio",
      question: "¿Te representaron en la búsqueda de un mejor precio?",
      rating: 0
    },
    {
      id: "treatment",
      title: "Trato",
      question: "¿Recibiste un trato amable y cordial por parte de la agencia? ¿Escucharon tus necesidades y te dieron respuestas apropiadas?",
      rating: 0
    },
    {
      id: "punctuality",
      title: "Puntualidad y tiempo de respuesta",
      question: "¿Llegaron a tiempo a las citas pactadas? ¿Respondían rápidamente a tus solicitudes? ¿Se mostraban disponibles dentro de horarios razonables?",
      rating: 0
    },
    {
      id: "propertyKnowledge",
      title: "Conocimiento de las propiedades",
      question: "¿Tenían dominio de los inmuebles? ¿Fueron capaces de mostrarte el potencial y \"puntos débiles\" de las propiedades?",
      rating: 0
    }
  ];

  const [ratings, setRatings] = useState<Record<string, number>>(
    reviewSteps.reduce((acc, step) => ({ ...acc, [step.id]: 0 }), {})
  );

  const { data: properties, isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: [`/api/agencies/${agencyId}/properties`],
    queryFn: async () => {
      const response = await fetch(`/api/agencies/${agencyId}/properties`);
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }
      return response.json();
    },
    enabled: isOpen && step === 'propertySelection'
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      const response = await fetch(`/api/agencies/${agencyId}/reviews`, {
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
      queryClient.invalidateQueries({ queryKey: [`/api/agencies/${agencyId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/agencies/${agencyId}/reviews`] });
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

  const handleRatingChange = (stepId: string, value: number) => {
    setRatings(prev => ({ ...prev, [stepId]: value }));
  };

  const goToNextStep = () => {
    if (currentReviewStep < reviewSteps.length - 1) {
      setCurrentReviewStep(currentReviewStep + 1);
    } else {
      setStep('commentStep');
    }
  };

  const goToPreviousStep = () => {
    if (currentReviewStep > 0) {
      setCurrentReviewStep(currentReviewStep - 1);
    } else {
      if (hasWorkedWithAgency) {
        setStep('propertySelection');
      } else {
        setStep('verification');
      }
    }
  };

  const handlePropertySelect = (propertyUuid: string) => {
    setSelectedPropertyUuid(propertyUuid);
  };

  const handleUserDataSubmit = (data: any) => {
    setUserData(data);
    handleSubmitReview(data);
  };

  const getInitials = (firstName: string, lastName: string): string => {
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    return `${firstInitial}.${lastInitial}.`;
  };

  const handleSubmitReview = (userInfo?: any) => {
    const firstName = userInfo?.firstName || userData.firstName || "";
    const lastName = userInfo?.lastName || userData.lastName || "";

    const authorInitials = firstName && lastName ? 
                           getInitials(firstName, lastName) : 
                           "Usuario anónimo";

    const reviewData = {
      agencyId: agencyId,
      propertyUuid: selectedPropertyUuid,
      verified: hasWorkedWithAgency === true,
      areaKnowledge: Number(ratings.areaKnowledge) || 0,
      priceNegotiation: Number(ratings.priceNegotiation) || 0,
      treatment: Number(ratings.treatment) || 0,
      punctuality: Number(ratings.punctuality) || 0,
      propertyKnowledge: Number(ratings.propertyKnowledge) || 0,
      comment: commentText.trim(),
      rating: calculateOverallRating(),
      author: authorInitials,
      email: userInfo?.email || userData.email || "",
      date: new Date().toISOString()
    };

    submitReviewMutation.mutate(reviewData);
  };

  const calculateOverallRating = () => {
    const totalRating = Object.values(ratings).reduce((sum, rating) => sum + rating, 0);
    return totalRating / Object.keys(ratings).length;
  };

  const resetFlow = () => {
    setStep('verification');
    setHasWorkedWithAgency(null);
    setSelectedPropertyUuid(null);
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

  const filteredProperties = properties?.filter(
    property => 
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (property.title && property.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (property.reference && property.reference.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const renderStep = () => {
    if (step === 'verification') {
      return (
        <div className="flex flex-col items-center text-center p-4">
          <MessageCircle className="h-16 w-16 text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-4">¿Has comprado o alquilado alguna propiedad con esta agencia?</h2>
          <div className="flex gap-4 mt-4">
            <Button 
              data-testid="button-review-yes"
              onClick={() => { 
                setHasWorkedWithAgency(true);
                setStep('propertySelection');
              }}
            >
              Sí
            </Button>
            <Button 
              data-testid="button-review-no"
              variant="outline" 
              onClick={() => { 
                setHasWorkedWithAgency(false);
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
          <h2 className="text-xl font-semibold mb-4">Puedes añadir una reseña pero no contará para la puntuación de la agencia.</h2>
          <Button 
            data-testid="button-continue-unverified"
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
              data-testid="input-search-property"
              placeholder="Buscar por dirección o referencia..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[200px]">
            {isLoadingProperties ? (
              <div className="text-center py-4 text-muted-foreground">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                Cargando propiedades...
              </div>
            ) : filteredProperties.length > 0 ? (
              <div className="space-y-2">
                {filteredProperties.map(property => (
                  <div 
                    key={property.uuid}
                    data-testid={`property-option-${property.uuid}`}
                    onClick={() => handlePropertySelect(property.uuid)}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedPropertyUuid === property.uuid 
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
              data-testid="button-property-not-found"
              variant="link" 
              onClick={() => {
                setHasWorkedWithAgency(false);
                setStep('verificationNotice');
              }}
            >
              No la encuentro
            </Button>
            <Button 
              data-testid="button-continue-property"
              disabled={selectedPropertyUuid === null}
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
              data-testid="button-review-previous"
              variant="outline" 
              onClick={goToPreviousStep}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <Button 
              data-testid="button-review-next"
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
              data-testid="textarea-review-comment"
              className="w-full min-h-[150px] p-3 border rounded-md"
              placeholder="Escribe aquí tu comentario..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
          </div>

          <div className="flex justify-between mt-auto">
            <Button 
              data-testid="button-comment-previous"
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
              data-testid="button-comment-next"
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
                data-testid="input-reviewer-firstname"
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
                data-testid="input-reviewer-lastname"
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
                data-testid="input-reviewer-email"
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
                data-testid="button-user-previous"
                variant="outline" 
                onClick={() => setStep('commentStep')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              <Button 
                type="submit"
                data-testid="button-submit-review"
                disabled={submitReviewMutation.isPending}
              >
                <Check className="mr-2 h-4 w-4" />
                {submitReviewMutation.isPending ? "Enviando..." : "Validar reseña"}
              </Button>
            </div>
          </form>
        </div>
      );
    }
  };

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
            Escribir una reseña para {agencyName}
          </DialogTitle>
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
