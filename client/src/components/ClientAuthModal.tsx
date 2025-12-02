import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/user-context";
import { Eye, EyeOff } from "lucide-react";

const registerSchema = z.object({
  email: z.string()
    .min(1, "El correo electrónico es requerido")
    .email("Por favor, introduce un email válido"),
  emailConfirm: z.string()
    .min(1, "Confirma tu correo electrónico"),
  password: z.string()
    .min(8, "Incluye al menos 8 caracteres")
    .regex(/[A-Z]/, "Incluye una mayúscula")
    .regex(/[a-z]/, "Incluye una minúscula")
    .regex(/[0-9]/, "Incluye un número")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Incluye un carácter especial"),
}).refine((data) => data.email === data.emailConfirm, {
  message: "Los correos electrónicos no coinciden",
  path: ["emailConfirm"],
});

const loginSchema = z.object({
  email: z.string()
    .min(1, "El correo electrónico es requerido")
    .email("Por favor, introduce un email válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

interface ClientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ClientAuthModal({ isOpen, onClose, onSuccess }: ClientAuthModalProps) {
  const { toast } = useToast();
  const { setUser } = useUser();
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      emailConfirm: "",
      password: "",
    },
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleRegister = async (data: z.infer<typeof registerSchema>) => {
    setIsSubmitting(true);
    try {
      const clientData = {
        name: data.email.split('@')[0],
        surname: "",
        email: data.email,
        phone: "",
        password: data.password,
        propertyInterest: "",
        budget: null,
        notes: "Cliente registrado desde aplicación de propiedad",
      };

      const response = await fetch("/api/clients/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        toast({
          title: "¡Cuenta creada con éxito!",
          description: "Ya puedes enviar tu solicitud.",
          duration: 3000,
        });
        registerForm.reset();
        if (onSuccess) onSuccess();
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

  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    try {
      const userData = await apiRequest("POST", "/api/auth/login", data);
      setUser(userData);
      toast({
        title: "¡Bienvenido de nuevo!",
        duration: 3000,
      });
      loginForm.reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "El email o la contraseña no son correctos",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModeSwitch = () => {
    setIsLoginMode(!isLoginMode);
    registerForm.reset();
    loginForm.reset();
  };

  const handleClose = () => {
    registerForm.reset();
    loginForm.reset();
    setIsLoginMode(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(newOpen) => {
      if (!newOpen) handleClose();
    }}>
      <DialogContent className="sm:max-w-[400px]" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isLoginMode ? "Iniciar sesión" : "Crear cuenta"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isLoginMode 
              ? "Introduce tu email y contraseña para iniciar sesión" 
              : "Crea una cuenta para aplicar a propiedades"}
          </DialogDescription>
        </DialogHeader>

        {isLoginMode ? (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tu email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="tu@email.com" 
                        type="email"
                        autoComplete="email"
                        data-testid="input-login-email"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          data-testid="input-login-password"
                          {...field}
                          value={field.value ?? ""}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          <span className="sr-only">{showPassword ? "Ocultar" : "Mostrar"}</span>
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-[#00A8E8] hover:bg-[#0090c5]"
                disabled={isSubmitting}
                data-testid="button-login-submit"
              >
                {isSubmitting ? "Iniciando sesión..." : "Continuar"}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tu email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="tu@email.com" 
                        type="email"
                        autoComplete="email"
                        data-testid="input-register-email"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="emailConfirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repite tu email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="tu@email.com" 
                        type="email"
                        autoComplete="off"
                        data-testid="input-register-email-confirm"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Elige una contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          data-testid="input-register-password"
                          {...field}
                          value={field.value ?? ""}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                        >
                          {showPassword ? "Ocultar" : "Mostrar"}
                        </button>
                      </div>
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">
                      Incluye al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-[#00A8E8] hover:bg-[#0090c5]"
                disabled={isSubmitting}
                data-testid="button-register-submit"
              >
                {isSubmitting ? "Creando cuenta..." : "Continuar"}
              </Button>
            </form>
          </Form>
        )}

        <div className="text-center text-sm mt-2">
          {isLoginMode ? (
            <span>
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                onClick={handleModeSwitch}
                className="text-[#00A8E8] hover:underline font-medium"
                data-testid="link-switch-to-register"
              >
                Crear cuenta
              </button>
            </span>
          ) : (
            <span>
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={handleModeSwitch}
                className="text-[#00A8E8] hover:underline font-medium"
                data-testid="link-switch-to-login"
              >
                Iniciar sesión
              </button>
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
