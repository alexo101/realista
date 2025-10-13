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
- **Client Relationship Management (CRM)**: Client profiles, appointment scheduling, real-time conversational messaging, and lead/inquiry tracking with property visit request workflows.
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

## External Dependencies

- **React Ecosystem**: React 18, React Query, React Hook Form.
- **UI Libraries**: Radix UI, shadcn/ui, Tailwind CSS.
- **Database**: PostgreSQL, Drizzle ORM, Neon (serverless PostgreSQL).
- **Authentication**: `express-session`, `connect-pg-simple`.
- **Email**: Nodemailer, Ethereal (for development).
- **Development Tools**: TypeScript, Vite, ESLint, Drizzle Kit.