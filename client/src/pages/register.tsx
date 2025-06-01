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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/user-context";
import { Building, User as UserIcon, Users, Eye, EyeOff } from "lucide-react";

// Esquema de validación para el formulario
const formSchema = z.object({
  profileType: z.enum(["agent", "agency"], {
    required_error: "Por favor selecciona un tipo de perfil",
  }),
  email: z.string().email("Por favor introduce un correo electrónico válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

type FormData = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const { setUser } = useUser();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Configuración del formulario
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profileType: "agent",
      email: "",
      password: "",
    },
  });

  // Manejar envío del formulario
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Determinar si el usuario será un agente admin basado en la selección
      const isAdmin = data.profileType === "agency";
      const isAgencyNetwork = data.profileType === "agencyNetwork";

      // Preparamos el payload según el tipo de perfil seleccionado
      const payload = {
        email: data.email,
        password: data.password,
        isAgent: true, // Todos los usuarios son agentes en la base de datos
        isAdmin: isAdmin, // Para agencias y redes de agencias
        // Para redes de agencias, podemos añadir propiedades adicionales en el futuro
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
        } else if (data.profileType === "agencyNetwork") {
          successMessage = "Tu red de agencias ha sido registrada correctamente. Ahora puedes configurar tu red.";
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