import fs from "node:fs";
import path from "node:path";
import type { Request } from "express";

type SeoPage = "home" | "realistaPro" | "public";

type SeoContent = {
  title: string;
  description: string;
  heading: string;
  intro: string;
};

const HOME_CONTENT = {
  title: "Realista | Encuentra tu hogar ideal con toda la información",
  description:
    "Encuentra propiedades, barrios, agencias y agentes inmobiliarios en España con Realista.",
  heading: "Encuentra tu hogar ideal con toda la información",
  intro:
    "Descubre propiedades en venta y alquiler, conoce los mejores barrios y conecta con profesionales inmobiliarios en un solo lugar.",
};

const REALISTA_PRO_CONTENT = {
  title: "RealistaPro | Software para agencias inmobiliarias",
  description:
    "Gestiona tu agencia inmobiliaria con CRM, propiedades, clientes, reseñas, IA y herramientas de administración en RealistaPro.",
  heading: "Elige el plan perfecto para tu negocio inmobiliario",
  intro:
    "RealistaPro reúne CRM, gestión de propiedades, clientes, reseñas, inteligencia artificial y administración de agencia en una sola plataforma.",
  plans: [
    {
      name: "Agencia Básica",
      price: "Gratis",
      description: "Perfil básico para empezar",
      features: ["Agente principal", "CRM", "Hasta 2 propiedades", "Sin reseñas"],
    },
    {
      name: "Agencia Pequeña",
      price: "29 €/mes",
      description: "Herramientas para agencias pequeñas",
      features: [
        "Hasta 2 perfiles públicos",
        "CRM",
        "Hasta 10 propiedades",
        "Clientes ilimitados",
        "Reseñas ilimitadas",
        "Ventajas IA",
      ],
    },
    {
      name: "Agencia Mediana",
      price: "79 €/mes",
      description: "Más capacidad para equipos en crecimiento",
      features: [
        "Hasta 6 agentes",
        "CRM",
        "Hasta 30 propiedades",
        "Clientes ilimitados",
        "Reseñas ilimitadas",
        "Ventajas IA",
      ],
    },
    {
      name: "Agencia Líder",
      price: "249 €/mes",
      description: "La plataforma completa para agencias",
      features: [
        "Agentes ilimitados",
        "CRM",
        "Propiedades ilimitadas",
        "Clientes ilimitados",
        "Reseñas ilimitadas",
        "Ventajas IA",
      ],
    },
  ],
};

