import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, Network, Eye, EyeOff, Building, CreditCard, Users, BarChart3 } from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/user-context";

const networkPlan = {
  id: "red_agencias",
  name: "Red de Agencias",
  monthlyPrice: 499,
  yearlyPrice: 4990,
  description: "Para franquicias y redes inmobiliarias",
  features: [
    "Agencias ilimitadas bajo tu marca",
    "Panel de control centralizado de toda la red",
    "Asigna planes individuales a cada agencia",
    "Estadísticas consolidadas de rendimiento",
    "Branding corporativo en todos los perfiles",
    "Facturación centralizada según planes de agencias",
    "Soporte prioritario dedicado",
    "API de integración disponible"
  ],
  icon: Network,
  color: "bg-orange-50 border-orange-300"
};

export default function NetworkPlanRegister() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { setUser } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    networkName: "",
    adminName: "",
    adminSurname: "",
    email: "",
    password: "",
    billingMode: "network"
  });

  // Try to get billing from route params first, then fall back to query params
  const routeParams = useParams<{ plan?: string; billing?: string }>();
  const queryParams = new URLSearchParams(window.location.search);
  const billing = routeParams.billing || queryParams.get('billing') || 'monthly';
  
  const displayPrice = billing === 'yearly'
    ? `${Math.floor(networkPlan.yearlyPrice / 12)}€/mes`
    : `${networkPlan.monthlyPrice}€/mes`;

  const billingText = billing === 'yearly' ? 'Plan Anual' : 'Plan Mensual';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.networkName || formData.networkName.trim().length < 2) {
      toast({
        title: "Error",
        description: "El nombre de la red debe tener al menos 2 caracteres",
        variant: "destructive"
      });
      return;
    }

    if (!formData.adminName || formData.adminName.trim().length < 2) {
      toast({
        title: "Error",
        description: "El nombre del administrador debe tener al menos 2 caracteres",
        variant: "destructive"
      });
      return;
    }

    if (!formData.adminSurname || formData.adminSurname.trim().length < 2) {
      toast({
        title: "Error",
        description: "El apellido del administrador debe tener al menos 2 caracteres",
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
      const userData = await apiRequest('POST', '/api/auth/register-network', {
        networkName: formData.networkName.trim(),
        name: formData.adminName.trim(),
        surname: formData.adminSurname.trim(),
        email: formData.email,
        password: formData.password,
        billingMode: formData.billingMode,
        subscriptionPlan: 'red_agencias',
        isYearlyBilling: billing === 'yearly'
      });
      
      setUser(userData);

      toast({
        title: "¡Red creada exitosamente!",
        description: "Tu red de agencias ha sido registrada. Ya puedes empezar a añadir agencias."
      });

      // Network admins go to their dedicated admin panel
      navigate('/admin-red');
    } catch (error: any) {
      console.error('Error al registrar red:', error);
      
      const errorMessage = error.message?.includes(':') 
        ? error.message.split(':').slice(1).join(':').trim()
        : error.message || "Por favor, verifica tus datos e intenta de nuevo";
      
      toast({
        title: "Error al crear la red",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 pt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl">Crear red de agencias</CardTitle>
              <CardDescription className="text-lg mt-2">
                Gestiona todas tus agencias desde un único panel de control
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-lg">{networkPlan.name}</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="networkName">Nombre de la Red / Franquicia</Label>
                  <Input
                    id="networkName"
                    type="text"
                    placeholder="Ej: RE/MAX España, Century 21"
                    value={formData.networkName}
                    onChange={(e) => setFormData({ ...formData, networkName: e.target.value })}
                    required
                    data-testid="input-network-name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminName">Nombre del administrador</Label>
                    <Input
                      id="adminName"
                      type="text"
                      placeholder="Ej: Carlos"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      required
                      data-testid="input-admin-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminSurname">Apellido del administrador</Label>
                    <Input
                      id="adminSurname"
                      type="text"
                      placeholder="Ej: López"
                      value={formData.adminSurname}
                      onChange={(e) => setFormData({ ...formData, adminSurname: e.target.value })}
                      required
                      data-testid="input-admin-surname"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email corporativo</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@tufranchicia.com"
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
                  className="w-full text-lg py-6 bg-orange-600 hover:bg-orange-700"
                  disabled={isLoading}
                  data-testid="button-submit-registration"
                >
                  {isLoading ? "Creando red..." : "Crear red y continuar"}
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                  Al crear una cuenta, aceptas nuestros{" "}
                  <a href="#" className="text-orange-600 hover:underline">Términos y Condiciones</a>
                </p>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className={`shadow-xl ${networkPlan.color}`}>
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-orange-200 rounded-full">
                    <Network className="h-8 w-8 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{networkPlan.name}</CardTitle>
                    <CardDescription className="text-base">{networkPlan.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Características incluidas:</h4>
                  <ul className="space-y-3">
                    {networkPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {billing === 'yearly' && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-semibold text-green-800">
                      Ahorro anual: {(networkPlan.monthlyPrice * 12 - networkPlan.yearlyPrice)}€
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Equivalente a 2 meses gratis
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-xl bg-gradient-to-br from-orange-50 to-amber-50">
              <CardHeader>
                <CardTitle className="text-xl">¿Por qué crear una red?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 text-sm">
                  <li className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                      <Building className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <span className="font-medium">Gestión multi-agencia</span>
                      <p className="text-muted-foreground">Añade y gestiona todas las agencias de tu franquicia desde un único lugar</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                      <BarChart3 className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <span className="font-medium">Estadísticas consolidadas</span>
                      <p className="text-muted-foreground">Visualiza el rendimiento de toda la red con métricas unificadas</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <span className="font-medium">Branding corporativo</span>
                      <p className="text-muted-foreground">Tu logo y colores en todos los perfiles de agencias y agentes</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                      <CreditCard className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <span className="font-medium">Facturación centralizada</span>
                      <p className="text-muted-foreground">La red paga por todas las agencias según el plan asignado a cada una</p>
                    </div>
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
