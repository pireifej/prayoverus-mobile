# Overview

PrayOverUs is a full-stack prayer community platform available as both a web application and React Native mobile app. The platform enables users to share prayers, support others, and participate in prayer groups. It combines personal prayer management with community features, allowing users to create private or public prayer requests, offer support through prayers and comments, and join prayer groups for collective spiritual support.

## Recent Changes (August 29, 2025)
- ✅ **React Native Mobile App Created**: Full-featured mobile application with native components and navigation
- ✅ **Cross-Platform Architecture**: Shared backend API serving both web and mobile clients
- ✅ **Mobile-Optimized UX**: Bottom navigation, touch-friendly interfaces, and native mobile patterns
- ✅ **Complete Feature Parity**: All web features available in mobile app including prayers, community, groups, and profiles
- ✅ **Expo Version Created**: Expo-based mobile app for instant QR code preview and testing
- ✅ **Mobile Preview Ready**: Users can scan QR code with Expo Go app to test on real devices
- ✅ **Expo App Fully Functional**: Fixed Metro bundler registration errors, added interactive navigation and complete prayer functionality including personal prayers, community wall, and prayer groups with working forms and data persistence
- ✅ **Catholic Prayer Generation**: Implemented authentic Catholic prayers for specific requests using traditional Catholic prayer structure with saint intercessions and proper liturgical format

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built with React and TypeScript using Vite as the build tool. The UI is constructed with shadcn/ui components, which provides a modern design system built on top of Radix UI primitives and styled with Tailwind CSS. The application uses a client-side routing approach with wouter for navigation.

**State Management**: React Query (TanStack Query) handles server state management, providing caching, synchronization, and background updates. Local state is managed with React's built-in useState and useContext hooks.

**Real-time Features**: WebSocket connections enable real-time updates for community prayer feeds, allowing users to see new prayers and support as they happen without page refreshes.

**Responsive Design**: The application is mobile-first with responsive navigation that adapts between desktop and mobile layouts, including a bottom navigation bar for mobile devices.

## Backend Architecture

The backend follows a REST API pattern built with Express.js and TypeScript. The server implements a layered architecture with clear separation between routes, business logic, and data access.

**API Structure**: RESTful endpoints handle CRUD operations for prayers, prayer groups, user management, and support/comment systems. The API includes proper error handling and request validation using Zod schemas.

**Real-time Communication**: WebSocket server integration provides live updates for community features, broadcasting new prayers and interactions to connected clients.

**Middleware**: Custom logging middleware tracks API performance and responses, while authentication middleware protects secured endpoints.

## Data Storage Solutions

**Database**: PostgreSQL serves as the primary database, accessed through Drizzle ORM which provides type-safe database operations and migrations.

**Schema Design**: The database schema includes tables for users, prayers, prayer groups, group memberships, prayer support, prayer comments, and sessions. Relationships are properly defined with foreign key constraints and cascading deletes.

**Connection Management**: Neon Database's serverless PostgreSQL is used with connection pooling for optimal performance in serverless environments.

## Authentication and Authorization

**Authentication Provider**: Replit Auth integration handles user authentication using OpenID Connect, providing secure login without implementing custom authentication flows.

**Session Management**: Express sessions are stored in PostgreSQL using connect-pg-simple, ensuring session persistence across server restarts.

**Authorization**: Route-level middleware protects authenticated endpoints, while user ownership is validated for operations on personal prayer data.

## UI Component System

**Design System**: shadcn/ui provides a comprehensive component library with consistent styling and behavior across the application.

**Theming**: CSS custom properties enable dark/light theme support with a warm, accessible color palette optimized for the prayer community context.

**Form Handling**: React Hook Form with Zod validation ensures robust form management with client-side validation matching server-side schemas.

# External Dependencies

## Core Framework Dependencies
- **React 18**: Frontend UI library with modern hooks and concurrent features
- **Express.js**: Backend web framework for Node.js
- **TypeScript**: Type safety across the entire application stack
- **Vite**: Fast build tool and development server for the frontend

## Database and ORM
- **PostgreSQL**: Primary database via Neon Database serverless platform
- **Drizzle ORM**: Type-safe database toolkit with migration support
- **@neondatabase/serverless**: Serverless PostgreSQL driver optimized for edge environments

## Authentication
- **Replit Auth**: OpenID Connect authentication provider
- **Passport.js**: Authentication middleware for Express
- **express-session**: Session management with PostgreSQL storage

## UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI component primitives
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library with consistent styling

## Data Management
- **TanStack React Query**: Server state management and caching
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation for both client and server
- **date-fns**: Date manipulation and formatting

## Real-time Features
- **WebSocket (ws)**: Real-time bidirectional communication
- **WebSocketServer**: Server-side WebSocket implementation

## Development Tools
- **ESBuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution for development
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **@replit/vite-plugin-cartographer**: Replit development integration