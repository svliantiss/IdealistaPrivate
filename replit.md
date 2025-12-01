# RentNetAgents - Real Estate Agent Collaboration Platform

## Overview

RentNetAgents is a private professional network designed for real estate agents to collaborate on both rental and sales properties. The platform enables agents to list properties (rentals and sales), search inventory from other agents, manage bookings/transactions, track commissions, and includes an admin panel for user management. This is a B2B platform inspired by Idealista but focused on agent-to-agent collaboration rather than direct consumer access.

## Recent Changes (Session: Booking Archive & Date Filter Fix)

- **Booking Archive System**: Bookings with past checkout dates are automatically archived
- **Archive Tab**: New third tab in Bookings page showing archived/completed bookings
- **Auto-Archive Logic**: Backend automatically archives pending/confirmed/paid bookings when checkout date passes
- **Fixed Date Filter**: Date filter now uses timezone-agnostic ISO date string comparison for consistent results
- **Status Badge Styling**: Added archived status badge with slate color scheme

### Previous Session: Interactive Booking Calendar & My Bookings
- Interactive Booking Calendar with click-to-select check-in/check-out
- Booking Form Dialog for client details
- Automatic Availability Updates when bookings created
- My Bookings Page showing agent's bookings
- Agency Contact Info fields and dialog

### Earlier Session: Admin Panel & Sales Features
- Admin Authentication System with password protection (ADMIN_PASSWORD env var)
- Admin Panel at `/admin` for managing agents
- Sales Properties System with separate commission structure (4% total, split 48/48/4)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite as build tool and dev server
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management
- Shadcn UI component library (Radix UI primitives + Tailwind CSS)
- Tailwind CSS for styling with custom design tokens
- Custom fonts: Inter (sans-serif) and Playfair Display (serif) for premium branding

**Backend:**
- Node.js with Express server
- TypeScript throughout the stack
- Session-based authentication using express-session with MemoryStore
- RESTful API architecture

**Database & ORM:**
- PostgreSQL database (via Neon serverless)
- Drizzle ORM for type-safe database operations
- Database schema defined in `shared/schema.ts` with Zod validation
- WebSocket connection support for serverless PostgreSQL

**Build & Deployment:**
- Custom build script using esbuild for server bundling
- Vite for client bundling
- Dependency bundling strategy: allowlist of common dependencies bundled to reduce syscalls and improve cold start times
- Production mode serves static files from `dist/public`

### Project Structure

The codebase follows a monorepo-style structure with three main directories:

- **`client/`** - React frontend application
  - `client/src/pages/` - Page components (Dashboard, Search, Properties, Bookings, Sales, Admin, AdminLogin)
  - `client/src/components/` - Reusable UI components (layout, shadcn components)
  - `client/src/lib/` - Utilities and query client configuration
  - `client/index.html` - HTML entry point with SEO meta tags

- **`server/`** - Express backend application
  - `server/index.ts` - Main server entry point with session middleware
  - `server/routes.ts` - API route definitions
  - `server/storage.ts` - Data access layer abstraction
  - `server/db.ts` - Database connection configuration
  - `server/vite.ts` - Development-only Vite middleware integration

- **`shared/`** - Shared code between client and server
  - `shared/schema.ts` - Database schema definitions using Drizzle and Zod

### Data Model

The application uses nine core entities (four for rentals, four for sales, one for agents):

**Agents** - Real estate professionals using the platform
- Identity: id, name, email (unique), agency affiliation, phone
- Authentication is admin-only (not per-agent currently)

**Properties** - Short-term rental listings
- Ownership: Linked to agent via agentId foreign key
- Details: title, description, location, type, price, beds, baths, square meters
- Media: images array, amenities array
- Metadata: status (draft/active/inactive), license number, timestamps

**Bookings** - Property reservations
- References: propertyId, bookingAgentId (who made booking), ownerAgentId (property owner)
- Client data: name, email, phone
- Dates: checkIn, checkOut
- Financial: totalPrice, status (pending/confirmed/cancelled)

**Commissions** - Revenue sharing records for rentals
- References: bookingId (one-to-one relationship)
- Splits: ownerCommission, bookingCommission, platformFee (10% total commission, 5% platform fee)
- Metadata: status, created timestamp

**Sales Properties** - Property listings for sale
- Structure mirrors Properties but for sales transactions
- Ownership: Linked to agent via agentId foreign key
- Details: title, description, location, type, price (listing price), beds, baths, square meters
- Media: images array, amenities array
- Metadata: status (draft/active/inactive/sold), license number, timestamps

