import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, Building, FileText, MessageSquare, Sparkles } from "lucide-react";

const plans = [
  {
    id: "basica",
    name: "Agencia Básica",
    price: "29€",
    period: "/mes",
    description: "Perfil básico para empezar",
    popular: false,
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
    price: "79€",
    period: "/mes",
    description: "Para pequeños equipos",
    popular: false,
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
    price: "149€", 
    period: "/mes",
    description: "Para equipos en crecimiento",
    popular: true,
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
    price: "299€",
    period: "/mes", 
    description: "Para grandes agencias",
    popular: false,
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

export default function RealistaPro() {
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
            Desde agencias que empiezan hasta líderes del mercado, tenemos el plan ideal para ti
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-300 hover:scale-105 hover:shadow-xl ${plan.color} ${
                  plan.popular ? 'ring-2 ring-green-500 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-1">
                    Más Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      plan.id === 'basica' ? 'bg-gray-200' :
                      plan.id === 'pequeña' ? 'bg-blue-200' :
                      plan.id === 'mediana' ? 'bg-green-200' : 'bg-purple-200'
                    }`}>
                      <IconComponent className={`h-8 w-8 ${
                        plan.id === 'basica' ? 'text-gray-600' :
                        plan.id === 'pequeña' ? 'text-blue-600' :
                        plan.id === 'mediana' ? 'text-green-600' : 'text-purple-600'
                      }`} />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-lg">{plan.description}</CardDescription>
                  <div className="text-center mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
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
                    className={`w-full text-lg py-6 ${
                      plan.popular 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                    size="lg"
                  >
                    Empezar ahora
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