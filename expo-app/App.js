import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, AppRegistry, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, RefreshControl, Animated, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen, ForgotPasswordScreen, ResetPasswordScreen } from './UserAuth';

// Use localStorage-like persistence for web and in-memory for mobile  
import { Platform } from 'react-native';

class SimpleStorage {
  constructor() {
    this.data = {};
    if (Platform.OS === 'web') {
      // For web, use localStorage
      this.isWeb = true;
    } else {
      // For mobile, use in-memory (you can extend this with AsyncStorage later)
      this.isWeb = false;
    }
  }

  async setItem(key, value) {
    if (this.isWeb) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } else {
      this.data[key] = value;
    }
  }

  async getItem(key) {
    if (this.isWeb) {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } else {
      return this.data[key] || null;
    }
    return null;
  }

  async removeItem(key) {
    if (this.isWeb) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } else {
      delete this.data[key];
    }
  }
}

const storage = new SimpleStorage();

// Animated Prayer Hands Component
function PrayerHandsLoader() {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '20deg'],
  });
  
  return (
    <Animated.Text style={[styles.prayerHandsAnimation, { transform: [{ rotate }] }]}>
      🙏
    </Animated.Text>
  );
}

// Animated Button Component with bounce effect
function AnimatedButton({ children, onPress, style, disabled, ...props }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
      tension: 40,
    }).start();
  };
  
  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.9}
      {...props}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [prayers, setPrayers] = useState([]);
  const [communityPrayers, setCommunityPrayers] = useState([]);
  const [newPrayer, setNewPrayer] = useState({ title: '', content: '', isPublic: true });
  const [prayerModal, setPrayerModal] = useState({ visible: false, prayer: null, generatedPrayer: '', loading: false });
  const [refreshingCommunity, setRefreshingCommunity] = useState(false);
  const [showTitleInput, setShowTitleInput] = useState(false);
  const [helpForm, setHelpForm] = useState({
    message: '',
    name: '',
    email: '',
    phone: ''
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentIdempotencyKey, setCurrentIdempotencyKey] = useState(null);
  const [hasShownSuccessForCurrentKey, setHasShownSuccessForCurrentKey] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [authScreen, setAuthScreen] = useState('login'); // 'login', 'forgot', 'reset'
  const [resetToken, setResetToken] = useState(null);

  // Check for stored user session on app start
  useEffect(() => {
    checkStoredAuth();
  }, []);

  // Deep linking support for password reset
  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      const route = url.replace(/.*?:\/\//g, '');
      const resetMatch = route.match(/reset-password\?token=([^&]+)/);
      
      if (resetMatch && resetMatch[1]) {
        console.log('📱 Deep link detected: Password reset with token');
        setResetToken(resetMatch[1]);
        setAuthScreen('reset');
      }
    };

    // Handle initial URL if app opened from link
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription?.remove();
    };
  }, []);

  // Load community prayers from the API when user logs in
  useEffect(() => {
    if (currentUser) {
      loadCommunityPrayers();
      loadUserPrayers();
    }
  }, [currentUser]);

  // Refresh user prayers when entering personal screen
  useEffect(() => {
    if (currentUser?.id && currentScreen === 'personal') {
      loadUserPrayers();
    }
  }, [currentScreen, currentUser?.id]);

  // Load community prayers when entering community screen
  useEffect(() => {
    if (currentUser && currentScreen === 'community') {
      loadCommunityPrayers();
    }
  }, [currentScreen, currentUser]);

  const loadCommunityPrayers = async (showRefreshIndicator = false) => {
    console.log('🔄 loadCommunityPrayers called - User ID:', currentUser?.id);
    try {
      if (showRefreshIndicator) {
        setRefreshingCommunity(true);
      }
      
      // Use the actual logged in user's ID from production API
      const userId = currentUser?.id;
      
      if (!userId) {
        console.log('⚠️ No user ID available, skipping community load');
        return;
      }
      
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      
      const endpoint = 'https://shouldcallpaul.replit.app/getCommunityWall';
      const requestPayload = {
        userId: userId.toString(),
        tz: timezone
      };
      
      // Clean debug output - endpoint and payload ONLY
      console.log('📱 MOBILE APP API CALL:');
      console.log('POST ' + endpoint);
      console.log(JSON.stringify(requestPayload, null, 2));
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + btoa('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify(requestPayload),
        timeout: 10000,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📱 Community API Response:', JSON.stringify(data, null, 2));
        
        // Handle direct array response from getCommunityWall
        const prayersArray = Array.isArray(data) ? data : [];
        
        if (prayersArray.length > 0) {
          const communityPrayers = prayersArray.map(request => ({
            id: request.request_id,
            title: request.request_title || request.prayer_title || 'Prayer Request',
            content: request.request_text,
            author: request.real_name || request.user_name || 'Anonymous',
            isPublic: true,
            prayedFor: false,
            timestamp: request.timestamp,
            date: request.timestamp ? new Date(request.timestamp).toLocaleDateString() : 'No date',
            category: request.category_name,
            prayer_title: request.prayer_title,
            other_person: request.other_person,
            picture: request.picture,
            user_id: request.user_id,
            fk_prayer_id: request.fk_prayer_id,
            allow_comments: request.allow_comments,
            use_alias: request.use_alias
          }));
          
          console.log('📱 Parsed community prayers:', communityPrayers.length, 'items');
          setCommunityPrayers(communityPrayers);
        } else {
          console.log('📱 No community prayers found in response');
          setCommunityPrayers([]);
        }
      } else {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Failed to load community prayers:', error.message);
      Alert.alert('Load Error', `Could not load community prayers: ${error.message}`);
      
      // Fallback to sample data for testing
      setCommunityPrayers([
        { id: 1, title: 'Prayer for healing', content: 'Please pray for my grandmother\'s recovery', author: 'Sarah', isPublic: true, prayedFor: false, date: 'Today' },
        { id: 2, title: 'Job search guidance', content: 'Seeking divine guidance in finding new employment', author: 'Michael', isPublic: true, prayedFor: false, date: 'Today' },
      ]);
    } finally {
      if (showRefreshIndicator) {
        setRefreshingCommunity(false);
      }
    }
  };

  const onRefreshCommunity = async () => {
    await loadCommunityPrayers(true);
  };

  // Check for stored user authentication on app start
  const checkStoredAuth = async () => {
    try {
      const userData = await storage.getItem('userSession');
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        console.log('Found stored user session:', parsedUserData.firstName, 'ID:', parsedUserData.id);
        setCurrentUser(parsedUserData);
      } else {
        console.log('No stored user session found');
      }
    } catch (error) {
      console.log('Error checking stored auth:', error.message);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Save user data to storage after login
  const saveUserToStorage = async (userData) => {
    try {
      await storage.setItem('userSession', JSON.stringify(userData));
      console.log('User session saved to persistent storage');
    } catch (error) {
      console.log('Error saving user to storage:', error.message);
    }
  };

  // Clear user data from storage on logout
  const clearUserFromStorage = async () => {
    try {
      await storage.removeItem('userSession');
      console.log('User session cleared from persistent storage');
    } catch (error) {
      console.log('Error clearing user from storage:', error.message);
    }
  };

  // Handle user login and save to storage
  const handleLogin = async (userData) => {
    setCurrentUser(userData);
    await saveUserToStorage(userData);
  };

  // Handle user logout and clear storage
  const handleLogout = async () => {
    await clearUserFromStorage();
    setCurrentUser(null);
    setCurrentScreen('home');
  };

  const loadUserPrayers = async () => {
    if (!currentUser?.id) {
      console.log('No user ID available for loading prayers');
      return;
    }

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      
      const endpoint = 'https://shouldcallpaul.replit.app/getMyRequests';
      const requestPayload = {
        tz: timezone,
        userId: currentUser.id.toString()
      };
      
      // Clean debug output - endpoint and payload ONLY
      console.log('📱 MOBILE APP API CALL:');
      console.log('POST ' + endpoint);
      console.log(JSON.stringify(requestPayload, null, 2));
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + btoa('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify(requestPayload)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📱 API Response:', JSON.stringify(data, null, 2));
        
        // Handle direct array response or wrapped response
        const prayersArray = Array.isArray(data) ? data : (data.result || []);
        
        if (prayersArray.length > 0) {
          const userPrayers = prayersArray.map(request => ({
            id: request.request_id,
            title: request.request_title || 'Prayer Request',
            content: request.request_text,
            author: request.real_name || request.user_name || 'You',
            date: request.timestamp ? new Date(request.timestamp).toLocaleDateString() : 'No date',
            isPublic: request.fk_user_id === null, // If fk_user_id is null, it's public
            prayedFor: false,
            timestamp: request.timestamp,
            category: request.category_name,
            prayer_title: request.prayer_title,
            other_person: request.other_person,
            picture: request.picture,
            user_id: request.user_id,
            fk_prayer_id: request.fk_prayer_id,
            allow_comments: request.allow_comments,
            use_alias: request.use_alias
          }));
          
          console.log('📱 Parsed prayers:', userPrayers.length, 'items');
          setPrayers(userPrayers);
        } else {
          console.log('📱 No prayers found in response');
          setPrayers([]); // Set empty array if no prayers found
        }
      } else {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      // Set empty prayers array on error instead of fallback data
      setPrayers([]);
    }
  };

  const addPrayer = async () => {
    if (newPrayer.content.trim()) {
      // Set loading state
      setIsPosting(true);
      
      // Use default title if not provided
      const prayerTitle = newPrayer.title.trim() || `${currentUser?.firstName}'s Prayer Request`;
      
      const prayer = {
        id: Date.now(),
        title: prayerTitle,
        content: newPrayer.content,
        isPublic: newPrayer.isPublic,
        author: currentUser?.firstName || 'You',
        userId: currentUser?.id,
        date: new Date().toLocaleDateString(),
        prayedFor: false
      };
      
      // Save to production API first
      try {
        await savePrayerToAPI(prayer);
        
        // Refresh user prayers from API to get the latest data including request_id
        await loadUserPrayers();
        if (newPrayer.isPublic) {
          await loadCommunityPrayers();
        }
        
        // Show success animation
        setPostSuccess(true);
        
        // Clear form after short delay to show success state
        setTimeout(() => {
          setNewPrayer({ title: '', content: '', isPublic: true });
          setShowTitleInput(false);
          setPostSuccess(false);
        }, 1200);
        
      } catch (error) {
        // Even if API fails, add to local state for offline functionality
        setPrayers([prayer, ...prayers]);
        if (newPrayer.isPublic) {
          setCommunityPrayers([prayer, ...communityPrayers]);
        }
        setNewPrayer({ title: '', content: '', isPublic: true });
        setShowTitleInput(false);
        Alert.alert('Success', 'Prayer added locally (will sync when connection is restored)');
      } finally {
        // Reset loading state
        setIsPosting(false);
      }
    } else {
      Alert.alert('Error', 'Please enter your prayer request');
    }
  };

  const savePrayerToAPI = async (prayer) => {
    try {
      // Generate unique idempotency key ONLY if we don't have one (for retries)
      let idempotencyKey = currentIdempotencyKey;
      if (!idempotencyKey) {
        idempotencyKey = 'request-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        setCurrentIdempotencyKey(idempotencyKey);
        setHasShownSuccessForCurrentKey(false); // Reset success flag for new key
      }
      
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      
      const endpoint = 'https://shouldcallpaul.replit.app/createRequestAndPrayer';
      const requestPayload = {
        requestText: prayer.content,
        requestTitle: prayer.title,
        tz: timezone,
        userId: currentUser?.id,
        sendEmail: "true",
        idempotencyKey: idempotencyKey
      };
      
      // Clean debug output - endpoint and payload ONLY
      console.log('📱 MOBILE APP API CALL:');
      console.log('POST ' + endpoint);
      console.log(JSON.stringify(requestPayload, null, 2));
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + btoa('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(requestPayload)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.error === 0) {
          console.log('Prayer request saved successfully:', data.result);
          // Show success message only once per idempotency key
          if (!hasShownSuccessForCurrentKey) {
            Alert.alert('Success', 'Prayer request created and saved to your account!');
            setHasShownSuccessForCurrentKey(true);
          }
          // Clear the idempotency key on successful completion
          setCurrentIdempotencyKey(null);
          setHasShownSuccessForCurrentKey(false);
          loadCommunityPrayers(); // Refresh community prayers
        } else {

          console.log('Warning: Prayer saved locally but may not be synced to server');
        }
      } else {
        console.log('Warning: Prayer saved locally but may not be synced to server');
      }
    } catch (error) {
      console.log('Warning: Prayer saved locally but may not be synced to server');
    }
  };

  const generatePrayer = async (prayerRequest) => {
    try {
      setPrayerModal({
        visible: true,
        prayer: prayerRequest,
        generatedPrayer: '',
        loading: true
      });

      // Get prayer text from database by request ID
      try {
        const endpoint = 'https://shouldcallpaul.replit.app/getPrayerByRequestId';
        const requestPayload = {
          requestId: prayerRequest.id
        };
        
        // Clean debug output - endpoint and payload ONLY
        console.log('📱 MOBILE APP API CALL:');
        console.log('POST ' + endpoint);
        console.log(JSON.stringify(requestPayload, null, 2));
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Basic ' + btoa('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
          },
          body: JSON.stringify(requestPayload),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('data.error:', data.error);
          console.log('data.prayerText exists:', !!data.prayerText);
          console.log('data.prayerText length:', data.prayerText?.length);
          
          if (data.error === 0 && data.prayerText) {
            console.log('SUCCESS: Using database prayer text');
            setPrayerModal(prev => ({
              ...prev,
              generatedPrayer: data.prayerText,
              loading: false
            }));
            return;
          } else {
            console.log('data.error:', data.error);
            console.log('Available fields:', Object.keys(data));
          }
        } else {
        }
      } catch (error) {
      }

      // Fallback prayer if API fails
      const fallbackPrayer = `Heavenly Father, we lift up ${prayerRequest.author} to Your loving care and ask for Your blessing upon their prayer request. 

Grant ${prayerRequest.author} Your peace, guidance, and strength in this situation. May Your will be accomplished in their life according to Your perfect plan.

Through Christ our Lord. Amen.`;
      
      setPrayerModal(prev => ({
        ...prev,
        generatedPrayer: fallbackPrayer,
        loading: false
      }));

    } catch (error) {
      console.error('Error generating prayer:', error);
      setPrayerModal(prev => ({
        ...prev,
        loading: false,
        generatedPrayer: 'We apologize, but we are unable to generate a prayer at this time. Please take a moment to offer your own heartfelt prayer for this request.'
      }));
    }
  };

  const closePrayerModal = () => {
    setPrayerModal({ visible: false, prayer: null, generatedPrayer: '', loading: false });
  };

  const submitHelpForm = async () => {
    if (!helpForm.message.trim() || !helpForm.name.trim() || !helpForm.email.trim()) {
      Alert.alert('Error', 'Please fill in message, name, and email fields');
      return;
    }

    try {
      const endpoint = 'https://shouldcallpaul.replit.app/contact';
      const content = `Message: ${helpForm.message}

Contact Details:
Name: ${helpForm.name}
Email: ${helpForm.email}
Phone: ${helpForm.phone || 'Not provided'}

User ID: ${currentUser?.id || 'Not logged in'}`;

      const requestPayload = {
        subject: "Pray Over Us Contact Form Submission",
        to: "prayoverus@gmail.com",
        content: content
      };
      
      // Clean debug output - endpoint and payload ONLY
      console.log('📱 MOBILE APP API CALL:');
      console.log('POST ' + endpoint);
      console.log(JSON.stringify(requestPayload, null, 2));
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + btoa('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify(requestPayload)
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Your message has been sent successfully!');
        setHelpForm({ message: '', name: '', email: '', phone: '' });
        setCurrentScreen('home');
      } else {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again later.');
      console.log('Contact form error:', error.message);
    }
  };

  const markAsPrayed = async () => {
    const prayer = prayerModal.prayer;
    if (!prayer) return;

    try {
      const endpoint = 'https://shouldcallpaul.replit.app/prayFor';
      const requestPayload = {
        userId: currentUser?.id,
        requestId: prayer.id  // Using the request_id from the prayer feed
      };
      
      // Clean debug output - endpoint and payload ONLY
      console.log('📱 MOBILE APP API CALL:');
      console.log('POST ' + endpoint);
      console.log(JSON.stringify(requestPayload, null, 2));
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + btoa('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify(requestPayload)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.error === 0) {
          console.log('Prayer action recorded successfully in database');
        } else {
        }
      } else {
      }
    } catch (error) {
      console.log('Failed to record prayer action:', error.message);
    }

    // Always update local state regardless of API result
    setCommunityPrayers(prevPrayers =>
      prevPrayers.map(p =>
        p.id === prayer.id
          ? { ...p, prayedFor: true }
          : p
      )
    );
    
    // Close the modal
    closePrayerModal();
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ marginTop: 10, color: '#6366f1' }}>Loading...</Text>
      </View>
    );
  }

  // Show auth screens if no current user
  if (!currentUser) {
    if (authScreen === 'forgot') {
      return (
        <ForgotPasswordScreen 
          onBack={() => setAuthScreen('login')}
        />
      );
    }
    
    if (authScreen === 'reset' && resetToken) {
      return (
        <ResetPasswordScreen 
          token={resetToken}
          onSuccess={() => {
            setAuthScreen('login');
            setResetToken(null);
          }}
        />
      );
    }
    
    return (
      <LoginScreen 
        onLogin={handleLogin}
        onForgotPassword={() => setAuthScreen('forgot')}
      />
    );
  }

  if (currentScreen === 'community') {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('home')} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Community Wall</Text>
        </View>
        
        <ScrollView 
          style={styles.screenContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshingCommunity}
              onRefresh={onRefreshCommunity}
              tintColor="#6366f1"
              title="Loading prayers..."
              titleColor="#6366f1"
            />
          }
        >
          <Text style={styles.sectionTitle}>Community Prayers</Text>
          {communityPrayers.map(prayer => (
            <View key={prayer.id} style={styles.prayerCard}>
              <Text style={styles.prayerTitle}>{prayer.title}</Text>
              <Text style={styles.prayerContent}>{prayer.content}</Text>
              <View style={styles.prayerMeta}>
                <Text style={styles.prayerAuthor}>by {prayer.author}</Text>
                {prayer.category && (
                  <Text style={styles.prayerCategory}>• {prayer.category}</Text>
                )}
              </View>
              {prayer.timestamp && (
                <Text style={styles.prayerTime}>
                  {new Date(prayer.timestamp).toLocaleDateString()}
                </Text>
              )}
              <TouchableOpacity 
                style={[styles.prayButton, prayer.prayedFor && styles.prayButtonPrayed]}
                onPress={() => generatePrayer(prayer)}
                disabled={prayer.prayedFor}
              >
                <Text style={[styles.prayButtonText, prayer.prayedFor && styles.prayButtonTextPrayed]}>
                  {prayer.prayedFor ? '✅ Prayed for' : '🙏 Pray for this'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        
        <Modal
          animationType="slide"
          transparent={true}
          visible={prayerModal.visible}
          onRequestClose={closePrayerModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Prayer for: {prayerModal.prayer?.title}</Text>
                <TouchableOpacity onPress={closePrayerModal} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              
              {prayerModal.loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text style={styles.loadingText}>Generating heartfelt prayer...</Text>
                </View>
              ) : (
                <ScrollView style={styles.prayerTextContainer}>
                  <Text style={styles.generatedPrayer}>{prayerModal.generatedPrayer}</Text>
                </ScrollView>
              )}
              
              <TouchableOpacity style={styles.closeModalButton} onPress={markAsPrayed}>
                <Text style={styles.closeModalButtonText}>Amen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  if (currentScreen === 'groups') {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('home')} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prayer Groups</Text>
        </View>
        
        <ScrollView style={styles.screenContent}>
          <Text style={styles.sectionTitle}>Available Groups</Text>
          <View style={styles.groupCard}>
            <Text style={styles.groupTitle}>Family Prayer Circle</Text>
            <Text style={styles.groupMembers}>5 members</Text>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Group</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.groupCard}>
            <Text style={styles.groupTitle}>Healing Prayers</Text>
            <Text style={styles.groupMembers}>12 members</Text>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Group</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (currentScreen === 'help') {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('home')} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
        </View>
        
        <ScrollView style={styles.screenContent}>
          <View style={styles.addPrayerForm}>
            <Text style={styles.formTitle}>Contact Us</Text>
            <Text style={styles.formSubtitle}>
              Have questions or need support? Send us a message and we'll get back to you as soon as possible.
            </Text>
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Your message..."
              multiline
              numberOfLines={4}
              value={helpForm.message}
              onChangeText={(text) => setHelpForm({...helpForm, message: text})}
              data-testid="input-help-message"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Your name"
              value={helpForm.name}
              onChangeText={(text) => setHelpForm({...helpForm, name: text})}
              data-testid="input-help-name"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Your email"
              keyboardType="email-address"
              value={helpForm.email}
              onChangeText={(text) => setHelpForm({...helpForm, email: text})}
              data-testid="input-help-email"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Your phone (optional)"
              keyboardType="phone-pad"
              value={helpForm.phone}
              onChangeText={(text) => setHelpForm({...helpForm, phone: text})}
              data-testid="input-help-phone"
            />
            
            <TouchableOpacity style={styles.addButton} onPress={submitHelpForm} data-testid="button-submit-help">
              <Text style={styles.addButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (currentScreen === 'profile') {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('home')} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity 
            onPress={() => setCurrentScreen('settings')} 
            style={styles.settingsButton}
            data-testid="button-settings"
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.screenContent}>
          {/* User Profile Info */}
          <View style={styles.profileCard}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileInitials}>
                  {currentUser.firstName?.[0]}{currentUser.lastName?.[0] || ''}
                </Text>
              </View>
            </View>
            
            <Text style={styles.profileName}>
              {currentUser.firstName} {currentUser.lastName || ''}
            </Text>
            <Text style={styles.profileEmail}>{currentUser.email}</Text>
            
            <View style={styles.profileInfoSection}>
              <Text style={styles.profileInfoLabel}>Username</Text>
              <Text style={styles.profileInfoValue}>{currentUser.userName || 'Not set'}</Text>
            </View>
            
            <View style={styles.profileInfoSection}>
              <Text style={styles.profileInfoLabel}>Title</Text>
              <Text style={styles.profileInfoValue}>{currentUser.title || 'Not set'}</Text>
            </View>
            
            <View style={styles.profileInfoSection}>
              <Text style={styles.profileInfoLabel}>About</Text>
              <Text style={styles.profileInfoValue}>{currentUser.about || 'Not set'}</Text>
            </View>
          </View>

          {/* Personal Requests Section */}
          <View style={styles.personalRequestsSection}>
            <Text style={styles.sectionTitle}>Personal Requests</Text>
            {prayers.length === 0 ? (
              <Text style={styles.emptyText}>No prayer requests yet. Share one on the home feed!</Text>
            ) : (
              prayers.map((prayer) => (
                <View key={prayer.id} style={styles.prayerCard}>
                  <Text style={styles.prayerTitle}>{prayer.title}</Text>
                  <Text style={styles.prayerContent}>{prayer.content}</Text>
                  <Text style={styles.prayerTime}>
                    {prayer.date} • {prayer.isPublic ? 'Public' : 'Private'}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (currentScreen === 'settings') {
    const handleDeleteAccount = () => {
      Alert.alert(
        'Delete Account',
        'This will permanently delete your account and all associated data. This action cannot be undone. Are you absolutely sure?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const endpoint = 'https://shouldcallpaul.replit.app/deleteUser';
                const requestPayload = {
                  userId: currentUser?.id.toString()
                };
                
                console.log('📱 MOBILE APP API CALL:');
                console.log('POST ' + endpoint);
                console.log(JSON.stringify(requestPayload, null, 2));
                
                const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': 'Basic ' + btoa('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
                  },
                  body: JSON.stringify(requestPayload)
                });
                
                if (response.ok) {
                  const data = await response.json();
                  
                  if (data.error === 0) {
                    const message = data.result || 'User deleted successfully';
                    Alert.alert('Success', message, [
                      { 
                        text: 'OK', 
                        onPress: async () => {
                          await handleLogout();
                        }
                      }
                    ]);
                  } else {
                    const errorMessage = data.result || data.message || 'Failed to delete account';
                    Alert.alert('Error', errorMessage);
                  }
                } else {
                  Alert.alert('Error', 'Account deletion service unavailable');
                }
              } catch (error) {
                Alert.alert('Error', 'Network error. Please try again.');
              }
            }
          }
        ]
      );
    };

    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('profile')} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        
        <ScrollView style={styles.screenContent}>
          {/* Hidden sections - to be implemented later */}
          <View style={{ display: 'none' }}>
            {/* General Section */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>General</Text>
              <TextInput style={styles.input} placeholder="First Name" />
              <TextInput style={styles.input} placeholder="Last Name" />
              <TextInput style={styles.input} placeholder="Email" />
              <TextInput style={styles.input} placeholder="Username" />
              <TextInput style={styles.input} placeholder="Title" />
              <TextInput style={[styles.input, styles.textArea]} placeholder="About" multiline />
            </View>

            {/* Security Section */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Security</Text>
              <TouchableOpacity style={styles.settingsButton}>
                <Text style={styles.settingsButtonText}>Change Password</Text>
              </TouchableOpacity>
            </View>

            {/* Privacy Section */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Privacy</Text>
              <Text style={styles.settingsDescription}>Privacy settings will be available soon.</Text>
            </View>
          </View>

          {/* Account Section - VISIBLE */}
          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>Account</Text>
            <Text style={styles.settingsDescription}>
              Manage your account settings and data.
            </Text>
            
            {/* Hidden profile picture change - to be implemented */}
            <View style={{ display: 'none' }}>
              <TouchableOpacity style={styles.changePhotoButton}>
                <Text style={styles.changePhotoText}>Change Profile Picture</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={handleDeleteAccount}
              data-testid="button-delete-account"
            >
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* User Header */}
      <View style={styles.userHeader}>
        <Text style={styles.welcomeText}>Welcome, {currentUser.firstName}!</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.feedContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshingCommunity}
            onRefresh={onRefreshCommunity}
            tintColor="#6366f1"
          />
        }
      >
        {/* Compact Post Prayer Widget */}
        <View style={styles.compactPostWidget}>
          <Text style={styles.widgetTitle}>Share a Prayer Request</Text>
          
          {showTitleInput && (
            <TextInput
              style={styles.input}
              placeholder={`${currentUser?.firstName}'s Prayer Request`}
              value={newPrayer.title}
              onChangeText={(text) => setNewPrayer({...newPrayer, title: text})}
              editable={!isPosting}
            />
          )}
          
          <TextInput
            style={[styles.input, styles.compactTextArea]}
            placeholder="What would you like prayer for?"
            multiline
            numberOfLines={3}
            value={newPrayer.content}
            onChangeText={(text) => setNewPrayer({...newPrayer, content: text})}
            editable={!isPosting}
          />
          
          <View style={styles.postActions}>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => setShowTitleInput(!showTitleInput)}
              disabled={isPosting}
            >
              <Text style={[styles.linkButtonText, isPosting && { opacity: 0.5 }]}>
                {showTitleInput ? 'Hide' : 'Add'} custom title
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.checkbox, newPrayer.isPublic && styles.checkboxChecked]}
              onPress={() => setNewPrayer({...newPrayer, isPublic: !newPrayer.isPublic})}
              disabled={isPosting}
            >
              <Text style={[styles.checkboxText, isPosting && { opacity: 0.5 }]}>
                {newPrayer.isPublic ? '☑' : '☐'} Share publicly
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.postButton, 
              isPosting && styles.postButtonDisabled,
              postSuccess && styles.postButtonSuccess
            ]} 
            onPress={addPrayer}
            disabled={isPosting}
            activeOpacity={0.7}
          >
            {isPosting ? (
              <View style={styles.postButtonLoading}>
                <PrayerHandsLoader />
                <Text style={styles.postButtonText}>Posting...</Text>
              </View>
            ) : postSuccess ? (
              <View style={styles.postButtonLoading}>
                <Text style={styles.successCheckmark}>✓</Text>
                <Text style={styles.postButtonText}>Posted!</Text>
              </View>
            ) : (
              <Text style={styles.postButtonText}>Post Prayer</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <AnimatedButton style={styles.quickLink} onPress={() => setCurrentScreen('profile')}>
            <Text style={styles.quickLinkText}>👤 My Profile</Text>
          </AnimatedButton>
          <AnimatedButton style={styles.quickLink} onPress={() => setCurrentScreen('help')}>
            <Text style={styles.quickLinkText}>❓ Help</Text>
          </AnimatedButton>
        </View>

        {/* Community Wall Feed */}
        <Text style={styles.feedTitle}>Community Prayers</Text>
        {communityPrayers.length === 0 ? (
          <Text style={styles.emptyText}>No prayers yet. Be the first to share!</Text>
        ) : (
          communityPrayers.map((prayer) => (
            <View key={prayer.id} style={styles.prayerCard}>
              <Text style={styles.prayerTitle}>{prayer.title}</Text>
              <Text style={styles.prayerContent}>{prayer.content}</Text>
              <View style={styles.prayerMeta}>
                <Text style={styles.prayerAuthor}>{prayer.author}</Text>
                {prayer.category && (
                  <Text style={styles.prayerCategory}> · {prayer.category}</Text>
                )}
              </View>
              <Text style={styles.prayerTime}>{prayer.date}</Text>
              <AnimatedButton 
                style={[styles.prayButton, prayer.prayedFor && styles.prayButtonPrayed]} 
                onPress={() => generatePrayer(prayer)}
              >
                <Text style={[styles.prayButtonText, prayer.prayedFor && styles.prayButtonTextPrayed]}>
                  {prayer.prayedFor ? '✓ Prayed' : '🙏 Pray for this'}
                </Text>
              </AnimatedButton>
            </View>
          ))
        )}
      </ScrollView>

      {/* Prayer Modal */}
      <Modal
        visible={prayerModal.visible}
        transparent={true}
        animationType="slide"
        onRequestClose={closePrayerModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Prayer for {prayerModal.prayer?.author}</Text>
              <TouchableOpacity onPress={closePrayerModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {prayerModal.loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Generating prayer...</Text>
              </View>
            ) : (
              <>
                <ScrollView style={styles.prayerTextContainer}>
                  <Text style={styles.generatedPrayer}>{prayerModal.generatedPrayer}</Text>
                </ScrollView>
                <TouchableOpacity style={styles.closeModalButton} onPress={markAsPrayed}>
                  <Text style={styles.closeModalButtonText}>Amen 🙏</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#6366f1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 40,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e293b',
  },
  cardText: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  tapHint: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginTop: 8,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 15,
  },
  backText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  screenContent: {
    flex: 1,
    padding: 20,
  },
  addPrayerForm: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1e293b',
  },
  formSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxChecked: {
    color: '#6366f1',
  },
  checkboxText: {
    fontSize: 16,
    color: '#64748b',
  },
  addButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1e293b',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  prayerCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  prayerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e293b',
  },
  prayerContent: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 8,
  },
  prayerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  prayerAuthor: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  prayerCategory: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 5,
  },
  prayerTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 10,
  },
  prayButton: {
    backgroundColor: '#f0f9ff',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  prayButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  groupCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1e293b',
  },
  groupMembers: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 10,
  },
  joinButton: {
    backgroundColor: '#10b981',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  prayButtonPrayed: {
    backgroundColor: '#dcfce7',
    borderColor: '#10b981',
  },
  prayButtonTextPrayed: {
    color: '#10b981',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontStyle: 'italic',
  },
  prayerTextContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  generatedPrayer: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    textAlign: 'left',
  },
  closeModalButton: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Profile and Settings styles
  settingsButton: {
    position: 'absolute',
    right: 20,
    top: 60,
    padding: 10,
  },
  settingsIcon: {
    fontSize: 24,
  },
  profileCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImageContainer: {
    marginBottom: 20,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
  },
  profileInfoSection: {
    width: '100%',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  profileInfoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  profileInfoValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  settingsSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  settingsDescription: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 24,
  },
  settingsButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  changePhotoButton: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  changePhotoText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // New Facebook-style feed styles
  feedContainer: {
    flex: 1,
  },
  compactPostWidget: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  compactTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkButton: {
    padding: 8,
  },
  linkButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  postButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    transition: 'all 0.3s ease',
  },
  postButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
  postButtonSuccess: {
    backgroundColor: '#10b981',
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  postButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  prayerHandsAnimation: {
    fontSize: 20,
    animation: 'pulse 1s infinite',
  },
  successCheckmark: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  quickLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  quickLink: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickLinkText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginHorizontal: 15,
    marginBottom: 10,
  },
  personalRequestsSection: {
    marginTop: 20,
  },
});

// Register the main component
AppRegistry.registerComponent('main', () => App);
export default App;