import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, User, Sparkles, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const agentPlans = {
  basico: {
    name: "Agente Básico",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Perfil básico individual",
    features: [
      "Perfil básico de agente individual",
      "CRM y gestión de agenda",
      "2 propiedades activas a la vez",
      "No posibilidad de solicitar reseñas"
    ],
    icon: User,
    color: "bg-gray-50 border-gray-200"
  },
  lider: {
    name: "Agente Líder",
    monthlyPrice: 20,
    yearlyPrice: 200,
    description: "Para agentes profesionales",
    features: [
      "Perfil profesional de agente",
      "CRM y gestión de agenda",
      "Hasta 10 propiedades activas a la vez",
      "Gestión ilimitada de clientes",
      "3 solicitudes de reseñas mensuales",
      "Ventajas IA"
    ],
    icon: Sparkles,
    color: "bg-blue-50 border-blue-200"
  }
};

export default function AgentPlanRegister() {
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Extract plan details from URL
  const params = new URLSearchParams(location.split('?')[1] || '');
  const planId = params.get('plan') || 'basico';
  const billing = params.get('billing') || 'monthly';
  
  const selectedPlan = agentPlans[planId as keyof typeof agentPlans] || agentPlans.basico;
  const IconComponent = selectedPlan.icon;
  
  const displayPrice = selectedPlan.monthlyPrice === 0 
    ? "Gratis" 
    : billing === 'yearly'
      ? `${Math.floor(selectedPlan.yearlyPrice / 12)}€/mes`
      : `${selectedPlan.monthlyPrice}€/mes`;

  const billingText = billing === 'yearly' ? 'Plan Anual' : 'Plan Mensual';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      });
      return;
    }

    // TODO: Implement agent registration
    toast({
      title: "Registro en proceso",
      description: "Funcionalidad de registro pendiente de implementar"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 pt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Side - Registration Form */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl">Crear cuenta de agente</CardTitle>
              <CardDescription className="text-lg mt-2">
                Completa tus datos para activar tu plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Selected Plan Summary */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
                    <p className="text-sm text-muted-foreground">{billingText}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{displayPrice}</p>
                    {billing === 'yearly' && selectedPlan.monthlyPrice > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Facturado anualmente: {selectedPlan.yearlyPrice}€
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email profesional</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={8}
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    minLength={8}
                    data-testid="input-confirm-password"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full text-lg py-6"
                  data-testid="button-submit-registration"
                >
                  Crear cuenta y continuar
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                  Al crear una cuenta, aceptas nuestros{" "}
                  <a href="#" className="text-blue-600 hover:underline">Términos y Condiciones</a>
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Right Side - Plan Features */}
          <div className="space-y-6">
            <Card className={`shadow-xl ${selectedPlan.color}`}>
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <IconComponent className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{selectedPlan.name}</CardTitle>
                    <CardDescription className="text-base">{selectedPlan.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Características incluidas:</h4>
                  <ul className="space-y-3">
                    {selectedPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {billing === 'yearly' && selectedPlan.monthlyPrice > 0 && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-semibold text-green-800">
                      🎉 Ahorro anual: {(selectedPlan.monthlyPrice * 12 - selectedPlan.yearlyPrice)}€
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Equivalente a 2 meses gratis
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Benefits Card */}
            <Card className="shadow-xl bg-gradient-to-br from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="text-xl">¿Por qué elegir Realista Pro?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                    <span>CRM completo para gestión de clientes y propiedades</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                    <span>Calendario integrado para citas y visitas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                    <span>Sistema de reseñas para aumentar tu credibilidad</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                    <span>Herramientas IA para descripciones y respuestas automáticas</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
