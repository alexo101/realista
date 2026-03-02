import { Footer } from "@/components/Footer";

export default function AvisoLegal() {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-white">
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-8">AVISO LEGAL</h1>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Titular del sitio web</h2>
          <p>
            En cumplimiento de lo dispuesto en la normativa española de servicios digitales, se informa que el presente
            sitio web, realista.homes, es titularidad de:
          </p>
          <p>
            Titular: [Nombre y Apellidos del promotor]
            <br />
            NIF: [NIF]
            <br />
            Domicilio: [Dirección completa]
            <br />
            Correo electrónico de contacto: [contacto@realista.homes]
          </p>
          <p>
            En caso de que la actividad pase a ser desarrollada por una sociedad mercantil, los datos anteriores serán
            actualizados conforme a su inscripción registral.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Objeto</h2>
          <p>
            El presente sitio web tiene por objeto ofrecer una plataforma digital de intermediación inmobiliaria que permite
            a usuarios publicar, buscar y contratar servicios relacionados con inmuebles.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Condiciones de uso</h2>
          <p>El acceso y uso del sitio web atribuye la condición de usuario e implica la aceptación plena de las presentes condiciones.</p>
          <p>El usuario se compromete a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Hacer un uso adecuado y lícito del sitio.</li>
            <li>No realizar actividades fraudulentas.</li>
            <li>No introducir contenidos ilícitos o lesivos.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Propiedad intelectual</h2>
          <p>
            Todos los contenidos del sitio (textos, diseños, logotipos, software) son titularidad del titular o cuentan con
            licencia legítima.
          </p>
          <p>Queda prohibida su reproducción sin autorización expresa.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Responsabilidad</h2>
          <p>
            El titular no garantiza la disponibilidad continua del sitio ni se responsabiliza de daños derivados del uso
            indebido del mismo.
          </p>
        </section>
      </main>

      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  );
}
