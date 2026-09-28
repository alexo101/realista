# SEO Strategy — Realista

## In scope
- Homepage (`/`)
- `/realista-pro` (subscription/pricing page)
- Public marketing pages (neighborhood results, agent/agency profiles, property listings)

## Out of scope
- Authenticated dashboards (`/gestionar/**`, `/perfil-cliente/**`, `/admin-red`, `/super-admin`)
- Login/register flows

## Target audience
- Real estate professionals (agents, agencies, networks) in Spain / Spanish-speaking markets
- Home buyers and renters searching for properties

## Primary keywords
- Real estate platform / portal inmobiliario
- Planes para agencias inmobiliarias / agentes inmobiliarios
- Property search (pisos, inmuebles) by neighborhood (barrio)

## Site rendering mode
- Pure React SPA (Vite + Wouter). No SSR or SSG for any public route.
- All metadata and content is client-rendered; social/AI bots see only the static `index.html` shell.

## Dismissed categories
- (None yet)
