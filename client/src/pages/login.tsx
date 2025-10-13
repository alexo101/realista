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
import { useUser } from "@/contexts/user-context";
import { Building, Home, Lock, Mail, Eye, EyeOff } from "lucide-react";

const formSchema = z.object({
  email: z.string()
    .min(1, "El correo electrónico es requerido")
    .regex(
      /^[\p{L}0-9._%+-]+@[\p{L}0-9.-]+\.[\p{L}]{2,}$/u,
      "Por favor introduce un correo electrónico válido"
    ),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type FormData = z.infer<typeof formSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const { setUser } = useUser();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {      
      const userData = await apiRequest("POST", "/api/auth/login", data);
      setUser(userData);

      toast({
        title: "¡Bienvenido de nuevo!",
        duration: 3000,
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "El nombre de usuario o la contraseña que has introducido no son correctos. Comprueba tus datos e inténtalo de nuevo",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto pt-24 pb-12">
      <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
        <div className="lg:w-1/2 bg-white p-8 rounded-lg shadow">
          <h1 className="text-3xl font-bold mb-6">Iniciar sesión</h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="tu@correo.com"
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
                {isSubmitting ? "Procesando..." : "Iniciar sesión"}
              </Button>

              <div className="space-y-2 mt-4">
                <p className="text-center text-sm text-gray-500">
                  ¿Eres agente inmobiliario?{" "}
                  <a
                    href="/realista-pro"
                    className="text-primary hover:underline"
                  >
                    Regístrate como profesional.
                  </a>
                </p>
                <p className="text-center text-sm text-gray-500">
                  ¿Buscas propiedades?{" "}
                  <a
                    href="/client-register"
                    className="text-primary hover:underline"
                  >
                    Crea tu cuenta aquí.
                  </a>
                </p>
              </div>
            </form>
          </Form>
        </div>

        <div className="lg:w-1/2 bg-primary/5 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">La plataforma inmobiliaria de referencia</h2>
          <p className="mb-6 text-gray-700">
            Realista te ofrece las mejores herramientas para encontrar tu hogar ideal o potenciar tu negocio inmobiliario en España.
          </p>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Encuentra tu propiedad ideal</h3>
                <p className="text-sm text-gray-600">
                  Miles de propiedades en venta y alquiler en toda España, con información detallada sobre cada barrio.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Conecta con profesionales</h3>
                <p className="text-sm text-gray-600">
                  Accede a la red de agentes y agencias inmobiliarias más completa del país, con valoraciones de clientes reales.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}