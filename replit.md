# Realista - Real Estate Platform

## Overview

Realista is a modern real estate platform built with React and Express.js, designed to connect users with properties, agents, and agencies. Its primary purpose is to streamline operations for real estate professionals and offer an intuitive property search experience for clients. The platform provides comprehensive property management, client relationship management, and professional networking tools, aiming to be a central hub for real estate transactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Framework & Components**: React 18 with TypeScript, using Radix UI primitives and shadcn/ui, styled with Tailwind CSS for a custom theme.
- **Design Approach**: Responsive design across all devices, ensuring consistent visual alignment.
- **Navigation**: Wouter for client-side routing, featuring an enhanced navbar with mobile menu and a dedicated bottom navigation bar for mobile client profiles.
- **Interaction**: Draggable image galleries, autocomplete search, multi-tab interfaces, an integrated calendar, and a conversational messaging interface.
- **Consolidated Favorites**: Client favorites are unified into a single section with three tabs (Propiedades/Agentes/Agencias).

### Technical Implementations
- **Backend**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM, hosted on Neon serverless PostgreSQL.
- **Authentication**: Session-based with `connect-pg-simple`, supporting multi-role access (agent, agency admin, client).
- **State Management**: React Query for server state, React Context for user authentication.
- **Build Tool**: Vite for development and production.
- **Object Storage**: Replit App Storage (Google Cloud Storage) for scalable image uploads with CDN. Includes automatic two-tier compression and serving via optimized endpoints.
- **Agency Coordinates & Map View**: Agencies include latitude/longitude for map plotting. Address autocomplete integrates geocoding, and a map view on neighborhood results plots agencies with distinct pins.
- **Draw-on-Map Area Search**: Enables users to draw polygons or circles on maps for property/agency search filtering, preserving the drawn shape across list/map views.
- **Cédula de Habitabilidad Bulk Edit**: Allows agents and agency admins to bulk update the `has_cedula_habitabilidad` flag for properties.
- **Email Service**: Nodemailer (Ethereal for development).
- **AI Integration**: Replit AI Integrations with OpenAI GPT-4o-mini for automated property description generation.
- **Payment Processing**: Stripe integration for subscription billing, managing products, prices, subscriptions, and customer portals. Includes webhook handling and secure upgrade flows.

### Feature Specifications
- **User Management**: Role-based authentication, dedicated registration, and profile management for agents and agencies.
- **Property Management**: Full CRUD operations with a multi-step creation workflow, draft support, advanced filtering, and integration with local geographical data. Uses UUIDs for primary keys.
- **Search & Discovery**: Real-time autocomplete search, neighborhood-based, and hierarchical location search.
- **5-Level Hierarchical Breadcrumb Navigation**: Supports navigation from Province to Neighborhood, with URL formats optimized for Spanish SEO.
- **Client Relationship Management (CRM)**: Client profiles with status tracking, appointment scheduling, messaging, lead tracking, and contact history.
- **Review & Rating System**: Multi-criteria agent reviews and property verification workflow.
- **RealistaPro Subscription System**: Three-tier model with seat limits, enforced by database rules.
- **Network/Franchise System**: Hierarchical organization for real estate networks (e.g., Remax), supporting network admin roles, dedicated dashboards, centralized billing, and per-agency plan assignment.

### System Design Choices
- **Full Type Safety**: Achieved with TypeScript across the stack.
- **Scalability**: Cloud storage for images and Neon serverless PostgreSQL.
- **Data Integrity**: Drizzle ORM for schema management, database-enforced business rules, and UUID-based primary keys.
- **User Experience**: Intuitive interfaces, clear error messaging, responsive layouts, and instant skeleton loading.
- **Performance Optimization**: Strategic database indexing, query optimization, and in-memory caching.
- **Session Consistency**: Consistent user data structures across registration endpoints.
- **UUID-Based Secure Routing**: Agent and client dashboards use UUIDs in URLs for secure access.
- **Spanish SEO-Optimized URLs**: Slug-based routing with Spanish terminology for entities and routes.

## External Dependencies

- **React Ecosystem**: React 18, React Query, React Hook Form.
- **UI Libraries**: Radix UI, shadcn/ui, Tailwind CSS.
- **Database**: PostgreSQL, Drizzle ORM, Neon.
- **Authentication**: `express-session`, `connect-pg-simple`.
- **Email**: Nodemailer, Ethereal.
- **Development Tools**: TypeScript, Vite, ESLint, Drizzle Kit.
- **AI**: OpenAI GPT-4o-mini (via Replit AI Integrations).
- **Payments**: Stripe.
- **Mapping/Geocoding**: Google Maps Platform.
- **Image Processing**: `browser-image-compression` (client-side), Sharp (server-side).