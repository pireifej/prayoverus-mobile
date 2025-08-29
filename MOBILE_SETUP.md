# Mobile App Setup Guide

PrayOverUs now has TWO mobile app versions:

## 🚀 Expo Version (Recommended for Testing)

**Best for**: Instant preview and testing on your phone

### Quick Start
1. **Install Expo Go** on your phone:
   - iOS: Download from App Store
   - Android: Download from Google Play Store

2. **Start the Expo server**:
   ```bash
   ./start-expo.sh
   ```
   OR
   ```bash
   cd expo-app && npx expo start --tunnel
   ```

3. **Scan the QR code** with your phone camera (iOS) or Expo Go app (Android)

4. **The app loads instantly** on your device!

### Features
- ✅ Personal prayer management with status tracking
- ✅ Community prayer wall with support interactions  
- ✅ Prayer groups discovery and joining
- ✅ User profile with prayer statistics
- ✅ Material Design UI with React Native Paper
- ✅ Real-time QR code preview updates

### File Structure
```
expo-app/
├── app/(tabs)/          # Main screens with tab navigation
├── context/            # Authentication context
├── assets/             # App icons and images
└── app.json           # Expo configuration
```

---

## 📱 React Native CLI Version (Production Ready)

**Best for**: Production deployment to app stores

### Setup Requirements
- Node.js 16+
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS, macOS only)

### Quick Start
```bash
cd mobile
npm install

# iOS (macOS only)
cd ios && pod install && cd ..
npm run ios

# Android
npm run android
```

### Features
- ✅ Full native React Native implementation
- ✅ Production-ready for app store deployment
- ✅ Native performance optimization
- ✅ Advanced native features and integrations
- ✅ Complete offline capabilities

### File Structure
```
mobile/
├── src/screens/        # All application screens
├── src/components/     # Reusable components
├── src/context/        # React contexts
├── src/services/       # API integration
├── android/           # Android configuration
└── ios/               # iOS configuration
```

---

## 🌐 Web Version

**Already Available**: The web application runs on the main workflow

### Quick Start
```bash
npm run dev
```

Access at: `http://localhost:5000`

### Features  
- ✅ Responsive web design
- ✅ Desktop and mobile browser support
- ✅ Same backend API as mobile apps
- ✅ Real-time WebSocket updates

---

## 🔄 Shared Backend

All three versions (Web, Expo, React Native) use the same backend:

### API Endpoints
- Authentication: `/api/auth/*`
- Prayers: `/api/prayers/*`
- Groups: `/api/groups/*`
- Comments: `/api/comments/*`
- Support: `/api/support/*`

### Database
- PostgreSQL with Drizzle ORM
- Shared schema across all platforms
- Real-time WebSocket support

---

## 📋 Development Workflow

### For Quick Testing (Recommended)
1. **Use Expo version** for rapid prototyping and testing
2. **Scan QR code** to test on real devices instantly
3. **Make changes** and see them live on your phone

### For Production Deployment
1. **Use React Native CLI version** for app store submission
2. **Build with native tools** (Xcode/Android Studio)
3. **Deploy to app stores** with full native capabilities

### For Web Users
1. **Use web version** for browser-based access
2. **Responsive design** works on all screen sizes
3. **Progressive Web App** features for mobile browsers

---

## 🤝 Which Version Should I Use?

| Use Case | Recommended Version |
|----------|-------------------|
| **Quick preview/testing** | Expo (QR code) |
| **App store deployment** | React Native CLI |
| **Web browser access** | Web application |
| **Development/prototyping** | Expo |
| **Production mobile app** | React Native CLI |

---

## 🛠️ Troubleshooting

### Expo QR Code Issues
- Ensure phone and computer are on same network
- Try `--tunnel` flag for better connectivity
- Restart Expo Go app and rescan

### React Native CLI Issues  
- Verify Android Studio/Xcode installation
- Check device/simulator connectivity
- Run `npx react-native doctor` for diagnostics

### Backend Connection
- Verify server is running on port 5000
- Check network connectivity
- Update API URLs in mobile app configurations