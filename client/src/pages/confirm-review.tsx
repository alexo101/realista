import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ConfirmationStatus = "loading" | "success" | "already_confirmed" | "error" | "not_found";

export default function ConfirmReview() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<ConfirmationStatus>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const confirmReview = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Token de confirmación no proporcionado");
        return;
      }

      try {
        const response = await fetch(`/api/reviews/confirm/${token}`);
        const data = await response.json();

        if (response.ok) {
          if (data.alreadyConfirmed) {
            setStatus("already_confirmed");
            setMessage(data.message);
          } else {
            setStatus("success");
            setMessage(data.message);
          }
        } else if (response.status === 404) {
          setStatus("not_found");
          setMessage(data.message || "Enlace de confirmación no válido");
        } else {
          setStatus("error");
          setMessage(data.message || "Error al confirmar la reseña");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Error de conexión. Por favor, inténtalo de nuevo.");
      }
    };

    confirmReview();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center">
          {status === "loading" && (
            <div className="space-y-4">
              <Loader2 className="w-16 h-16 mx-auto text-blue-600 animate-spin" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Confirmando tu reseña...
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Por favor, espera un momento.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                ¡Reseña publicada!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {message}
              </p>
              <div className="flex items-center justify-center gap-1 text-yellow-500">
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Gracias por compartir tu experiencia con la comunidad.
              </p>
              <Link href="/">
                <Button className="mt-4" data-testid="button-go-home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al inicio
                </Button>
              </Link>
            </div>
          )}

          {status === "already_confirmed" && (
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Ya confirmada
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {message}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Tu reseña ya está visible en el perfil correspondiente.
              </p>
              <Link href="/">
                <Button className="mt-4" variant="outline" data-testid="button-go-home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al inicio
                </Button>
              </Link>
            </div>
          )}

          {(status === "error" || status === "not_found") && (
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {status === "not_found" ? "Enlace no válido" : "Error"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {message}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {status === "not_found" 
                  ? "Es posible que este enlace haya expirado o ya no sea válido."
                  : "Ha ocurrido un error al procesar tu solicitud."}
              </p>
              <Link href="/">
                <Button className="mt-4" variant="outline" data-testid="button-go-home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al inicio
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
