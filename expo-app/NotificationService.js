import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';

// Configure how notifications are displayed when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Request notification permissions from the user
   * @returns {Promise<boolean>} - True if permission granted, false otherwise
   */
  async requestPermissions() {
    try {
      if (!Device.isDevice) {
        console.log('Must use physical device for push notifications');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push notification permissions');
        return false;
      }

      console.log('✅ Push notification permissions granted');
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Get the FCM/Expo push token for this device
   * @returns {Promise<string|null>} - The push token or null if failed
   */
  async getPushToken() {
    try {
      if (!Device.isDevice) {
        console.log('Must use physical device for push notifications');
        return null;
      }

      // Get Expo push token (works for both Android and iOS)
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '8daab5cb-7f07-4bdc-a42f-b92c73f2d5d3', // Your Expo project ID
      });

      console.log('📱 Push token:', tokenData.data);
      return tokenData.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Register the FCM token with the backend API
   * @param {number} userId - The user's ID
   * @param {string} token - The FCM/push token
   * @returns {Promise<boolean>} - True if registration successful
   */
  async registerTokenWithBackend(userId, token) {
    try {
      const endpoint = 'https://shouldcallpaul.replit.app/registerFCMToken';
      
      console.log('📤 Registering FCM token with backend:');
      console.log('User ID:', userId);
      console.log('Token:', token);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + btoa('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify({
          userId: userId,
          token: token,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Token registered successfully:', data);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to register token:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error registering token with backend:', error);
      return false;
    }
  }

  /**
   * Complete setup: request permissions, get token, and register with backend
   * @param {number} userId - The user's ID
   * @returns {Promise<boolean>} - True if setup successful
   */
  async setupNotifications(userId) {
    try {
      // Step 1: Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('User denied notification permissions');
        return false;
      }

      // Step 2: Get push token
      const token = await this.getPushToken();
      if (!token) {
        console.log('Failed to get push token');
        return false;
      }

      // Step 3: Register with backend
      const registered = await this.registerTokenWithBackend(userId, token);
      if (!registered) {
        console.log('Failed to register token with backend');
        return false;
      }

      // Step 4: Set up notification handlers
      this.setupNotificationHandlers();

      console.log('✅ Push notifications fully configured!');
      return true;
    } catch (error) {
      console.error('Error setting up notifications:', error);
      return false;
    }
  }

  /**
   * Set up handlers for incoming notifications
   */
  setupNotificationHandlers() {
    // Handle notifications that arrive while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', notification);
      
      // Extract custom data from notification
      const data = notification.request.content.data;
      console.log('Notification data:', data);
      
      // You can add custom handling here based on notification type
      if (data.type === 'new_prayer') {
        console.log('New prayer notification:', data.prayerId);
      } else if (data.type === 'prayer_support') {
        console.log('Prayer support notification:', data.prayerId);
      }
    });

    // Handle notification taps/interactions
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      console.log('Notification data:', data);
      
      // Handle navigation based on notification type
      if (data.type === 'new_prayer' && data.prayerId) {
        // Navigate to prayer detail screen
        console.log('Should navigate to prayer:', data.prayerId);
        // TODO: Implement navigation to specific prayer
      } else if (data.type === 'prayer_support' && data.prayerId) {
        console.log('Should navigate to prayer:', data.prayerId);
        // TODO: Implement navigation to specific prayer
      }
    });

    console.log('✅ Notification handlers registered');
  }

  /**
   * Clean up notification listeners
   */
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
    console.log('🧹 Notification listeners cleaned up');
  }

  /**
   * Show a local notification (for testing)
   */
  async scheduleLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: data,
      },
      trigger: null, // Show immediately
    });
  }
}

// Export a singleton instance
export default new NotificationService();
