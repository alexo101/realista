import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/language-context";

export default function TerminosCondiciones() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-white">
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-8">{t("legal.terms.title")}</h1>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">{t("legal.terms.section_1")}</h2>
          <p>{t("legal.terms.section_1_text")}</p>
          <p>{t("legal.terms.section_1_text_2")}</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">{t("legal.terms.section_2")}</h2>
          <p>{t("legal.terms.section_2_text")}</p>
          <p>{t("legal.terms.section_2_text_2")}</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">{t("legal.terms.section_3")}</h2>
          <p>{t("legal.terms.section_3_intro")}</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t("legal.terms.section_3_1")}</li>
            <li>{t("legal.terms.section_3_2")}</li>
            <li>{t("legal.terms.section_3_3")}</li>
          </ul>
          <p>{t("legal.terms.section_3_text")}</p>
          <p>{t("legal.terms.section_3_text_2")}</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">{t("legal.terms.section_4")}</h2>
          <p>{t("legal.terms.section_4_intro")}</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t("legal.terms.section_4_1")}</li>
            <li>{t("legal.terms.section_4_2")}</li>
            <li>{t("legal.terms.section_4_3")}</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">{t("legal.terms.section_5")}</h2>
          <p>{t("legal.terms.section_5_intro")}</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t("legal.terms.section_5_1")}</li>
            <li>{t("legal.terms.section_5_2")}</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">{t("legal.terms.section_6")}</h2>
          <p>{t("legal.terms.section_6_text")}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">{t("legal.terms.section_7")}</h2>
          <p>{t("legal.terms.section_7_text")}</p>
        </section>
      </main>

      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  );
}
