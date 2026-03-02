import { Footer } from "@/components/Footer";

export default function TerminosCondiciones() {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-white">
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-8">TÉRMINOS Y CONDICIONES DE USO</h1>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">1. Naturaleza del servicio</h2>
          <p>
            realista.homes es una plataforma digital que actúa como intermediaria entre usuarios que publican inmuebles y
            usuarios interesados.
          </p>
          <p>La plataforma no es propietaria de los inmuebles publicados salvo indicación expresa.</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">2. Registro</h2>
          <p>
            Para utilizar determinados servicios es obligatorio crear una cuenta proporcionando información veraz y
            actualizada.
          </p>
          <p>El usuario es responsable de custodiar sus credenciales.</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">3. Pagos y comisiones</h2>
          <p>La plataforma podrá cobrar:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Comisiones por publicación</li>
            <li>Comisiones por transacción</li>
            <li>Servicios adicionales</li>
          </ul>
          <p>Los pagos se gestionan mediante proveedor externo de servicios de pago.</p>
          <p>La plataforma no almacena datos completos de tarjetas.</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">4. Obligaciones de los usuarios</h2>
          <p>Los usuarios se comprometen a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>No publicar información falsa</li>
            <li>Cumplir la normativa inmobiliaria</li>
            <li>No infringir derechos de terceros</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">5. Responsabilidad</h2>
          <p>La plataforma actúa como intermediaria tecnológica y no garantiza:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>La veracidad de los anuncios</li>
            <li>El éxito de las operaciones</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">6. Cancelaciones y reembolsos</h2>
          <p>
            Las condiciones de cancelación y devolución dependerán del tipo de servicio contratado y serán detalladas en cada
            caso.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">7. Resolución de conflictos</h2>
          <p>Las partes se someten a la legislación española.</p>
        </section>
      </main>

      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  );
}
