# PrayOverUs Mobile App

A React Native prayer community mobile application that enables users to share prayers, support others, and participate in prayer groups.

## Features

- **Personal Prayer Management**: Create, track, and mark prayers as answered
- **Community Prayer Wall**: Share prayer requests and pray for others
- **Prayer Groups**: Join or create prayer groups for collective spiritual support
- **Real-time Updates**: Live notifications for new prayers and support
- **Cross-platform**: Works on both iOS and Android devices
- **Native Mobile Experience**: Optimized for touch interfaces and mobile usage patterns

## Technology Stack

- **Frontend**: React Native with TypeScript
- **UI Framework**: React Native Paper (Material Design)
- **Navigation**: React Navigation 6
- **State Management**: TanStack React Query
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: React Native Vector Icons
- **Storage**: AsyncStorage for local data persistence

## Backend Integration

The mobile app connects to the same backend API as the web application:

- **Authentication**: JWT token-based authentication
- **API**: RESTful endpoints for prayers, groups, comments, and support
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket support for live updates

## Project Structure

```
mobile/
├── src/
│   ├── components/         # Reusable UI components
│   │   └── PrayerCard.tsx
│   ├── context/           # React Context providers
│   │   └── AuthContext.tsx
│   ├── screens/           # Application screens
│   │   ├── HomeScreen.tsx
│   │   ├── CommunityScreen.tsx
│   │   ├── GroupsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── AddPrayerScreen.tsx
│   │   └── PrayerDetailScreen.tsx
│   └── services/          # API service layer
│       └── api.ts
├── android/               # Android-specific configuration
├── ios/                   # iOS-specific configuration
└── App.tsx               # Main application component
```

## Key Components

### Authentication (AuthContext)
- Manages user authentication state
- Handles JWT token storage and validation
- Provides login/logout functionality
- Integrates with AsyncStorage for persistence

### API Service (api.ts)
- Centralized API communication layer
- Handles authentication headers automatically
- Provides type-safe methods for all endpoints
- Manages error handling and retry logic

### Navigation
- Bottom tab navigation for main sections
- Stack navigation for detailed views
- Modal presentations for forms
- Deep linking support for prayers and groups

### Screens

1. **HomeScreen**: Personal prayer dashboard with filtering
2. **CommunityScreen**: Public prayer wall with support actions
3. **GroupsScreen**: Prayer group management and discovery
4. **ProfileScreen**: User settings and account management
5. **AddPrayerScreen**: Form for creating new prayers
6. **LoginScreen**: Authentication and onboarding
7. **PrayerDetailScreen**: Detailed prayer view with comments

## Setup Instructions

### Prerequisites
- Node.js 16+ 
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **iOS Setup** (macOS only):
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Android Setup**:
   - Open `android/` directory in Android Studio
   - Sync project and install dependencies

### Configuration

1. **API Configuration**:
   Update `src/services/api.ts` with your backend URL:
   ```typescript
   const API_BASE_URL = 'https://your-api-url.com';
   ```

2. **Authentication**:
   Configure authentication providers in `src/context/AuthContext.tsx`

### Running the App

**Start Metro bundler**:
```bash
npm start
```

**Run on Android**:
```bash
npm run android
```

**Run on iOS**:
```bash
npm run ios
```

## API Integration

The mobile app requires these backend endpoints:

### Authentication
- `GET /api/auth/user` - Get current user profile
- `POST /api/auth/login` - User authentication

### Prayers
- `GET /api/prayers/mine` - Get user's prayers
- `GET /api/prayers/public` - Get public community prayers
- `POST /api/prayers` - Create new prayer
- `PATCH /api/prayers/:id/status` - Update prayer status
- `DELETE /api/prayers/:id` - Delete prayer

### Prayer Support
- `POST /api/prayers/:id/support` - Add prayer support
- `DELETE /api/prayers/:id/support/:type` - Remove support

### Prayer Comments
- `GET /api/prayers/:id/comments` - Get prayer comments
- `POST /api/prayers/:id/comments` - Add comment

### Prayer Groups
- `GET /api/groups/mine` - Get user's groups
- `GET /api/groups/public` - Get public groups
- `POST /api/groups` - Create prayer group
- `POST /api/groups/:id/join` - Join group
- `DELETE /api/groups/:id/leave` - Leave group

## Features in Detail

### Personal Prayer Management
- Create prayers with title, content, and privacy settings
- Track prayer status (ongoing/answered)
- Filter prayers by status
- Mark prayers as answered with celebration UI
- Delete prayers with confirmation

### Community Features
- View public prayers from other users
- Add support ("praying for this") to community prayers
- Send encouraging messages to prayer authors
- Real-time updates when new prayers are shared

### Prayer Groups
- Discover public prayer groups
- Join groups with common interests or causes
- Create new prayer groups with custom settings
- View group member counts and activity

### Mobile-Optimized UX
- Bottom tab navigation for easy thumb access
- Floating action buttons for quick actions
- Pull-to-refresh on all lists
- Loading states and error handling
- Toast notifications for user feedback
- Responsive design for various screen sizes

## Building for Production

### Android
```bash
cd android
./gradlew assembleRelease
```

### iOS
1. Open `ios/PrayOverUsMobile.xcworkspace` in Xcode
2. Select "Generic iOS Device" or specific device
3. Product → Archive
4. Follow App Store upload process

## Contributing

1. Follow React Native and TypeScript best practices
2. Use React Native Paper components consistently
3. Implement proper error handling and loading states
4. Add TypeScript types for all components and functions
5. Test on both iOS and Android platforms
6. Follow the established project structure and naming conventions

## License

Private - All rights reserved