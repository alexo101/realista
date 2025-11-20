# Realista - Real Estate Platform

## Overview

Realista is a modern real estate platform built with React and Express.js, designed to connect users with properties, agents, and agencies. It offers a comprehensive solution for property management, client relationship management, and professional networking within the real estate sector. The platform aims to streamline operations for real estate professionals and provide an intuitive experience for clients seeking properties.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Framework**: React 18 with TypeScript.
- **Components**: Radix UI primitives styled with shadcn/ui.
- **Styling**: Tailwind CSS with a custom theme.
- **Design Approach**: Responsive design across all screens (desktop and mobile) with consistent visual alignment.
- **Navigation**: Wouter for client-side routing, enhanced navbar with mobile menu.
- **Interaction**: Draggable image galleries, autocomplete search, multi-tab interfaces, integrated calendar system for appointments, conversational messaging interface.

### Technical Implementations
- **Backend**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM, hosted on Neon serverless PostgreSQL.
- **Authentication**: Session-based with `connect-pg-simple`, multi-role (agent, agency admin, client) support.
- **State Management**: React Query for server state, React Context for user authentication.
- **Build Tool**: Vite for fast development and optimized production builds.
- **Image Handling**: Scalable cloud storage for property images and other uploads.
- **Email Service**: Nodemailer (with Ethereal for dev).

### Feature Specifications
- **User Management**: Role-based authentication, dedicated registration flows, and profile management for agents and agencies.
- **Property Management**: Full CRUD operations for properties, advanced filtering, and integration with Barcelona's district and neighborhood data.
- **Search & Discovery**: Real-time autocomplete search for properties, agents, and agencies, with neighborhood-based search capabilities.
- **Client Relationship Management (CRM)**: Client profiles with status tracking, appointment scheduling, real-time conversational messaging, and lead/inquiry tracking with property visit request workflows.
    - **Client Status Tracking** (November 2025): 10-tier client lifecycle management with colored visual indicators (Nuevo, Contactado, En seguimiento, Visitando / Programando visita, Oferta realizada, En negociación, Reservado / En proceso de cierre, Ganado, Perdido / No interesado, Inactivo). Default status "Nuevo" auto-assigned on creation. Status field stored in `clients.status` column (TEXT, NOT NULL, default 'Nuevo').
- **Review & Rating System**: Multi-criteria agent reviews and a property verification workflow.
- **RealistaPro Subscription System**:
    - **Model**: Three-tier (Agency, Independent Agent, Inherited Agency Access) with seat limits.
    - **Database Rules**: Enforced business rules for active agency per agent and admin per agency using partial unique indexes and CHECK constraints.
    - **Atomic Operations**: Transaction-based seat allocation and admin transfers with row locking (`FOR UPDATE`) to prevent race conditions.
    - **Audit Trail**: `subscription_events` table for tracking state changes.
    - **Flexibility**: Soft delete support for agents and agencies, with automatic subscription resumption.

### System Design Choices
- **Full Type Safety**: Achieved with TypeScript across both frontend and backend.
- **Scalability**: Cloud storage for images, Neon serverless PostgreSQL with connection pooling.
- **Data Integrity**: Drizzle ORM for schema management and migrations, database-enforced business rules.
- **User Experience**: Focused on intuitive interfaces, clear error messaging, and responsive layouts.
- **Performance Optimization** (November 2025):
    - **Database Indexes**: Strategic indexes on high-traffic columns for faster queries:
        - Single-column indexes: `neighborhood`, `city`, `agent_id`, `agency_id`, `operation_type`, `is_active`, `view_count`, `email`
        - Composite indexes: `(neighborhood, operation_type)`, `(agent_id, is_active)`, `(agency_id, is_active)` for common query patterns
    - **Query Optimization**:
        - Fixed N+1 query in `getPropertiesByAgency`: Replaced agent loop with single unified WHERE clause using OR/IN
        - Added pagination limits: `getProperties` (default 100, max 1000), `searchProperties` (max 500) to prevent unbounded queries
        - Deterministic ordering: Added `ORDER BY created_at DESC` to paginated queries for consistent results
    - **Caching**: In-memory caching for search results (5-minute TTL) to optimize tab switching and repeated queries
- **Session Consistency**: All registration endpoints (`/api/auth/register`, `/api/auth/register-agency`, `/api/auth/register-agent`, `/api/clients/register`) return consistent user data structure including `isAdmin` and `isClient` flags, ensuring frontend receives complete user context for proper UI rendering. Client registration auto-creates session with `clientUuid` (November 2025).
- **UUID-Based Secure Routing** (November 2025):
    - **Agent Dashboard**: `/gestionar/{agentUuid}/{section}` - sections: calendario, perfil-agente, perfil-agencia, propiedades, clientes, mensajes, resenas, equipo
    - **Client Dashboard**: `/perfil-cliente/{clientUuid}/{section}` - sections: perfil, busquedas, citas, favoritos, mensajes
    - **Database UUIDs**: Both `agents.uuid` and `clients.uuid` columns (UUID type, NOT NULL, UNIQUE, defaultRandom)
    - **Session Security**: Sessions include `agentUuid` for agents and `clientUuid` for clients
    - **Route Guards**: Both dashboards validate UUID matches logged-in user, redirect with toast if mismatch
    - **Loading State**: UserContext provides `isLoading` to prevent premature authentication redirects
    - **Auto-Login**: Client registration creates session immediately, eliminating separate login step
    - **Important**: Users with sessions created before UUID updates must log out and log back in to receive UUID-enabled sessions
