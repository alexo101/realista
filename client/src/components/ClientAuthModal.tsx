import { useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/user-context";
import { Eye, EyeOff } from "lucide-react";

interface ClientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ClientAuthModal({ isOpen, onClose, onSuccess }: ClientAuthModalProps) {
  const { toast } = useToast();
  const { setUser } = useUser();
  const [, navigate] = useLocation();
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state using useState instead of react-hook-form
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ email?: string; emailConfirm?: string; password?: string; phone?: string }>({});

  const validateLogin = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Por favor, introduce un email válido";
    }
    
    if (!password) {
      newErrors.password = "La contraseña es obligatoria";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors: { email?: string; emailConfirm?: string; password?: string; phone?: string } = {};
    
    if (!email) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Por favor, introduce un email válido";
    }
    
    if (!emailConfirm) {
      newErrors.emailConfirm = "Confirma tu correo electrónico";
    } else if (email !== emailConfirm) {
      newErrors.emailConfirm = "Los correos electrónicos no coinciden";
    }
    
    if (!phone) {
      newErrors.phone = "El teléfono es obligatorio";
    } else if (!/^[6-9]\d{8}$/.test(phone.replace(/\s/g, ""))) {
      newErrors.phone = "Introduce un teléfono español válido (9 dígitos, empezando por 6, 7, 8 o 9)";
    }
    
    if (!password) {
      newErrors.password = "La contraseña es obligatoria";
    } else if (password.length < 8) {
      newErrors.password = "Incluye al menos 8 caracteres";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Incluye una mayúscula";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = "Incluye una minúscula";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Incluye un número";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      newErrors.password = "Incluye un carácter especial";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegister()) return;
    
    setIsSubmitting(true);
    try {
      const clientData = {
        name: email.split('@')[0],
        surname: "",
        email: email,
        phone: phone.replace(/\s/g, ""),
        password: password,
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
        resetForm();
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLogin()) return;
    
    setIsSubmitting(true);
    try {
      const userData = await apiRequest("POST", "/api/auth/login", { email, password });
      setUser(userData);
      toast({
        title: "¡Bienvenido de nuevo!",
        duration: 3000,
      });
      resetForm();
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

  const resetForm = () => {
    setEmail("");
    setEmailConfirm("");
    setPassword("");
    setPhone("");
    setErrors({});
  };

  const handleModeSwitch = () => {
    setIsLoginMode(!isLoginMode);
    resetForm();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      setIsLoginMode(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Tu email</Label>
              <Input 
                id="login-email"
                placeholder="tu@email.com" 
                type="email"
                autoComplete="email"
                data-testid="input-login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Contraseña</Label>
              <div className="relative">
                <Input 
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  data-testid="input-login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <button
              type="button"
              className="w-full text-right text-sm text-[#00A8E8] hover:underline"
              onClick={() => {
                onClose();
                navigate("/recuperar-contrasena");
              }}
            >
              ¿Has olvidado tu contraseña?
            </button>

            <Button 
              type="submit" 
              className="w-full bg-[#00A8E8] hover:bg-[#0090c5]"
              disabled={isSubmitting}
              data-testid="button-login-submit"
            >
              {isSubmitting ? "Iniciando sesión..." : "Continuar"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register-email">Tu email</Label>
              <Input 
                id="register-email"
                placeholder="tu@email.com" 
                type="email"
                autoComplete="email"
                data-testid="input-register-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email-confirm">Repite tu email</Label>
              <Input 
                id="register-email-confirm"
                placeholder="tu@email.com" 
                type="email"
                autoComplete="off"
                data-testid="input-register-email-confirm"
                value={emailConfirm}
                onChange={(e) => setEmailConfirm(e.target.value)}
              />
              {errors.emailConfirm && (
                <p className="text-sm text-red-500">{errors.emailConfirm}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-phone">Teléfono</Label>
              <Input
                id="register-phone"
                placeholder="612345678"
                type="tel"
                inputMode="numeric"
                maxLength={9}
                autoComplete="tel"
                data-testid="input-register-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">Elige una contraseña</Label>
              <div className="relative">
                <Input 
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  data-testid="input-register-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Incluye al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial
              </p>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#00A8E8] hover:bg-[#0090c5]"
              disabled={isSubmitting}
              data-testid="button-register-submit"
            >
              {isSubmitting ? "Creando cuenta..." : "Continuar"}
            </Button>
          </form>
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
