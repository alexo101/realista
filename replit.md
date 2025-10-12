# Realista - Real Estate Platform

## Overview

Realista is a modern real estate platform built with React and Express.js that allows users to search for properties, agents, and agencies. The platform provides a comprehensive solution for property management, client management, and real estate professional networking.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Query for server state management and React Context for user authentication
- **UI Components**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom theme configuration
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: Session-based authentication with connect-pg-simple
- **File Handling**: Cloud storage URLs (imageUrls) for scalable image management
- **Email Service**: Nodemailer with Ethereal fallback for development

## Key Components

### User Management System
- **Multi-role authentication**: Supports agents, agency administrators, and clients
- **Profile management**: Separate interfaces for agent profiles and agency profiles
- **Registration flow**: Dedicated registration pages with role-based redirects

### Property Management
- **CRUD operations**: Full property lifecycle management
- **Image handling**: Draggable gallery with main image selection
- **Advanced filtering**: Price ranges, bedrooms, bathrooms, features, and neighborhoods
- **Neighborhood integration**: Barcelona-specific district and neighborhood data

### Search and Discovery
- **Autocomplete search**: Real-time search for agents and agencies
- **Multi-tab interface**: Separate search results for properties, agents, and agencies
- **Neighborhood-based search**: Integration with Barcelona's district system

### Client Relationship Management
- **Client profiles**: Comprehensive client information management
- **Appointment scheduling**: Integrated calendar system for property visits
- **Conversational messages**: Real-time chat interface for agent-client communication
- **Inquiry management**: Lead tracking and communication system with full property address display
- **Property visit requests**: Structured visit scheduling workflow

### Review and Rating System
- **Agent reviews**: Multi-criteria rating system (area knowledge, negotiation, treatment, etc.)
- **Property verification**: Review workflow with property association
- **Review management**: Administrative interface for review oversight

### RealistaPro Subscription System
- **Three-tier subscription model**: Agency subscriptions, independent agent subscriptions, and inherited agency access
- **Agency-level subscriptions**: Stored on agencies table with seat limits (Básica: 1, Pequeña: 5, Mediana: 15, Líder: 50)
- **Independent agents**: Personal subscriptions stored on agents table (paused when joining agency)
- **Database-enforced business rules**: 
  - Partial unique index ensures one active agency per agent (agentId WHERE leftAt IS NULL)
  - Partial unique index ensures one admin per agency (agencyId WHERE role='admin' AND leftAt IS NULL)
  - CHECK constraint ensures role is 'admin' or 'member'
- **Atomic seat allocation**: Transaction-based with row locking (FOR UPDATE) to prevent race conditions
- **Subscription state tracking**: Complete audit trail via subscription_events table with who/what/when/reason
- **Admin transfer workflow**: Atomic operation with proper role management and event logging
- **Soft delete support**: Agents leaving agencies resume paused subscriptions; deleted agencies free all members

## Data Flow

### Authentication Flow
1. User registration through dedicated pages (`/register`, `/client-register`)
2. Role-based profile creation (agent, agency admin, or client)
3. Session management with PostgreSQL session store
4. Context-based user state management across the application

### Property Search Flow
1. Search initiated through SearchBar component with filters
2. API requests to `/api/search/properties` with query parameters
3. Results processed and displayed in PropertyResults component
4. Detailed property views accessible via `/property/:id` routes

### Client Management Flow
1. Agent creates client profiles through ClientForm component
2. Appointment scheduling through integrated calendar system
3. Property visit requests processed through dedicated workflow
4. Inquiry management for lead tracking and follow-up

## External Dependencies

### Core Libraries
- **React ecosystem**: React 18, React Query, React Hook Form
- **UI framework**: Radix UI primitives with shadcn/ui components
- **Database**: Drizzle ORM with Neon serverless PostgreSQL
- **Authentication**: Express sessions with connect-pg-simple
- **Styling**: Tailwind CSS with professional theme configuration

### Development Tools
- **TypeScript**: Full type safety across client and server
- **Vite**: Modern build tooling with hot module replacement
- **ESLint**: Code quality and consistency
- **Drizzle Kit**: Database schema management and migrations

### Third-party Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Nodemailer**: Email service integration
- **Ethereal Email**: Development email testing

## Deployment Strategy

### Development Environment
- **Local development**: Vite dev server with Express backend
- **Database**: Neon serverless PostgreSQL with connection pooling
- **Environment variables**: Separate configuration for development and production

### Production Configuration
- **Build process**: Vite production build with optimized assets
- **Server deployment**: Node.js Express server with bundled assets
- **Database**: Production Neon PostgreSQL instance
- **Static assets**: Served from dist/public directory