function getPublicContent(pathname: string): SeoContent {
  const labels: Record<string, string> = {
    "/aviso-legal": "Aviso legal",
    "/politica-privacidad": "Política de privacidad",
    "/politica-cookies": "Política de cookies",
    "/terminos-condiciones": "Términos y condiciones",
  };
  const label = labels[pathname] ?? "Información legal";
  return {
    title: `${label} | Realista`,
    description: `Consulta la ${label.toLowerCase()} de Realista y conoce las condiciones aplicables al uso de la plataforma inmobiliaria.`,
    heading: label,
    intro:
      "Consulta la información legal aplicable al uso de Realista, la plataforma inmobiliaria para clientes y profesionales.",
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeJsonForHtml(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function getClientAssetTags(): string {
  if (process.env.NODE_ENV !== "production") {
    return '<script type="module" src="/src/main.tsx"></script>';
  }

  const builtIndexPath = path.resolve(process.cwd(), "dist", "public", "index.html");
  if (!fs.existsSync(builtIndexPath)) {
    throw new Error(`Could not find the production client index at ${builtIndexPath}`);
  }

  const builtIndex = fs.readFileSync(builtIndexPath, "utf8");
  const assetTags = [
    ...builtIndex.matchAll(/<link\s+rel="modulepreload"[^>]*>/gi),
    ...builtIndex.matchAll(/<link\s+rel="stylesheet"[^>]*>/gi),
    ...builtIndex.matchAll(
      /<script\s+type="module"[^>]*src="[^"]+"[^>]*><\/script>/gi,
    ),
  ].map((match) => match[0]);

  if (assetTags.length === 0) {
    throw new Error(`Could not find production client assets in ${builtIndexPath}`);
  }

  return assetTags.join("\n    ");
}

function getBaseUrl(req: Request): string {
  const configuredBaseUrl = process.env.PUBLIC_BASE_URL?.trim();
  if (configuredBaseUrl) return configuredBaseUrl.replace(/\/$/, "");

  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto?.split(",")[0]?.trim() || req.protocol;
  return `${protocol}://${req.get("host")}`;
}

function sharedStyles(): string {
  return `
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #102030; background: #fff; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; }
    a { color: inherit; }
    .seo-shell { min-height: 100vh; }
    .seo-nav { height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 5vw; border-bottom: 1px solid #e6edf2; background: #fff; }
    .seo-brand { display: inline-flex; align-items: center; gap: 9px; color: #0f8fc5; text-decoration: none; font-size: 20px; font-weight: 800; }
    .seo-brand-mark { width: 26px; height: 26px; display: inline-grid; place-items: center; border: 2px solid #0f8fc5; border-radius: 8px 8px 8px 3px; font-size: 14px; }
    .seo-nav-link { color: #526273; font-size: 14px; font-weight: 600; text-decoration: none; }
    .seo-hero { padding: 76px 5vw 82px; background: linear-gradient(135deg, #f2fbfe 0%, #fff 72%); text-align: center; }
    .seo-eyebrow { display: inline-block; margin: 0 0 18px; padding: 7px 13px; border-radius: 999px; color: #0f78a9; background: #e7f6fc; font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    h1 { max-width: 920px; margin: 0 auto 18px; font-size: clamp(34px, 5vw, 62px); line-height: 1.04; letter-spacing: -.04em; }
    .seo-lead { max-width: 760px; margin: 0 auto; color: #5c6b7a; font-size: clamp(17px, 2vw, 21px); line-height: 1.55; }
    .seo-search { max-width: 920px; margin: 38px auto 0; display: flex; gap: 12px; padding: 10px; border: 1px solid #dce5ec; border-radius: 14px; background: #fff; box-shadow: 0 14px 40px rgba(30, 78, 105, .1); }
    .seo-search input { min-width: 0; flex: 1; border: 0; outline: 0; padding: 13px 14px; color: #718091; font-size: 15px; }
    .seo-button { display: inline-block; border: 0; border-radius: 9px; padding: 13px 24px; color: #fff; background: #0f8fc5; font-size: 14px; font-weight: 800; text-decoration: none; }
    .seo-section { max-width: 1120px; margin: 0 auto; padding: 64px 5vw; }
    .seo-section h2 { margin: 0 0 12px; font-size: 32px; letter-spacing: -.03em; }
    .seo-section-intro { max-width: 720px; margin: 0 0 30px; color: #5c6b7a; font-size: 17px; line-height: 1.55; }
    .seo-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
    .seo-card { padding: 24px; border: 1px solid #dce5ec; border-radius: 16px; background: #fff; box-shadow: 0 8px 24px rgba(30, 78, 105, .06); }
    .seo-card h3 { margin: 0 0 8px; font-size: 18px; }
    .seo-card p { margin: 0; color: #5c6b7a; line-height: 1.5; }
    .seo-footer { padding: 30px 5vw; border-top: 1px solid #243343; color: #c9d4de; background: #102030; }
    .seo-footer a { color: #73c8ef; text-decoration: none; }
    .seo-pricing { max-width: 1220px; margin: 0 auto; padding: 52px 5vw 76px; }
    .seo-pricing-heading { max-width: 760px; margin-bottom: 30px; }
    .seo-pricing-heading h1 { margin: 0 0 14px; text-align: left; font-size: clamp(34px, 5vw, 52px); }
    .seo-pricing-heading p { margin: 0; color: #5c6b7a; font-size: 18px; line-height: 1.55; }
    .seo-plans { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
    .seo-plan { display: flex; min-height: 390px; flex-direction: column; padding: 24px 20px; border: 1px solid #dce5ec; border-radius: 16px; background: #fff; box-shadow: 0 8px 24px rgba(30, 78, 105, .06); }
    .seo-plan:nth-child(2) { border-color: #9ed8ef; background: #f7fcfe; }
    .seo-plan h2 { margin: 0 0 8px; font-size: 20px; }
    .seo-price { margin: 8px 0 4px; color: #0f8fc5; font-size: 28px; font-weight: 800; }
    .seo-plan-description { min-height: 42px; margin: 0 0 20px; color: #5c6b7a; font-size: 14px; line-height: 1.4; }
    .seo-plan ul { margin: 0; padding: 0; list-style: none; color: #405263; font-size: 14px; line-height: 1.9; }
    .seo-plan li::before { content: "✓"; margin-right: 8px; color: #19b67a; font-weight: 800; }
    .seo-plan .seo-button { margin-top: auto; text-align: center; }
    @media (max-width: 900px) { .seo-grid, .seo-plans { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 600px) { .seo-nav { padding: 0 20px; } .seo-hero, .seo-section, .seo-pricing { padding-left: 20px; padding-right: 20px; } .seo-search { display: block; } .seo-search .seo-button { display: block; width: 100%; text-align: center; } .seo-grid, .seo-plans { grid-template-columns: 1fr; } }
  `;
}

function homeBody(): string {
  return `
    <div class="seo-shell">
      <header class="seo-nav">
        <a class="seo-brand" href="/"><span class="seo-brand-mark">⌂</span>Realista</a>
        <a class="seo-nav-link" href="/realista-pro">RealistaPro</a>
      </header>
      <main>
        <section class="seo-hero">
          <p class="seo-eyebrow">La plataforma inmobiliaria de referencia</p>
          <h1>${escapeHtml(HOME_CONTENT.heading)}</h1>
          <p class="seo-lead">${escapeHtml(HOME_CONTENT.intro)}</p>
          <form class="seo-search" action="/buscar/comprar" method="get">
            <input name="q" aria-label="Buscar barrio o ciudad" placeholder="Buscar barrio o ciudad..." />
            <button class="seo-button" type="submit">Buscar propiedades</button>
          </form>
        </section>
        <section class="seo-section">
          <h2>Todo lo que necesitas para encontrar tu hogar</h2>
          <p class="seo-section-intro">Explora propiedades, barrios y profesionales inmobiliarios con la información necesaria para tomar mejores decisiones.</p>
          <div class="seo-grid">
            <article class="seo-card"><h3>Propiedades</h3><p>Busca viviendas en venta y alquiler con información detallada por barrio.</p></article>
            <article class="seo-card"><h3>Barrios</h3><p>Conoce las zonas, servicios y características que hacen único cada barrio.</p></article>
            <article class="seo-card"><h3>Agencias y agentes</h3><p>Conecta con profesionales inmobiliarios de confianza en toda España.</p></article>
          </div>
        </section>
      </main>
      <footer class="seo-footer">© ${new Date().getFullYear()} Realista · <a href="/realista-pro">RealistaPro para agencias inmobiliarias</a></footer>
    </div>
  `;
}

function publicBody(content: SeoContent): string {
  return `
    <div class="seo-shell">
      <header class="seo-nav">
        <a class="seo-brand" href="/"><span class="seo-brand-mark">⌂</span>Realista</a>
        <a class="seo-nav-link" href="/realista-pro">RealistaPro</a>
      </header>
      <main class="seo-pricing">
        <div class="seo-pricing-heading">
          <p class="seo-eyebrow">Realista</p>
          <h1>${escapeHtml(content.heading)}</h1>
          <p>${escapeHtml(content.intro)}</p>
        </div>
      </main>
      <footer class="seo-footer"><a href="/">Volver a Realista</a> · <a href="/realista-pro">Soluciones para agencias inmobiliarias</a></footer>
    </div>
  `;
}

function realistaProBody(): string {
  const plans = REALISTA_PRO_CONTENT.plans
    .map(
      (plan) => `
        <article class="seo-plan">
          <h2>${escapeHtml(plan.name)}</h2>
          <p class="seo-price">${escapeHtml(plan.price)}</p>
          <p class="seo-plan-description">${escapeHtml(plan.description)}</p>
          <ul>${plan.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}</ul>
          <a class="seo-button" href="/registrarse">Empezar ahora</a>
        </article>
      `,
    )
    .join("");

  return `
    <div class="seo-shell">
      <header class="seo-nav">
        <a class="seo-brand" href="/"><span class="seo-brand-mark">⌂</span>Realista</a>
        <a class="seo-nav-link" href="/iniciar-sesion">Iniciar sesión</a>
      </header>
      <main class="seo-pricing">
        <div class="seo-pricing-heading">
          <p class="seo-eyebrow">RealistaPro</p>
          <h1>${escapeHtml(REALISTA_PRO_CONTENT.heading)}</h1>
          <p>${escapeHtml(REALISTA_PRO_CONTENT.intro)}</p>
        </div>
        <section class="seo-plans" aria-label="Planes de RealistaPro">${plans}</section>
      </main>
      <footer class="seo-footer">RealistaPro · CRM, propiedades, clientes, reseñas e IA para agencias inmobiliarias · <a href="/">Volver a Realista</a></footer>
    </div>
  `;
}

export function getSeoHtml(req: Request, page: SeoPage): string {
  const baseUrl = getBaseUrl(req);
  const clientAssetTags = getClientAssetTags();
  const isHome = page === "home";
  const isRealistaPro = page === "realistaPro";
  const content = isRealistaPro
    ? REALISTA_PRO_CONTENT
    : isHome
      ? HOME_CONTENT
      : getPublicContent(req.path);
  const canonicalPath = isRealistaPro
    ? "/realista-pro"
    : isHome
      ? "/"
      : req.path;
  const canonical = `${baseUrl}${canonicalPath}`;
  const schema = isRealistaPro
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "RealistaPro",
        description: content.description,
        brand: { "@type": "Brand", name: "Realista" },
        url: canonical,
        offers: REALISTA_PRO_CONTENT.plans.map((plan) => ({
          "@type": "Offer",
          name: plan.name,
          price: plan.price === "Gratis" ? "0" : plan.price.match(/\d+/)?.[0] || "0",
          priceCurrency: "EUR",
          url: canonical,
          availability: "https://schema.org/InStock",
        })),
      }
    : isHome
      ? {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Realista",
        url: canonical,
        description: content.description,
        potentialAction: {
          "@type": "SearchAction",
          target: `${baseUrl}/buscar/comprar?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
        }
      : {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: content.title,
          description: content.description,
          url: canonical,
          isPartOf: { "@type": "WebSite", name: "Realista", url: baseUrl },
        };

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(content.title)}</title>
    <meta name="description" content="${escapeHtml(content.description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Realista" />
    <meta property="og:locale" content="es_ES" />
    <meta property="og:title" content="${escapeHtml(content.title)}" />
    <meta property="og:description" content="${escapeHtml(content.description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(`${baseUrl}/logo.png`)}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(content.title)}" />
    <meta name="twitter:description" content="${escapeHtml(content.description)}" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <style>${sharedStyles()}</style>
    <script type="application/ld+json">${escapeJsonForHtml(schema)}</script>
  </head>
  <body>
    <div id="root">${isRealistaPro ? realistaProBody() : isHome ? homeBody() : publicBody(content)}</div>
    ${clientAssetTags}
  </body>
</html>`;
}