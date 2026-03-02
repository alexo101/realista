import { Footer } from "@/components/Footer";

export default function PoliticaCookies() {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-white">
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-8">POLÍTICA DE COOKIES</h1>

        <section className="space-y-4 mb-8">
          <p>El sitio realista.homes utiliza cookies propias y de terceros.</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Tipos de cookies</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Técnicas (necesarias para el funcionamiento)</li>
            <li>Analíticas</li>
            <li>Publicitarias (si aplicara)</li>
          </ul>
          <p>Las cookies no esenciales se instalarán únicamente tras consentimiento del usuario.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Gestión del consentimiento</h2>
          <p>El usuario podrá:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Aceptar todas</li>
            <li>Rechazar todas</li>
            <li>Configurar preferencias</li>
          </ul>
          <p>Puede modificar su consentimiento en cualquier momento desde el panel de configuración.</p>
        </section>
      </main>

      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  );
}
