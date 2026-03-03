import { createContext, useContext, ReactNode, useEffect } from "react";
import i18n from "@/i18n";
import { useTranslation } from "react-i18next";

type Language = "es" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { t: i18nT } = useTranslation();
  const language = (i18n.language?.slice(0, 2) === "en" ? "en" : "es") as Language;

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    localStorage.setItem("realista-language", lang);
    void i18n.changeLanguage(lang);
  };

  const t = (key: string): string => {
    return i18nT(key);
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