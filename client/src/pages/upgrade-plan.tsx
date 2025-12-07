import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, Sparkles, Building } from "lucide-react";
import { useState } from "react";
import { useUser } from "@/contexts/user-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";

const agencyPlans = [
  {
    id: "pequeña",
    name: "Agencia Pequeña", 
    monthlyPrice: 29,
    yearlyPrice: 290,
    description: "Para pequeños equipos",
    agentsLimit: 2,
    propertiesLimit: 10,
    features: [
      "Hasta 2 perfiles públicos de agentes",
      "CRM y gestión de agenda",
      "Hasta 10 propiedades activas a la vez",
      "Gestión ilimitada de clientes",
      "Solicitudes ilimitadas de reseñas",
      "Ventajas IA"
    ],
    icon: Users,
    color: "bg-blue-50 border-blue-200"
  },
  {
    id: "mediana",
    name: "Agencia Mediana",
    monthlyPrice: 79,
    yearlyPrice: 790,
    description: "Para equipos en crecimiento",
    agentsLimit: 6,
    propertiesLimit: 30,
    features: [
      "Hasta 6 agentes",
      "CRM y gestión de agenda", 
      "Hasta 30 propiedades activas a la vez",
      "Gestión ilimitada de clientes",
      "Solicitudes ilimitadas de reseñas",
      "Ventajas IA"
    ],
    icon: Star,
    color: "bg-green-50 border-green-200"
  },
  {
    id: "lider",
    name: "Agencia Líder",
    monthlyPrice: 249,
    yearlyPrice: 2490,
    description: "Para grandes agencias",
    agentsLimit: null,
    propertiesLimit: null,
    features: [
      "Agentes ilimitados",
      "CRM y gestión de agenda",
      "Propiedades ilimitadas",
      "Gestión ilimitada de clientes",
      "Solicitudes ilimitadas de reseñas",
      "Ventajas IA"
    ],
    icon: Sparkles,
    color: "bg-purple-50 border-purple-200"
  }
];

