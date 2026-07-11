import { manageTranslations } from "./manage-translations";

export type TranslationMap = Record<string, string>;

export const translations: Record<"es" | "en" | "fr" | "it", TranslationMap> = {
  es: {
    // Navbar
    "nav.home": "Inicio",
    "nav.login": "Iniciar sesión",
    "nav.profile": "Mi área personal",
    "nav.manage": "Gestionar todo",
    "nav.realista_pro": "RealistaPro",

    // SearchBar
    "search.rent": "Alquilar",
    "search.buy": "Comprar",
    "search.agencies": "Agencias",
    "search.agents": "Agentes",
    "search.neighborhood": "Buscar barrio...",
    "search.button": "Buscar",
    "search.select_neighborhood": "Selecciona un barrio",
    "search.location_required": "Ubicación requerida",
    "search.location_required_desc":
      "Por favor, selecciona un barrio, distrito o Barcelona para buscar",

    // Home
    "home.hero_title": "Encuentra tu hogar ideal con toda la información",
    "home.most_viewed": "Las más vistas",
    "home.tab_sale": "En Venta",
    "home.tab_rent": "En Alquiler",
    "home.no_sale_title":
      "No hay propiedades en venta disponibles en este momento.",
    "home.no_rent_title":
      "No hay propiedades en alquiler disponibles en este momento.",
    "home.no_results_subtitle":
      "Vuelve pronto para ver nuevas oportunidades.",
    "home.add_review_title":
      "Añade una review a tu agente y/o agencia",
    "home.add_review_subtitle":
      "Busca a tu agente o agencia y comparte tu experiencia.",
    "home.agency_eyebrow": "Para agencias inmobiliarias",
    "home.agency_title": "Todo lo que tu agencia necesita para crecer",
    "home.agency_subtitle":
      "Centraliza tu operativa, aumenta la visibilidad de tus propiedades y construye una reputación que genere confianza.",
    "home.agency_benefit_visibility_title": "Más visibilidad",
    "home.agency_benefit_visibility_description":
      "Publica propiedades y presenta tu agencia y tu equipo con perfiles profesionales.",
    "home.agency_benefit_crm_title": "CRM de clientes",
    "home.agency_benefit_crm_description":
      "Organiza contactos, conversaciones y oportunidades desde un único espacio.",
    "home.agency_benefit_operations_title": "Agenda y equipo",
    "home.agency_benefit_operations_description":
      "Coordina citas, tareas y agentes para que toda la agencia trabaje conectada.",
    "home.agency_benefit_reputation_title": "Reputación verificada",
    "home.agency_benefit_reputation_description":
      "Solicita y gestiona reseñas que ayuden a nuevos clientes a elegirte.",
    "home.agency_benefit_ai_title": "IA integrada",
    "home.agency_benefit_ai_description":
      "Crea descripciones profesionales para tus propiedades de forma más rápida.",
    "home.agency_neighborhood_title": "Conoce cómo valoran los clientes cada barrio",
    "home.agency_neighborhood_description":
      "Las clasificaciones de seguridad, transporte, servicios y calidad de vida aportan contexto a tus propiedades y ayudan a tus clientes a decidir mejor.",
    "home.agency_cta": "Explorar planes en RealistaPro",

    // Footer
    "footer.company_description":
      "Tu plataforma de confianza para encontrar las mejores propiedades en España. Conectamos agentes, agencias y clientes de manera profesional y eficiente.",
    "footer.location": "Barcelona, España",
    "footer.districts": "Distritos de Barcelona",
    "footer.all_districts": "Ver todos los distritos →",
    "footer.popular_neighborhoods": "Barrios Populares",
    "footer.legal_info": "Información Legal",
    "footer.privacy": "Política de privacidad",
    "footer.terms": "Términos y Condiciones",
    "footer.cookies": "Política de Cookies",
    "footer.legal_notice": "Aviso Legal",
    "footer.copyright": "Todos los derechos reservados.",
    "footer.digital_real_estate": "Inmobiliaria Digital",
    "footer.disclaimer":
      "Realista es una plataforma digital que conecta profesionales inmobiliarios con clientes. No somos responsables de las transacciones realizadas entre usuarios. Toda la información mostrada es proporcionada por los agentes y agencias registrados.",

    // RealistaPro
    "realista_pro.title": "RealistaPro",
    "realista_pro.subtitle":
      "La plataforma profesional para agencias inmobiliarias que quieren destacar",
    "realista_pro.crm": "CRM Avanzado",
    "realista_pro.ai": "IA Integrada",
    "realista_pro.reviews": "Gestión de Reseñas",
    "realista_pro.choose_plan": "Elige tu plan perfecto",
    "realista_pro.flexible_plans":
      "Planes flexibles para agencias y agentes individuales",
    "realista_pro.agencies": "Agencias",
    "realista_pro.agents": "Agentes",
    "realista_pro.networks": "Redes",
    "realista_pro.monthly": "Mensual",
    "realista_pro.yearly": "Anual",
    "realista_pro.start_free": "Empezar gratis",
    "realista_pro.start_now": "Empezar ahora",
    "realista_pro.ai_features": "¿Qué incluyen las Ventajas IA?",
    "realista_pro.auto_descriptions": "Descripciones automáticas",
    "realista_pro.auto_descriptions_desc":
      "IA genera descripciones atractivas y profesionales para tus propiedades",
    "realista_pro.smart_responses": "Respuestas inteligentes",
    "realista_pro.smart_responses_desc":
      "Sugerencias automáticas para responder consultas de clientes",
    "realista_pro.per_month": "/mes",
    "realista_pro.billed_annually": "Facturado anualmente",
    "realista_pro.free": "Gratis",
    "realista_pro.two_months_free": "2 meses gratis",
    "realista_pro.current_subscription": "Tu suscripción actual",
    "realista_pro.annual": "Anual",
    "realista_pro.up_to": "Hasta",
    "realista_pro.unlimited": "ilimitados",
    "realista_pro.properties": "propiedades",
    "realista_pro.agents_label": "agentes",
    "realista_pro.manage_billing": "Gestionar facturación",
    "realista_pro.current_plan": "Plan actual",
    "realista_pro.network_register": "Registrar mi red",
    "realista_pro.agency_label": "Agencia",
    "realista_pro.monthly_only": "Solo facturación mensual",
    "realista_pro.network_pricing":
      "Facturación según agencias y sus planes",
    "realista_pro.free_plan_activated_title": "¡Plan activado!",
    "realista_pro.free_plan_activated_desc":
      "Tu plan gratuito ha sido activado correctamente.",
    "realista_pro.subscription_activated_title": "¡Suscripción activada!",
    "realista_pro.subscription_activated_desc":
      "Tu plan ha sido activado correctamente. Gracias por confiar en Realista.",
    "realista_pro.subscription_cancelled_title": "Suscripción cancelada",
    "realista_pro.subscription_cancelled_desc":
      "El proceso de pago fue cancelado. Puedes intentarlo de nuevo cuando quieras.",
    "realista_pro.error_title": "Error",
    "realista_pro.error_checkout":
      "No se pudo iniciar el proceso de pago",
    "realista_pro.error_profile":
      "No se pudo determinar tu perfil. Por favor, inicia sesión de nuevo.",
    "realista_pro.error_price":
      "No se encontró el precio para este plan. Inténtalo de nuevo.",
    "realista_pro.error_free_plan":
      "No se pudo activar el plan gratuito",
    "realista_pro.error_billing_portal":
      "No se pudo abrir el portal de facturación",
    "realista_pro.billed_annually_prefix": "Facturado anualmente:",

    // Plans
    "plan.basic_agency": "Agencia Básica",
    "plan.basic_agency_desc": "Perfil básico para empezar",
    "plan.small_agency": "Agencia Pequeña",
    "plan.small_agency_desc": "Para pequeños equipos",
    "plan.medium_agency": "Agencia Mediana",
    "plan.medium_agency_desc": "Para equipos en crecimiento",
    "plan.leader_agency": "Agencia Líder",
    "plan.leader_agency_desc": "Para grandes agencias",
    "plan.basic_agent": "Agente Básico",
    "plan.basic_agent_desc": "Perfil básico individual",
    "plan.leader_agent": "Agente Líder",
    "plan.leader_agent_desc": "Para agentes profesionales",
    "plan.small_label": "Pequeña",
    "plan.medium_label": "Mediana",
    "plan.leader_label": "Líder",
    "plan.network": "Red de Agencias",
    "plan.network_desc": "Para franquicias y redes inmobiliarias",
    "plan.feature.crm": "CRM y gestión de agenda",
    "plan.feature.ai_benefits": "Ventajas IA",
    "plan.feature.unlimited_clients": "Gestión ilimitada de clientes",
    "plan.feature.unlimited_reviews": "Solicitudes ilimitadas de reseñas",
    "plan.feature.no_reviews": "No posibilidad de solicitar reseñas",
    "plan.feature.basic_main_agent":
      "Perfil básico con solo el Agente principal",
    "plan.feature.2_properties": "2 propiedades activas a la vez",
    "plan.feature.2_public_profiles":
      "Hasta 2 perfiles públicos de agentes",
    "plan.feature.10_properties": "Hasta 10 propiedades activas a la vez",
    "plan.feature.6_agents": "Hasta 6 agentes",
    "plan.feature.30_properties": "Hasta 30 propiedades activas a la vez",
    "plan.feature.unlimited_agents": "Agentes ilimitados",
    "plan.feature.unlimited_properties": "Propiedades ilimitadas",
    "plan.feature.agent_basic_profile":
      "Perfil básico de agente individual",
    "plan.feature.agent_pro_profile": "Perfil profesional de agente",
    "plan.feature.network_unlimited_agencies":
      "Agencias ilimitadas bajo tu marca",
    "plan.feature.network_central_panel":
      "Panel de control centralizado de toda la red",
    "plan.feature.network_consolidated_stats":
      "Estadísticas consolidadas de rendimiento",
    "plan.feature.network_branding":
      "Branding corporativo en todos los perfiles",
    "plan.feature.network_billing":
      "Gestión centralizada o facturación individual por agencia",
    "plan.feature.network_priority_support":
      "Soporte prioritario dedicado",
    "plan.feature.network_api": "API de integración disponible",

    // Legal pages
    "legal.notice.title": "AVISO LEGAL",
    "legal.notice.web_owner": "Titular del sitio web",
    "legal.notice.web_owner_text":
      "En cumplimiento de lo dispuesto en la normativa española de servicios digitales, se informa que el presente sitio web, realista.homes, es titularidad de:",
    "legal.notice.owner":
      "Titular: [Nombre y Apellidos del promotor]",
    "legal.notice.nif": "NIF: [NIF]",
    "legal.notice.address": "Domicilio: [Dirección completa]",
    "legal.notice.contact":
      "Correo electrónico de contacto: [contacto@realista.homes]",
    "legal.notice.company_update":
      "En caso de que la actividad pase a ser desarrollada por una sociedad mercantil, los datos anteriores serán actualizados conforme a su inscripción registral.",
    "legal.notice.object": "Objeto",
    "legal.notice.object_text":
      "El presente sitio web tiene por objeto ofrecer una plataforma digital de intermediación inmobiliaria que permite a usuarios publicar, buscar y contratar servicios relacionados con inmuebles.",
    "legal.notice.terms": "Condiciones de uso",
    "legal.notice.terms_text":
      "El acceso y uso del sitio web atribuye la condición de usuario e implica la aceptación plena de las presentes condiciones.",
    "legal.notice.user_commitment": "El usuario se compromete a:",
    "legal.notice.use_1": "Hacer un uso adecuado y lícito del sitio.",
    "legal.notice.use_2": "No realizar actividades fraudulentas.",
    "legal.notice.use_3":
      "No introducir contenidos ilícitos o lesivos.",
    "legal.notice.ip": "Propiedad intelectual",
    "legal.notice.ip_text":
      "Todos los contenidos del sitio (textos, diseños, logotipos, software) son titularidad del titular o cuentan con licencia legítima.",
    "legal.notice.ip_text_2":
      "Queda prohibida su reproducción sin autorización expresa.",
    "legal.notice.liability": "Responsabilidad",
    "legal.notice.liability_text":
      "El titular no garantiza la disponibilidad continua del sitio ni se responsabiliza de daños derivados del uso indebido del mismo.",

    "legal.privacy.title": "POLÍTICA DE PRIVACIDAD",
    "legal.privacy.controller": "Responsable del tratamiento",
    "legal.privacy.controller_text":
      "Responsable: [Nombre y Apellidos o futura sociedad]",
    "legal.privacy.email": "Email: contacto@realista.homes",
    "legal.privacy.data": "Datos que recopilamos",
    "legal.privacy.data_1": "Datos identificativos (nombre, email)",
    "legal.privacy.data_2": "Datos de facturación",
    "legal.privacy.data_3": "Datos de contacto",
    "legal.privacy.data_4":
      "Información de uso de la plataforma",
    "legal.privacy.data_5":
      "Datos de pago (gestionados a través de proveedor externo)",
    "legal.privacy.purpose": "Finalidad",
    "legal.privacy.purpose_1": "Gestión de cuentas de usuario",
    "legal.privacy.purpose_2": "Gestión de pagos y comisiones",
    "legal.privacy.purpose_3":
      "Prestación de servicios de intermediación",
    "legal.privacy.purpose_4":
      "Cumplimiento de obligaciones legales",
    "legal.privacy.purpose_5":
      "Envío de comunicaciones relacionadas con el servicio",
    "legal.privacy.basis": "Base jurídica",
    "legal.privacy.basis_1": "Ejecución de contrato",
    "legal.privacy.basis_2": "Consentimiento del usuario",
    "legal.privacy.basis_3": "Cumplimiento de obligación legal",
    "legal.privacy.retention": "Conservación",
    "legal.privacy.retention_text":
      "Los datos se conservarán mientras exista relación contractual y posteriormente durante los plazos exigidos por normativa fiscal y mercantil.",
    "legal.privacy.recipients": "Destinatarios",
    "legal.privacy.recipients_intro":
      "Podrán acceder a los datos:",
    "legal.privacy.recipients_1": "Proveedores tecnológicos",
    "legal.privacy.recipients_2":
      "Proveedores de servicios de pago",
    "legal.privacy.recipients_3":
      "Autoridades competentes cuando exista obligación legal",
    "legal.privacy.international":
      "Si existen transferencias internacionales, se garantizarán mediante mecanismos adecuados conforme al RGPD.",
    "legal.privacy.rights": "Derechos del usuario",
    "legal.privacy.rights_intro": "El usuario puede ejercer:",
    "legal.privacy.rights_1": "Acceso",
    "legal.privacy.rights_2": "Rectificación",
    "legal.privacy.rights_3": "Supresión",
    "legal.privacy.rights_4": "Oposición",
    "legal.privacy.rights_5": "Limitación",
    "legal.privacy.rights_6": "Portabilidad",
    "legal.privacy.contact_rights":
      "Enviando solicitud a privacidad@realista.homes.",
    "legal.privacy.aepd":
      "Asimismo, podrá presentar reclamación ante la Agencia Española de Protección de Datos.",

    "legal.cookies.title": "POLÍTICA DE COOKIES",
    "legal.cookies.intro":
      "El sitio realista.homes utiliza cookies propias y de terceros.",
    "legal.cookies.types": "Tipos de cookies",
    "legal.cookies.types_1":
      "Técnicas (necesarias para el funcionamiento)",
    "legal.cookies.types_2": "Analíticas",
    "legal.cookies.types_3": "Publicitarias (si aplicara)",
    "legal.cookies.non_essential":
      "Las cookies no esenciales se instalarán únicamente tras consentimiento del usuario.",
    "legal.cookies.management": "Gestión del consentimiento",
    "legal.cookies.user_can": "El usuario podrá:",
    "legal.cookies.action_1": "Aceptar todas",
    "legal.cookies.action_2": "Rechazar todas",
    "legal.cookies.action_3": "Configurar preferencias",
    "legal.cookies.change":
      "Puede modificar su consentimiento en cualquier momento desde el panel de configuración.",

    "legal.terms.title": "TÉRMINOS Y CONDICIONES DE USO",
    "legal.terms.section_1": "1. Naturaleza del servicio",
    "legal.terms.section_1_text":
      "realista.homes es una plataforma digital que actúa como intermediaria entre usuarios que publican inmuebles y usuarios interesados.",
    "legal.terms.section_1_text_2":
      "La plataforma no es propietaria de los inmuebles publicados salvo indicación expresa.",
    "legal.terms.section_2": "2. Registro",
    "legal.terms.section_2_text":
      "Para utilizar determinados servicios es obligatorio crear una cuenta proporcionando información veraz y actualizada.",
    "legal.terms.section_2_text_2":
      "El usuario es responsable de custodiar sus credenciales.",
    "legal.terms.section_3": "3. Pagos y comisiones",
    "legal.terms.section_3_intro": "La plataforma podrá cobrar:",
    "legal.terms.section_3_1": "Comisiones por publicación",
    "legal.terms.section_3_2": "Comisiones por transacción",
    "legal.terms.section_3_3": "Servicios adicionales",
    "legal.terms.section_3_text":
      "Los pagos se gestionan mediante proveedor externo de servicios de pago.",
    "legal.terms.section_3_text_2":
      "La plataforma no almacena datos completos de tarjetas.",
    "legal.terms.section_4": "4. Obligaciones de los usuarios",
    "legal.terms.section_4_intro": "Los usuarios se comprometen a:",
    "legal.terms.section_4_1": "No publicar información falsa",
    "legal.terms.section_4_2":
      "Cumplir la normativa inmobiliaria",
    "legal.terms.section_4_3":
      "No infringir derechos de terceros",
    "legal.terms.section_5": "5. Responsabilidad",
    "legal.terms.section_5_intro":
      "La plataforma actúa como intermediaria tecnológica y no garantiza:",
    "legal.terms.section_5_1": "La veracidad de los anuncios",
    "legal.terms.section_5_2": "El éxito de las operaciones",
    "legal.terms.section_6": "6. Cancelaciones y reembolsos",
    "legal.terms.section_6_text":
      "Las condiciones de cancelación y devolución dependerán del tipo de servicio contratado y serán detalladas en cada caso.",
    "legal.terms.section_7": "7. Resolución de conflictos",
    "legal.terms.section_7_text":
      "Las partes se someten a la legislación española.",

    // Common
    "common.clear": "Limpiar",
    "common.select_all": "Seleccionar todos",
    "common.done": "Hecho",
    "common.cancel": "Cancelar",
    "common.save": "Guardar",
    "common.yes": "Sí",
    "common.no": "No",

    // Neighborhood Rating
    "neighborhood_rating.title":
      "Busca y conoce las localidades de tu interés",
    "neighborhood_rating.search_placeholder":
      "Buscar localidades en España",
    "neighborhood_rating.not_rated": "Sin calificar",
    "neighborhood_rating.rate_button": "Calificar esta localidad",
    "neighborhood_rating.rate_title": "Califica: {location}",
    "neighborhood_rating.category_security": "Seguridad",
    "neighborhood_rating.category_parking": "Aparcamiento",
    "neighborhood_rating.category_family": "Ambiente familiar",
    "neighborhood_rating.category_transport": "Conectividad",
    "neighborhood_rating.category_green": "Zonas verdes",
    "neighborhood_rating.category_services": "Servicios",
    "neighborhood_rating.submitting": "Enviando...",
    "neighborhood_rating.submit": "Enviar valoración",
    "neighborhood_rating.based_on":
      "Basado en {count} valoraciones de residentes",
    "neighborhood_rating.no_ratings":
      "No hay valoraciones disponibles para {location} en este momento.",
    "neighborhood_rating.try_popular":
      "Prueba con uno de los barrios populares arriba.",
    "neighborhood_rating.toast_submitted_title": "¡Valoración enviada!",
    "neighborhood_rating.toast_submitted_desc":
      "Tu valoración para {location} ha sido guardada con éxito.",
    "neighborhood_rating.toast_error_title": "Error al enviar valoración",
    "neighborhood_rating.toast_error_desc":
      "No se pudo enviar tu valoración. Inténtalo de nuevo.",
    "neighborhood_rating.toast_missing_title": "Faltan calificaciones",
    "neighborhood_rating.toast_missing_desc":
      "Por favor, califica todas las categorías antes de enviar.",

    ...manageTranslations.es,
  },
  en: {
    // Navbar
    "nav.home": "Home",
    "nav.login": "Log in",
    "nav.profile": "My personal area",
    "nav.manage": "Manage all",
    "nav.realista_pro": "RealistaPro",

    // SearchBar
    "search.rent": "Rent",
    "search.buy": "Buy",
    "search.agencies": "Agencies",
    "search.agents": "Agents",
    "search.neighborhood": "Search neighborhood...",
    "search.button": "Search",
    "search.select_neighborhood": "Select a neighborhood",
    "search.location_required": "Location required",
    "search.location_required_desc":
      "Please select a neighborhood, district or Barcelona to search",

    // Home
    "home.hero_title": "Find your ideal home with complete information",
    "home.most_viewed": "Most viewed",
    "home.tab_sale": "For Sale",
    "home.tab_rent": "For Rent",
    "home.no_sale_title":
      "There are no properties for sale available at the moment.",
    "home.no_rent_title":
      "There are no rental properties available at the moment.",
    "home.no_results_subtitle":
      "Come back soon to discover new opportunities.",
    "home.add_review_title":
      "Add a review for your agent and/or agency",
    "home.add_review_subtitle":
      "Search for your agent or agency and share your experience.",
    "home.agency_eyebrow": "For real estate agencies",
    "home.agency_title": "Everything your agency needs to grow",
    "home.agency_subtitle":
      "Centralize your operations, increase property visibility, and build a reputation that earns trust.",
    "home.agency_benefit_visibility_title": "More visibility",
    "home.agency_benefit_visibility_description":
      "Publish properties and showcase your agency and team with professional profiles.",
    "home.agency_benefit_crm_title": "Client CRM",
    "home.agency_benefit_crm_description":
      "Organize contacts, conversations, and opportunities in one place.",
    "home.agency_benefit_operations_title": "Schedule and team",
    "home.agency_benefit_operations_description":
      "Coordinate appointments, tasks, and agents so your whole agency stays connected.",
    "home.agency_benefit_reputation_title": "Verified reputation",
    "home.agency_benefit_reputation_description":
      "Request and manage reviews that help new clients choose you.",
    "home.agency_benefit_ai_title": "Integrated AI",
    "home.agency_benefit_ai_description":
      "Create professional property descriptions more quickly.",
    "home.agency_neighborhood_title": "See how clients rate each neighborhood",
    "home.agency_neighborhood_description":
      "Ratings for safety, transport, services, and quality of life add context to your properties and help clients make better decisions.",
    "home.agency_cta": "Explore RealistaPro plans",

    // Footer
    "footer.company_description":
      "Your trusted platform to find the best properties in Spain. We connect agents, agencies, and clients in a professional and efficient way.",
    "footer.location": "Barcelona, Spain",
    "footer.districts": "Barcelona districts",
    "footer.all_districts": "See all districts →",
    "footer.popular_neighborhoods": "Popular neighborhoods",
    "footer.legal_info": "Legal information",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms and Conditions",
    "footer.cookies": "Cookie Policy",
    "footer.legal_notice": "Legal Notice",
    "footer.copyright": "All rights reserved.",
    "footer.digital_real_estate": "Digital Real Estate",
    "footer.disclaimer":
      "Realista is a digital platform that connects real estate professionals with clients. We are not responsible for transactions between users. All information displayed is provided by registered agents and agencies.",

    // RealistaPro
    "realista_pro.title": "RealistaPro",
    "realista_pro.subtitle":
      "The professional platform for real estate agencies that want to stand out",
    "realista_pro.crm": "Advanced CRM",
    "realista_pro.ai": "Integrated AI",
    "realista_pro.reviews": "Review Management",
    "realista_pro.choose_plan": "Choose your perfect plan",
    "realista_pro.flexible_plans":
      "Flexible plans for agencies and individual agents",
    "realista_pro.agencies": "Agencies",
    "realista_pro.agents": "Agents",
    "realista_pro.networks": "Networks",
    "realista_pro.monthly": "Monthly",
    "realista_pro.yearly": "Yearly",
    "realista_pro.start_free": "Start free",
    "realista_pro.start_now": "Start now",
    "realista_pro.ai_features": "What do AI features include?",
    "realista_pro.auto_descriptions": "Automatic descriptions",
    "realista_pro.auto_descriptions_desc":
      "AI generates attractive and professional descriptions for your properties",
    "realista_pro.smart_responses": "Smart responses",
    "realista_pro.smart_responses_desc":
      "Automatic suggestions for replying to client inquiries",
    "realista_pro.per_month": "/month",
    "realista_pro.billed_annually": "Billed annually",
    "realista_pro.free": "Free",
    "realista_pro.two_months_free": "2 months free",
    "realista_pro.current_subscription": "Your current subscription",
    "realista_pro.annual": "Yearly",
    "realista_pro.up_to": "Up to",
    "realista_pro.unlimited": "unlimited",
    "realista_pro.properties": "properties",
    "realista_pro.agents_label": "agents",
    "realista_pro.manage_billing": "Manage billing",
    "realista_pro.current_plan": "Current plan",
    "realista_pro.network_register": "Register my network",
    "realista_pro.agency_label": "Agency",
    "realista_pro.monthly_only": "Monthly billing only",
    "realista_pro.network_pricing":
      "Billing based on agencies and their plans",
    "realista_pro.free_plan_activated_title": "Plan activated!",
    "realista_pro.free_plan_activated_desc":
      "Your free plan has been activated successfully.",
    "realista_pro.subscription_activated_title":
      "Subscription activated!",
    "realista_pro.subscription_activated_desc":
      "Your plan has been activated successfully. Thanks for trusting Realista.",
    "realista_pro.subscription_cancelled_title":
      "Subscription canceled",
    "realista_pro.subscription_cancelled_desc":
      "The payment process was canceled. You can try again whenever you want.",
    "realista_pro.error_title": "Error",
    "realista_pro.error_checkout":
      "Could not start the checkout process",
    "realista_pro.error_profile":
      "Could not determine your profile. Please sign in again.",
    "realista_pro.error_price":
      "Price for this plan was not found. Please try again.",
    "realista_pro.error_free_plan":
      "Could not activate the free plan",
    "realista_pro.error_billing_portal":
      "Could not open the billing portal",
    "realista_pro.billed_annually_prefix": "Billed yearly:",

    // Plans
    "plan.basic_agency": "Basic Agency",
    "plan.basic_agency_desc": "Basic profile to get started",
    "plan.small_agency": "Small Agency",
    "plan.small_agency_desc": "For small teams",
    "plan.medium_agency": "Medium Agency",
    "plan.medium_agency_desc": "For growing teams",
    "plan.leader_agency": "Leader Agency",
    "plan.leader_agency_desc": "For large agencies",
    "plan.basic_agent": "Basic Agent",
    "plan.basic_agent_desc": "Individual basic profile",
    "plan.leader_agent": "Leader Agent",
    "plan.leader_agent_desc": "For professional agents",
    "plan.small_label": "Small",
    "plan.medium_label": "Medium",
    "plan.leader_label": "Leader",
    "plan.network": "Agency Network",
    "plan.network_desc": "For franchises and real estate networks",
    "plan.feature.crm": "CRM and schedule management",
    "plan.feature.ai_benefits": "AI benefits",
    "plan.feature.unlimited_clients": "Unlimited client management",
    "plan.feature.unlimited_reviews": "Unlimited review requests",
    "plan.feature.no_reviews": "No review request capability",
    "plan.feature.basic_main_agent":
      "Basic profile with only the main agent",
    "plan.feature.2_properties": "2 active properties at a time",
    "plan.feature.2_public_profiles":
      "Up to 2 public agent profiles",
    "plan.feature.10_properties":
      "Up to 10 active properties at a time",
    "plan.feature.6_agents": "Up to 6 agents",
    "plan.feature.30_properties":
      "Up to 30 active properties at a time",
    "plan.feature.unlimited_agents": "Unlimited agents",
    "plan.feature.unlimited_properties": "Unlimited properties",
    "plan.feature.agent_basic_profile": "Basic individual agent profile",
    "plan.feature.agent_pro_profile": "Professional agent profile",
    "plan.feature.network_unlimited_agencies":
      "Unlimited agencies under your brand",
    "plan.feature.network_central_panel":
      "Centralized control panel for the entire network",
    "plan.feature.network_consolidated_stats":
      "Consolidated performance statistics",
    "plan.feature.network_branding":
      "Corporate branding on all profiles",
    "plan.feature.network_billing":
      "Centralized management or per-agency billing",
    "plan.feature.network_priority_support":
      "Dedicated priority support",
    "plan.feature.network_api": "Integration API available",

    // Legal pages
    "legal.notice.title": "LEGAL NOTICE",
    "legal.notice.web_owner": "Website owner",
    "legal.notice.web_owner_text":
      "In compliance with Spanish digital services regulations, we inform you that this website, realista.homes, is owned by:",
    "legal.notice.owner": "Owner: [Full name of the promoter]",
    "legal.notice.nif": "Tax ID: [NIF]",
    "legal.notice.address": "Address: [Full address]",
    "legal.notice.contact":
      "Contact email: [contacto@realista.homes]",
    "legal.notice.company_update":
      "If the activity is later carried out by a commercial company, the previous data will be updated according to its registry inscription.",
    "legal.notice.object": "Purpose",
    "legal.notice.object_text":
      "This website aims to offer a digital real estate intermediation platform that allows users to publish, search and hire services related to properties.",
    "legal.notice.terms": "Terms of use",
    "legal.notice.terms_text":
      "Access and use of the website grants user status and implies full acceptance of these conditions.",
    "legal.notice.user_commitment": "Users agree to:",
    "legal.notice.use_1": "Use the site properly and lawfully.",
    "legal.notice.use_2": "Not carry out fraudulent activities.",
    "legal.notice.use_3":
      "Not introduce unlawful or harmful content.",
    "legal.notice.ip": "Intellectual property",
    "legal.notice.ip_text":
      "All website content (texts, designs, logos, software) is owned by the owner or has a legitimate license.",
    "legal.notice.ip_text_2":
      "Reproduction is prohibited without explicit authorization.",
    "legal.notice.liability": "Liability",
    "legal.notice.liability_text":
      "The owner does not guarantee continuous availability of the website and is not responsible for damages arising from improper use.",

    "legal.privacy.title": "PRIVACY POLICY",
    "legal.privacy.controller": "Data controller",
    "legal.privacy.controller_text":
      "Controller: [Name and surname or future company]",
    "legal.privacy.email": "Email: contacto@realista.homes",
    "legal.privacy.data": "Data we collect",
    "legal.privacy.data_1": "Identification data (name, email)",
    "legal.privacy.data_2": "Billing data",
    "legal.privacy.data_3": "Contact data",
    "legal.privacy.data_4": "Platform usage information",
    "legal.privacy.data_5":
      "Payment data (managed through external provider)",
    "legal.privacy.purpose": "Purpose",
    "legal.privacy.purpose_1": "User account management",
    "legal.privacy.purpose_2": "Payments and commissions management",
    "legal.privacy.purpose_3":
      "Provision of intermediation services",
    "legal.privacy.purpose_4": "Compliance with legal obligations",
    "legal.privacy.purpose_5":
      "Sending service-related communications",
    "legal.privacy.basis": "Legal basis",
    "legal.privacy.basis_1": "Contract performance",
    "legal.privacy.basis_2": "User consent",
    "legal.privacy.basis_3": "Compliance with legal obligation",
    "legal.privacy.retention": "Retention",
    "legal.privacy.retention_text":
      "Data will be kept while the contractual relationship exists and afterwards for the periods required by tax and commercial regulations.",
    "legal.privacy.recipients": "Recipients",
    "legal.privacy.recipients_intro":
      "The following may access data:",
    "legal.privacy.recipients_1": "Technology providers",
    "legal.privacy.recipients_2": "Payment service providers",
    "legal.privacy.recipients_3":
      "Competent authorities when legally required",
    "legal.privacy.international":
      "If there are international transfers, they will be safeguarded by appropriate mechanisms in accordance with GDPR.",
    "legal.privacy.rights": "User rights",
    "legal.privacy.rights_intro": "Users may exercise:",
    "legal.privacy.rights_1": "Access",
    "legal.privacy.rights_2": "Rectification",
    "legal.privacy.rights_3": "Erasure",
    "legal.privacy.rights_4": "Objection",
    "legal.privacy.rights_5": "Restriction",
    "legal.privacy.rights_6": "Portability",
    "legal.privacy.contact_rights":
      "By sending a request to privacidad@realista.homes.",
    "legal.privacy.aepd":
      "You may also file a complaint with the Spanish Data Protection Agency.",

    "legal.cookies.title": "COOKIE POLICY",
    "legal.cookies.intro":
      "The realista.homes website uses first-party and third-party cookies.",
    "legal.cookies.types": "Types of cookies",
    "legal.cookies.types_1":
      "Technical (necessary for operation)",
    "legal.cookies.types_2": "Analytics",
    "legal.cookies.types_3": "Advertising (if applicable)",
    "legal.cookies.non_essential":
      "Non-essential cookies will only be installed after user consent.",
    "legal.cookies.management": "Consent management",
    "legal.cookies.user_can": "Users can:",
    "legal.cookies.action_1": "Accept all",
    "legal.cookies.action_2": "Reject all",
    "legal.cookies.action_3": "Configure preferences",
    "legal.cookies.change":
      "You can modify your consent at any time from the settings panel.",

    "legal.terms.title": "TERMS AND CONDITIONS OF USE",
    "legal.terms.section_1": "1. Nature of the service",
    "legal.terms.section_1_text":
      "realista.homes is a digital platform acting as an intermediary between users who post properties and interested users.",
    "legal.terms.section_1_text_2":
      "The platform is not the owner of published properties unless expressly stated.",
    "legal.terms.section_2": "2. Registration",
    "legal.terms.section_2_text":
      "To use certain services, creating an account with truthful and updated information is mandatory.",
    "legal.terms.section_2_text_2":
      "Users are responsible for safeguarding their credentials.",
    "legal.terms.section_3": "3. Payments and commissions",
    "legal.terms.section_3_intro":
      "The platform may charge:",
    "legal.terms.section_3_1": "Publishing commissions",
    "legal.terms.section_3_2": "Transaction commissions",
    "legal.terms.section_3_3": "Additional services",
    "legal.terms.section_3_text":
      "Payments are handled through an external payment service provider.",
    "legal.terms.section_3_text_2":
      "The platform does not store full card details.",
    "legal.terms.section_4": "4. User obligations",
    "legal.terms.section_4_intro": "Users agree to:",
    "legal.terms.section_4_1": "Not publish false information",
    "legal.terms.section_4_2":
      "Comply with real estate regulations",
    "legal.terms.section_4_3":
      "Not infringe third-party rights",
    "legal.terms.section_5": "5. Liability",
    "legal.terms.section_5_intro":
      "The platform acts as a technological intermediary and does not guarantee:",
    "legal.terms.section_5_1":
      "The accuracy of listings",
    "legal.terms.section_5_2":
      "The success of operations",
    "legal.terms.section_6": "6. Cancellations and refunds",
    "legal.terms.section_6_text":
      "Cancellation and refund conditions depend on the type of contracted service and will be detailed in each case.",
    "legal.terms.section_7": "7. Dispute resolution",
    "legal.terms.section_7_text":
      "The parties submit to Spanish law.",

    // Common
    "common.clear": "Clear",
    "common.select_all": "Select all",
    "common.done": "Done",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.yes": "Yes",
    "common.no": "No",

    // Neighborhood Rating
    "neighborhood_rating.title":
      "Search and discover the neighborhoods you're interested in",
    "neighborhood_rating.search_placeholder":
      "Search locations in Spain",
    "neighborhood_rating.not_rated": "Not rated",
    "neighborhood_rating.rate_button": "Rate this neighborhood",
    "neighborhood_rating.rate_title": "Rate: {location}",
    "neighborhood_rating.category_security": "Security",
    "neighborhood_rating.category_parking": "Parking",
    "neighborhood_rating.category_family": "Family friendly",
    "neighborhood_rating.category_transport": "Connectivity",
    "neighborhood_rating.category_green": "Green spaces",
    "neighborhood_rating.category_services": "Services",
    "neighborhood_rating.submitting": "Submitting...",
    "neighborhood_rating.submit": "Submit rating",
    "neighborhood_rating.based_on":
      "Based on {count} resident ratings",
    "neighborhood_rating.no_ratings":
      "There are no ratings available for {location} at the moment.",
    "neighborhood_rating.try_popular":
      "Try one of the popular neighborhoods above.",
    "neighborhood_rating.toast_submitted_title": "Rating submitted!",
    "neighborhood_rating.toast_submitted_desc":
      "Your rating for {location} has been saved successfully.",
    "neighborhood_rating.toast_error_title": "Error submitting rating",
    "neighborhood_rating.toast_error_desc":
      "Your rating could not be submitted. Please try again.",
    "neighborhood_rating.toast_missing_title": "Missing ratings",
    "neighborhood_rating.toast_missing_desc":
      "Please rate all categories before submitting.",

    ...manageTranslations.en,
  },
  fr: {
    // Navbar
    "nav.home": "Accueil",
    "nav.login": "Se connecter",
    "nav.profile": "Mon espace personnel",
    "nav.manage": "Tout gérer",
    "nav.realista_pro": "RealistaPro",

    // SearchBar
    "search.rent": "Louer",
    "search.buy": "Acheter",
    "search.agencies": "Agences",
    "search.agents": "Agents",
    "search.neighborhood": "Rechercher un quartier...",
    "search.button": "Rechercher",
    "search.select_neighborhood": "Sélectionnez un quartier",
    "search.location_required": "Emplacement requis",
    "search.location_required_desc":
      "Veuillez sélectionner un quartier, un district ou Barcelone pour effectuer une recherche",

    // Home
    "home.hero_title":
      "Trouvez votre logement idéal avec toutes les informations",
    "home.most_viewed": "Les plus vues",
    "home.tab_sale": "À Vendre",
    "home.tab_rent": "À Louer",
    "home.no_sale_title":
      "Il n'y a actuellement aucune propriété à vendre disponible.",
    "home.no_rent_title":
      "Il n'y a actuellement aucune propriété à louer disponible.",
    "home.no_results_subtitle":
      "Revenez bientôt pour découvrir de nouvelles opportunités.",
    "home.add_review_title":
      "Ajoutez un avis pour votre agent et/ou agence",
    "home.add_review_subtitle":
      "Recherchez votre agent ou agence et partagez votre expérience.",
    "home.agency_eyebrow": "Pour les agences immobilières",
    "home.agency_title": "Tout ce dont votre agence a besoin pour se développer",
    "home.agency_subtitle":
      "Centralisez vos opérations, augmentez la visibilité de vos biens et bâtissez une réputation digne de confiance.",
    "home.agency_benefit_visibility_title": "Plus de visibilité",
    "home.agency_benefit_visibility_description":
      "Publiez vos biens et présentez votre agence et votre équipe avec des profils professionnels.",
    "home.agency_benefit_crm_title": "CRM clients",
    "home.agency_benefit_crm_description":
      "Organisez contacts, conversations et opportunités depuis un seul espace.",
    "home.agency_benefit_operations_title": "Agenda et équipe",
    "home.agency_benefit_operations_description":
      "Coordonnez rendez-vous, tâches et agents pour garder toute l'agence connectée.",
    "home.agency_benefit_reputation_title": "Réputation vérifiée",
    "home.agency_benefit_reputation_description":
      "Demandez et gérez des avis qui aident de nouveaux clients à vous choisir.",
    "home.agency_benefit_ai_title": "IA intégrée",
    "home.agency_benefit_ai_description":
      "Créez plus rapidement des descriptions professionnelles pour vos biens.",
    "home.agency_neighborhood_title": "Découvrez comment les clients évaluent chaque quartier",
    "home.agency_neighborhood_description":
      "Les évaluations de la sécurité, des transports, des services et de la qualité de vie contextualisent vos biens et aident vos clients à mieux décider.",
    "home.agency_cta": "Découvrir les offres RealistaPro",

    // Footer
    "footer.company_description":
      "Votre plateforme de confiance pour trouver les meilleures propriétés en Espagne. Nous connectons agents, agences et clients de manière professionnelle et efficace.",
    "footer.location": "Barcelone, Espagne",
    "footer.districts": "Quartiers de Barcelone",
    "footer.all_districts": "Voir tous les quartiers →",
    "footer.popular_neighborhoods": "Quartiers populaires",
    "footer.legal_info": "Informations légales",
    "footer.privacy": "Politique de confidentialité",
    "footer.terms": "Termes et Conditions",
    "footer.cookies": "Politique de Cookies",
    "footer.legal_notice": "Mentions légales",
    "footer.copyright": "Tous droits réservés.",
    "footer.digital_real_estate": "Immobilier Digital",
    "footer.disclaimer":
      "Realista est une plateforme numérique qui connecte des professionnels de l'immobilier avec des clients. Nous ne sommes pas responsables des transactions effectuées entre utilisateurs. Toutes les informations affichées sont fournies par les agents et agences enregistrés.",

    // RealistaPro
    "realista_pro.title": "RealistaPro",
    "realista_pro.subtitle":
      "La plateforme professionnelle pour les agences immobilières qui veulent se démarquer",
    "realista_pro.crm": "CRM Avancé",
    "realista_pro.ai": "IA Intégrée",
    "realista_pro.reviews": "Gestion des Avis",
    "realista_pro.choose_plan": "Choisissez votre plan parfait",
    "realista_pro.flexible_plans":
      "Plans flexibles pour les agences et agents individuels",
    "realista_pro.agencies": "Agences",
    "realista_pro.agents": "Agents",
    "realista_pro.networks": "Réseaux",
    "realista_pro.monthly": "Mensuel",
    "realista_pro.yearly": "Annuel",
    "realista_pro.start_free": "Commencer gratuitement",
    "realista_pro.start_now": "Commencer maintenant",
    "realista_pro.ai_features": "Que comprennent les avantages IA ?",
    "realista_pro.auto_descriptions": "Descriptions automatiques",
    "realista_pro.auto_descriptions_desc":
      "L'IA génère des descriptions attrayantes et professionnelles pour vos propriétés",
    "realista_pro.smart_responses": "Réponses intelligentes",
    "realista_pro.smart_responses_desc":
      "Suggestions automatiques pour répondre aux demandes des clients",
    "realista_pro.per_month": "/mois",
    "realista_pro.billed_annually": "Facturé annuellement",
    "realista_pro.free": "Gratuit",
    "realista_pro.two_months_free": "2 mois gratuits",
    "realista_pro.current_subscription": "Votre abonnement actuel",
    "realista_pro.annual": "Annuel",
    "realista_pro.up_to": "Jusqu'à",
    "realista_pro.unlimited": "illimités",
    "realista_pro.properties": "propriétés",
    "realista_pro.agents_label": "agents",
    "realista_pro.manage_billing": "Gérer la facturation",
    "realista_pro.current_plan": "Plan actuel",
    "realista_pro.network_register": "Enregistrer mon réseau",
    "realista_pro.agency_label": "Agence",
    "realista_pro.monthly_only": "Facturation mensuelle uniquement",
    "realista_pro.network_pricing":
      "Facturation selon les agences et leurs plans",
    "realista_pro.free_plan_activated_title": "Plan activé !",
    "realista_pro.free_plan_activated_desc":
      "Votre plan gratuit a été activé avec succès.",
    "realista_pro.subscription_activated_title": "Abonnement activé !",
    "realista_pro.subscription_activated_desc":
      "Votre plan a été activé avec succès. Merci de faire confiance à Realista.",
    "realista_pro.subscription_cancelled_title": "Abonnement annulé",
    "realista_pro.subscription_cancelled_desc":
      "Le processus de paiement a été annulé. Vous pouvez réessayer quand vous le souhaitez.",
    "realista_pro.error_title": "Erreur",
    "realista_pro.error_checkout":
      "Impossible de démarrer le processus de paiement",
    "realista_pro.error_profile":
      "Impossible de déterminer votre profil. Veuillez vous reconnecter.",
    "realista_pro.error_price":
      "Le prix de ce plan est introuvable. Veuillez réessayer.",
    "realista_pro.error_free_plan":
      "Impossible d'activer le plan gratuit",
    "realista_pro.error_billing_portal":
      "Impossible d'ouvrir le portail de facturation",
    "realista_pro.billed_annually_prefix": "Facturé annuellement :",

    // Plans
    "plan.basic_agency": "Agence Basique",
    "plan.basic_agency_desc": "Profil basique pour démarrer",
    "plan.small_agency": "Petite Agence",
    "plan.small_agency_desc": "Pour les petites équipes",
    "plan.medium_agency": "Agence Moyenne",
    "plan.medium_agency_desc": "Pour les équipes en croissance",
    "plan.leader_agency": "Agence Leader",
    "plan.leader_agency_desc": "Pour les grandes agences",
    "plan.basic_agent": "Agent Basique",
    "plan.basic_agent_desc": "Profil individuel basique",
    "plan.leader_agent": "Agent Leader",
    "plan.leader_agent_desc": "Pour les agents professionnels",
    "plan.small_label": "Petite",
    "plan.medium_label": "Moyenne",
    "plan.leader_label": "Leader",
    "plan.network": "Réseau d'Agences",
    "plan.network_desc": "Pour les franchises et réseaux immobiliers",
    "plan.feature.crm": "CRM et gestion d'agenda",
    "plan.feature.ai_benefits": "Avantages IA",
    "plan.feature.unlimited_clients": "Gestion illimitée des clients",
    "plan.feature.unlimited_reviews": "Demandes d'avis illimitées",
    "plan.feature.no_reviews": "Pas de possibilité de demander des avis",
    "plan.feature.basic_main_agent":
      "Profil basique avec uniquement l'agent principal",
    "plan.feature.2_properties": "2 propriétés actives à la fois",
    "plan.feature.2_public_profiles":
      "Jusqu'à 2 profils publics d'agents",
    "plan.feature.10_properties": "Jusqu'à 10 propriétés actives à la fois",
    "plan.feature.6_agents": "Jusqu'à 6 agents",
    "plan.feature.30_properties": "Jusqu'à 30 propriétés actives à la fois",
    "plan.feature.unlimited_agents": "Agents illimités",
    "plan.feature.unlimited_properties": "Propriétés illimitées",
    "plan.feature.agent_basic_profile":
      "Profil basique d'agent individuel",
    "plan.feature.agent_pro_profile": "Profil professionnel d'agent",
    "plan.feature.network_unlimited_agencies":
      "Agences illimitées sous votre marque",
    "plan.feature.network_central_panel":
      "Panneau de contrôle centralisé de tout le réseau",
    "plan.feature.network_consolidated_stats":
      "Statistiques consolidées de performance",
    "plan.feature.network_branding":
      "Image de marque corporative sur tous les profils",
    "plan.feature.network_billing":
      "Gestion centralisée ou facturation individuelle par agence",
    "plan.feature.network_priority_support":
      "Support prioritaire dédié",
    "plan.feature.network_api": "API d'intégration disponible",

    // Legal pages
    "legal.notice.title": "MENTIONS LÉGALES",
    "legal.notice.web_owner": "Titulaire du site web",
    "legal.notice.web_owner_text":
      "Conformément aux dispositions de la réglementation espagnole sur les services numériques, il est porté à la connaissance des utilisateurs que le présent site web, realista.homes, est la propriété de :",
    "legal.notice.owner":
      "Titulaire : [Nom et prénom du promoteur]",
    "legal.notice.nif": "Numéro fiscal : [NIF]",
    "legal.notice.address": "Adresse : [Adresse complète]",
    "legal.notice.contact":
      "E-mail de contact : [contacto@realista.homes]",
    "legal.notice.company_update":
      "Dans le cas où l'activité viendrait à être exercée par une société commerciale, les données ci-dessus seront mises à jour conformément à son immatriculation.",
    "legal.notice.object": "Objet",
    "legal.notice.object_text":
      "Le présent site web a pour objet d'offrir une plateforme numérique d'intermédiation immobilière permettant aux utilisateurs de publier, rechercher et souscrire des services liés à l'immobilier.",
    "legal.notice.terms": "Conditions d'utilisation",
    "legal.notice.terms_text":
      "L'accès et l'utilisation du site web confèrent la qualité d'utilisateur et impliquent l'acceptation pleine et entière des présentes conditions.",
    "legal.notice.user_commitment": "L'utilisateur s'engage à :",
    "legal.notice.use_1": "Faire un usage approprié et licite du site.",
    "legal.notice.use_2": "Ne pas réaliser d'activités frauduleuses.",
    "legal.notice.use_3":
      "Ne pas introduire de contenus illicites ou préjudiciables.",
    "legal.notice.ip": "Propriété intellectuelle",
    "legal.notice.ip_text":
      "Tous les contenus du site (textes, designs, logos, logiciels) sont la propriété du titulaire ou bénéficient d'une licence légitime.",
    "legal.notice.ip_text_2":
      "Leur reproduction sans autorisation expresse est interdite.",
    "legal.notice.liability": "Responsabilité",
    "legal.notice.liability_text":
      "Le titulaire ne garantit pas la disponibilité continue du site et n'est pas responsable des dommages découlant d'une utilisation inappropriée de celui-ci.",

    "legal.privacy.title": "POLITIQUE DE CONFIDENTIALITÉ",
    "legal.privacy.controller": "Responsable du traitement",
    "legal.privacy.controller_text":
      "Responsable : [Nom et prénom ou future société]",
    "legal.privacy.email": "E-mail : contacto@realista.homes",
    "legal.privacy.data": "Données que nous collectons",
    "legal.privacy.data_1": "Données d'identification (nom, e-mail)",
    "legal.privacy.data_2": "Données de facturation",
    "legal.privacy.data_3": "Données de contact",
    "legal.privacy.data_4":
      "Informations d'utilisation de la plateforme",
    "legal.privacy.data_5":
      "Données de paiement (gérées par un prestataire externe)",
    "legal.privacy.purpose": "Finalité",
    "legal.privacy.purpose_1": "Gestion des comptes utilisateurs",
    "legal.privacy.purpose_2": "Gestion des paiements et commissions",
    "legal.privacy.purpose_3":
      "Prestation de services d'intermédiation",
    "legal.privacy.purpose_4":
      "Respect des obligations légales",
    "legal.privacy.purpose_5":
      "Envoi de communications liées au service",
    "legal.privacy.basis": "Base juridique",
    "legal.privacy.basis_1": "Exécution du contrat",
    "legal.privacy.basis_2": "Consentement de l'utilisateur",
    "legal.privacy.basis_3": "Respect d'une obligation légale",
    "legal.privacy.retention": "Conservation",
    "legal.privacy.retention_text":
      "Les données seront conservées tant que la relation contractuelle existe et ensuite pendant les délais exigés par la réglementation fiscale et commerciale.",
    "legal.privacy.recipients": "Destinataires",
    "legal.privacy.recipients_intro":
      "Peuvent accéder aux données :",
    "legal.privacy.recipients_1": "Fournisseurs technologiques",
    "legal.privacy.recipients_2":
      "Prestataires de services de paiement",
    "legal.privacy.recipients_3":
      "Autorités compétentes en cas d'obligation légale",
    "legal.privacy.international":
      "En cas de transferts internationaux, ceux-ci seront encadrés par des mécanismes appropriés conformément au RGPD.",
    "legal.privacy.rights": "Droits de l'utilisateur",
    "legal.privacy.rights_intro": "L'utilisateur peut exercer :",
    "legal.privacy.rights_1": "Accès",
    "legal.privacy.rights_2": "Rectification",
    "legal.privacy.rights_3": "Effacement",
    "legal.privacy.rights_4": "Opposition",
    "legal.privacy.rights_5": "Limitation",
    "legal.privacy.rights_6": "Portabilité",
    "legal.privacy.contact_rights":
      "En envoyant une demande à privacidad@realista.homes.",
    "legal.privacy.aepd":
      "Vous pouvez également déposer une réclamation auprès de l'Agence espagnole de protection des données.",

    "legal.cookies.title": "POLITIQUE DE COOKIES",
    "legal.cookies.intro":
      "Le site realista.homes utilise des cookies propres et de tiers.",
    "legal.cookies.types": "Types de cookies",
    "legal.cookies.types_1":
      "Techniques (nécessaires au fonctionnement)",
    "legal.cookies.types_2": "Analytiques",
    "legal.cookies.types_3": "Publicitaires (le cas échéant)",
    "legal.cookies.non_essential":
      "Les cookies non essentiels ne seront installés qu'après le consentement de l'utilisateur.",
    "legal.cookies.management": "Gestion du consentement",
    "legal.cookies.user_can": "L'utilisateur pourra :",
    "legal.cookies.action_1": "Tout accepter",
    "legal.cookies.action_2": "Tout refuser",
    "legal.cookies.action_3": "Configurer les préférences",
    "legal.cookies.change":
      "Vous pouvez modifier votre consentement à tout moment depuis le panneau de configuration.",

    "legal.terms.title": "CONDITIONS GÉNÉRALES D'UTILISATION",
    "legal.terms.section_1": "1. Nature du service",
    "legal.terms.section_1_text":
      "realista.homes est une plateforme numérique qui agit en tant qu'intermédiaire entre les utilisateurs qui publient des biens immobiliers et les utilisateurs intéressés.",
    "legal.terms.section_1_text_2":
      "La plateforme n'est pas propriétaire des biens publiés, sauf indication expresse contraire.",
    "legal.terms.section_2": "2. Inscription",
    "legal.terms.section_2_text":
      "Pour utiliser certains services, il est obligatoire de créer un compte en fournissant des informations véridiques et à jour.",
    "legal.terms.section_2_text_2":
      "L'utilisateur est responsable de la protection de ses identifiants.",
    "legal.terms.section_3": "3. Paiements et commissions",
    "legal.terms.section_3_intro": "La plateforme pourra facturer :",
    "legal.terms.section_3_1": "Commissions de publication",
    "legal.terms.section_3_2": "Commissions de transaction",
    "legal.terms.section_3_3": "Services additionnels",
    "legal.terms.section_3_text":
      "Les paiements sont gérés par un prestataire externe de services de paiement.",
    "legal.terms.section_3_text_2":
      "La plateforme ne stocke pas les données complètes des cartes.",
    "legal.terms.section_4": "4. Obligations des utilisateurs",
    "legal.terms.section_4_intro": "Les utilisateurs s'engagent à :",
    "legal.terms.section_4_1": "Ne pas publier d'informations fausses",
    "legal.terms.section_4_2":
      "Respecter la réglementation immobilière",
    "legal.terms.section_4_3":
      "Ne pas porter atteinte aux droits de tiers",
    "legal.terms.section_5": "5. Responsabilité",
    "legal.terms.section_5_intro":
      "La plateforme agit en tant qu'intermédiaire technologique et ne garantit pas :",
    "legal.terms.section_5_1": "L'exactitude des annonces",
    "legal.terms.section_5_2": "Le succès des opérations",
    "legal.terms.section_6": "6. Annulations et remboursements",
    "legal.terms.section_6_text":
      "Les conditions d'annulation et de remboursement dépendront du type de service souscrit et seront précisées dans chaque cas.",
    "legal.terms.section_7": "7. Résolution des conflits",
    "legal.terms.section_7_text":
      "Les parties se soumettent à la législation espagnole.",

    // Common
    "common.clear": "Effacer",
    "common.select_all": "Tout sélectionner",
    "common.done": "Terminé",
    "common.cancel": "Annuler",
    "common.save": "Enregistrer",
    "common.yes": "Oui",
    "common.no": "Non",

    // Neighborhood Rating
    "neighborhood_rating.title":
      "Recherchez et découvrez les quartiers qui vous intéressent",
    "neighborhood_rating.search_placeholder":
      "Rechercher des localités en Espagne",
    "neighborhood_rating.not_rated": "Non noté",
    "neighborhood_rating.rate_button": "Évaluer ce quartier",
    "neighborhood_rating.rate_title": "Évaluer : {location}",
    "neighborhood_rating.category_security": "Sécurité",
    "neighborhood_rating.category_parking": "Stationnement",
    "neighborhood_rating.category_family": "Convivialité familiale",
    "neighborhood_rating.category_transport": "Connectivité",
    "neighborhood_rating.category_green": "Espaces verts",
    "neighborhood_rating.category_services": "Services",
    "neighborhood_rating.submitting": "Envoi en cours...",
    "neighborhood_rating.submit": "Envoyer l'évaluation",
    "neighborhood_rating.based_on":
      "Basé sur {count} évaluations de résidents",
    "neighborhood_rating.no_ratings":
      "Aucune évaluation disponible pour {location} pour le moment.",
    "neighborhood_rating.try_popular":
      "Essayez l'un des quartiers populaires ci-dessus.",
    "neighborhood_rating.toast_submitted_title": "Évaluation envoyée !",
    "neighborhood_rating.toast_submitted_desc":
      "Votre évaluation pour {location} a été enregistrée avec succès.",
    "neighborhood_rating.toast_error_title":
      "Erreur lors de l'envoi de l'évaluation",
    "neighborhood_rating.toast_error_desc":
      "Votre évaluation n'a pas pu être envoyée. Veuillez réessayer.",
    "neighborhood_rating.toast_missing_title": "Évaluations manquantes",
    "neighborhood_rating.toast_missing_desc":
      "Veuillez évaluer toutes les catégories avant d'envoyer.",

    ...manageTranslations.fr,
  },
  it: {
    // Navbar
    "nav.home": "Home",
    "nav.login": "Accedi",
    "nav.profile": "La mia area personale",
    "nav.manage": "Gestisci tutto",
    "nav.realista_pro": "RealistaPro",

    // SearchBar
    "search.rent": "Affittare",
    "search.buy": "Comprare",
    "search.agencies": "Agenzie",
    "search.agents": "Agenti",
    "search.neighborhood": "Cerca quartiere...",
    "search.button": "Cerca",
    "search.select_neighborhood": "Seleziona un quartiere",
    "search.location_required": "Posizione richiesta",
    "search.location_required_desc":
      "Seleziona un quartiere, un distretto o Barcellona per effettuare la ricerca",

    // Home
    "home.hero_title":
      "Trova la tua casa ideale con tutte le informazioni",
    "home.most_viewed": "Le più viste",
    "home.tab_sale": "In Vendita",
    "home.tab_rent": "In Affitto",
    "home.no_sale_title":
      "Al momento non ci sono proprietà in vendita disponibili.",
    "home.no_rent_title":
      "Al momento non ci sono proprietà in affitto disponibili.",
    "home.no_results_subtitle":
      "Torna presto per scoprire nuove opportunità.",
    "home.add_review_title":
      "Aggiungi una recensione per il tuo agente e/o agenzia",
    "home.add_review_subtitle":
      "Cerca il tuo agente o agenzia e condividi la tua esperienza.",
    "home.agency_eyebrow": "Per le agenzie immobiliari",
    "home.agency_title": "Tutto ciò che serve alla tua agenzia per crescere",
    "home.agency_subtitle":
      "Centralizza le attività, aumenta la visibilità degli immobili e costruisci una reputazione che ispiri fiducia.",
    "home.agency_benefit_visibility_title": "Più visibilità",
    "home.agency_benefit_visibility_description":
      "Pubblica immobili e presenta la tua agenzia e il tuo team con profili professionali.",
    "home.agency_benefit_crm_title": "CRM clienti",
    "home.agency_benefit_crm_description":
      "Organizza contatti, conversazioni e opportunità in un unico spazio.",
    "home.agency_benefit_operations_title": "Agenda e team",
    "home.agency_benefit_operations_description":
      "Coordina appuntamenti, attività e agenti mantenendo connessa tutta l'agenzia.",
    "home.agency_benefit_reputation_title": "Reputazione verificata",
    "home.agency_benefit_reputation_description":
      "Richiedi e gestisci recensioni che aiutino nuovi clienti a sceglierti.",
    "home.agency_benefit_ai_title": "IA integrata",
    "home.agency_benefit_ai_description":
      "Crea più rapidamente descrizioni professionali per i tuoi immobili.",
    "home.agency_neighborhood_title": "Scopri come i clienti valutano ogni quartiere",
    "home.agency_neighborhood_description":
      "Le valutazioni di sicurezza, trasporti, servizi e qualità della vita contestualizzano gli immobili e aiutano i clienti a decidere meglio.",
    "home.agency_cta": "Scopri i piani RealistaPro",

    // Footer
    "footer.company_description":
      "La tua piattaforma di fiducia per trovare le migliori proprietà in Spagna. Colleghiamo agenti, agenzie e clienti in modo professionale ed efficiente.",
    "footer.location": "Barcellona, Spagna",
    "footer.districts": "Distretti di Barcellona",
    "footer.all_districts": "Vedi tutti i distretti →",
    "footer.popular_neighborhoods": "Quartieri popolari",
    "footer.legal_info": "Informazioni legali",
    "footer.privacy": "Informativa sulla privacy",
    "footer.terms": "Termini e Condizioni",
    "footer.cookies": "Informativa sui Cookie",
    "footer.legal_notice": "Note Legali",
    "footer.copyright": "Tutti i diritti riservati.",
    "footer.digital_real_estate": "Immobiliare Digitale",
    "footer.disclaimer":
      "Realista è una piattaforma digitale che collega professionisti immobiliari con i clienti. Non siamo responsabili delle transazioni effettuate tra utenti. Tutte le informazioni mostrate sono fornite dagli agenti e dalle agenzie registrati.",

    // RealistaPro
    "realista_pro.title": "RealistaPro",
    "realista_pro.subtitle":
      "La piattaforma professionale per le agenzie immobiliari che vogliono distinguersi",
    "realista_pro.crm": "CRM Avanzato",
    "realista_pro.ai": "IA Integrata",
    "realista_pro.reviews": "Gestione delle Recensioni",
    "realista_pro.choose_plan": "Scegli il tuo piano perfetto",
    "realista_pro.flexible_plans":
      "Piani flessibili per agenzie e agenti individuali",
    "realista_pro.agencies": "Agenzie",
    "realista_pro.agents": "Agenti",
    "realista_pro.networks": "Reti",
    "realista_pro.monthly": "Mensile",
    "realista_pro.yearly": "Annuale",
    "realista_pro.start_free": "Inizia gratis",
    "realista_pro.start_now": "Inizia ora",
    "realista_pro.ai_features": "Cosa includono i vantaggi IA?",
    "realista_pro.auto_descriptions": "Descrizioni automatiche",
    "realista_pro.auto_descriptions_desc":
      "L'IA genera descrizioni accattivanti e professionali per le tue proprietà",
    "realista_pro.smart_responses": "Risposte intelligenti",
    "realista_pro.smart_responses_desc":
      "Suggerimenti automatici per rispondere alle richieste dei clienti",
    "realista_pro.per_month": "/mese",
    "realista_pro.billed_annually": "Fatturato annualmente",
    "realista_pro.free": "Gratis",
    "realista_pro.two_months_free": "2 mesi gratis",
    "realista_pro.current_subscription": "Il tuo abbonamento attuale",
    "realista_pro.annual": "Annuale",
    "realista_pro.up_to": "Fino a",
    "realista_pro.unlimited": "illimitati",
    "realista_pro.properties": "proprietà",
    "realista_pro.agents_label": "agenti",
    "realista_pro.manage_billing": "Gestisci fatturazione",
    "realista_pro.current_plan": "Piano attuale",
    "realista_pro.network_register": "Registra la mia rete",
    "realista_pro.agency_label": "Agenzia",
    "realista_pro.monthly_only": "Solo fatturazione mensile",
    "realista_pro.network_pricing":
      "Fatturazione in base alle agenzie e ai loro piani",
    "realista_pro.free_plan_activated_title": "Piano attivato!",
    "realista_pro.free_plan_activated_desc":
      "Il tuo piano gratuito è stato attivato correttamente.",
    "realista_pro.subscription_activated_title": "Abbonamento attivato!",
    "realista_pro.subscription_activated_desc":
      "Il tuo piano è stato attivato correttamente. Grazie per aver scelto Realista.",
    "realista_pro.subscription_cancelled_title": "Abbonamento annullato",
    "realista_pro.subscription_cancelled_desc":
      "Il processo di pagamento è stato annullato. Puoi riprovare quando vuoi.",
    "realista_pro.error_title": "Errore",
    "realista_pro.error_checkout":
      "Impossibile avviare il processo di pagamento",
    "realista_pro.error_profile":
      "Impossibile determinare il tuo profilo. Effettua nuovamente l'accesso.",
    "realista_pro.error_price":
      "Prezzo per questo piano non trovato. Riprova.",
    "realista_pro.error_free_plan":
      "Impossibile attivare il piano gratuito",
    "realista_pro.error_billing_portal":
      "Impossibile aprire il portale di fatturazione",
    "realista_pro.billed_annually_prefix": "Fatturato annualmente:",

    // Plans
    "plan.basic_agency": "Agenzia Base",
    "plan.basic_agency_desc": "Profilo base per iniziare",
    "plan.small_agency": "Piccola Agenzia",
    "plan.small_agency_desc": "Per piccoli team",
    "plan.medium_agency": "Agenzia Media",
    "plan.medium_agency_desc": "Per team in crescita",
    "plan.leader_agency": "Agenzia Leader",
    "plan.leader_agency_desc": "Per grandi agenzie",
    "plan.basic_agent": "Agente Base",
    "plan.basic_agent_desc": "Profilo individuale base",
    "plan.leader_agent": "Agente Leader",
    "plan.leader_agent_desc": "Per agenti professionisti",
    "plan.small_label": "Piccola",
    "plan.medium_label": "Media",
    "plan.leader_label": "Leader",
    "plan.network": "Rete di Agenzie",
    "plan.network_desc": "Per franchising e reti immobiliari",
    "plan.feature.crm": "CRM e gestione agenda",
    "plan.feature.ai_benefits": "Vantaggi IA",
    "plan.feature.unlimited_clients": "Gestione illimitata dei clienti",
    "plan.feature.unlimited_reviews": "Richieste illimitate di recensioni",
    "plan.feature.no_reviews":
      "Nessuna possibilità di richiedere recensioni",
    "plan.feature.basic_main_agent":
      "Profilo base con solo l'agente principale",
    "plan.feature.2_properties": "2 proprietà attive alla volta",
    "plan.feature.2_public_profiles":
      "Fino a 2 profili pubblici di agenti",
    "plan.feature.10_properties": "Fino a 10 proprietà attive alla volta",
    "plan.feature.6_agents": "Fino a 6 agenti",
    "plan.feature.30_properties": "Fino a 30 proprietà attive alla volta",
    "plan.feature.unlimited_agents": "Agenti illimitati",
    "plan.feature.unlimited_properties": "Proprietà illimitate",
    "plan.feature.agent_basic_profile":
      "Profilo base di agente individuale",
    "plan.feature.agent_pro_profile": "Profilo professionale di agente",
    "plan.feature.network_unlimited_agencies":
      "Agenzie illimitate sotto il tuo marchio",
    "plan.feature.network_central_panel":
      "Pannello di controllo centralizzato di tutta la rete",
    "plan.feature.network_consolidated_stats":
      "Statistiche consolidate delle prestazioni",
    "plan.feature.network_branding":
      "Branding aziendale su tutti i profili",
    "plan.feature.network_billing":
      "Gestione centralizzata o fatturazione individuale per agenzia",
    "plan.feature.network_priority_support":
      "Supporto prioritario dedicato",
    "plan.feature.network_api": "API di integrazione disponibile",

    // Legal pages
    "legal.notice.title": "NOTE LEGALI",
    "legal.notice.web_owner": "Titolare del sito web",
    "legal.notice.web_owner_text":
      "In conformità con le disposizioni della normativa spagnola sui servizi digitali, si informa che il presente sito web, realista.homes, è di proprietà di:",
    "legal.notice.owner":
      "Titolare: [Nome e Cognome del promotore]",
    "legal.notice.nif": "Codice Fiscale: [NIF]",
    "legal.notice.address": "Indirizzo: [Indirizzo completo]",
    "legal.notice.contact":
      "E-mail di contatto: [contacto@realista.homes]",
    "legal.notice.company_update":
      "Nel caso in cui l'attività venga successivamente svolta da una società commerciale, i dati precedenti saranno aggiornati in base alla sua iscrizione nel registro.",
    "legal.notice.object": "Oggetto",
    "legal.notice.object_text":
      "Il presente sito web ha lo scopo di offrire una piattaforma digitale di intermediazione immobiliare che consente agli utenti di pubblicare, cercare e contrattare servizi relativi agli immobili.",
    "legal.notice.terms": "Condizioni d'uso",
    "legal.notice.terms_text":
      "L'accesso e l'utilizzo del sito web attribuiscono la condizione di utente e implicano la piena accettazione delle presenti condizioni.",
    "legal.notice.user_commitment": "L'utente si impegna a:",
    "legal.notice.use_1": "Fare un uso adeguato e lecito del sito.",
    "legal.notice.use_2": "Non svolgere attività fraudolente.",
    "legal.notice.use_3":
      "Non introdurre contenuti illeciti o dannosi.",
    "legal.notice.ip": "Proprietà intellettuale",
    "legal.notice.ip_text":
      "Tutti i contenuti del sito (testi, design, loghi, software) sono di proprietà del titolare o dispongono di licenza legittima.",
    "legal.notice.ip_text_2":
      "È vietata la loro riproduzione senza autorizzazione espressa.",
    "legal.notice.liability": "Responsabilità",
    "legal.notice.liability_text":
      "Il titolare non garantisce la disponibilità continua del sito né si assume la responsabilità per danni derivanti dall'uso improprio dello stesso.",

    "legal.privacy.title": "INFORMATIVA SULLA PRIVACY",
    "legal.privacy.controller": "Titolare del trattamento",
    "legal.privacy.controller_text":
      "Titolare: [Nome e Cognome o futura società]",
    "legal.privacy.email": "Email: contacto@realista.homes",
    "legal.privacy.data": "Dati che raccogliamo",
    "legal.privacy.data_1": "Dati identificativi (nome, email)",
    "legal.privacy.data_2": "Dati di fatturazione",
    "legal.privacy.data_3": "Dati di contatto",
    "legal.privacy.data_4":
      "Informazioni sull'utilizzo della piattaforma",
    "legal.privacy.data_5":
      "Dati di pagamento (gestiti tramite fornitore esterno)",
    "legal.privacy.purpose": "Finalità",
    "legal.privacy.purpose_1": "Gestione degli account utente",
    "legal.privacy.purpose_2": "Gestione di pagamenti e commissioni",
    "legal.privacy.purpose_3":
      "Erogazione di servizi di intermediazione",
    "legal.privacy.purpose_4":
      "Adempimento degli obblighi legali",
    "legal.privacy.purpose_5":
      "Invio di comunicazioni relative al servizio",
    "legal.privacy.basis": "Base giuridica",
    "legal.privacy.basis_1": "Esecuzione del contratto",
    "legal.privacy.basis_2": "Consenso dell'utente",
    "legal.privacy.basis_3": "Adempimento di un obbligo legale",
    "legal.privacy.retention": "Conservazione",
    "legal.privacy.retention_text":
      "I dati saranno conservati per tutta la durata del rapporto contrattuale e successivamente per i periodi richiesti dalla normativa fiscale e commerciale.",
    "legal.privacy.recipients": "Destinatari",
    "legal.privacy.recipients_intro":
      "Potranno accedere ai dati:",
    "legal.privacy.recipients_1": "Fornitori tecnologici",
    "legal.privacy.recipients_2":
      "Fornitori di servizi di pagamento",
    "legal.privacy.recipients_3":
      "Autorità competenti in caso di obbligo legale",
    "legal.privacy.international":
      "In caso di trasferimenti internazionali, questi saranno garantiti tramite meccanismi adeguati conformi al RGPD.",
    "legal.privacy.rights": "Diritti dell'utente",
    "legal.privacy.rights_intro": "L'utente può esercitare:",
    "legal.privacy.rights_1": "Accesso",
    "legal.privacy.rights_2": "Rettifica",
    "legal.privacy.rights_3": "Cancellazione",
    "legal.privacy.rights_4": "Opposizione",
    "legal.privacy.rights_5": "Limitazione",
    "legal.privacy.rights_6": "Portabilità",
    "legal.privacy.contact_rights":
      "Inviando una richiesta a privacidad@realista.homes.",
    "legal.privacy.aepd":
      "Inoltre, è possibile presentare un reclamo all'Agenzia Spagnola per la Protezione dei Dati.",

    "legal.cookies.title": "INFORMATIVA SUI COOKIE",
    "legal.cookies.intro":
      "Il sito realista.homes utilizza cookie propri e di terze parti.",
    "legal.cookies.types": "Tipi di cookie",
    "legal.cookies.types_1":
      "Tecnici (necessari per il funzionamento)",
    "legal.cookies.types_2": "Analitici",
    "legal.cookies.types_3": "Pubblicitari (se applicabile)",
    "legal.cookies.non_essential":
      "I cookie non essenziali verranno installati solo dopo il consenso dell'utente.",
    "legal.cookies.management": "Gestione del consenso",
    "legal.cookies.user_can": "L'utente potrà:",
    "legal.cookies.action_1": "Accettare tutti",
    "legal.cookies.action_2": "Rifiutare tutti",
    "legal.cookies.action_3": "Configurare le preferenze",
    "legal.cookies.change":
      "Puoi modificare il tuo consenso in qualsiasi momento dal pannello delle impostazioni.",

    "legal.terms.title": "TERMINI E CONDIZIONI D'USO",
    "legal.terms.section_1": "1. Natura del servizio",
    "legal.terms.section_1_text":
      "realista.homes è una piattaforma digitale che agisce da intermediaria tra gli utenti che pubblicano immobili e gli utenti interessati.",
    "legal.terms.section_1_text_2":
      "La piattaforma non è proprietaria degli immobili pubblicati, salvo indicazione espressa contraria.",
    "legal.terms.section_2": "2. Registrazione",
    "legal.terms.section_2_text":
      "Per utilizzare determinati servizi è obbligatorio creare un account fornendo informazioni veritiere e aggiornate.",
    "legal.terms.section_2_text_2":
      "L'utente è responsabile della custodia delle proprie credenziali.",
    "legal.terms.section_3": "3. Pagamenti e commissioni",
    "legal.terms.section_3_intro": "La piattaforma potrà addebitare:",
    "legal.terms.section_3_1": "Commissioni di pubblicazione",
    "legal.terms.section_3_2": "Commissioni di transazione",
    "legal.terms.section_3_3": "Servizi aggiuntivi",
    "legal.terms.section_3_text":
      "I pagamenti sono gestiti tramite un fornitore esterno di servizi di pagamento.",
    "legal.terms.section_3_text_2":
      "La piattaforma non memorizza i dati completi delle carte.",
    "legal.terms.section_4": "4. Obblighi degli utenti",
    "legal.terms.section_4_intro": "Gli utenti si impegnano a:",
    "legal.terms.section_4_1": "Non pubblicare informazioni false",
    "legal.terms.section_4_2":
      "Rispettare la normativa immobiliare",
    "legal.terms.section_4_3":
      "Non violare i diritti di terzi",
    "legal.terms.section_5": "5. Responsabilità",
    "legal.terms.section_5_intro":
      "La piattaforma agisce come intermediario tecnologico e non garantisce:",
    "legal.terms.section_5_1": "L'accuratezza degli annunci",
    "legal.terms.section_5_2": "Il successo delle operazioni",
    "legal.terms.section_6": "6. Cancellazioni e rimborsi",
    "legal.terms.section_6_text":
      "Le condizioni di cancellazione e rimborso dipenderanno dal tipo di servizio contrattato e saranno specificate in ogni caso.",
    "legal.terms.section_7": "7. Risoluzione delle controversie",
    "legal.terms.section_7_text":
      "Le parti si sottopongono alla legislazione spagnola.",

    // Common
    "common.clear": "Cancella",
    "common.select_all": "Seleziona tutti",
    "common.done": "Fatto",
    "common.cancel": "Annulla",
    "common.save": "Salva",
    "common.yes": "Sì",
    "common.no": "No",

    // Neighborhood Rating
    "neighborhood_rating.title": "Cerca e scopri i quartieri che ti interessano",
    "neighborhood_rating.search_placeholder":
      "Cerca località in Spagna",
    "neighborhood_rating.not_rated": "Non valutato",
    "neighborhood_rating.rate_button": "Valuta questo quartiere",
    "neighborhood_rating.rate_title": "Valuta: {location}",
    "neighborhood_rating.category_security": "Sicurezza",
    "neighborhood_rating.category_parking": "Parcheggio",
    "neighborhood_rating.category_family": "Ambiente familiare",
    "neighborhood_rating.category_transport": "Collegamenti",
    "neighborhood_rating.category_green": "Aree verdi",
    "neighborhood_rating.category_services": "Servizi",
    "neighborhood_rating.submitting": "Invio in corso...",
    "neighborhood_rating.submit": "Invia valutazione",
    "neighborhood_rating.based_on":
      "Basato su {count} valutazioni di residenti",
    "neighborhood_rating.no_ratings":
      "Al momento non sono disponibili valutazioni per {location}.",
    "neighborhood_rating.try_popular":
      "Prova uno dei quartieri popolari qui sopra.",
    "neighborhood_rating.toast_submitted_title": "Valutazione inviata!",
    "neighborhood_rating.toast_submitted_desc":
      "La tua valutazione per {location} è stata salvata con successo.",
    "neighborhood_rating.toast_error_title":
      "Errore nell'invio della valutazione",
    "neighborhood_rating.toast_error_desc":
      "Non è stato possibile inviare la tua valutazione. Riprova.",
    "neighborhood_rating.toast_missing_title": "Valutazioni mancanti",
    "neighborhood_rating.toast_missing_desc":
      "Valuta tutte le categorie prima di inviare.",

    ...manageTranslations.it,
  },
};
