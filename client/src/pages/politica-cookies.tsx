import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/language-context";

export default function PoliticaCookies() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-white">
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-8">{t("legal.cookies.title")}</h1>

        <section className="space-y-4 mb-8">
          <p>{t("legal.cookies.intro")}</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">{t("legal.cookies.types")}</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t("legal.cookies.types_1")}</li>
            <li>{t("legal.cookies.types_2")}</li>
            <li>{t("legal.cookies.types_3")}</li>
          </ul>
          <p>{t("legal.cookies.non_essential")}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">{t("legal.cookies.management")}</h2>
          <p>{t("legal.cookies.user_can")}</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t("legal.cookies.action_1")}</li>
            <li>{t("legal.cookies.action_2")}</li>
            <li>{t("legal.cookies.action_3")}</li>
          </ul>
          <p>{t("legal.cookies.change")}</p>
        </section>
      </main>

      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  );
}
