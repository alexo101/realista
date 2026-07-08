import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ICU from "i18next-icu";
import { initReactI18next } from "react-i18next";
import { translations } from "./translations";

const resources = {
  es: { translation: translations.es },
  en: { translation: translations.en },
  fr: { translation: translations.fr },
  it: { translation: translations.it },
};

void i18n
  .use(LanguageDetector)
  .use(ICU)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "es",
    supportedLngs: ["es", "en", "fr", "it"],
    keySeparator: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "realista-language",
      caches: ["localStorage"],
    },
    returnEmptyString: false,
  });

export default i18n;
