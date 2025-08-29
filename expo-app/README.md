# PrayOverUs - Expo Mobile App

A React Native prayer community mobile application built with Expo for easy preview and testing.

## Preview with QR Code

This Expo version allows you to preview the app immediately on your mobile device:

1. **Install Expo Go** on your phone:
   - iOS: Download from App Store
   - Android: Download from Google Play Store

2. **Start the development server**:
   ```bash
   cd expo-app
   npx expo start
   ```

3. **Scan the QR code** that appears in the terminal/console with:
   - iOS: Use your camera app
   - Android: Use the Expo Go app

4. **The app will load** on your device for real-time testing!

## Features

- **Personal Prayer Management**: Create, track, and mark prayers as answered
- **Community Prayer Wall**: Share prayer requests and pray for others  
- **Prayer Groups**: Join or create prayer groups for collective spiritual support
- **Real-time Updates**: Live notifications for new prayers and support
- **Native Mobile Experience**: Optimized for touch interfaces with Material Design

## Technology Stack

- **Framework**: Expo (React Native)
- **Navigation**: Expo Router (file-based routing)
- **UI Components**: React Native Paper (Material Design)
- **State Management**: TanStack React Query
- **Form Handling**: React Hook Form with Zod validation
- **Storage**: AsyncStorage for local data

## Project Structure

```
expo-app/
├── app/                    # File-based routing
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home (My Prayers)
│   │   ├── community.tsx  # Community Prayer Wall
│   │   ├── groups.tsx     # Prayer Groups
│   │   └── profile.tsx    # User Profile
│   ├── _layout.tsx        # Root layout with providers
│   ├── login.tsx          # Authentication screen
│   └── add-prayer.tsx     # Add prayer modal
├── context/
│   └── AuthContext.tsx    # Authentication context
├── assets/                # App icons and images
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## Development

### Prerequisites
- Node.js 16+
- Expo CLI (installed automatically)
- Expo Go app on your mobile device

### Getting Started

1. **Navigate to the expo-app directory**:
   ```bash
   cd expo-app
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npx expo start
   ```

4. **Choose your platform**:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator  
   - Scan QR code for physical device

### Key Differences from React Native CLI

- **File-based routing** with Expo Router instead of React Navigation setup
- **Built-in build tools** - no need for Xcode/Android Studio for development
- **Over-the-air updates** for easy deployment
- **Simplified configuration** through app.json

## Screens Overview

### Home Screen (My Prayers)
- Personal prayer dashboard with filtering by status
- Quick actions to add prayers and mark as answered
- Beautiful cards showing prayer content and timestamps

### Community Screen
- Public prayer wall with prayers from other users
- Support prayers with "Praying for this" button
- Encourage others with messages

### Groups Screen  
- Discover and join prayer groups
- View group member counts and descriptions
- Browse popular categories

### Profile Screen
- User settings and preferences
- Prayer statistics and journey tracking
- Account management and support

### Add Prayer Screen
- Clean form for creating new prayers
- Toggle for sharing with community
- Privacy settings and guidelines

## Backend Integration

The Expo app connects to the same backend API as the web application:

- **Authentication**: JWT token-based with AsyncStorage
- **API Endpoints**: RESTful endpoints for prayers, groups, comments
- **Real-time**: WebSocket support for live updates
- **Database**: PostgreSQL with Drizzle ORM

## Building for Production

### Expo Application Services (EAS Build)

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS**:
   ```bash
   eas build:configure
   ```

3. **Build for iOS**:
   ```bash
   eas build --platform ios
   ```

4. **Build for Android**:
   ```bash
   eas build --platform android
   ```

### Publishing

1. **Submit to App Store**:
   ```bash
   eas submit --platform ios
   ```

2. **Submit to Google Play**:
   ```bash
   eas submit --platform android
   ```

## Advantages of Expo Version

1. **Instant Preview**: QR code scanning for immediate testing
2. **No Setup Required**: No Xcode or Android Studio needed
3. **Over-the-Air Updates**: Update app without app store releases
4. **Cross-Platform**: Single codebase for iOS and Android
5. **Easy Deployment**: Simplified build and submission process

## Contributing

1. Use Expo and React Native best practices
2. Follow Material Design principles with React Native Paper
3. Implement proper error handling and loading states
4. Test on both iOS and Android devices via Expo Go
5. Maintain consistent code style and TypeScript types

## Support

For issues with the Expo app:
1. Check Expo documentation: https://docs.expo.dev
2. Verify device compatibility with Expo Go
3. Ensure stable internet connection for QR code scanning