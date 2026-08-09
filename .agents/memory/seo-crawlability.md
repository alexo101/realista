---
name: Public SPA crawlability
description: Do not serve a server-rendered HTML shell for SPA routes; it breaks back-navigation and hard loads.
---

Public app routes (`/`, `/realista-pro`, legal pages, search, neighborhood, property, agent, agency) must fall through to the normal SPA (Vite in dev, static `index.html` in production). A previous Express SEO shell intercepted full-page loads and left users on a static placeholder after back navigation.

**Why:** The shell replaced the real React page for hard loads and history restores, so home and listing pages appeared as generic static HTML.

**How to apply:** Keep `robots.txt` and `sitemap.xml` from `server/crawlability.ts`. Keep route-aware titles/descriptions/canonicals in `client/src/components/SeoMetadata.tsx`. Do not reintroduce `server/seoHtml.ts` or Express HTML handlers for page routes unless a safer SEO technique is explicitly designed later.
