import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Star, Users, Building, FileText, MessageSquare, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";

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
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  
  const currentPlans = profileType === "agencies" ? agencyPlans : agentPlans;
  
  const getDisplayPrice = (plan: any) => {
    if (plan.monthlyPrice === 0) return "Gratis";
    
    if (isYearly) {
      const monthlyEquivalent = Math.floor(plan.yearlyPrice / 12);
      return `${monthlyEquivalent}€`;
    }
    return `${plan.monthlyPrice}€`;
  };

  const handlePlanSelection = (plan: any) => {
    // Redirect to registration with plan parameters
    const params = new URLSearchParams({
      plan: plan.id,
      type: profileType === "agencies" ? "agency" : "agent",
      billing: isYearly ? "yearly" : "monthly"
    });
    navigate(`/register?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              {t('realista_pro.title')}
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('realista_pro.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-lg">
            <div className="flex items-center gap-2">
              <Building className="h-6 w-6" />
              <span>{t('realista_pro.crm')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              <span>{t('realista_pro.ai')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              <span>{t('realista_pro.reviews')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">{t('realista_pro.choose_plan')}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('realista_pro.flexible_plans')}
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
              {t('realista_pro.agencies')}
            </Button>
            <Button
              variant={profileType === "agents" ? "default" : "ghost"}
              onClick={() => setProfileType("agents")}
              className="px-6 py-2"
            >
              <User className="h-4 w-4 mr-2" />
              {t('realista_pro.agents')}
            </Button>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <span className={`text-lg ${!isYearly ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
            {t('realista_pro.monthly')}
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="scale-125"
          />
          <span className={`text-lg ${isYearly ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
            {t('realista_pro.yearly')}
          </span>
          
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
                className={`relative transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col h-full ${plan.color}`}
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
                    <span className="text-muted-foreground">{t('realista_pro.per_month')}</span>
                    {isYearly && plan.monthlyPrice > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Facturado anualmente: {plan.yearlyPrice}€
                      </div>
                    )}
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
                    onClick={() => handlePlanSelection(plan)}
                  >
                    {plan.monthlyPrice === 0 ? t('realista_pro.start_free') : t('realista_pro.start_now')}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Additional Features Section */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-center mb-12">{t('realista_pro.ai_features')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Card className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-purple-100">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <h4 className="text-xl font-semibold mb-3">{t('realista_pro.auto_descriptions')}</h4>
              <p className="text-muted-foreground">
                {t('realista_pro.auto_descriptions_desc')}
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h4 className="text-xl font-semibold mb-3">{t('realista_pro.smart_responses')}</h4>
              <p className="text-muted-foreground">
                {t('realista_pro.smart_responses_desc')}
              </p>
            </Card>
          </div>
        </div>

        
      </div>
    </div>
  );
}