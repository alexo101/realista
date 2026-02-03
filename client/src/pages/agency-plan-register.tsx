import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Building, Users, Star, Sparkles, Eye, EyeOff, Search, X } from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/user-context";
import { getCities } from "@/utils/neighborhoods";

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
      "Solicitudes ilimitadas de reseñas",
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
      "Solicitudes ilimitadas de reseñas",
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
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [formData, setFormData] = useState({
    agencyName: "",
    city: undefined as string | undefined,
    adminName: "",
    adminSurname: "",
    email: "",
    password: ""
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Validation functions
  const validateName = (value: string) => {
    if (!value.trim()) return "Este campo es obligatorio";
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(value)) return "Solo se permiten letras y espacios";
    if (value.length > 50) return "Máximo 50 caracteres";
    return "";
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Este campo es obligatorio";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(value)) return "Introduce un email válido (ej: usuario@dominio.com)";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "Este campo es obligatorio";
    if (value.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (!/\d/.test(value)) return "La contraseña debe incluir al menos un número";
    return "";
  };

  const validateRequired = (value: string | undefined) => {
    if (!value || !value.trim()) return "Este campo es obligatorio";
    return "";
  };

  // Get errors for each field
  const errors = {
    agencyName: validateRequired(formData.agencyName),
    city: validateRequired(formData.city),
    adminName: validateName(formData.adminName),
    adminSurname: validateName(formData.adminSurname),
    email: validateEmail(formData.email),
    password: validatePassword(formData.password)
  };

  const isFormValid = Object.values(errors).every(error => error === "");

  const shouldShowError = (field: string) => {
    return (touched[field] || submitAttempted) && errors[field as keyof typeof errors];
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Try to get plan from route params first, then fall back to query params
  const routeParams = useParams<{ plan?: string; billing?: string }>();
  const queryParams = new URLSearchParams(window.location.search);
  
  const planId = routeParams.plan || queryParams.get('plan') || 'basica';
  const billing = routeParams.billing || queryParams.get('billing') || 'monthly';
  
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
    setSubmitAttempted(true);
    
    if (!isFormValid) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos correctamente",
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

      // If checkout URL is provided (paid plan), redirect to Stripe
      if (userData.checkoutUrl) {
        toast({
          title: "¡Cuenta creada!",
          description: "Redirigiendo a la página de pago..."
        });
        window.location.href = userData.checkoutUrl;
        return;
      }

      // If there was a Stripe error for paid plan, show warning but still allow access
      if (userData.stripeError) {
        toast({
          title: "Cuenta creada con aviso",
          description: userData.stripeError,
          variant: "destructive"
        });
      } else {
        toast({
          title: "¡Cuenta creada exitosamente!",
          description: "Tu agencia ha sido registrada y ya puedes empezar a gestionar tus propiedades"
        });
      }

      // Redirect to calendar page (free plan or stripe error)
      if (userData.agentUuid) {
        navigate(`/gestionar/${userData.agentUuid}/calendario`);
      } else {
        navigate('/gestionar');
      }
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
                  <Label htmlFor="agencyName">Nombre de Agencia *</Label>
                  <Input
                    id="agencyName"
                    type="text"
                    placeholder="Ej: Inmobiliaria Barcelona Centro"
                    value={formData.agencyName}
                    onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                    onBlur={() => handleBlur('agencyName')}
                    className={shouldShowError('agencyName') ? 'border-red-500' : ''}
                    data-testid="input-agency-name"
                  />
                  {shouldShowError('agencyName') && (
                    <p className="text-sm text-red-500">{errors.agencyName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Zona *</Label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="city-search"
                        placeholder="Buscar zona..."
                        value={cityDropdownOpen ? citySearchTerm : (formData.city || "")}
                        onChange={(e) => {
                          setCitySearchTerm(e.target.value);
                          if (!cityDropdownOpen) setCityDropdownOpen(true);
                        }}
                        onFocus={() => {
                          setCityDropdownOpen(true);
                          setCitySearchTerm("");
                        }}
                        onBlur={() => handleBlur('city')}
                        className={`pl-9 pr-8 w-full ${shouldShowError('city') ? 'border-red-500' : ''}`}
                        data-testid="input-city-search"
                      />
                      {formData.city && !cityDropdownOpen && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, city: undefined });
                            setCityDropdownOpen(true);
                            setCitySearchTerm("");
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {cityDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => {
                            setCityDropdownOpen(false);
                            setCitySearchTerm("");
                          }}
                        />
                        <div className="absolute left-0 z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {getCities()
                            .filter((cityOption) => 
                              cityOption.toLowerCase().includes(citySearchTerm.toLowerCase())
                            )
                            .slice(0, 50)
                            .map((cityOption, index) => (
                              <button
                                key={`${cityOption}-${index}`}
                                type="button"
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                                  formData.city === cityOption ? 'bg-primary/10 text-primary font-medium' : ''
                                }`}
                                onClick={() => {
                                  setFormData({ ...formData, city: cityOption });
                                  setCityDropdownOpen(false);
                                  setCitySearchTerm("");
                                }}
                                data-testid={`city-option-${cityOption}`}
                              >
                                {cityOption}
                              </button>
                            ))
                          }
                          {getCities().filter((cityOption) => 
                            cityOption.toLowerCase().includes(citySearchTerm.toLowerCase())
                          ).length === 0 && (
                            <div className="px-4 py-2 text-sm text-gray-500">
                              No se encontraron zonas
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {shouldShowError('city') && (
                    <p className="text-sm text-red-500">{errors.city}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminName">Nombre del agente principal *</Label>
                  <Input
                    id="adminName"
                    type="text"
                    placeholder="Ej: Juan"
                    value={formData.adminName}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '').slice(0, 50);
                      setFormData({ ...formData, adminName: value });
                    }}
                    onBlur={() => handleBlur('adminName')}
                    className={shouldShowError('adminName') ? 'border-red-500' : ''}
                    maxLength={50}
                    data-testid="input-admin-name"
                  />
                  {shouldShowError('adminName') && (
                    <p className="text-sm text-red-500">{errors.adminName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminSurname">Apellido del agente principal *</Label>
                  <Input
                    id="adminSurname"
                    type="text"
                    placeholder="Ej: García"
                    value={formData.adminSurname}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '').slice(0, 50);
                      setFormData({ ...formData, adminSurname: value });
                    }}
                    onBlur={() => handleBlur('adminSurname')}
                    className={shouldShowError('adminSurname') ? 'border-red-500' : ''}
                    maxLength={50}
                    data-testid="input-admin-surname"
                  />
                  {shouldShowError('adminSurname') && (
                    <p className="text-sm text-red-500">{errors.adminSurname}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email corporativo *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="agencia@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onBlur={() => handleBlur('email')}
                    className={shouldShowError('email') ? 'border-red-500' : ''}
                    data-testid="input-email"
                  />
                  {shouldShowError('email') && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres con un número"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      onBlur={() => handleBlur('password')}
                      className={shouldShowError('password') ? 'border-red-500' : ''}
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
                  {shouldShowError('password') && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full text-lg py-6"
                  disabled={isLoading || !isFormValid}
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
