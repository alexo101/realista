import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Star, Users, Building, FileText, MessageSquare, Sparkles, User } from "lucide-react";
import { useState } from "react";

const agencyPlans = [
  {
    id: "basica",
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
  {
    id: "pequeña",
    name: "Agencia Pequeña", 
    monthlyPrice: 29,
    yearlyPrice: 290, // 2 months free
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
  {
    id: "mediana",
    name: "Agencia Mediana",
    monthlyPrice: 79,
    yearlyPrice: 790, // 2 months free
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
  {
    id: "lider",
    name: "Agencia Líder",
    monthlyPrice: 249,
    yearlyPrice: 2490, // 2 months free
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
];

const agentPlans = [
  {
    id: "basico",
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
  {
    id: "lider",
    name: "Agente Líder",
    monthlyPrice: 20,
    yearlyPrice: 200, // 2 months free
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
];

export default function RealistaPro() {
  const [isYearly, setIsYearly] = useState(false);
  const [profileType, setProfileType] = useState<"agencies" | "agents">("agencies");
  
  const currentPlans = profileType === "agencies" ? agencyPlans : agentPlans;
  
  const getDisplayPrice = (plan: any) => {
    if (plan.monthlyPrice === 0) return "Gratis";
    
    if (isYearly) {
      const monthlyEquivalent = Math.floor(plan.yearlyPrice / 12);
      return `${monthlyEquivalent}€`;
    }
    return `${plan.monthlyPrice}€`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              RealistaPro
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
            La plataforma profesional para agencias inmobiliarias que quieren destacar
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-lg">
            <div className="flex items-center gap-2">
              <Building className="h-6 w-6" />
              <span>CRM Avanzado</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              <span>IA Integrada</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              <span>Gestión de Reseñas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Elige tu plan perfecto</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Planes flexibles para agencias y agentes individuales
          </p>
        </div>

        {/* Profile Type Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-lg border shadow-sm">
            <Button
              variant={profileType === "agencies" ? "default" : "ghost"}
              onClick={() => setProfileType("agencies")}
              className="px-6 py-2"
            >
              <Building className="h-4 w-4 mr-2" />
              Agencias
            </Button>
            <Button
              variant={profileType === "agents" ? "default" : "ghost"}
              onClick={() => setProfileType("agents")}
              className="px-6 py-2"
            >
              <User className="h-4 w-4 mr-2" />
              Agentes
            </Button>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <span className={`text-lg ${!isYearly ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
            Mensual
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="scale-125"
          />
          <span className={`text-lg ${isYearly ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
            Anual
          </span>
          {isYearly && (
            <Badge variant="secondary" className="ml-2">
              2 meses gratis
            </Badge>
          )}
        </div>

        <div className={`grid gap-8 max-w-7xl mx-auto ${
          profileType === "agents" ? "grid-cols-1 md:grid-cols-2 max-w-4xl" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        }`}>
          {currentPlans.map((plan) => {
            const IconComponent = plan.icon;
            const displayPrice = getDisplayPrice(plan);
            
            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-300 hover:scale-105 hover:shadow-xl ${plan.color}`}
              >
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      plan.id === 'basica' || plan.id === 'basico' ? 'bg-gray-200' :
                      plan.id === 'pequeña' ? 'bg-blue-200' :
                      plan.id === 'mediana' ? 'bg-green-200' : 
                      plan.id === 'lider' ? 'bg-purple-200' : 'bg-blue-200'
                    }`}>
                      <IconComponent className={`h-8 w-8 ${
                        plan.id === 'basica' || plan.id === 'basico' ? 'text-gray-600' :
                        plan.id === 'pequeña' ? 'text-blue-600' :
                        plan.id === 'mediana' ? 'text-green-600' : 
                        plan.id === 'lider' ? 'text-purple-600' : 'text-blue-600'
                      }`} />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-lg">{plan.description}</CardDescription>
                  <div className="text-center mt-4">
                    <span className="text-4xl font-bold">{displayPrice}</span>
                    <span className="text-muted-foreground">/mes</span>
                    {isYearly && plan.monthlyPrice > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Facturado anualmente: {plan.yearlyPrice}€
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button 
                    className="w-full text-lg py-6 bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    {plan.monthlyPrice === 0 ? "Empezar gratis" : "Empezar ahora"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Additional Features Section */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-center mb-12">¿Qué incluyen las Ventajas IA?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-purple-100">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <h4 className="text-xl font-semibold mb-3">Descripciones automáticas</h4>
              <p className="text-muted-foreground">
                IA genera descripciones atractivas y profesionales para tus propiedades
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h4 className="text-xl font-semibold mb-3">Respuestas inteligentes</h4>
              <p className="text-muted-foreground">
                Sugerencias automáticas para responder consultas de clientes
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-green-100">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h4 className="text-xl font-semibold mb-3">Análisis de mercado</h4>
              <p className="text-muted-foreground">
                Informes automáticos sobre tendencias y valoraciones de propiedades
              </p>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20 p-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl text-white">
          <h3 className="text-3xl font-bold mb-4">¿Listo para transformar tu agencia?</h3>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Únete a las agencias que ya están liderando el mercado inmobiliario con RealistaPro
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
            Hablar con un experto
          </Button>
        </div>
      </div>
    </div>
  );
}