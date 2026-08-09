import { useEffect } from "react";
import { useLocation } from "wouter";

const PUBLIC_ROUTE_PREFIXES = [
  "/buscar/",
  "/search/",
  "/barrio/",
  "/neighborhood/",
  "/inmueble/",
  "/property/",
  "/agentes/",
  "/agent/",
  "/agent-profile/",
  "/agencias/",
  "/agency/",
  "/agency-profile/",
];

const PRIVATE_ROUTE_PREFIXES = [
  "/gestionar",
  "/perfil-cliente",
  "/admin-red",
  "/super-admin",
  "/registro",
  "/register",
  "/login",
  "/iniciar-sesion",
  "/app/",
  "/confirmar-resena/",
  "/client-",
];

const ROUTE_METADATA = {
  home: {
    title: "Realista | Encuentra tu hogar ideal con toda la información",
    description:
      "Encuentra propiedades, barrios, agencias y agentes inmobiliarios en España con Realista.",
  },
  realistaPro: {
    title: "RealistaPro | Software para agencias inmobiliarias",
    description:
      "Gestiona tu agencia inmobiliaria con CRM, propiedades, clientes, reseñas, IA y herramientas de administración en RealistaPro.",
  },
  buy: {
    title: "Pisos en venta | Realista",
    description:
      "Busca pisos y casas en venta por barrio, ciudad y precio. Compara propiedades y contacta directamente con profesionales inmobiliarios.",
  },
  rent: {
    title: "Pisos en alquiler | Realista",
    description:
      "Encuentra pisos y casas en alquiler por barrio, ciudad y precio. Consulta información completa y contacta con agencias inmobiliarias.",
  },
  agencies: {
    title: "Agencias inmobiliarias | Realista",
    description:
      "Encuentra agencias inmobiliarias de confianza, conoce sus propiedades y contacta con profesionales de tu zona.",
  },
  agents: {
    title: "Agentes inmobiliarios | Realista",
    description:
      "Encuentra agentes inmobiliarios profesionales por zona y conecta directamente con el experto adecuado para tu búsqueda.",
  },
  public: {
    title: "Realista | Plataforma inmobiliaria",
    description:
      "Encuentra propiedades, barrios, agencias y agentes inmobiliarios en España con Realista.",
  },
  private: {
    title: "Realista",
    description: "Gestiona tu cuenta de Realista.",
  },
} as const;

function upsertMeta(
  attribute: "name" | "property",
  key: string,
  content: string,
) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function upsertCanonical(href: string | null) {
  let element = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!href) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = href;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value).replace(/\+/g, " ");
  } catch {
    return value;
  }
}