**Sales Transactions** - Property sales completed or pending
- References: propertyId, sellerAgentId, buyerAgentId
- Buyer info: name, email, phone
- Financial: salePrice, saleDate
- Status: pending, completed, cancelled

**Sales Commissions** - Revenue sharing for property sales
- References: transactionId (one-to-one relationship)
- Splits: sellerCommission, buyerCommission, platformFee (4% total commission, 1% platform fee)
- Metadata: status, created timestamp

### Key Architectural Decisions

**Session-Based Authentication**
- Admin access controlled via express-session with MemoryStore
- Session cookies with httpOnly, sameSite, and secure flags (in production)
- Single admin password (ADMIN_PASSWORD environment variable required)
- No per-agent authentication currently implemented (uses hardcoded CURRENT_AGENT_ID = 1)
- **Rationale**: Simple initial implementation for admin panel; agent authentication can be added later
- **Trade-off**: MemoryStore sessions are lost on server restart; consider PostgreSQL session store (connect-pg-simple already installed) for production

**Storage Abstraction Layer**
- Interface-based design in `server/storage.ts` defines all data operations
- Separates business logic from ORM implementation details
- All database queries use Drizzle ORM with type-safe operations
- **Rationale**: Makes it easy to swap database implementations or add caching layer
- **Trade-off**: Extra abstraction layer adds boilerplate but improves testability

**Shared Schema Definitions**
- Single source of truth in `shared/schema.ts` for both client and server
- Drizzle schema generates TypeScript types automatically
- Zod schemas created from Drizzle schemas for runtime validation
- **Rationale**: Ensures type safety across full stack and reduces duplication
- **Benefit**: Refactoring database changes automatically updates all TypeScript consumers

**Monolithic API Design**
- RESTful endpoints for CRUD operations on each entity
- Query parameters for filtering (location, propertyType, status, etc.)
- No GraphQL or tRPC - traditional REST API
- **Rationale**: Simple, well-understood pattern suitable for CRUD operations
- **Alternative considered**: tRPC would provide end-to-end type safety but adds complexity

**Development vs Production Modes**
- Development: Vite dev server middleware for HMR and fast refresh
- Production: Pre-built static files served by Express
- Replit-specific plugins only loaded in development (cartographer, dev banner)
- **Rationale**: Optimizes developer experience while keeping production bundle lean

**Component Library Strategy**
- Shadcn UI provides unstyled, accessible components via Radix UI
- Components copied into project (not npm dependency) for full control
- Tailwind CSS for styling with custom design tokens defined in `index.css`
- Custom theme variables (--sidebar, --primary, --accent, etc.)
- **Rationale**: Maximum customization while leveraging well-tested accessibility primitives
- **Trade-off**: Component updates require manual copying vs automatic npm updates

**Hardcoded Current Agent**
- Frontend uses `CURRENT_AGENT_ID = 1` throughout
- No authentication context or user session management on client
- **Current limitation**: Multi-agent usage not supported in UI
- **Future enhancement**: Add agent login flow and session context

## External Dependencies

### Database & Infrastructure
- **Neon Postgres** - Serverless PostgreSQL database
  - Required: `DATABASE_URL` environment variable
  - WebSocket connection for serverless compatibility
  - Connection pooling via `@neondatabase/serverless`

### Authentication & Sessions
- **express-session** - Session middleware
  - MemoryStore for development (sessions cleared on restart)
  - connect-pg-simple available for PostgreSQL-backed sessions in production
  - Required: `SESSION_SECRET` environment variable (critical for production)
  - Required: `ADMIN_PASSWORD` environment variable for admin access

### UI & Styling
- **Radix UI** - Headless component primitives (@radix-ui/react-*)
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Google Fonts** - Inter and Playfair Display fonts loaded via CDN

### Development Tools
- **Replit Vite Plugins** - Development-only enhancements
  - Runtime error modal overlay
  - Meta images plugin for OpenGraph image handling
  - Cartographer for code navigation
  - Dev banner for Replit environment awareness

### Build & Bundling
- **esbuild** - Fast JavaScript bundler for server code
- **Vite** - Frontend build tool with HMR support
- **TypeScript** - Type checking and compilation

### Validation & Type Safety
- **Zod** - Runtime type validation
- **drizzle-zod** - Bridge between Drizzle schemas and Zod validators
- **zod-validation-error** - Human-readable error messages

### Utility Libraries
- **date-fns** - Date manipulation and formatting
- **nanoid** - Unique ID generation (used in HMR cache busting)
- **clsx** & **tailwind-merge** - Conditional CSS class utilities
- **class-variance-authority** - Type-safe component variants