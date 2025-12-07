# Realista - Real Estate Platform

## Overview

Realista is a modern real estate platform built with React and Express.js, connecting users with properties, agents, and agencies. Its purpose is to streamline operations for real estate professionals and offer an intuitive property search experience for clients. The platform provides comprehensive property management, client relationship management, and professional networking tools.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Framework**: React 18 with TypeScript.
- **Components**: Radix UI primitives styled with shadcn/ui, integrated with Tailwind CSS for a custom theme.
- **Design Approach**: Responsive design across all devices with consistent visual alignment.
- **Navigation**: Wouter for client-side routing, featuring an enhanced navbar with mobile menu.
- **Interaction**: Draggable image galleries, autocomplete search, multi-tab interfaces, an integrated calendar for appointments, and a conversational messaging interface.

### Technical Implementations
- **Backend**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM, hosted on Neon serverless PostgreSQL.
- **Authentication**: Session-based with `connect-pg-simple`, supporting multi-role access (agent, agency admin, client).
- **State Management**: React Query for server state, React Context for user authentication.
- **Build Tool**: Vite for development and production.
- **Object Storage**: Replit App Storage powered by Google Cloud Storage (GCS) for scalable image uploads with CDN delivery.
  - **Bucket**: `realista-property_images` stores all property images
  - **Upload Flow**: Images uploaded via `/api/property-images/upload-direct` endpoint using multer memory storage, then saved to GCS
  - **Automatic Image Compression**: Two-tier compression system ensures all images are under 1MB:
    - **Client-side**: `browser-image-compression` library compresses images before upload (max 2048px, 85% quality)
    - **Server-side**: Sharp library provides backup compression with format-aware handling:
      - GIFs preserved without compression (animations intact)
      - PNGs/WebPs with transparency converted to WebP format
      - Non-transparent images converted to JPEG (best compression)
      - Progressive quality reduction (85→75→65→55→45) until under 1MB
  - **Upload Limits**: 20 images per batch, 100 images total per property
  - **Serving Flow**: Images served via `/property-images/:imageId` endpoint with streaming from GCS and proper cache headers for CDN optimization
  - **Environment Variables**: `PUBLIC_OBJECT_SEARCH_PATHS` (public bucket path) and `PRIVATE_OBJECT_DIR` (private object directory) configured as secrets
  - **Implementation**: `ObjectStorageService` in `server/objectStorage.ts` handles all GCS interactions
- **Email Service**: Nodemailer (Ethereal for development).
- **AI Integration**: Replit AI Integrations with OpenAI GPT-4o-mini for automated property description generation.
- **Payment Processing**: Stripe integration for subscription billing.
  - **Stripe Schema**: Managed by `stripe-replit-sync` package, automatically syncs products, prices, subscriptions, and customers from Stripe to a `stripe` schema in PostgreSQL
  - **Webhook Handling**: UUID-secured webhook endpoint at `/api/stripe/webhook/:uuid`, processed by `stripe-replit-sync` before `express.json()` middleware
  - **Products**: 4 subscription products (Agency Pequeña, Mediana, Líder; Agent Líder) with monthly and yearly pricing + 3 network products (Network Básica, Pro, Enterprise)
  - **Checkout Flow**: `/api/stripe/checkout` creates Stripe Checkout sessions with entity metadata (supports agency, agent, and network entity types)
  - **Customer Portal**: `/api/stripe/portal` enables self-service billing management
  - **Subscription Sync**: `stripeService.syncSubscriptionStatus()` updates agency/agent/network `subscription_plan`, `seats_limit`, `active_properties_limit` from Stripe data
  - **Free Tier Activation**: `/api/stripe/activate-free-tier` for Básica/Básico plans that don't require payment
  - **Secure Upgrade Flow**: Plan upgrades go through Stripe checkout (`/api/agencies/:id/upgrade-plan`):
    - Validates plan with Zod schema (only paid tiers: pequeña, mediana, lider)
    - Creates or retrieves Stripe customer ID
    - If agency has existing subscription → redirects to Customer Portal
    - If new subscription → creates checkout session with proper success/cancel URLs
    - Plan only activates via webhook confirmation after successful payment

