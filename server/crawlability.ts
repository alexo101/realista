import type { Request } from "express";

function getPublicBaseUrl(req: Request): string {
  const configuredBaseUrl = process.env.PUBLIC_BASE_URL?.trim();
  if (configuredBaseUrl) return configuredBaseUrl.replace(/\/$/, "");

  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto?.split(",")[0]?.trim() || req.protocol;
  return `${protocol}://${req.get("host")}`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function getRobotsTxt(req: Request): string {
  const baseUrl = getPublicBaseUrl(req);

  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /gestionar/",
    "Disallow: /perfil-cliente/",
    "Disallow: /admin-red",
    "Disallow: /super-admin",
    "Disallow: /registro-cliente",
    "Disallow: /client-register",
    "Disallow: /confirmar-resena/",
    "",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    "",
  ].join("\n");
}

export function getSitemapXml(req: Request): string {
  const baseUrl = getPublicBaseUrl(req);
  const publicUrls = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/realista-pro", changefreq: "weekly", priority: "0.9" },
    { path: "/buscar/comprar", changefreq: "daily", priority: "0.8" },
    { path: "/buscar/alquilar", changefreq: "daily", priority: "0.8" },
    { path: "/buscar/agencias", changefreq: "weekly", priority: "0.7" },
    { path: "/buscar/agentes", changefreq: "weekly", priority: "0.7" },
    { path: "/aviso-legal", changefreq: "yearly", priority: "0.2" },
    { path: "/politica-privacidad", changefreq: "yearly", priority: "0.2" },
    { path: "/politica-cookies", changefreq: "yearly", priority: "0.2" },
    { path: "/terminos-condiciones", changefreq: "yearly", priority: "0.2" },
  ];

  const urls = publicUrls
    .map(
      ({ path, changefreq, priority }) => `  <url>
    <loc>${escapeXml(`${baseUrl}${path}`)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}