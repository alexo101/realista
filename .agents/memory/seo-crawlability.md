---
name: Public SPA crawlability
description: The public acquisition routes use an Express HTML shell before React mounts.
---

Public SPA acquisition pages should return route-specific crawlable HTML from Express while preserving the existing React mount point and client bundle. Include canonical, social metadata, and structured data in that shell.

**Why:** Search, social, and AI crawlers may not execute the SPA bundle, so a generic empty root hides the page’s primary content and metadata.

**How to apply:** Extend the shared server-side shell for additional public marketing routes instead of migrating the whole authenticated application to a different framework.