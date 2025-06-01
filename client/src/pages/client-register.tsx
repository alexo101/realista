import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, User, Mail, Lock, Phone, Eye, EyeOff } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Por favor introduce un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type FormData = z.infer<typeof formSchema>;

export default function ClientRegisterPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Preparar los datos del cliente
      const clientData = {
        name: data.name,
        surname: "", // Campo simplificado
        email: data.email,
        phone: "000000000", // Campo requerido con valor por defecto
        password: data.password,
        // Datos adicionales para el registro de cliente
        propertyInterest: "", // Se puede completar más tarde
        budget: null, // Se puede completar más tarde
        notes: "Cliente registrado desde la web", // Nota para identificar el origen
      };

      const response = await apiRequest("POST", "/api/clients/register", clientData);

      if (response.ok) {
        toast({
          title: "¡Registro exitoso!",
          description: "Tu cuenta ha sido creada. Ya puedes iniciar sesión.",
          duration: 5000,
        });

        // Redirigir a la página de login después del registro exitoso
        navigate("/login");
      } else {
        const error = await response.json();
        toast({
          title: "Error en el registro",
          description: error.message || "No se pudo crear la cuenta",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error. Por favor, inténtalo de nuevo.",
        variant: "destructive",
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Crea tu cuenta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Regístrate para buscar propiedades y contactar con agentes
          </p>
        </div>

        <div className="flex gap-8">
          {/* Formulario de registro */}
          <div className="w-full lg:w-1/2">
            <Card>
              <CardHeader>
                <CardTitle>Información personal</CardTitle>
                <CardDescription>
                  Completa tus datos para crear tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Tu nombre"
                                className="pl-10"
                                {...field}
                              />
                            </div>
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
                          <FormLabel>Correo electrónico</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="tu@email.com"
                                type="email"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Tu contraseña"
                                type={showPassword ? "text" : "password"}
                                className="pl-10 pr-10"
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
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
              </CardContent>
            </Card>
          </div>

          {/* Columna de información */}
          <div className="hidden lg:block lg:w-1/2">
            <Card className="h-full bg-primary/5">
              <CardContent className="p-8 h-full flex flex-col justify-center">
                <h2 className="text-2xl font-bold mb-4">Encuentra tu hogar ideal</h2>
                <div className="space-y-4 text-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <p>
                      Accede a miles de propiedades en venta y alquiler en toda España
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <p>
                      Contacta directamente con agentes inmobiliarios profesionales
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <p>
                      Recibe notificaciones de nuevas propiedades que coincidan con tus criterios
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <p>
                      Programa visitas y gestiona todo el proceso desde un solo lugar
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}