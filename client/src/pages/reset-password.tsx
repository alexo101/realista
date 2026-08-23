import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { getPasswordRequirementErrors, PASSWORD_REQUIREMENTS } from "@shared/password-policy";

type ResetStatus = "loading" | "valid" | "invalid" | "success";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<ResetStatus>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const validateToken = async () => {
      if (!token) {
        setStatus("invalid");
        return;
      }

      try {
        await apiRequest("GET", `/api/auth/reset-password/${encodeURIComponent(token)}`);
        if (isMounted) setStatus("valid");
      } catch {
        if (isMounted) setStatus("invalid");
      }
    };

    validateToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const requirementErrors = getPasswordRequirementErrors(password);
    if (requirementErrors.length > 0) {
      setError(`La contraseña debe incluir ${requirementErrors.join(", ")}.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/auth/reset-password", {
        token,
        password,
        confirmPassword,
      });
      setStatus("success");
    } catch (requestError: any) {
      setError(requestError.message || "No se pudo actualizar la contraseña.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <CardTitle>Enlace no válido</CardTitle>
            <CardDescription>
              Este enlace de restablecimiento ha caducado o ya no es válido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/recuperar-contrasena")}>
              Solicitar un nuevo enlace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <CardTitle>Contraseña actualizada</CardTitle>
            <CardDescription>
              Ya puedes iniciar sesión con tu nueva contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/iniciar-sesion"
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Iniciar sesión
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Crea una nueva contraseña</CardTitle>
          <CardDescription>
            Elige una contraseña segura para proteger tu cuenta de Realista.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  data-testid="input-new-password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                data-testid="input-confirm-password"
              />
            </div>

            <ul className="space-y-1 text-sm text-muted-foreground" aria-label="Requisitos de contraseña">
              {PASSWORD_REQUIREMENTS.map((requirement) => {
                const isMet = requirement.test(password);
                return (
                  <li key={requirement.key} className={isMet ? "text-green-600" : undefined}>
                    {isMet ? "✓" : "•"} {requirement.label}
                  </li>
                );
              })}
            </ul>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              data-testid="button-reset-password"
            >
              {isSubmitting ? "Actualizando..." : "Restablecer contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
