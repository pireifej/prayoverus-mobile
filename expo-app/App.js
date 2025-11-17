import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, AppRegistry, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, RefreshControl, Animated, Linking, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen, ForgotPasswordScreen, ResetPasswordScreen } from './UserAuth';
import NotificationService from './NotificationService';

// Use localStorage-like persistence for web and AsyncStorage for mobile  
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SimpleStorage {
  constructor() {
    this.isWeb = Platform.OS === 'web';
  }

  async setItem(key, value) {
    if (this.isWeb) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } else {
      await AsyncStorage.setItem(key, value);
    }
  }

  async getItem(key) {
    if (this.isWeb) {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } else {
      return await AsyncStorage.getItem(key);
    }
    return null;
  }

  async removeItem(key) {
    if (this.isWeb) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } else {
      await AsyncStorage.removeItem(key);
    }
  }
}

const storage = new SimpleStorage();

// Component to render HTML with proper formatting in React Native
function HtmlText({ html, style }) {
  if (!html) return null;
  
  // Split by HTML tags and process each part
  const parts = [];
  let currentIndex = 0;
  const regex = /<(\/?)(\w+)([^>]*)>/g;
  let match;
  let key = 0;
  
  const tagStack = [];
  let lastIndex = 0;
  
  // Parse HTML and create Text components with proper styling
  const elements = [];
  let tempHtml = html;
  
  // Replace <br> with newlines
  tempHtml = tempHtml.replace(/<br\s*\/?>/gi, '\n');
  
  // Split by strong tags and process
  const strongRegex = /<strong>(.*?)<\/strong>/gi;
  const splits = [];
  let lastIdx = 0;
  
  tempHtml.replace(strongRegex, (match, content, offset) => {
    // Add text before the tag
    if (offset > lastIdx) {
      splits.push({ text: tempHtml.substring(lastIdx, offset), bold: false });
    }
    // Add bold text
    splits.push({ text: content, bold: true });
    lastIdx = offset + match.length;
  });
  
  // Add remaining text
  if (lastIdx < tempHtml.length) {
    splits.push({ text: tempHtml.substring(lastIdx), bold: false });
  }
  
  // Decode HTML entities
  const decodeHtml = (text) => {
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
  };
  
  return (
    <Text style={style}>
      {splits.map((part, index) => (
        <Text key={index} style={part.bold ? { fontWeight: 'bold' } : {}}>
          {decodeHtml(part.text)}
        </Text>
      ))}
    </Text>
  );
}

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
  const [expandedPrayers, setExpandedPrayers] = useState({});
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentIdempotencyKey, setCurrentIdempotencyKey] = useState(null);
  const [hasShownSuccessForCurrentKey, setHasShownSuccessForCurrentKey] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [authScreen, setAuthScreen] = useState('login'); // 'login', 'forgot', 'reset'
  const [resetToken, setResetToken] = useState(null);
  const [hideAlreadyPrayed, setHideAlreadyPrayed] = useState(false);
  
  // Rosary state
  const [rosaryScreen, setRosaryScreen] = useState('lobby'); // 'lobby', 'session'
  const [rosaryRole, setRosaryRole] = useState(null); // 'host' or 'participant'
  const [rosarySession, setRosarySession] = useState(null);

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
            use_alias: request.use_alias,
            prayer_count: request.prayer_count || 0,
            prayed_by_names: request.prayed_by_names || [],
            user_has_prayed: request.user_has_prayed || false
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
    
    // Set up push notifications for the logged-in user
    if (userData && userData.id) {
      console.log('Setting up push notifications for user:', userData.id);
      
      // Set up notifications in the background (non-blocking)
      NotificationService.setupNotifications(userData.id)
        .then(success => {
          if (success) {
            console.log('✅ Push notifications configured successfully');
          } else {
            console.log('⚠️ Push notifications setup skipped or failed');
          }
        })
        .catch(error => {
          console.error('Error setting up push notifications:', error);
        });
    }
  };

  // Handle user logout and clear storage
  const handleLogout = async () => {
    console.log('🚪 Logging out user:', currentUser?.firstName);
    
    // Clean up notification listeners
    NotificationService.cleanup();
    
    await clearUserFromStorage();
    setCurrentUser(null);
    setCurrentScreen('home');
    
    console.log('✅ Logout complete - redirecting to Sign In');
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

  const togglePrayerNames = (prayerId) => {
    setExpandedPrayers(prev => ({
      ...prev,
      [prayerId]: !prev[prayerId]
    }));
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

    // Always update local state with immediate GUI feedback
    setCommunityPrayers(prevPrayers =>
      prevPrayers.map(p =>
        p.id === prayer.id
          ? { 
              ...p, 
              prayedFor: true,
              user_has_prayed: true,
              prayer_count: (p.prayer_count || 0) + 1,
              prayed_by_names: [...(p.prayed_by_names || []), currentUser?.firstName || currentUser?.email || 'You']
            }
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
                  <HtmlText html={prayerModal.generatedPrayer} style={styles.generatedPrayer} />
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
              <Image 
                source={{ uri: `https://shouldcallpaul.replit.app/profile_images/${currentUser.picture}` }}
                style={styles.profileImage}
              />
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

          {/* Help & Support Button */}
          <TouchableOpacity 
            style={styles.helpSupportButton} 
            onPress={() => setCurrentScreen('help')}
            data-testid="button-help-support"
          >
            <Text style={styles.helpSupportButtonText}>❓ Help & Support</Text>
          </TouchableOpacity>

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

          {/* Test Notification Button - Hidden for now */}
          {false && (
            <TouchableOpacity 
              style={styles.testNotificationButton} 
              onPress={async () => {
                try {
                  await NotificationService.scheduleLocalNotification(
                    '🙏 New Prayer Request',
                    'Someone in your community needs prayers',
                    { type: 'test', prayerId: '123' }
                  );
                  Alert.alert('Success', 'Test notification sent! Check your notification tray.');
                } catch (error) {
                  Alert.alert('Error', 'Failed to send test notification: ' + error.message);
                }
              }}
              data-testid="button-test-notification"
            >
              <Text style={styles.testNotificationButtonText}>🔔 Test Notification</Text>
            </TouchableOpacity>
          )}
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

  // ROSARY SCREENS
  if (currentScreen === 'rosary') {
    // Mock data for development
    const mockRosaryData = {
      sessionId: 'ABC123',
      hostUserId: currentUser?.id,
      participants: [
        { userId: currentUser?.id, name: currentUser?.firstName || 'You', picture: currentUser?.picture, readingOrder: 1, isHost: true },
        { userId: 2, name: 'Sarah', picture: 'defaultUser.png', readingOrder: 2, isHost: false },
        { userId: 3, name: 'Mike', picture: 'defaultUser.png', readingOrder: 3, isHost: false },
        { userId: 4, name: 'Mary', picture: 'defaultUser.png', readingOrder: 4, isHost: false },
        { userId: 5, name: 'John', picture: 'defaultUser.png', readingOrder: 5, isHost: false },
      ],
      currentBead: 12,
      currentPrayer: 'Hail Mary (2nd decade)',
      currentPrayerText: 'Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.',
      currentReader: { userId: 2, name: 'Sarah' },
      nextReader: { userId: 3, name: 'Mike' },
      rosaryType: 'joyful',
      mysteryName: 'The Annunciation'
    };

    // Rosary Lobby Screen (Create/Join)
    if (rosaryScreen === 'lobby') {
      return (
        <View style={styles.container}>
          <StatusBar style="auto" />
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setCurrentScreen('home')} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Live Rosary</Text>
          </View>

          <ScrollView style={styles.screenContent}>
            <View style={styles.rosaryLobbyContainer}>
              <Text style={styles.rosaryLobbyTitle}>📿 Pray Together</Text>
              <Text style={styles.rosaryLobbySubtitle}>
                Join others in praying the Rosary in real-time
              </Text>

              <View style={styles.rosaryOptionCard}>
                <Text style={styles.rosaryOptionTitle}>Host a Session</Text>
                <Text style={styles.rosaryOptionDescription}>
                  Start a new Rosary session and invite others to join
                </Text>
                <TouchableOpacity 
                  style={styles.rosaryPrimaryButton}
                  onPress={() => {
                    setRosaryRole('host');
                    setRosarySession(mockRosaryData);
                    setRosaryScreen('session');
                  }}
                  data-testid="button-host-rosary"
                >
                  <Text style={styles.rosaryPrimaryButtonText}>Host Session</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.rosaryOptionCard}>
                <Text style={styles.rosaryOptionTitle}>Join a Session</Text>
                <Text style={styles.rosaryOptionDescription}>
                  Enter a session code to join an active Rosary
                </Text>
                <TextInput
                  style={styles.rosaryInput}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  data-testid="input-join-code"
                />
                <TouchableOpacity 
                  style={styles.rosarySecondaryButton}
                  onPress={() => {
                    setRosaryRole('participant');
                    setRosarySession(mockRosaryData);
                    setRosaryScreen('session');
                  }}
                  data-testid="button-join-rosary"
                >
                  <Text style={styles.rosarySecondaryButtonText}>Join Session</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      );
    }

    // Live Rosary Session Screen
    if (rosaryScreen === 'session' && rosarySession) {
      const session = rosarySession;
      const isHost = rosaryRole === 'host';
      
      return (
        <View style={styles.container}>
          <StatusBar style="auto" />
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => {
                Alert.alert(
                  'Leave Session?',
                  'Are you sure you want to leave this Rosary session?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Leave', 
                      style: 'destructive',
                      onPress: () => {
                        setRosaryScreen('lobby');
                        setRosarySession(null);
                        setRosaryRole(null);
                      }
                    }
                  ]
                );
              }} 
              style={styles.backButton}
            >
              <Text style={styles.backText}>← Leave</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Live Rosary</Text>
          </View>

          <ScrollView style={styles.screenContent}>
            {/* Session Info */}
            <View style={styles.rosarySessionHeader}>
              <Text style={styles.rosarySessionTitle}>
                {isHost ? '⭐ Hosting' : '📿 Participating'} • {session.participants.length} people
              </Text>
              <Text style={styles.rosarySessionCode}>Code: {session.sessionId}</Text>
            </View>

            {/* Rosary Visual */}
            <View style={styles.rosaryVisualContainer}>
              <Text style={styles.rosaryMysteryTitle}>{session.mysteryName}</Text>
              <View style={styles.rosaryBeadsRow}>
                {[...Array(10)].map((_, i) => {
                  const beadNumber = i + 10;
                  const isCurrent = beadNumber === session.currentBead;
                  const isCompleted = beadNumber < session.currentBead;
                  
                  return (
                    <View 
                      key={i} 
                      style={[
                        styles.rosaryBead,
                        isCurrent && styles.rosaryBeadCurrent,
                        isCompleted && styles.rosaryBeadCompleted
                      ]}
                    >
                      {isCurrent && <View style={styles.rosaryBeadPulse} />}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Current Prayer */}
            <View style={styles.rosaryPrayerSection}>
              <Text style={styles.rosaryPrayerTitle}>{session.currentPrayer}</Text>
              <Text style={styles.rosaryPrayerText}>{session.currentPrayerText}</Text>
            </View>

            {/* Reader Info */}
            <View style={styles.rosaryReaderSection}>
              <View style={styles.rosaryCurrentReader}>
                <Text style={styles.rosaryReaderLabel}>READING NOW</Text>
                <Text style={styles.rosaryReaderName}>
                  {session.currentReader.name} {session.currentReader.userId === currentUser?.id && '(You)'}
                </Text>
              </View>
              <View style={styles.rosaryNextReader}>
                <Text style={styles.rosaryReaderLabel}>NEXT</Text>
                <Text style={styles.rosaryNextReaderName}>{session.nextReader.name}</Text>
              </View>
            </View>

            {/* Participants List */}
            <View style={styles.rosaryParticipantsSection}>
              <Text style={styles.rosaryParticipantsTitle}>Participants ({session.participants.length})</Text>
              {session.participants.map((p) => (
                <View key={p.userId} style={styles.rosaryParticipantItem}>
                  <Image 
                    source={{ uri: `https://shouldcallpaul.replit.app/profile_images/${p.picture}` }}
                    style={styles.rosaryParticipantPicture}
                  />
                  <Text style={styles.rosaryParticipantName}>
                    {p.name} {p.isHost && '⭐'} {p.userId === session.currentReader.userId && '🟢'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Host Controls */}
            {isHost && (
              <View style={styles.rosaryHostControls}>
                <TouchableOpacity 
                  style={styles.rosaryNextPrayerButton}
                  onPress={() => {
                    Alert.alert('Next Prayer', 'In production, this would advance to the next bead and update all participants in real-time via WebSocket.');
                  }}
                  data-testid="button-next-prayer"
                >
                  <Text style={styles.rosaryNextPrayerButtonText}>Next Prayer →</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.rosaryEndSessionButton}
                  onPress={() => {
                    Alert.alert(
                      'End Session?',
                      'This will end the Rosary session for all participants.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'End Session', 
                          style: 'destructive',
                          onPress: () => {
                            setRosaryScreen('lobby');
                            setRosarySession(null);
                            setRosaryRole(null);
                            Alert.alert('Session Ended', 'Thank you for praying!');
                          }
                        }
                      ]
                    );
                  }}
                  data-testid="button-end-session"
                >
                  <Text style={styles.rosaryEndSessionButtonText}>End Session</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* User Header */}
      <View style={styles.userHeader}>
        <TouchableOpacity onPress={() => setCurrentScreen('profile')} style={styles.profileLink} data-testid="link-profile">
          <Image 
            source={{ uri: `https://shouldcallpaul.replit.app/profile_images/${currentUser.picture}` }}
            style={styles.headerProfilePicture}
          />
          <Text style={styles.profileLinkText}>{currentUser.firstName}</Text>
        </TouchableOpacity>
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

        {/* Community Wall Feed */}
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>Community Prayers</Text>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setHideAlreadyPrayed(!hideAlreadyPrayed)}
            data-testid="button-filter-prayed"
          >
            <Text style={styles.filterButtonText}>
              {hideAlreadyPrayed ? 'Show All' : 'Hide Prayed ✓'}
            </Text>
          </TouchableOpacity>
        </View>
        {(() => {
          const filteredPrayers = communityPrayers.filter(prayer => !hideAlreadyPrayed || !prayer.user_has_prayed);
          
          if (communityPrayers.length === 0) {
            return <Text style={styles.emptyText}>No prayers yet. Be the first to share!</Text>;
          }
          
          if (filteredPrayers.length === 0) {
            return <Text style={styles.emptyText}>All caught up! 🙏 Tap 'Show All' to review prayed requests.</Text>;
          }
          
          return filteredPrayers.map((prayer) => (
            <View key={prayer.id} style={styles.prayerCardContainer}>
              {/* Prayer Count Badge */}
              {prayer.prayer_count > 0 && (
                <TouchableOpacity 
                  style={styles.prayerCountBadge}
                  onPress={() => togglePrayerNames(prayer.id)}
                  data-testid={`badge-prayer-count-${prayer.id}`}
                >
                  <Text style={styles.prayerCountText}>
                    {prayer.prayer_count} {prayer.prayer_count === 1 ? 'person' : 'people'} prayed
                  </Text>
                  <Text style={styles.expandIcon}>
                    {expandedPrayers[prayer.id] ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>
              )}
              
              {/* Expandable Names List */}
              {expandedPrayers[prayer.id] && prayer.prayed_by_names && prayer.prayed_by_names.length > 0 && (
                <View style={styles.prayerNamesList}>
                  <Text style={styles.prayerNamesText}>
                    {prayer.prayed_by_names.join(', ')}
                  </Text>
                </View>
              )}

              <View style={styles.communityPrayerCard}>
                <Text style={styles.prayerTitle}>{prayer.title}</Text>
                <Text style={styles.prayerContent}>{prayer.content}</Text>
                <View style={styles.prayerMeta}>
                  <Text style={styles.prayerAuthor}>{prayer.author}</Text>
                  {prayer.category && (
                    <Text style={styles.prayerCategory}> · {prayer.category}</Text>
                  )}
                </View>
                <Text style={styles.prayerTime}>{prayer.date}</Text>
                <View style={styles.prayButtonContainer}>
                  <AnimatedButton 
                    style={[
                      styles.prayButton, 
                      prayer.user_has_prayed && styles.prayButtonUserPrayed
                    ]} 
                    onPress={() => generatePrayer(prayer)}
                    data-testid={`button-pray-${prayer.id}`}
                  >
                    <Text style={[
                      styles.prayButtonText, 
                      prayer.user_has_prayed && styles.prayButtonTextUserPrayed
                    ]}>
                      {prayer.user_has_prayed ? '✓ You Prayed' : '🙏 Pray for this'}
                    </Text>
                  </AnimatedButton>
                </View>
              </View>
            </View>
          ));
        })()}
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
                  <HtmlText html={prayerModal.generatedPrayer} style={styles.generatedPrayer} />
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
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  headerProfilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  profileLinkText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
    textDecorationLine: 'underline',
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
    paddingVertical: 20,
    paddingHorizontal: 0,
    backgroundColor: '#f3f4f6',
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
  communityPrayerCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 0,
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
  prayerCardContainer: {
    marginBottom: 24,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  prayerCountBadge: {
    backgroundColor: '#f0f4ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#dbeafe',
  },
  prayerCountText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 10,
    color: '#3b82f6',
    marginLeft: 5,
  },
  prayerNamesList: {
    backgroundColor: '#f0f9ff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#dbeafe',
  },
  prayerNamesText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  prayButtonContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  prayButton: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  prayButtonUserPrayed: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  prayButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  prayButtonTextUserPrayed: {
    color: '#22c55e',
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
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e2e8f0',
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
  testNotificationButton: {
    backgroundColor: '#10b981',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  testNotificationButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  helpSupportButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  helpSupportButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 10,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginHorizontal: 0,
    marginBottom: 0,
  },
  filterButton: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
  },
  personalRequestsSection: {
    marginTop: 20,
  },
  // Rosary Styles
  rosaryButton: {
    backgroundColor: '#8b5cf6',
    marginHorizontal: 15,
    marginVertical: 15,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  rosaryButtonIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  rosaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rosaryLobbyContainer: {
    padding: 15,
  },
  rosaryLobbyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 10,
  },
  rosaryLobbySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
  },
  rosaryOptionCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  rosaryOptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  rosaryOptionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 15,
  },
  rosaryInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f8fafc',
  },
  rosaryPrimaryButton: {
    backgroundColor: '#8b5cf6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  rosaryPrimaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rosarySecondaryButton: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  rosarySecondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rosarySessionHeader: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rosarySessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  rosarySessionCode: {
    fontSize: 14,
    color: '#64748b',
  },
  rosaryVisualContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  rosaryMysteryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
    marginBottom: 15,
    textAlign: 'center',
  },
  rosaryBeadsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  rosaryBead: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rosaryBeadCurrent: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  rosaryBeadCompleted: {
    backgroundColor: '#94a3b8',
    borderColor: '#64748b',
  },
  rosaryBeadPulse: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10b981',
    opacity: 0.3,
  },
  rosaryPrayerSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
  },
  rosaryPrayerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  rosaryPrayerText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
  },
  rosaryReaderSection: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rosaryCurrentReader: {
    flex: 1,
    paddingRight: 10,
  },
  rosaryNextReader: {
    flex: 1,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
  },
  rosaryReaderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 5,
  },
  rosaryReaderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  rosaryNextReaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  rosaryParticipantsSection: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
  },
  rosaryParticipantsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  rosaryParticipantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rosaryParticipantPicture: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    marginRight: 10,
  },
  rosaryParticipantName: {
    fontSize: 14,
    color: '#475569',
  },
  rosaryHostControls: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
  },
  rosaryNextPrayerButton: {
    backgroundColor: '#8b5cf6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  rosaryNextPrayerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rosaryEndSessionButton: {
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  rosaryEndSessionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// Register the main component
AppRegistry.registerComponent('main', () => App);
export default App;