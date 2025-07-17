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
- **File Handling**: Base64 image storage and processing
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