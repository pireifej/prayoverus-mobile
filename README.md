# PrayOverUs Mobile Prayer Platform

A comprehensive prayer community platform available as both a web application and React Native mobile app. The platform enables users to share prayers, support others, and participate in prayer groups with authentic Catholic prayer generation.

## 🚀 Features

### Mobile App (Expo React Native)
- **Account Creation & Authentication** - Full user registration with production API integration
- **Personal Prayer Management** - Create, view, and manage private prayer requests
- **Community Prayer Wall** - Share prayers publicly and support others
- **Catholic Prayer Generation** - AI-generated authentic Catholic prayers using ChatGPT API
- **Prayer Groups** - Join and participate in collective prayer communities
- **Real-time Updates** - Live community interactions and prayer notifications
- **Cross-Platform** - Works on both iOS and Android via Expo Go

### Web Application
- **Responsive Design** - Mobile-first UI with desktop support
- **Real-time Community** - WebSocket-powered live prayer updates
- **Complete Feature Parity** - All mobile features available on web

## 🏗️ Architecture

### Frontend
- **React Native** (Expo) for mobile app
- **React + TypeScript + Vite** for web application
- **shadcn/ui components** with Tailwind CSS
- **TanStack React Query** for state management
- **wouter** for routing

### Backend
- **Express.js + TypeScript** REST API
- **PostgreSQL** with Drizzle ORM
- **WebSocket** for real-time features
- **Replit Auth** for authentication

### External Integrations
- **Production API** - prayoverus.com endpoints for user management and prayers
- **ChatGPT API** - Catholic prayer generation service
- **Neon Database** - Serverless PostgreSQL hosting

## 🚀 Quick Start

### Mobile App Testing
1. Ensure you have Expo Go app installed on your phone
2. Start the Expo development server:
   ```bash
   ./start-expo-minimal.sh
   ```
3. Scan the QR code with Expo Go (Android) or Camera app (iOS)
4. Test account creation and prayer features

### Web Application
1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open http://localhost:5000 in your browser
3. Sign in or create an account to access features

## 📱 Mobile App Features

### Account Creation
- First Name & Last Name
- Email & Password
- Phone Number
- Gender Selection
- Production database integration

### Prayer Management
- **Personal Prayers** - Private prayer requests and tracking
- **Community Wall** - Public prayer sharing and support
- **Prayer Groups** - Collective prayer communities
- **Amen Tracking** - Prayer support actions recorded in database

### Catholic Prayer Generation
- Authentic Catholic prayer structure
- Saint intercessions and liturgical format
- Personalized prayers for specific requests
- Integration with production ChatGPT API

## 🔧 Development

### Project Structure
```
├── expo-app/          # React Native mobile app
├── client/           # React web application
├── server/           # Express.js backend API
├── shared/           # Shared TypeScript schemas
├── mobile/           # React Native CLI version (alternative)
└── components.json   # shadcn/ui configuration
```

### Key Files
- `expo-app/App.js` - Main mobile app entry point
- `expo-app/UserAuth.js` - Authentication and registration
- `client/src/App.tsx` - Web application entry point
- `server/routes.ts` - Backend API routes
- `shared/schema.ts` - Shared data models

### Environment Variables
- `OPENAI_API_KEY` - For Catholic prayer generation
- `DATABASE_URL` - PostgreSQL connection string
- Production API endpoints configured for prayoverus.com

## 🌟 Recent Updates

- ✅ Complete account creation with production API integration
- ✅ Enhanced authentication flow with detailed error handling
- ✅ Catholic prayer generation using authentic liturgical format
- ✅ Real-time community features with WebSocket integration
- ✅ Cross-platform mobile app with Expo for instant testing
- ✅ Production database integration for all user actions

## 📝 API Integration

### Production Endpoints
- `POST /createUser` - Account registration
- `POST /login` - User authentication  
- `POST /getMyRequestFeed` - Community prayer feed
- `POST /createRequest` - New prayer creation
- `POST /prayFor` - Prayer support tracking

### Local Development
- Web API: `http://localhost:5000/api`
- Mobile connects to production APIs directly
- WebSocket: Real-time updates for community features

## 🙏 Catholic Prayer Features

The app generates authentic Catholic prayers following traditional liturgical structure:
- Opening invocation
- Scripture-based content
- Saint intercessions
- Closing with traditional Catholic endings
- Personalized for specific prayer requests

## 📱 Testing the Mobile App

1. **Install Expo Go** on your mobile device
2. **Run the app**: `./start-expo-minimal.sh`
3. **Scan QR code** displayed in terminal
4. **Test features**:
   - Create new account
   - Login with existing credentials
   - Add personal prayers
   - Browse community wall
   - Generate Catholic prayers
   - Join prayer groups

## 🚀 Deployment

- **Mobile**: Expo build and app store deployment
- **Web**: Replit deployment with automatic HTTPS
- **Database**: Neon PostgreSQL with connection pooling
- **Real-time**: WebSocket server with Express integration

## 📞 Support

For technical support or feature requests, contact the development team or check the project documentation in `replit.md`.

---

*Built with ❤️ for the prayer community - connecting hearts in faith across the world.*