function canonicalPath(pathname: string): string {
  const aliasPrefixes: Array<[RegExp, string]> = [
    [/^\/search\/buy(?:\/|$)/, "/buscar/comprar"],
    [/^\/search\/rent(?:\/|$)/, "/buscar/alquilar"],
    [/^\/search\/agencies(?:\/|$)/, "/buscar/agencias"],
    [/^\/search\/agents(?:\/|$)/, "/buscar/agentes"],
    [/^\/neighborhood\//, "/barrio/"],
    [/^\/property\//, "/inmueble/"],
    [/^\/agent-profile\//, "/agentes/"],
    [/^\/agent\//, "/agentes/"],
    [/^\/agency-profile\//, "/agencias/"],
    [/^\/agency\//, "/agencias/"],
  ];

  for (const [pattern, replacement] of aliasPrefixes) {
    if (pattern.test(pathname)) {
      return pathname.replace(pattern, replacement);
    }
  }
  return pathname;
}

function metadataForPath(pathname: string) {
  if (pathname === "/") return ROUTE_METADATA.home;
  if (pathname === "/realista-pro") return ROUTE_METADATA.realistaPro;
  if (
    pathname === "/buscar/comprar" ||
    pathname.startsWith("/search/buy")
  ) {
    return ROUTE_METADATA.buy;
  }
  if (
    pathname === "/buscar/alquilar" ||
    pathname.startsWith("/search/rent")
  ) {
    return ROUTE_METADATA.rent;
  }
  if (
    pathname === "/buscar/agencias" ||
    pathname.startsWith("/search/agencies")
  ) {
    return ROUTE_METADATA.agencies;
  }
  if (
    pathname === "/buscar/agentes" ||
    pathname.startsWith("/search/agents")
  ) {
    return ROUTE_METADATA.agents;
  }
  if (
    pathname.startsWith("/barrio/") ||
    pathname.startsWith("/neighborhood/")
  ) {
    const segment = pathname.split("/")[2];
    const neighborhood = segment ? safeDecode(segment) : "tu zona";
    return {
      title: `${neighborhood} | Barrios y propiedades | Realista`,
      description: `Descubre propiedades, agencias y agentes inmobiliarios en ${neighborhood}. Compara información del barrio y encuentra tu próximo hogar.`,
    };
  }
  if (pathname.startsWith("/inmueble/") || pathname.startsWith("/property/")) {
    return {
      title: "Propiedad inmobiliaria | Realista",
      description:
        "Consulta los detalles de esta propiedad inmobiliaria, descubre su ubicación y contacta con el agente o agencia responsable.",
    };
  }
  if (
    pathname.startsWith("/agentes/") ||
    pathname.startsWith("/agent/") ||
    pathname.startsWith("/agent-profile/")
  ) {
    return {
      title: "Agente inmobiliario | Realista",
      description:
        "Conoce a este agente inmobiliario, descubre sus propiedades y contacta directamente para recibir asesoramiento.",
    };
  }
  if (
    pathname.startsWith("/agencias/") ||
    pathname.startsWith("/agency/") ||
    pathname.startsWith("/agency-profile/")
  ) {
    return {
      title: "Agencia inmobiliaria | Realista",
      description:
        "Conoce esta agencia inmobiliaria, consulta sus propiedades y contacta con su equipo profesional.",
    };
  }
  if (
    pathname === "/aviso-legal" ||
    pathname === "/politica-privacidad" ||
    pathname === "/politica-cookies" ||
    pathname === "/terminos-condiciones"
  ) {
    const labels: Record<string, string> = {
      "/aviso-legal": "Aviso legal",
      "/politica-privacidad": "Política de privacidad",
      "/politica-cookies": "Política de cookies",
      "/terminos-condiciones": "Términos y condiciones",
    };
    const label = labels[pathname];
    return {
      title: `${label} | Realista`,
      description: `Consulta la ${label.toLowerCase()} de Realista y conoce las condiciones aplicables al uso de la plataforma inmobiliaria.`,
    };
  }
  if (
    PRIVATE_ROUTE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return ROUTE_METADATA.private;
  }
  if (
    pathname === "/" ||
    PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return ROUTE_METADATA.public;
  }
  return ROUTE_METADATA.private;
}

export function SeoMetadata() {
  const [location] = useLocation();

  useEffect(() => {
    const pathname = location.split("?")[0].split("#")[0] || "/";
    const metadata = metadataForPath(pathname);
    const isPrivate = metadata === ROUTE_METADATA.private;
    const canonical = isPrivate
      ? null
      : new URL(canonicalPath(pathname), window.location.origin).toString();

    document.title = metadata.title;
    upsertMeta("name", "description", metadata.description);
    upsertMeta("property", "og:title", metadata.title);
    upsertMeta("property", "og:description", metadata.description);
    upsertMeta("property", "og:url", canonical || window.location.href);
    upsertMeta("name", "twitter:title", metadata.title);
    upsertMeta("name", "twitter:description", metadata.description);
    upsertMeta("name", "robots", isPrivate ? "noindex,nofollow" : "index,follow");
    upsertCanonical(canonical);
  }, [location]);

  return null;
}