export default function UpgradePlan() {
  const { user } = useUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<typeof agencyPlans[0] | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isYearlyBilling, setIsYearlyBilling] = useState(false);

  // Get agency data to find agency ID
  const { data: agencies } = useQuery<{ id: number; subscriptionPlan: string }[]>({
    queryKey: ['/api/agencies'],
    enabled: !!user?.isAdmin,
  });

  const agencyId = agencies?.[0]?.id;

  const upgradeMutation = useMutation({
    mutationFn: async ({ plan, isYearlyBilling }: { plan: string; isYearlyBilling: boolean }) => {
      if (!agencyId) throw new Error("No se encontró la agencia");
      return await apiRequest('PATCH', `/api/agencies/${agencyId}/upgrade-plan`, { plan, isYearlyBilling });
    },
    onSuccess: (data: { checkoutUrl: string; type: string; message: string }) => {
      if (data.checkoutUrl) {
        toast({
          title: data.type === 'portal' ? "Abriendo portal de facturación" : "Redirigiendo a Stripe",
          description: data.message,
          duration: 3000,
        });
        setShowConfirmModal(false);
        // Redirect to Stripe checkout or customer portal
        window.location.href = data.checkoutUrl;
      } else {
        toast({
          title: "Error",
          description: "No se recibió la URL de pago",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo mejorar el plan",
        variant: "destructive",
      });
    },
  });

  const handlePlanClick = (plan: typeof agencyPlans[0]) => {
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  const handleConfirmUpgrade = () => {
    if (selectedPlan) {
      upgradeMutation.mutate({ plan: selectedPlan.id, isYearlyBilling });
    }
  };

  const currentPlan = user?.subscriptionPlan;

  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Acceso denegado</h1>
        <p className="text-muted-foreground">Solo los administradores de agencia pueden acceder a esta página.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Mejora tu plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Amplía las capacidades de tu agencia con más agentes y propiedades
          </p>
        </div>

        <div className="grid gap-8 max-w-6xl mx-auto grid-cols-1 md:grid-cols-3">
          {agencyPlans.map((plan) => {
            const IconComponent = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col h-full ${plan.color} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Tu plan actual</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      plan.id === 'pequeña' ? 'bg-blue-200' :
                      plan.id === 'mediana' ? 'bg-green-200' : 
                      'bg-purple-200'
                    }`}>
                      <IconComponent className={`h-8 w-8 ${
                        plan.id === 'pequeña' ? 'text-blue-600' :
                        plan.id === 'mediana' ? 'text-green-600' : 
                        'text-purple-600'
                      }`} />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-lg">{plan.description}</CardDescription>
                  <div className="text-center mt-4">
                    <span className="text-4xl font-bold">{plan.monthlyPrice}€</span>
                    <span className="text-muted-foreground">/mes</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="mt-auto">
                  <Button 
                    className="w-full text-lg py-6 bg-primary hover:bg-primary/90"
                    size="lg"
                    onClick={() => handlePlanClick(plan)}
                    disabled={isCurrentPlan || upgradeMutation.isPending}
                    data-testid={`button-upgrade-${plan.id}`}
                  >
                    {isCurrentPlan ? 'Plan actual' : 'Mejora tu plan'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Additional Features Section */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-center mb-12">Ventajas IA incluidas en planes de pago</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Card className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-purple-100">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <h4 className="text-xl font-semibold mb-3">Descripciones automáticas</h4>
              <p className="text-muted-foreground">
                Genera descripciones atractivas y profesionales para tus propiedades con un solo clic usando IA avanzada
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <Building className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h4 className="text-xl font-semibold mb-3">Más propiedades y agentes</h4>
              <p className="text-muted-foreground">
                Expande tu equipo y gestiona más propiedades activas simultáneamente para hacer crecer tu negocio
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent data-testid="dialog-confirm-upgrade">
          <DialogHeader>
            <DialogTitle>Confirmar mejora de plan</DialogTitle>
            <DialogDescription>
              Estás a punto de mejorar tu plan a <strong>{selectedPlan?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <h4 className="font-semibold mb-3">Nuevas ventajas:</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>
                  {selectedPlan?.agentsLimit 
                    ? `Hasta ${selectedPlan.agentsLimit} perfiles de agentes`
                    : 'Agentes ilimitados'}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>
                  {selectedPlan?.propertiesLimit 
                    ? `Hasta ${selectedPlan.propertiesLimit} propiedades activas`
                    : 'Propiedades ilimitadas'}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Acceso a funciones IA</span>
              </li>
            </ul>
            
            {/* Billing Period Toggle */}
            <div className="mt-4 flex items-center justify-center gap-4 p-3 bg-gray-50 rounded-lg">
              <span className={`text-sm font-medium ${!isYearlyBilling ? 'text-primary' : 'text-muted-foreground'}`}>
                Mensual
              </span>
              <button
                type="button"
                onClick={() => setIsYearlyBilling(!isYearlyBilling)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isYearlyBilling ? 'bg-primary' : 'bg-gray-300'
                }`}
                data-testid="toggle-billing-period"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isYearlyBilling ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${isYearlyBilling ? 'text-primary' : 'text-muted-foreground'}`}>
                Anual
              </span>
              {isYearlyBilling && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  2 meses gratis
                </Badge>
              )}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Precio:</strong>{' '}
                {isYearlyBilling 
                  ? `${selectedPlan?.yearlyPrice}€/año (${Math.floor((selectedPlan?.yearlyPrice || 0) / 12)}€/mes)`
                  : `${selectedPlan?.monthlyPrice}€/mes`}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmModal(false)}
              disabled={upgradeMutation.isPending}
              data-testid="button-cancel-upgrade"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmUpgrade}
              disabled={upgradeMutation.isPending}
              data-testid="button-confirm-upgrade"
            >
              {upgradeMutation.isPending ? 'Redirigiendo a Stripe...' : 'Continuar al pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
