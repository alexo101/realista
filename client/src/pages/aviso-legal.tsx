import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/language-context";

export default function AvisoLegal() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-white">
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-8">{t("legal.notice.title")}</h1>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">{t("legal.notice.web_owner")}</h2>
          <p>
            {t("legal.notice.web_owner_text")}
          </p>
          <p>
            {t("legal.notice.owner")}
            <br />
            {t("legal.notice.nif")}
            <br />
            {t("legal.notice.address")}
            <br />
            {t("legal.notice.contact")}
          </p>
          <p>
            {t("legal.notice.company_update")}
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">{t("legal.notice.object")}</h2>
          <p>
            {t("legal.notice.object_text")}
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">{t("legal.notice.terms")}</h2>
          <p>{t("legal.notice.terms_text")}</p>
          <p>{t("legal.notice.user_commitment")}</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t("legal.notice.use_1")}</li>
            <li>{t("legal.notice.use_2")}</li>
            <li>{t("legal.notice.use_3")}</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">{t("legal.notice.ip")}</h2>
          <p>{t("legal.notice.ip_text")}</p>
          <p>{t("legal.notice.ip_text_2")}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">{t("legal.notice.liability")}</h2>
          <p>{t("legal.notice.liability_text")}</p>
        </section>
      </main>

      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  );
}
