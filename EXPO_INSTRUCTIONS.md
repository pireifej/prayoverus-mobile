# PrayOverUs Expo Mobile App - Quick Start Guide

## 🚀 **Ready to Preview on Your Phone!**

The Expo version of PrayOverUs is fully built and ready to preview on your mobile device.

## **Step 1: Install Expo Go App**
- **iOS**: Download "Expo Go" from the App Store
- **Android**: Download "Expo Go" from Google Play Store

## **Step 2: Start the Expo Server**

Run this command in your terminal:

```bash
./start-expo-working.sh
```

**OR manually:**

```bash
cd expo-app
CI=1 npx expo start --port 19006 --lan
```

## **Step 3: Scan QR Code**

- **iOS**: Open your camera app and point it at the QR code
- **Android**: Open the Expo Go app and tap "Scan QR Code"

## **What You'll See on Your Phone**

The complete PrayOverUs prayer app with:

### 🏠 **Home Screen (My Prayers)**
- Personal prayer dashboard
- Filter prayers by status (All/Ongoing/Answered)
- Mark prayers as answered with celebration
- Quick add prayer button

### 👥 **Community Screen**
- Public prayer wall from other users
- "Praying for this" support button
- Encourage others with messages
- Real-time community interactions

### 🤝 **Groups Screen**
- Discover public prayer groups
- Join groups with one tap
- Browse categories (Health, Family, Work, etc.)
- View member counts

### 👤 **Profile Screen**
- Prayer statistics and journey tracking
- Settings and preferences
- Account management
- Inspirational content

### ➕ **Add Prayer Screen**
- Create new prayers with rich text
- Toggle public/private sharing
- Privacy guidelines and tips

## **Mobile Features**

✅ **Native Mobile UX**
- Bottom tab navigation
- Touch-friendly interfaces
- Pull-to-refresh on all lists
- Loading animations
- Toast notifications

✅ **Material Design**
- Beautiful cards and components
- Consistent color scheme
- Smooth animations
- Professional mobile design

✅ **Real-time Updates**
- Live prayer support counts
- Community prayer notifications
- Instant UI updates

## **Troubleshooting**

### **Port Already in Use Error**
The script uses port 19006 to avoid conflicts with the main web app running on port 5000.

### **QR Code Not Working**
- Ensure your phone and computer are on the same WiFi network
- Try closing and reopening Expo Go app
- Make sure you have good internet connection

### **App Won't Load**
- Verify Expo Go app is updated to latest version
- Try restarting the Expo server
- Check that no firewall is blocking connections

## **Demo Features**

The app includes demo data so you can immediately test:
- Sample personal prayers with different statuses
- Mock community prayers with user interactions
- Example prayer groups to join
- User profile with prayer statistics

## **Backend Integration**

The mobile app is configured to connect to the same backend as the web version:
- Authentication via JWT tokens
- Same API endpoints for prayers, groups, comments
- PostgreSQL database integration
- Real-time WebSocket support (ready for implementation)

## **Development Features**

- **Hot Reload**: Changes reflect instantly on your device
- **Error Overlay**: Development errors shown on device
- **Console Logs**: Debug information in Expo Dev Tools
- **Network Inspector**: Monitor API calls

## **Next Steps**

Once you have the app running on your phone:
1. Test the user interface and navigation
2. Try creating prayers and marking them answered
3. Explore the community features
4. Test the prayer groups functionality
5. Provide feedback on the mobile experience

The Expo version gives you the full prayer community experience optimized for mobile devices!