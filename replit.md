# Overview

PrayOverUs is a full-stack prayer community platform available as both a web application and a React Native mobile app. It enables users to share prayers, support others, and participate in prayer groups, combining personal prayer management with community features. Key capabilities include creating private or public prayer requests, offering support through prayers and comments, and joining groups for collective spiritual support. The platform aims to provide a comprehensive, engaging, and mobile-optimized experience for spiritual connection and community building.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built with React and TypeScript, using Vite for building. UI components are developed with shadcn/ui, built on Radix UI primitives and styled with Tailwind CSS. Navigation is handled by wouter for client-side routing. React Query manages server state, while React's built-in hooks handle local state. Real-time updates for community feeds are enabled via WebSocket connections. The application features a mobile-first responsive design, adapting layouts and navigation for various screen sizes, including a bottom navigation bar for mobile.

## Backend Architecture

The backend utilizes an Express.js and TypeScript REST API with a layered architecture. It provides RESTful endpoints for CRUD operations on prayers, prayer groups, user management, and support/comment systems. Zod schemas ensure request validation and error handling. Real-time communication is facilitated by WebSocket server integration. Custom middleware handles logging and authentication.

## Data Storage Solutions

PostgreSQL serves as the primary database, accessed through Drizzle ORM for type-safe operations and migrations. The schema includes tables for users, prayers, prayer groups, memberships, support, comments, and sessions with defined relationships. Neon Database's serverless PostgreSQL with connection pooling is used for optimal performance.

## Authentication and Authorization

Replit Auth provides user authentication via OpenID Connect. Express sessions are managed and persisted in PostgreSQL using connect-pg-simple. Authorization is enforced through route-level middleware and user ownership validation for data operations.

## UI Component System

shadcn/ui provides a consistent component library. Theming supports dark/light modes with an accessible color palette. React Hook Form, coupled with Zod validation, ensures robust and validated form management.

## Technical Implementations & Features

*   **Full-Screen Prayer Detail View**: Instagram-style prayer viewing with image headers, scrollable text, prayer counts, author info, and a 'Pray' button.
*   **Ad Integration**: Google AdMob banner ads on the home screen and interstitial ads after every 5th prayer for monetization.
*   **Android 15 & Large Screen Support**: Target SDK 35 with edge-to-edge and orientation support for diverse devices.
*   **Prayer Options**: Facebook-style icon buttons for adding titles, pictures, or setting church-only visibility.
*   **Prayer Management**: Three-dot menu on prayer cards for editing, deleting, or sharing prayers with ownership detection.
*   **Prayer Deep Linking**: App opens directly to shared prayer links, handling authenticated and unauthenticated states.
*   **Error Handling**: Comprehensive error handling for prayer requests, distinguishing between network and server errors.
*   **Church Filtering**: Server-side filtering of prayers by church affiliation for efficiency.
*   **Profile Picture Upload**: Users can upload and update profile pictures with real-time updates and persistence.
*   **Live Rosary Feature**: UI for synchronized multi-user Rosary prayer sessions with progress indicators, real-time prayer text, and host controls, ready for WebSocket integration.
*   **Prayer Feedback**: "X people prayed" badges, instant "✓ You Prayed" button updates, and "Hide Prayed ✓" filter.
*   **Password Reset**: Complete forgot password and reset password flow with email integration and deep linking.
*   **UI/UX Enhancements**: Bouncy button animations, loading states with animated prayer hands, and Facebook-style feeds.
*   **Catholic Prayer Generation**: Implemented authentic Catholic prayers for specific requests.

# External Dependencies

*   **React 18**: Frontend UI library.
*   **Express.js**: Backend web framework.
*   **TypeScript**: Type safety.
*   **Vite**: Frontend build tool.
*   **PostgreSQL**: Primary database via Neon Database.
*   **Drizzle ORM**: Type-safe database toolkit.
*   **@neondatabase/serverless**: Serverless PostgreSQL driver.
*   **Replit Auth**: OpenID Connect authentication.
*   **Passport.js**: Authentication middleware.
*   **express-session**: Session management.
*   **Tailwind CSS**: Utility-first CSS framework.
*   **Radix UI**: Headless UI component primitives.
*   **shadcn/ui**: Pre-built component library.
*   **Lucide React**: Icon library.
*   **TanStack React Query**: Server state management.
*   **React Hook Form**: Form state management.
*   **Zod**: Schema validation.
*   **date-fns**: Date manipulation.
*   **WebSocket (ws)**: Real-time communication.
*   **WebSocketServer**: Server-side WebSocket implementation.
*   **expo-image-picker**: For image uploads.
*   **react-native-google-mobile-ads**: For banner and interstitial ads.