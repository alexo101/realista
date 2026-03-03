import { useEffect, useState } from "react";

const COOKIE_BANNER_DISMISSED_KEY = "cookie_banner_dismissed_v1";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(COOKIE_BANNER_DISMISSED_KEY) === "true";
    setIsVisible(!isDismissed);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(COOKIE_BANNER_DISMISSED_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-sm text-gray-700">
          Este sitio utiliza únicamente cookies técnicas esenciales para su funcionamiento. No se
          utilizan cookies de seguimiento ni publicidad.{" "}
          <a href="/politica-privacidad" className="font-medium text-primary underline">
            Más información
          </a>
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          className="inline-flex w-fit items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