- **UUID-Based Agency-Agent Relationships** (November 2025):
    - **Migration Strategy**: Transitioned `agency_agents` junction table from integer-based to UUID-based foreign keys for enhanced security and scalability.
    - **Database Schema**: Added `agent_uuid` and `agency_uuid` columns (UUID type, NOT NULL) with foreign keys to `agents.uuid` and `agencies.uuid`.
    - **Dual Key Support**: Both integer IDs and UUIDs coexist in `agency_agents` table during transition for backward compatibility.
    - **Read Operations**: All queries use UUID-based JOINs (`getAgentById`, `getFavoriteAgentsByClient`) for agency relationship lookups.
    - **Write Operations**: Both `addAgentToAgencyAtomic` and `createAgencyAgent` populate UUID columns during insert to satisfy NOT NULL constraints.
    - **Indexes**: Created btree indexes on UUID columns (`agency_agents_agency_uuid_idx`, `agency_agents_agent_uuid_idx`) for query performance.
    - **Unique Constraints**: UUID-based partial unique indexes (`unique_active_agent_uuid`, `unique_active_admin_uuid`) enforce business rules.
    - **Data Integrity**: All 9 existing relationships backfilled with UUIDs, zero NULL values remain.
- **Spanish SEO-Optimized URLs** (October 2025):
    - **Slug-Based Routing**: All entities (agents, agencies, properties) have auto-generated slugs stored in database.
    - **Slug Generation**: `shared/slug-utils.ts` handles Spanish characters (á, é, í, ó, ú, ñ) and creates SEO-friendly URLs.
    - **Spanish Route Translation**: All routes use Spanish terminology (`/agencias`, `/agentes`, `/inmueble`, `/buscar`, `/barrio`, `/gestionar`, `/iniciar-sesion`, `/registrarse`, `/perfil-cliente`).
    - **Dual Identifier Support**: Backend routes accept both slug and numeric ID for backward compatibility.
    - **Auto-Slug Creation**: New entities automatically receive slugs on creation via storage layer.
    - **URL Examples**: `/agencias/lider-agencia`, `/agentes/rodolfo-lider-8`, `/inmueble/atico-gracia-AT-01-3`, `/gestionar/{uuid}/calendario`, `/perfil-cliente/{uuid}/perfil`.
- **Instant Skeleton Loading System** (November 2025):
    - **RouteTransitionContext**: Shared context using `useLayoutEffect` for pre-paint route change detection, providing instant skeleton coverage (no blank screen flash).
    - **Page-Level Coordinator Pattern**: Pages use `isFetching` from React Query + `useRouteTransition` + `useSkeletonVisibility` to compute single `showSkeleton` boolean.
    - **Minimum Display Time**: 150ms minimum enforced via `useSkeletonVisibility` to prevent skeleton flash on instant cached responses.
    - **Component Integration**: PropertyResults, AgentResults, AgencyResults accept `showSkeleton` prop (not `isLoading`) for consistent behavior.
    - **Brand Color Skeletons**: All skeleton loaders use primary blue color (`bg-primary/10`) for consistent branding.
    - **Automatic Dismissal**: Pages call `endTransition()` when data ready or on error, GlobalLoadingOverlay auto-hides after 2s fallback.
    - **Architecture**: Coordinates full-page GlobalLoadingOverlay with component-level skeletons to avoid double-loading states.
- **Hierarchical Location Search** (November 2025):
    - **District-to-Neighborhood Expansion**: Frontend uses `expandNeighborhoodSearch` to convert district names to their constituent neighborhoods before API calls.
    - **Example**: Searching "Sant Andreu" district expands to ["Sant Andreu del Palomar", "La Sagrera", "El Congrés i els Indians", "Navas", ...].
    - **Dual-Layer Handling**: Storage layer detects pre-expanded comma-separated lists vs hierarchical strings to avoid double expansion.
    - **Result Inclusion**: Agents/agencies with `influenceNeighborhoods` and properties with `neighborhood` matching any constituent neighborhood appear on district pages.
    - **Contact Feature**: Agent profiles include contact modal with form fields (Nombre, Teléfono, Email, Mensaje), Spanish phone validation, and Resend email integration.
- **ALL_ZONES Sentinel Value** (November 2025):
    - **Purpose**: Agencies selecting "Todas las zonas" store a single sentinel value instead of all 73+ Barcelona or 130+ Madrid neighborhoods.
    - **Constant**: `ALL_ZONES = "Todas las zonas"` exported from `shared/schema.ts` for consistent reference across frontend/backend.
    - **Storage Efficiency**: Reduces database storage from 73+ strings to 1 string per agency when operating city-wide.
    - **Display Logic**: Agency profiles detect `ALL_ZONES` in `agencyInfluenceNeighborhoods` array and display "Sin limites de zona" pill instead of listing all neighborhoods.
    - **Search Behavior**: Backend search/filtering treats `ALL_ZONES` as wildcard - agencies with this value match ANY neighborhood search query using OR condition.
    - **Migration**: `scripts/migrate-all-zones.ts` converts legacy agencies with complete neighborhood lists to sentinel value.
    - **Implementation**: Both `searchAgents` and `searchAgencies` in `server/storage.ts` include OR branch: `ALL_ZONES = ANY(neighborhoods)` alongside array overlap filter.

## External Dependencies

- **React Ecosystem**: React 18, React Query, React Hook Form.
- **UI Libraries**: Radix UI, shadcn/ui, Tailwind CSS.
- **Database**: PostgreSQL, Drizzle ORM, Neon (serverless PostgreSQL).
- **Authentication**: `express-session`, `connect-pg-simple`.
- **Email**: Nodemailer, Ethereal (for development).
- **Development Tools**: TypeScript, Vite, ESLint, Drizzle Kit.