### Database Management
- **Schema management**: Drizzle ORM with TypeScript schema definitions
- **Migrations**: Automated migration system with drizzle-kit
- **Connection pooling**: Neon serverless connection pooling for scalability

## Changelog

- October 12, 2025. Fixed alignment issue between SearchBar and NeighborhoodRating sections
  - Wrapped NeighborhoodRating content in white card container (bg-white rounded-lg shadow-lg p-4)
  - Matched SearchBar structure for consistent visual alignment
  - Both sections now use identical container padding for proper UI consistency
- October 11, 2025. Implemented comprehensive RealistaPro subscription architecture
  - Created three-tier subscription model: agency-level, independent agent, and inherited access
  - Implemented agency_agents junction table with role enforcement (admin/member)
  - Added database-enforced business rules: one active agency per agent, one admin per agency
  - Implemented partial unique indexes with WHERE clauses for proper constraint enforcement
  - Created subscription_events audit table for complete state transition logging
  - Built atomic seat allocation with transaction support and row locking (FOR UPDATE)
  - Implemented subscription helper functions: pause/resume, admin transfer, seat checks
  - Added soft delete support with automatic subscription resumption for leaving agents
  - Updated registration endpoints to use new architecture with proper admin linking
  - All subscription operations are transactional and race-condition safe
- October 10, 2025. Configured Replit App Storage for property images
  - Created cloud storage bucket: replit-objstore-60a5ea22-e602-42f2-948c-b43002a405a1
  - Set PUBLIC_OBJECT_SEARCH_PATHS for public image serving
  - Set PRIVATE_OBJECT_DIR for private file storage
  - Image upload functionality now fully operational with cloud storage
  - Properties can now have images uploaded and stored in scalable cloud infrastructure
- October 10, 2025. Improved login error messaging
  - Updated login error message to be more specific and user-friendly
  - Backend now returns: "El nombre de usuario o la contraseña que has introducido no son correctos. Comprueba tus datos e inténtalo de nuevo"
  - Frontend properly displays server error messages in all error scenarios
  - Better user experience with clear guidance on what went wrong
- October 10, 2025. Completed full migration to cloud storage only
  - Removed legacy base64 image system entirely from database and codebase
  - Deleted 'images' field from properties schema, kept only 'imageUrls' for cloud storage
  - Updated all components to use cloud URLs exclusively: PropertyResults.tsx, property.tsx, client-profile.tsx, manage.tsx
  - Properties without images now display placeholder until images are uploaded
  - System fully optimized for scalability with cloud-based image storage
- October 9, 2025. Completed database import from previous Replit project
  - Successfully imported all data from JSON files (17 tables)
  - Added agent_favorite_properties table to schema
  - Imported: 1 agency, 3 agents, 6 properties, 4 clients, 8 reviews, 5 inquiries
  - All relationships and data integrity preserved
  - Database fully functional with imported data
- August 9, 2025. Fixed critical session management bug
  - Implemented express-session middleware with proper cookie-based authentication
  - Added session persistence endpoints (/api/auth/me and /api/auth/logout)
  - Updated user context to check for existing sessions on app load
  - Fixed UserMenu component error handling for null email values
  - Users can now maintain login state across property page navigation
  - Session cookies persist for 24 hours with secure configuration
- July 18, 2025. Enhanced UI layout and messaging system
  - Fixed sidebar toggle button positioning at border between sidebar and main content
  - Implemented dynamic main content expansion/contraction based on sidebar state
  - Fixed header overlap issues with proper top padding (pt-20 md:pt-24)
  - Enhanced database queries to include property information in conversational messages
  - Fixed property address display in Messages section with proper JOIN queries
  - Improved responsive layout transitions with smooth animations
- January 17, 2025. Enhanced Messages section with conversational interface
  - Replaced basic inquiry list with WhatsApp-style chat interface
  - Added client search functionality by name and property address
  - Implemented real-time messaging with agent messages on the right side
  - Added full property address display in initial messages
  - Created conversation view with message history and send functionality
  - Added API endpoints for conversations and message handling
- January 5, 2025. Made all screens responsive for desktop and mobile devices
  - Enhanced navbar with mobile menu and hamburger navigation
  - Improved property cards and results grids for mobile layouts
  - Added responsive breakpoints throughout component hierarchy
  - Implemented mobile navigation for manage page with horizontal scroll
  - Optimized search bars and filters for mobile interaction
  - Enhanced caching strategy with 10-minute cache times and retry logic
- June 28, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.