import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Building, Users, Star, Sparkles, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/user-context";

const agencyPlans = {
  basica: {
    name: "Agencia Básica",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Perfil básico para empezar",
    features: [
      "Perfil básico con solo el Agente principal",
      "CRM y gestión de agenda",
      "2 propiedades activas a la vez",
      "No posibilidad de solicitar reseñas"
    ],
    icon: Building,
    color: "bg-gray-50 border-gray-200"
  },
  pequeña: {
    name: "Agencia Pequeña",
    monthlyPrice: 29,
    yearlyPrice: 290,
    description: "Para pequeños equipos",
    features: [
      "Hasta 2 perfiles públicos de agentes",
      "CRM y gestión de agenda",
      "Hasta 10 propiedades activas a la vez",
      "Gestión ilimitada de clientes",
      "3 solicitudes de reseñas mensuales",
      "Ventajas IA"
    ],
    icon: Users,
    color: "bg-blue-50 border-blue-200"
  },
  mediana: {
    name: "Agencia Mediana",
    monthlyPrice: 79,
    yearlyPrice: 790,
    description: "Para equipos en crecimiento",
    features: [
      "Hasta 6 agentes",
      "CRM y gestión de agenda",
      "Hasta 30 propiedades activas a la vez",
      "Gestión ilimitada de clientes",
      "7 solicitudes de reseñas mensuales",
      "Ventajas IA"
    ],
    icon: Star,
    color: "bg-green-50 border-green-200"
  },
  lider: {
    name: "Agencia Líder",
    monthlyPrice: 249,
    yearlyPrice: 2490,
    description: "Para grandes agencias",
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
};

export default function AgencyPlanRegister() {
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { setUser } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    agencyName: "",
    city: undefined as string | undefined,
    adminName: "",
    adminSurname: "",
    email: "",
    password: ""
  });

  // Extract plan details from URL using window.location.search
  const params = new URLSearchParams(window.location.search);
  const planId = params.get('plan') || 'basica';
  const billing = params.get('billing') || 'monthly';
  
  console.log('Agency Registration - Plan ID:', planId, 'Billing:', billing);
  
  const selectedPlan = agencyPlans[planId as keyof typeof agencyPlans] || agencyPlans.basica;
  console.log('Selected Plan:', selectedPlan.name);
  const IconComponent = selectedPlan.icon;
  
  const displayPrice = selectedPlan.monthlyPrice === 0 
    ? "Gratis" 
    : billing === 'yearly'
      ? `${Math.floor(selectedPlan.yearlyPrice / 12)}€/mes`
      : `${selectedPlan.monthlyPrice}€/mes`;

  const billingText = billing === 'yearly' ? 'Plan Anual' : 'Plan Mensual';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate agency name
    if (!formData.agencyName || formData.agencyName.trim().length < 2) {
      toast({
        title: "Error",
        description: "El nombre de la agencia debe tener al menos 2 caracteres",
        variant: "destructive"
      });
      return;
    }

    // Validate city
    if (!formData.city) {
      toast({
        title: "Error",
        description: "Por favor selecciona una ciudad",
        variant: "destructive"
      });
      return;
    }

    // Validate admin name
    if (!formData.adminName || formData.adminName.trim().length < 2) {
      toast({
        title: "Error",
        description: "El nombre del agente principal debe tener al menos 2 caracteres",
        variant: "destructive"
      });
      return;
    }

    // Validate admin surname
    if (!formData.adminSurname || formData.adminSurname.trim().length < 2) {
      toast({
        title: "Error",
        description: "El apellido del agente principal debe tener al menos 2 caracteres",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const userData = await apiRequest('POST', '/api/auth/register-agency', {
        agencyName: formData.agencyName.trim(),
        city: formData.city,
        name: formData.adminName.trim(),
        surname: formData.adminSurname.trim(),
        email: formData.email,
        password: formData.password,
        subscriptionPlan: planId,
        isYearlyBilling: billing === 'yearly'
      });
      
      // Update user context with the logged-in user
      setUser(userData);

      toast({
        title: "¡Cuenta creada exitosamente!",
        description: "Tu agencia ha sido registrada y ya puedes empezar a gestionar tus propiedades"
      });

      // Redirect to manage page
      navigate('/manage');
    } catch (error: any) {
      console.error('Error al registrar agencia:', error);
      
      // Extract error message from the error object
      const errorMessage = error.message?.includes(':') 
        ? error.message.split(':').slice(1).join(':').trim()
        : error.message || "Por favor, verifica tus datos e intenta de nuevo";
      
      toast({
        title: "Error al crear la cuenta",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 pt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Side - Registration Form */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl">Crear cuenta de agencia</CardTitle>
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
                  <Label htmlFor="agencyName">Nombre de Agencia</Label>
                  <Input
                    id="agencyName"
                    type="text"
                    placeholder="Ej: Inmobiliaria Barcelona Centro"
                    value={formData.agencyName}
                    onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                    required
                    data-testid="input-agency-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Select
                    value={formData.city || ""}
                    onValueChange={(value) => setFormData({ ...formData, city: value })}
                  >
                    <SelectTrigger id="city" data-testid="select-city">
                      <SelectValue placeholder="Selecciona una ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Barcelona">Barcelona</SelectItem>
                      <SelectItem value="Madrid">Madrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminName">Nombre del agente principal</Label>
                  <Input
                    id="adminName"
                    type="text"
                    placeholder="Ej: Juan"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    required
                    data-testid="input-admin-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminSurname">Apellido del agente principal</Label>
                  <Input
                    id="adminSurname"
                    type="text"
                    placeholder="Ej: García"
                    value={formData.adminSurname}
                    onChange={(e) => setFormData({ ...formData, adminSurname: e.target.value })}
                    required
                    data-testid="input-admin-surname"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email corporativo</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="agencia@ejemplo.com"
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

                <Button 
                  type="submit" 
                  className="w-full text-lg py-6"
                  disabled={isLoading}
                  data-testid="button-submit-registration"
                >
                  {isLoading ? "Creando cuenta..." : "Crear cuenta y continuar"}
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
