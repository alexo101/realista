import { Footer } from "@/components/Footer";

export default function PoliticaPrivacidad() {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-white">
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-8">POLÍTICA DE PRIVACIDAD</h1>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Responsable del tratamiento</h2>
          <p>
            Responsable: [Nombre y Apellidos o futura sociedad]
            <br />
            NIF: [NIF]
            <br />
            Email: contacto@realista.homes
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Datos que recopilamos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Datos identificativos (nombre, email)</li>
            <li>Datos de facturación</li>
            <li>Datos de contacto</li>
            <li>Información de uso de la plataforma</li>
            <li>Datos de pago (gestionados a través de proveedor externo)</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Finalidad</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Gestión de cuentas de usuario</li>
            <li>Gestión de pagos y comisiones</li>
            <li>Prestación de servicios de intermediación</li>
            <li>Cumplimiento de obligaciones legales</li>
            <li>Envío de comunicaciones relacionadas con el servicio</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Base jurídica</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Ejecución de contrato</li>
            <li>Consentimiento del usuario</li>
            <li>Cumplimiento de obligación legal</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Conservación</h2>
          <p>
            Los datos se conservarán mientras exista relación contractual y posteriormente durante los plazos exigidos por
            normativa fiscal y mercantil.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Destinatarios</h2>
          <p>Podrán acceder a los datos:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Proveedores tecnológicos</li>
            <li>Proveedores de servicios de pago</li>
            <li>Autoridades competentes cuando exista obligación legal</li>
          </ul>
          <p>
            Si existen transferencias internacionales, se garantizarán mediante mecanismos adecuados conforme al RGPD.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Derechos del usuario</h2>
          <p>El usuario puede ejercer:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Acceso</li>
            <li>Rectificación</li>
            <li>Supresión</li>
            <li>Oposición</li>
            <li>Limitación</li>
            <li>Portabilidad</li>
          </ul>
          <p>
            Enviando solicitud a privacidad@realista.homes.
            <br />
            Asimismo, podrá presentar reclamación ante la Agencia Española de Protección de Datos.
          </p>
        </section>
      </main>

      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  );
}