### Feature Specifications
- **User Management**: Role-based authentication, dedicated registration flows, and profile management for agents and agencies.
- **Property Management**: Full CRUD operations with a multi-step creation workflow (5 steps), draft support, advanced filtering, and integration with Barcelona's district and neighborhood data. Google Maps provides live address previews and geocoding. Properties use UUIDs as primary keys.
- **Search & Discovery**: Real-time autocomplete search for properties, agents, and agencies, with neighborhood-based and hierarchical location search capabilities (e.g., district-to-neighborhood expansion).
- **Client Relationship Management (CRM)**: Client profiles with 6-tier status tracking (Nuevo, Seguimiento, En visitas, Cerrando, Ganado, Perdido), appointment scheduling, real-time messaging, lead/inquiry tracking, and a contact history timeline.
- **Review & Rating System**: Multi-criteria agent reviews and a property verification workflow.
- **RealistaPro Subscription System**: Three-tier model (Agency, Independent Agent, Inherited Agency Access) with seat limits, enforced by database rules, atomic operations, and an audit trail.
- **Network/Franchise System**: Hierarchical organization supporting real estate networks (like Remax, Century 21) with:
  - **Entity Hierarchy**: Networks → Agencies → Agents → Properties/Clients
  - **Network Admin Role**: `agentType: 'network_admin'` with dedicated admin dashboard at `/admin-red`
  - **Dedicated Admin UI**: Network admins have their own separate dashboard (not agency UI), accessed via `/admin-red`, with tabs for Overview, Agencies, and Billing
  - **Centralized Billing**: Networks always use centralized billing mode (`billingMode: 'network'`)
  - **Per-Agency Plan Assignment**: Network admins assign individual plans (Básica, Pequeña, Mediana, Líder) to each agency via dropdown selector
  - **Usage-Based Pricing**: Networks pay per-agency based on each agency's assigned plan tier (Básica 0€, Pequeña 29€, Mediana 79€, Líder 249€ monthly)
  - **Dynamic Plan Management**: Network admins can change agency plans at any time; limits update automatically
  - **Monthly-Only Billing**: Networks only support monthly billing cycles due to variable agency counts
  - **Billing Dashboard**: Shows real-time breakdown by plan tier with agency counts, subtotals, and total monthly cost
  - **Network Branding**: Agencies and agents in a network display network badge with logo on public profiles
  - **Agency Creation**: Network admins can create new agencies directly from their dashboard via POST `/api/network-admin/agencies`
  - **Agency Management**: Add existing agencies, assign/change plans, view agent/property counts per agency
  - **Registration Flow**: `/registro-plan-red` redirects to `/admin-red` after successful network creation
  - **Route Isolation**: Network admins redirected from `/gestionar` to `/admin-red`; no links to agency profiles from admin panel

### System Design Choices
- **Full Type Safety**: Achieved with TypeScript across the stack.
- **Scalability**: Cloud storage for images and Neon serverless PostgreSQL.
- **Data Integrity**: Drizzle ORM for schema management, database-enforced business rules, and UUID-based primary keys and foreign keys for properties, agents, and clients.
- **User Experience**: Intuitive interfaces, clear error messaging, responsive layouts, and an instant skeleton loading system for smooth route transitions.
- **Performance Optimization**: Strategic database indexing, query optimization (e.g., fixed N+1 queries, pagination limits, deterministic ordering), and in-memory caching for search results.
- **Session Consistency**: All registration endpoints return consistent user data structures.
- **UUID-Based Secure Routing**: Agent and client dashboards use UUIDs in URLs for secure and consistent access, with session-based validation.
- **Spanish SEO-Optimized URLs**: Slug-based routing with Spanish terminology for all entities (agents, agencies, properties) and routes.
- **ALL_ZONES Sentinel Value**: A special value "Todas las zonas" is used for agencies operating city-wide to optimize storage and search behavior for influence neighborhoods.

## External Dependencies

- **React Ecosystem**: React 18, React Query, React Hook Form.
- **UI Libraries**: Radix UI, shadcn/ui, Tailwind CSS.
- **Database**: PostgreSQL, Drizzle ORM, Neon (serverless PostgreSQL).
- **Authentication**: `express-session`, `connect-pg-simple`.
- **Email**: Nodemailer, Ethereal (for development).
- **Development Tools**: TypeScript, Vite, ESLint, Drizzle Kit.