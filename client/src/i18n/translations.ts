export type TranslationMap = Record<string, string>;

export const translations: Record<"es" | "en", TranslationMap> = {
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

    // Footer
    "footer.company_description":
      "Your trusted platform to find the best properties in Spain. We connect agents, agencies, and clients in a professional and efficient way.",
    "footer.location": "Barcelona, Spain",
    "footer.districts": "Barcelona districts",
    "footer.all_districts": "See all districts →",
    "footer.popular_neighborhoods": "Popular neighborhoods",
    "footer.legal_info": "Legal information",
    "footer.privacy": "Política de privacidad",
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
  },
};
