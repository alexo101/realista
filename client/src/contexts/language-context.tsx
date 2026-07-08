import { createContext, useContext, ReactNode, useEffect } from "react";
import i18n from "@/i18n";
import { useTranslation } from "react-i18next";

type Language = "es" | "en" | "fr" | "it";

const SUPPORTED_LANGUAGES: Language[] = ["es", "en", "fr", "it"];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { t: i18nT } = useTranslation();
  const detectedLang = i18n.language?.slice(0, 2) as Language;
  const language: Language = SUPPORTED_LANGUAGES.includes(detectedLang)
    ? detectedLang
    : "es";

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    localStorage.setItem("realista-language", lang);
    void i18n.changeLanguage(lang);
  };

  const t = (key: string, options?: Record<string, string | number>): string => {
    return i18nT(key, options);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}