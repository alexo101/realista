import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

const confirmationMessage =
  "Si existe una cuenta con este correo, te hemos enviado un enlace para restablecer la contraseña.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (requestError: any) {
      setError(requestError.message || "No se pudo procesar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          {submitted ? (
            <CheckCircle2 className="mb-2 h-12 w-12 text-green-600" />
          ) : (
            <Mail className="mb-2 h-12 w-12 text-primary" />
          )}
          <CardTitle>
            {submitted ? "Revisa tu correo" : "Recuperar contraseña"}
          </CardTitle>
          <CardDescription>
            {submitted
              ? confirmationMessage
              : "Introduce tu correo electrónico y te enviaremos un enlace para crear una nueva contraseña."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <Link
              href="/iniciar-sesion"
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Volver a iniciar sesión
            </Link>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="recovery-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="recovery-email"
                    type="email"
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    className="pl-10"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    data-testid="input-recovery-email"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <LoadingButton
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
                loadingText="Enviando..."
                data-testid="button-send-reset-link"
              >
                Enviar enlace de restablecimiento
              </LoadingButton>
              <Link
                href="/iniciar-sesion"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a iniciar sesión
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
