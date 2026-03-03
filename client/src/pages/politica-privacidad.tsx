import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/language-context";

export default function PoliticaPrivacidad() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-white">
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-8">{t("legal.privacy.title")}</h1>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">{t("legal.privacy.controller")}</h2>
          <p>
            {t("legal.privacy.controller_text")}
            <br />
            {t("legal.notice.nif")}
            <br />
            {t("legal.privacy.email")}
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">{t("legal.privacy.data")}</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t("legal.privacy.data_1")}</li>
            <li>{t("legal.privacy.data_2")}</li>
            <li>{t("legal.privacy.data_3")}</li>
            <li>{t("legal.privacy.data_4")}</li>
            <li>{t("legal.privacy.data_5")}</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">{t("legal.privacy.purpose")}</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t("legal.privacy.purpose_1")}</li>
            <li>{t("legal.privacy.purpose_2")}</li>
            <li>{t("legal.privacy.purpose_3")}</li>
            <li>{t("legal.privacy.purpose_4")}</li>
            <li>{t("legal.privacy.purpose_5")}</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">{t("legal.privacy.basis")}</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t("legal.privacy.basis_1")}</li>
            <li>{t("legal.privacy.basis_2")}</li>
            <li>{t("legal.privacy.basis_3")}</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">{t("legal.privacy.retention")}</h2>
          <p>{t("legal.privacy.retention_text")}</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">{t("legal.privacy.recipients")}</h2>
          <p>{t("legal.privacy.recipients_intro")}</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t("legal.privacy.recipients_1")}</li>
            <li>{t("legal.privacy.recipients_2")}</li>
            <li>{t("legal.privacy.recipients_3")}</li>
          </ul>
          <p>{t("legal.privacy.international")}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">{t("legal.privacy.rights")}</h2>
          <p>{t("legal.privacy.rights_intro")}</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t("legal.privacy.rights_1")}</li>
            <li>{t("legal.privacy.rights_2")}</li>
            <li>{t("legal.privacy.rights_3")}</li>
            <li>{t("legal.privacy.rights_4")}</li>
            <li>{t("legal.privacy.rights_5")}</li>
            <li>{t("legal.privacy.rights_6")}</li>
          </ul>
          <p>
            {t("legal.privacy.contact_rights")}
            <br />
            {t("legal.privacy.aepd")}
          </p>
        </section>
      </main>

      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  );
}
