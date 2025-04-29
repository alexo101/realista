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
import { Building, Home, Lock, Mail } from "lucide-react";

// Esquema de validación para el formulario
const formSchema = z.object({
  email: z.string().email("Por favor introduce un correo electrónico válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type FormData = z.infer<typeof formSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const { setUser } = useUser();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [userName, setUserName] = useState("");

  // Configuración del formulario
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Verificar si el email existe cuando el usuario lo introduce
  const checkEmail = async (email: string) => {
    try {
      const response = await apiRequest("GET", `/api/users/check-email?email=${email}`);
      if (response.ok) {
        const data = await response.json();
        setEmailExists(data.exists);
        setUserName(data.name || email.split('@')[0]);
      }
    } catch (error) {
      console.error("Error al verificar email:", error);
    }
  };

  // Observar cambios en el campo de email
  const email = form.watch("email");
  if (email && email.includes("@") && email.includes(".")) {
    // Solo verificar cuando parece un email válido
    if (emailExists === null) {
      checkEmail(email);
    }
  } else if (emailExists !== null) {
    // Resetear estado si el email se borra o modifica
    setEmailExists(null);
    setUserName("");
  }

  // Manejar envío del formulario
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const endpoint = emailExists ? "/api/auth/login" : "/api/auth/register";
      
      const payload = {
        email: data.email,
        password: data.password,
      };

      console.log("Enviando datos de autenticación:", payload);
      
      const response = await apiRequest("POST", endpoint, payload);

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        toast({
          title: emailExists ? "Inicio de sesión exitoso" : "Registro exitoso",
          description: emailExists 
            ? "Has iniciado sesión correctamente" 
            : "Tu cuenta ha sido creada correctamente",
        });
        
        // Redirigir a la página principal o de gestión
        navigate("/");
      } else {
        const error = await response.json();
        toast({
          title: emailExists ? "Error al iniciar sesión" : "Error al registrarse",
          description: error.message || "Ha ocurrido un error. Por favor, inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error durante la autenticación:", error);
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
    <div className="container mx-auto pt-24 pb-12">
      <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
        {/* Columna de formulario */}
        <div className="lg:w-1/2 bg-white p-8 rounded-lg shadow">
          <h1 className="text-3xl font-bold mb-6">
            {emailExists === true 
              ? `Bienvenido de nuevo, ${userName}` 
              : emailExists === false 
                ? "Regístrate en Realista" 
                : "Iniciar sesión o registrarse"}
          </h1>
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

              {form.watch("email") && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {emailExists ? "Contraseña" : "Crea tu contraseña"}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder={emailExists ? "Tu contraseña" : "Crea una contraseña segura"}
                            type="password"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      {!emailExists && (
                        <p className="text-sm text-gray-500 mt-1">
                          La contraseña debe tener al menos 8 caracteres. Se recomienda incluir letras, números y símbolos.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? "Procesando..." 
                  : emailExists 
                    ? "Iniciar sesión" 
                    : "Crear cuenta"}
              </Button>

              {emailExists === false && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  ¿Quieres registrarte como agencia?{" "}
                  <a
                    href="/register"
                    className="text-primary hover:underline"
                  >
                    Registra tu agencia
                  </a>
                </p>
              )}
            </form>
          </Form>
        </div>

        {/* Columna de hero/información */}
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