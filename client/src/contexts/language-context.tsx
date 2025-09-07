import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation data
const translations = {
  es: {
    // Navbar
    'nav.home': 'Inicio',
    'nav.login': 'Iniciar sesión',
    'nav.profile': 'Mi perfil',
    'nav.manage': 'Gestionar todo',
    'nav.realista_pro': 'RealistaPro',
    
    // SearchBar
    'search.rent': 'Alquilar',
    'search.buy': 'Comprar',
    'search.agencies': 'Agencias',
    'search.agents': 'Agentes',
    'search.neighborhood': 'Buscar barrio...',
    'search.button': 'Buscar',
    'search.select_neighborhood': 'Selecciona un barrio',
    'search.location_required': 'Ubicación requerida',
    'search.location_required_desc': 'Por favor, selecciona un barrio, distrito o Barcelona para buscar',
    
    // RealistaPro
    'realista_pro.title': 'RealistaPro',
    'realista_pro.subtitle': 'La plataforma profesional para agencias inmobiliarias que quieren destacar',
    'realista_pro.crm': 'CRM Avanzado',
    'realista_pro.ai': 'IA Integrada',
    'realista_pro.reviews': 'Gestión de Reseñas',
    'realista_pro.choose_plan': 'Elige tu plan perfecto',
    'realista_pro.flexible_plans': 'Planes flexibles para agencias y agentes individuales',
    'realista_pro.agencies': 'Agencias',
    'realista_pro.agents': 'Agentes',
    'realista_pro.monthly': 'Mensual',
    'realista_pro.yearly': 'Anual',
    'realista_pro.start_free': 'Empezar gratis',
    'realista_pro.start_now': 'Empezar ahora',
    'realista_pro.ai_features': '¿Qué incluyen las Ventajas IA?',
    'realista_pro.auto_descriptions': 'Descripciones automáticas',
    'realista_pro.auto_descriptions_desc': 'IA genera descripciones atractivas y profesionales para tus propiedades',
    'realista_pro.smart_responses': 'Respuestas inteligentes',
    'realista_pro.smart_responses_desc': 'Sugerencias automáticas para responder consultas de clientes',
    'realista_pro.per_month': '/mes',
    'realista_pro.billed_annually': 'Facturado anualmente',
    'realista_pro.free': 'Gratis',
    
    // Plans
    'plan.basic_agency': 'Agencia Básica',
    'plan.basic_agency_desc': 'Perfil básico para empezar',
    'plan.small_agency': 'Agencia Pequeña',
    'plan.small_agency_desc': 'Para pequeños equipos',
    'plan.medium_agency': 'Agencia Mediana', 
    'plan.medium_agency_desc': 'Para equipos en crecimiento',
    'plan.leader_agency': 'Agencia Líder',
    'plan.leader_agency_desc': 'Para grandes agencias',
    'plan.basic_agent': 'Agente Básico',
    'plan.basic_agent_desc': 'Perfil básico individual',
    'plan.leader_agent': 'Agente Líder',
    'plan.leader_agent_desc': 'Para agentes profesionales',
    
    // Common
    'common.clear': 'Limpiar',
    'common.select_all': 'Seleccionar todos',
    'common.done': 'Hecho',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.yes': 'Sí',
    'common.no': 'No',
  },
  en: {
    // Navbar
    'nav.home': 'Home',
    'nav.login': 'Log in',
    'nav.profile': 'My profile',
    'nav.manage': 'Manage all',
    'nav.realista_pro': 'RealistaPro',
    
    // SearchBar
    'search.rent': 'Rent',
    'search.buy': 'Buy',
    'search.agencies': 'Agencies',
    'search.agents': 'Agents',
    'search.neighborhood': 'Search neighborhood...',
    'search.button': 'Search',
    'search.select_neighborhood': 'Select a neighborhood',
    'search.location_required': 'Location required',
    'search.location_required_desc': 'Please select a neighborhood, district or Barcelona to search',
    
    // RealistaPro
    'realista_pro.title': 'RealistaPro',
    'realista_pro.subtitle': 'The professional platform for real estate agencies that want to stand out',
    'realista_pro.crm': 'Advanced CRM',
    'realista_pro.ai': 'Integrated AI',
    'realista_pro.reviews': 'Review Management',
    'realista_pro.choose_plan': 'Choose your perfect plan',
    'realista_pro.flexible_plans': 'Flexible plans for agencies and individual agents',
    'realista_pro.agencies': 'Agencies',
    'realista_pro.agents': 'Agents',
    'realista_pro.monthly': 'Monthly',
    'realista_pro.yearly': 'Yearly',
    'realista_pro.start_free': 'Start free',
    'realista_pro.start_now': 'Start now',
    'realista_pro.ai_features': 'What do AI Features include?',
    'realista_pro.auto_descriptions': 'Automatic descriptions',
    'realista_pro.auto_descriptions_desc': 'AI generates attractive and professional descriptions for your properties',
    'realista_pro.smart_responses': 'Smart responses',
    'realista_pro.smart_responses_desc': 'Automatic suggestions to respond to client inquiries',
    'realista_pro.per_month': '/month',
    'realista_pro.billed_annually': 'Billed annually',
    'realista_pro.free': 'Free',
    
    // Plans
    'plan.basic_agency': 'Basic Agency',
    'plan.basic_agency_desc': 'Basic profile to get started',
    'plan.small_agency': 'Small Agency',
    'plan.small_agency_desc': 'For small teams',
    'plan.medium_agency': 'Medium Agency',
    'plan.medium_agency_desc': 'For growing teams',
    'plan.leader_agency': 'Leader Agency',
    'plan.leader_agency_desc': 'For large agencies',
    'plan.basic_agent': 'Basic Agent',
    'plan.basic_agent_desc': 'Individual basic profile',
    'plan.leader_agent': 'Leader Agent',
    'plan.leader_agent_desc': 'For professional agents',
    
    // Common
    'common.clear': 'Clear',
    'common.select_all': 'Select all',
    'common.done': 'Done',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.yes': 'Yes',
    'common.no': 'No',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('es');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('realista-language') as Language;
    if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('realista-language', lang);
  };

  const t = (key: string): string => {
    const translation = translations[language][key as keyof typeof translations['es']];
    if (!translation) {
      console.warn(`Translation missing for key: ${key} in language: ${language}`);
      return key;
    }
    return translation;
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
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}