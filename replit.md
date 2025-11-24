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
- **Image Handling**: Scalable cloud storage for uploads.
- **Email Service**: Nodemailer (Ethereal for development).
- **AI Integration**: Replit AI Integrations with OpenAI GPT-5-nano for automated property description generation.

### Feature Specifications
- **User Management**: Role-based authentication, dedicated registration flows, and profile management for agents and agencies.
- **Property Management**: Full CRUD operations with a multi-step creation workflow (5 steps), draft support, advanced filtering, and integration with Barcelona's district and neighborhood data. Google Maps provides live address previews and geocoding. Properties use UUIDs as primary keys.
- **Search & Discovery**: Real-time autocomplete search for properties, agents, and agencies, with neighborhood-based and hierarchical location search capabilities (e.g., district-to-neighborhood expansion).
- **Client Relationship Management (CRM)**: Client profiles with 6-tier status tracking (Nuevo, Seguimiento, En visitas, Cerrando, Ganado, Perdido), appointment scheduling, real-time messaging, lead/inquiry tracking, and a contact history timeline.
- **Review & Rating System**: Multi-criteria agent reviews and a property verification workflow.
- **RealistaPro Subscription System**: Three-tier model (Agency, Independent Agent, Inherited Agency Access) with seat limits, enforced by database rules, atomic operations, and an audit trail.

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