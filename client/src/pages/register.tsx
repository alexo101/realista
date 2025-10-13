import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/user-context";
import { Building, User as UserIcon, Users, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Esquema de validación para el formulario
const formSchema = z.object({
  profileType: z.enum(["agent", "agency"], {
    required_error: "Por favor selecciona un tipo de perfil",
  }),
  email: z.string()
    .min(1, "El correo electrónico es requerido")
    .regex(
      /^[a-zA-Z0-9._%+-ñÑáéíóúÁÉÍÓÚüÜ]+@[a-zA-Z0-9.-ñÑáéíóúÁÉÍÓÚüÜ]+\.[a-zA-Z]{2,}$/,
      "Por favor introduce un correo electrónico válido"
    ),
  name: z.string().optional(),
  surname: z.string().optional(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  subscriptionPlan: z.string().optional(),
  subscriptionType: z.string().optional(),
  isYearlyBilling: z.boolean().default(false),
}).refine(
  (data) => {
    // If profileType is "agency", name and surname are required
    if (data.profileType === "agency") {
      return data.name && data.name.trim().length > 0 && 
             data.surname && data.surname.trim().length > 0;
    }
    return true;
  },
  {
    message: "El nombre y apellido del administrador son requeridos para agencias",
    path: ["name"], // Error will be shown on name field
  }
);

type FormData = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const { setUser } = useUser();
  const [location, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Plan configurations for display
  // Configuración del formulario
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profileType: "agent",
      email: "",
      name: "",
      surname: "",
      password: "",
      subscriptionPlan: "",
      subscriptionType: "",
      isYearlyBilling: false,
    },
  });

  const getPlanDetails = (planId: string, subscriptionType: string) => {
    if (subscriptionType === 'agency') {
      const agencyPlans: Record<string, { name: string, monthlyPrice: number, yearlyPrice: number, color: string }> = {
        "basica": { name: "Básica", monthlyPrice: 0, yearlyPrice: 0, color: "bg-gray-50 border-gray-200" },
        "pequeña": { name: "Pequeña", monthlyPrice: 29, yearlyPrice: 290, color: "bg-blue-50 border-blue-200" },
        "mediana": { name: "Mediana", monthlyPrice: 79, yearlyPrice: 790, color: "bg-purple-50 border-purple-200" },
        "lider": { name: "Líder", monthlyPrice: 249, yearlyPrice: 2490, color: "bg-amber-50 border-amber-200" },
      };
      return agencyPlans[planId];
    } else {
      const agentPlans: Record<string, { name: string, monthlyPrice: number, yearlyPrice: number, color: string }> = {
        "basico": { name: "Básico", monthlyPrice: 0, yearlyPrice: 0, color: "bg-gray-50 border-gray-200" },
        "lider": { name: "Líder", monthlyPrice: 20, yearlyPrice: 200, color: "bg-blue-50 border-blue-200" }
      };
      return agentPlans[planId];
    }
  };

  // Parse URL parameters on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const plan = params.get('plan');
    const type = params.get('type'); // "agency" or "agent"  
    const billing = params.get('billing'); // "monthly" or "yearly"
    
    if (plan) {
      setSelectedPlan(plan);
      form.setValue('subscriptionPlan', plan);
    }
    if (type) {
      form.setValue('subscriptionType', type);
      form.setValue('profileType', type === 'agency' ? 'agency' : 'agent');
    }
    if (billing) {
      form.setValue('isYearlyBilling', billing === 'yearly');
    }
  }, [location, form]);

  // Manejar envío del formulario
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Determinar si el usuario será un agente admin basado en la selección
      const isAdmin = data.profileType === "agency";

      // Preparamos el payload según el tipo de perfil seleccionado
      const payload = {
        email: data.email,
        password: data.password,
        name: data.name || null,
        surname: data.surname || null,
        isAgent: true, // Todos los usuarios son agentes en la base de datos
        isAdmin: isAdmin, // Para agencias y redes de agencias
        subscriptionPlan: data.subscriptionPlan || null,
        subscriptionType: data.subscriptionType || null,
        isYearlyBilling: data.isYearlyBilling || false,
      };

      console.log("Enviando datos de registro:", payload);

      const response = await apiRequest("POST", "/api/auth/register", payload);

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);

        let successMessage = "Tu cuenta ha sido creada correctamente.";

        // Mensaje personalizado según el tipo de perfil
        if (data.profileType === "agency") {
          successMessage = "Tu agencia ha sido registrada correctamente. Ahora puedes completar tu perfil.";
        }

        toast({
          title: "Registro exitoso",
          description: successMessage,
        });

        // Redirigir a la página de gestión con la pestaña adecuada según el tipo de perfil
        if (isAdmin) {
          // Si es una agencia o red de agencias, dirigir a la sección de perfil de agencia
          navigate("/manage?tab=agency-profile");
        } else {
          // Si es un agente, dirigir a la sección de perfil de agente
          navigate("/manage");
        }
      } else {
        const error = await response.json();
        toast({
          title: "Error al registrarse",
          description: error.message || "Ha ocurrido un error. Por favor, inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error durante el registro:", error);
      toast({
        title: "Error al registrarse",
        description: "Ha ocurrido un error. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto pt-24 pb-12">
      <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
        {/* Columna de formulario */}
        <div className="lg:w-1/2 bg-white p-8 rounded-lg shadow">
          <h1 className="text-3xl font-bold mb-6">Crear una cuenta</h1>
          
          {/* Plan Selection Display */}
          {selectedPlan && (() => {
            const planInfo = getPlanDetails(selectedPlan, form.getValues('subscriptionType') || 'agent');
            return planInfo ? (
              <Card className={`mb-6 border-2 ${planInfo.color}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-lg">Plan Seleccionado</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{planInfo.name}</h3>
                      <p className="text-sm text-gray-600">
                        {form.getValues('subscriptionType') === 'agency' ? 'Plan para agencias' : 'Plan para agentes'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {planInfo.monthlyPrice === 0 ? 'Gratis' : 
                         form.getValues('isYearlyBilling') ? 
                           `${Math.floor(planInfo.yearlyPrice / 12)}€` : 
                           `${planInfo.monthlyPrice}€`}
                      </div>
                      <p className="text-sm text-gray-500">por mes</p>
                      {form.getValues('isYearlyBilling') && planInfo.monthlyPrice > 0 && (
                        <p className="text-xs text-green-600 font-medium">2 meses gratis</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null;
          })()}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="profileType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de perfil</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 gap-4"
                      >
                        <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                          <RadioGroupItem value="agent" id="agent" />
                          <UserIcon className="h-6 w-6 text-primary" />
                          <FormLabel htmlFor="agent" className="font-normal cursor-pointer flex-1">
                            <div className="font-medium">Anunciarme como agente</div>
                            <div className="text-sm text-gray-500">Trabaja de forma independiente</div>
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                          <RadioGroupItem value="agency" id="agency" />
                          <Building className="h-6 w-6 text-primary" />
                          <FormLabel htmlFor="agency" className="font-normal cursor-pointer flex-1">
                            <div className="font-medium">Anunciar mi agencia</div>
                            <div className="text-sm text-gray-500">Gestiona una agencia inmobiliaria</div>
                          </FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="tu@correo.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Name and Surname fields - only for agency registration */}
              {form.watch("profileType") === "agency" && (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del administrador</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Juan"
                            type="text"
                            data-testid="input-admin-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="surname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido del administrador</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="García"
                            type="text"
                            data-testid="input-admin-surname"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Crea una contraseña segura"
                          type={showPassword ? "text" : "password"}
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <p className="text-sm text-gray-500 mt-1">
                      La contraseña debe tener al menos 8 caracteres. Se recomienda incluir letras, números y símbolos.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registrando..." : "Crear cuenta"}
              </Button>

              <p className="text-center text-sm text-gray-500 mt-4">
                ¿Ya tienes una cuenta?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/login");
                  }}
                  className="text-primary hover:underline"
                >
                  Inicia sesión
                </a>
              </p>
            </form>
          </Form>
        </div>

        {/* Columna de hero/información */}
        <div className="lg:w-1/2 bg-primary/5 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Impulsa tu negocio inmobiliario</h2>
          <p className="mb-6 text-gray-700">
            Únete a la plataforma inmobiliaria líder en España y conecta con clientes potenciales interesados en propiedades en tu zona de influencia.
          </p>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <UserIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Perfil de agente</h3>
                <p className="text-sm text-gray-600">
                  Ideal para agentes inmobiliarios independientes que quieren promocionar sus servicios y propiedades.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Perfil de agencia</h3>
                <p className="text-sm text-gray-600">
                  Perfecto para agencias inmobiliarias que quieren gestionar sus propiedades y equipo de agentes en una sola plataforma.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}