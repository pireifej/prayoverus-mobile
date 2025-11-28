# Overview

PrayOverUs is a full-stack prayer community platform available as both a web application and React Native mobile app. The platform enables users to share prayers, support others, and participate in prayer groups. It combines personal prayer management with community features, allowing users to create private or public prayer requests, offer support through prayers and comments, and join prayer groups for collective spiritual support.

## Recent Changes (November 28, 2025)
- ✅ **Profile Screen Loading Fix**: Church name now displays correctly on Profile screen
  - Added loading state indicator while fetching profile data from API
  - Profile now properly awaits `refreshUserProfile()` before displaying content
  - Fixes race condition where church showed "Not set" before API response completed
  - Loading spinner with "Loading profile..." text during data fetch

## Previous Changes (November 27, 2025)
- ✅ **Prayer Options Menu**: Three-dot menu (⋮) on prayer cards with Edit, Delete, Share options
  - Edit: Opens modal with pre-filled request text, saves via editRequest API (requestId, userId, requestText)
  - Delete: Confirmation dialog ("Are you sure?"), calls deleteRequestById API with request_id, displays response message  
  - Share: Copies shareable link (prayoverus.com/index.html?requestId={id}) to clipboard
  - Ownership detection: Edit/Delete only shown for user's own prayers
  - Works on both Community Wall and Profile screen prayer cards
- ✅ **Prayer Deep Linking**: App opens shared prayer links directly
  - Share URL format: https://prayoverus.com/index.html?requestId={id}
  - Waits for prayers to load before opening modal (race condition fix)
  - Shows "Prayer Not Found" if prayer was deleted
  - Prompts sign-in if user not authenticated

## Previous Changes (November 23, 2025)
- ✅ **Prayer Request Error Handling**: Comprehensive error handling when creating prayer requests
  - Shows actual error messages from the API to users (validation errors, server errors)
  - Distinguishes between network errors (offline) and server errors
  - Network errors: Saves prayer locally and shows "Offline Mode" message
  - Server errors: Shows error message and keeps form filled so user can retry
  - No more silent failures or misleading "saved locally" messages for validation errors

## Previous Changes (November 20, 2025)
- ✅ **Backend Church Filtering**: "My Church Only" button now uses server-side filtering for better performance
  - Passes `filterByChurch: true/false` parameter to `/getCommunityWall` API
  - Automatically reloads prayers when filter is toggled
  - Removes client-side filtering for church data (now handled by backend)
  - More efficient for large prayer communities
- ✅ **Fullscreen Prayer Display Enhancement**: Increased bottom padding from 100px to 250px
  - Ensures long prayers can be fully scrolled and read
  - Prayer text no longer cuts off behind "Amen" button

## Previous Changes (November 18, 2025)
- ✅ **Profile Picture Upload**: Complete implementation for users to upload and change their profile pictures
  - Camera button overlay on profile picture in profile screen
  - expo-image-picker integration with photo library access
  - Image upload to production API (/uploadProfilePicture endpoint)
  - Real-time profile picture updates across all screens
  - Loading indicator during upload
  - Proper error handling and success feedback
  - Profile pictures persist to AsyncStorage and sync with backend

## Previous Changes (October 20, 2025)
- ✅ **Live Rosary Feature**: Complete UI implementation for multi-user synchronized Rosary prayer sessions
  - Rosary lobby with host/join session options
  - Visual rosary bead progress indicator with current prayer highlighting
  - Real-time prayer text display with rotating reader assignments
  - Participant list showing all users in the session
  - Host controls for advancing prayers and ending sessions
  - Ready for backend WebSocket integration (APIs documented separately)
- ✅ **Prayer Count Badges**: Shows "X people prayed" above prayer cards with expandable names list
- ✅ **Instant Prayer Feedback**: Green "✓ You Prayed" button indicator updates immediately
- ✅ **Prayer Filter**: "Hide Prayed ✓" button to filter already-prayed requests with empty state messaging

## Previous Changes (October 18, 2025)
- ✅ **Password Reset Feature**: Complete forgot password and reset password flow with email integration
- ✅ **Deep Linking Support**: App opens directly to password reset screen from email links
- ✅ **Enhanced UI/UX**: Bouncy button animations, loading states with animated prayer hands, and success feedback
- ✅ **Facebook-style Feed**: Compact prayer posting widget with community feed below
- ✅ **Profile Enhancements**: Personal Requests section showing user's prayer history

## Previous Changes (August 30, 2025)
- ✅ **React Native Mobile App Created**: Full-featured mobile application with native components and navigation
- ✅ **Cross-Platform Architecture**: Shared backend API serving both web and mobile clients
- ✅ **Mobile-Optimized UX**: Bottom navigation, touch-friendly interfaces, and native mobile patterns
- ✅ **Complete Feature Parity**: All web features available in mobile app including prayers, community, groups, and profiles
- ✅ **Expo Version Created**: Expo-based mobile app for instant QR code preview and testing
- ✅ **Mobile Preview Ready**: Users can scan QR code with Expo Go app to test on real devices
- ✅ **Expo App Fully Functional**: Fixed Metro bundler registration errors, added interactive navigation and complete prayer functionality including personal prayers, community wall, and prayer groups with working forms and data persistence
- ✅ **Catholic Prayer Generation**: Implemented authentic Catholic prayers for specific requests using traditional Catholic prayer structure with saint intercessions and proper liturgical format
- ✅ **Production API Integration**: Complete integration with production PrayOverUs.com APIs
- ✅ **Authentication API**: Login endpoint integration with real user authentication and profile data
- ✅ **Prayer Feed API**: Community wall loads real prayer requests from production database
- ✅ **Prayer Creation API**: Add New Prayer functionality saves directly to production database
- ✅ **Prayer Action Tracking**: "Amen" button records prayer actions in production database via prayFor API
- ✅ **Real User Sessions**: App uses authenticated user IDs for all API calls and data operations

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