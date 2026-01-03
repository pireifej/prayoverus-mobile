import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, AppRegistry, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, RefreshControl, Animated, Linking, Image, Vibration, Share, Clipboard, Pressable, TouchableWithoutFeedback, PanResponder, KeyboardAvoidingView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { LoginScreen, ForgotPasswordScreen, ResetPasswordScreen } from './UserAuth';
import NotificationService from './NotificationService';
import PrayerDetailScreen from './PrayerDetailScreen';
import { Buffer } from 'buffer';

// AdMob - conditionally import to support Expo Go (where native modules aren't available)
let mobileAds, BannerAd, BannerAdSize, TestIds, InterstitialAd, AdEventType;
let isAdMobAvailable = false;

try {
  const adMobModule = require('react-native-google-mobile-ads');
  mobileAds = adMobModule.default;
  BannerAd = adMobModule.BannerAd;
  BannerAdSize = adMobModule.BannerAdSize;
  TestIds = adMobModule.TestIds;
  InterstitialAd = adMobModule.InterstitialAd;
  AdEventType = adMobModule.AdEventType;
  isAdMobAvailable = true;
} catch (e) {
  console.log('AdMob not available (running in Expo Go)');
}

// AdMob Banner Ad Unit ID - use test ID in development
const BANNER_AD_UNIT_ID = isAdMobAvailable && TestIds 
  ? (__DEV__ ? TestIds.BANNER : 'ca-app-pub-3440306279423513/4277741998')
  : null;

// AdMob Interstitial Ad Unit ID - use test ID in development, production ID in release
const INTERSTITIAL_AD_UNIT_ID = isAdMobAvailable && TestIds 
  ? (__DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-3440306279423513/9994022974')
  : null;

// Use localStorage-like persistence for web and AsyncStorage for mobile  
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base64 encoding that works in both web and React Native
const base64Encode = (str) => {
  if (typeof btoa !== 'undefined') {
    // Web environment
    return btoa(str);
  } else {
    // React Native environment
    return Buffer.from(str, 'utf-8').toString('base64');
  }
};

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
    <Text style={style} selectable={true}>
      {splits.map((part, index) => (
        <Text key={index} style={part.bold ? { fontWeight: 'bold' } : {}}>
          {decodeHtml(part.text)}
        </Text>
      ))}
    </Text>
  );
}

// Helper function to format relative time (e.g., "5 minutes ago", "4 hours ago")
function getRelativeTime(dateString) {
  if (!dateString) return '';
  
  // Parse different date formats
  let date;
  
  // Check if it's already a relative format like "2 hours ago"
  if (dateString.includes('ago') || dateString.includes('just now')) {
    return dateString;
  }
  
  // Try parsing as a date
  if (dateString.includes('/')) {
    // Format: MM/DD/YYYY or similar
    const parts = dateString.split('/');
    if (parts.length === 3) {
      date = new Date(parts[2], parts[0] - 1, parts[1]);
    }
  } else if (dateString.includes('-')) {
    // Format: YYYY-MM-DD
    date = new Date(dateString);
  } else {
    // Try natural language like "December 31, 2025"
    date = new Date(dateString);
  }
  
  if (!date || isNaN(date.getTime())) {
    return dateString; // Return original if parsing failed
  }
  
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    // Return original date for older dates
    return dateString;
  }
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

// Helper function for base64 encoding (used by PrayerOptionsMenu)
const base64EncodeForMenu = (str) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let i = 0; i < str.length; i += 3) {
    const chr1 = str.charCodeAt(i);
    const chr2 = str.charCodeAt(i + 1);
    const chr3 = str.charCodeAt(i + 2);
    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    const enc3 = isNaN(chr2) ? 64 : ((chr2 & 15) << 2) | (chr3 >> 6);
    const enc4 = isNaN(chr3) ? 64 : chr3 & 63;
    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }
  return output;
};

// Prayer Options Menu Component - Three dots menu for edit/delete/share
function PrayerOptionsMenu({ prayer, currentUserId, onEdit, onDelete, onShare, isProfileSection = false }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [isCopyingPrayer, setIsCopyingPrayer] = useState(false);
  
  // Check if current user owns this prayer
  const isOwner = prayer.user_id && currentUserId && 
    (prayer.user_id.toString() === currentUserId.toString());
  
  const handleShare = async () => {
    setMenuVisible(false);
    const shareUrl = `https://prayoverus.com/index.html?requestId=${prayer.id}`;
    
    // Directly open native share sheet
    try {
      await Share.share({
        message: `🙏 Please pray for this intention:\n\n${shareUrl}`,
        url: shareUrl, // iOS uses this URL directly
        title: 'Share Prayer Request',
      });
    } catch (error) {
      // User cancelled share - this is normal, no need to show error
      if (error.message !== 'User did not share') {
        console.log('Share error:', error);
      }
    }
  };
  
  const handleCopyRequestText = () => {
    setMenuVisible(false);
    const textToCopy = prayer.title 
      ? `${prayer.title}\n\n${prayer.content}` 
      : prayer.content;
    Clipboard.setString(textToCopy);
    Alert.alert('Copied', 'Request text copied to clipboard');
  };
  
  const handleCopyPrayerText = async () => {
    setIsCopyingPrayer(true);
    try {
      const endpoint = 'https://shouldcallpaul.replit.app/getPrayerByRequestId';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + base64EncodeForMenu('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify({ requestId: prayer.id }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.error === 0 && data.prayerText) {
          // Strip HTML tags from prayer text
          const plainText = data.prayerText.replace(/<[^>]*>/g, '');
          Clipboard.setString(plainText);
          setMenuVisible(false);
          Alert.alert('Copied', 'Prayer text copied to clipboard');
        } else {
          setMenuVisible(false);
          Alert.alert('Error', 'Could not fetch prayer text');
        }
      } else {
        setMenuVisible(false);
        Alert.alert('Error', 'Could not fetch prayer text');
      }
    } catch (error) {
      console.log('Error fetching prayer text:', error);
      setMenuVisible(false);
      Alert.alert('Error', 'Could not fetch prayer text');
    } finally {
      setIsCopyingPrayer(false);
    }
  };
  
  const handleEdit = () => {
    setMenuVisible(false);
    if (onEdit) onEdit(prayer);
  };
  
  const handleDelete = () => {
    setMenuVisible(false);
    setDeleteConfirmVisible(true);
  };
  
  const confirmDelete = () => {
    setDeleteConfirmVisible(false);
    if (onDelete) onDelete(prayer);
  };
  
  return (
    <View style={optionsMenuStyles.container}>
      <TouchableOpacity 
        style={optionsMenuStyles.menuButton}
        onPress={() => setMenuVisible(true)}
        data-testid={`button-options-${prayer.id}`}
      >
        <Text style={optionsMenuStyles.menuDots}>⋮</Text>
      </TouchableOpacity>
      
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={optionsMenuStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={optionsMenuStyles.menuContainer}>
            <View style={optionsMenuStyles.menuHeader}>
              <Text style={optionsMenuStyles.menuTitle}>Options</Text>
            </View>
            
            {/* Share - Always visible */}
            <TouchableOpacity 
              style={optionsMenuStyles.menuItem}
              onPress={handleShare}
              data-testid={`button-share-${prayer.id}`}
            >
              <Text style={optionsMenuStyles.menuIcon}>🔗</Text>
              <Text style={optionsMenuStyles.menuItemText}>Share Prayer</Text>
            </TouchableOpacity>
            
            {/* Copy Request Text - Always visible */}
            <TouchableOpacity 
              style={optionsMenuStyles.menuItem}
              onPress={handleCopyRequestText}
              data-testid={`button-copy-request-${prayer.id}`}
            >
              <Text style={optionsMenuStyles.menuIcon}>📋</Text>
              <Text style={optionsMenuStyles.menuItemText}>Copy Request Text</Text>
            </TouchableOpacity>
            
            {/* Copy Prayer Text - Always visible */}
            <TouchableOpacity 
              style={optionsMenuStyles.menuItem}
              onPress={handleCopyPrayerText}
              disabled={isCopyingPrayer}
              data-testid={`button-copy-prayer-${prayer.id}`}
            >
              <Text style={optionsMenuStyles.menuIcon}>{isCopyingPrayer ? '⏳' : '🙏'}</Text>
              <Text style={optionsMenuStyles.menuItemText}>
                {isCopyingPrayer ? 'Loading...' : 'Copy Prayer Text'}
              </Text>
            </TouchableOpacity>
            
            {/* Edit - Owner only */}
            {isOwner && (
              <TouchableOpacity 
                style={optionsMenuStyles.menuItem}
                onPress={handleEdit}
                data-testid={`button-edit-${prayer.id}`}
              >
                <Text style={optionsMenuStyles.menuIcon}>✏️</Text>
                <Text style={optionsMenuStyles.menuItemText}>Edit</Text>
              </TouchableOpacity>
            )}
            
            {/* Delete - Owner only */}
            {isOwner && (
              <TouchableOpacity 
                style={[optionsMenuStyles.menuItem, optionsMenuStyles.menuItemDanger]}
                onPress={handleDelete}
                data-testid={`button-delete-${prayer.id}`}
              >
                <Text style={optionsMenuStyles.menuIcon}>🗑️</Text>
                <Text style={[optionsMenuStyles.menuItemText, optionsMenuStyles.menuItemTextDanger]}>Delete</Text>
              </TouchableOpacity>
            )}
            
            {/* Cancel */}
            <TouchableOpacity 
              style={[optionsMenuStyles.menuItem, optionsMenuStyles.menuItemCancel]}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={optionsMenuStyles.menuItemTextCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Custom Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={optionsMenuStyles.modalOverlay}>
          <View style={optionsMenuStyles.deleteConfirmContainer}>
            <Text style={optionsMenuStyles.deleteConfirmIcon}>🗑️</Text>
            <Text style={optionsMenuStyles.deleteConfirmTitle}>Delete Prayer Request</Text>
            <Text style={optionsMenuStyles.deleteConfirmMessage}>
              Are you sure you want to delete this prayer request? This cannot be undone.
            </Text>
            <View style={optionsMenuStyles.deleteConfirmButtons}>
              <TouchableOpacity 
                style={optionsMenuStyles.cancelButton}
                onPress={() => setDeleteConfirmVisible(false)}
              >
                <Text style={optionsMenuStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={optionsMenuStyles.deleteButton}
                onPress={confirmDelete}
              >
                <Text style={optionsMenuStyles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Styles for the options menu
const optionsMenuStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDots: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '80%',
    maxWidth: 300,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  menuHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuItemTextDanger: {
    color: '#dc3545',
  },
  menuItemCancel: {
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    borderBottomWidth: 0,
  },
  menuItemTextCancel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    width: '100%',
  },
  // Delete confirmation modal styles
  deleteConfirmContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '85%',
    maxWidth: 340,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  deleteConfirmIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  deleteConfirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteConfirmMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#dc3545',
    borderWidth: 2,
    borderColor: '#dc3545',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [prayers, setPrayers] = useState([]);
  const [communityPrayers, setCommunityPrayers] = useState([]);
  const [newPrayer, setNewPrayer] = useState({ title: '', content: '', isPublic: true });
  const [prayerImage, setPrayerImage] = useState(null);
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
  const [showChurchOnly, setShowChurchOnly] = useState(false);
  
  // AdMob interstitial state
  const [prayerCount, setPrayerCount] = useState(0);
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);
  const interstitialRef = useRef(null);
  
  // Track if prayer modal was opened from detail view (to return after Amen)
  const returnToDetailRef = useRef(null);
  
  // Ref to access latest communityPrayers in callbacks (avoids stale closure)
  const communityPrayersRef = useRef(communityPrayers);
  
  // Rosary state
  const [rosaryScreen, setRosaryScreen] = useState('lobby'); // 'lobby', 'session'
  const [rosaryRole, setRosaryRole] = useState(null); // 'host' or 'participant'
  const [rosarySession, setRosarySession] = useState(null);
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    title: '',
    about: '',
    churchId: null,
    churchName: ''
  });
  const [churches, setChurches] = useState([]);
  const [showChurchPicker, setShowChurchPicker] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  
  // Edit Prayer Modal state
  const [editPrayerModal, setEditPrayerModal] = useState({
    visible: false,
    prayer: null,
    title: '',
    content: '',
    isLoading: false
  });
  
  // Deep link pending prayer ID (to open after prayers load)
  const [pendingDeepLinkPrayerId, setPendingDeepLinkPrayerId] = useState(null);
  // Store initial deep link URL to process after auth check completes
  const [pendingInitialUrl, setPendingInitialUrl] = useState(null);
  
  // Prayer Detail View Modal state (Instagram-style full-screen view) - DEPRECATED, using PrayerDetailScreen now
  const [detailModal, setDetailModal] = useState({
    visible: false,
    prayer: null,
    prayerIndex: -1
  });
  const detailModalSlideAnim = useRef(new Animated.Value(1000)).current;
  const detailModalOpacityAnim = useRef(new Animated.Value(0)).current;
  const detailSwipeAnim = useRef(new Animated.Value(0)).current;
  
  // NEW: Prayer Detail Screen state (replaces modal)
  const [showDetailScreen, setShowDetailScreen] = useState(false);
  const [detailScreenProps, setDetailScreenProps] = useState({
    requestId: null,
    prayerIds: [],
    currentIndex: 0
  });
  
  // Detail view generated prayer state
  const [detailGeneratedPrayer, setDetailGeneratedPrayer] = useState({
    text: '',
    loading: false,
    collapsed: true
  });
  
  // "Prayed!" swipe confirmation animation
  const [showSwipePrayedConfirmation, setShowSwipePrayedConfirmation] = useState(false);
  const swipePrayedAnim = useRef(new Animated.Value(0)).current;
  
  // Prayer celebration animation state (BIG FIREWORKS!)
  const [showPrayerAnimation, setShowPrayerAnimation] = useState(false);
  const confettiCount = 40; // Way more confetti!
  const confettiAnims = useRef([...Array(40)].map(() => new Animated.Value(0))).current;
  const celebrationEmojis = ['🎉', '🎊', '⭐', '💫', '✨', '🌟', '🎆', '🎇', '💝', '🙏'];
  
  // Modal slide animation
  const modalSlideAnim = useRef(new Animated.Value(1000)).current; // Start off-screen
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  
  // Sound effect
  const [sound, setSound] = useState(null);

  // Configure audio mode for the app
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.log('Could not set audio mode:', error);
      }
    })();
  }, []);

  // Check for stored user session on app start
  useEffect(() => {
    checkStoredAuth();
    
    // Initialize AdMob (only if available - not in Expo Go)
    if (isAdMobAvailable && mobileAds) {
      mobileAds()
        .initialize()
        .then(adapterStatuses => {
          console.log('AdMob initialized:', adapterStatuses);
          // Load the first interstitial ad after initialization
          loadInterstitialAd();
        })
        .catch(error => {
          console.log('AdMob initialization error:', error);
        });
    }
  }, []);
  
  // Function to load interstitial ad
  const loadInterstitialAd = () => {
    if (!isAdMobAvailable || !InterstitialAd || !INTERSTITIAL_AD_UNIT_ID) {
      return;
    }
    
    try {
      const interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: true,
      });
      
      interstitial.addAdEventListener(AdEventType.LOADED, () => {
        console.log('Interstitial ad loaded');
        setInterstitialLoaded(true);
        interstitialRef.current = interstitial;
      });
      
      interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('Interstitial ad closed');
        setInterstitialLoaded(false);
        interstitialRef.current = null;
        // Load next interstitial
        loadInterstitialAd();
      });
      
      interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('Interstitial ad error:', error);
        setInterstitialLoaded(false);
      });
      
      interstitial.load();
    } catch (error) {
      console.log('Error creating interstitial:', error);
    }
  };
  
  // Function to show interstitial ad (call after every 5th prayer)
  const showInterstitialAd = () => {
    if (interstitialLoaded && interstitialRef.current) {
      interstitialRef.current.show();
      return true;
    }
    return false;
  };

  // Deep linking support for password reset and prayer sharing
  useEffect(() => {
    const handleDeepLink = ({ url }, isInitialUrl = false) => {
      const route = url.replace(/.*?:\/\//g, '');
      
      // Check for password reset link (can be processed immediately)
      const resetMatch = route.match(/reset-password\?token=([^&]+)/);
      if (resetMatch && resetMatch[1]) {
        console.log('📱 Deep link detected: Password reset with token');
        setResetToken(resetMatch[1]);
        setAuthScreen('reset');
        return;
      }
      
      // Check for prayer deep link (e.g., prayoverus.com/index.html?requestId=123)
      const prayerMatch = route.match(/requestId=(\d+)/);
      if (prayerMatch && prayerMatch[1]) {
        const prayerId = parseInt(prayerMatch[1], 10);
        console.log('📱 Deep link detected: Prayer ID', prayerId);
        
        // If this is the initial URL and auth check hasn't completed yet, store it for later
        if (isInitialUrl && isCheckingAuth) {
          console.log('📱 Auth check in progress, storing URL for later processing');
          setPendingInitialUrl(url);
          return;
        }
        
        // If user is logged in, store the prayer ID and navigate to home
        if (currentUser) {
          setPendingDeepLinkPrayerId(prayerId);
          setCurrentScreen('home');
        } else {
          // User is truly not logged in (auth check completed)
          console.log('📱 User not logged in, will navigate after login');
          setPendingDeepLinkPrayerId(prayerId);
          Alert.alert('Sign In Required', 'Please sign in to view this prayer request.');
        }
        return;
      }
    };

    // Handle initial URL if app opened from link
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url }, true); // Pass flag indicating this is initial URL
      }
    });

    // Listen for deep links while app is running (not initial, so auth is already checked)
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink({ url }, false));

    return () => {
      subscription?.remove();
    };
  }, [currentUser, isCheckingAuth]);
  
  // Process pending initial URL after auth check completes
  useEffect(() => {
    if (!isCheckingAuth && pendingInitialUrl) {
      console.log('📱 Auth check complete, processing pending deep link URL');
      const route = pendingInitialUrl.replace(/.*?:\/\//g, '');
      const prayerMatch = route.match(/requestId=(\d+)/);
      
      if (prayerMatch && prayerMatch[1]) {
        const prayerId = parseInt(prayerMatch[1], 10);
        
        if (currentUser) {
          console.log('📱 User is logged in, setting pending prayer ID:', prayerId);
          setPendingDeepLinkPrayerId(prayerId);
          setCurrentScreen('home');
        } else {
          console.log('📱 User not logged in after auth check, showing sign in alert');
          setPendingDeepLinkPrayerId(prayerId);
          Alert.alert('Sign In Required', 'Please sign in to view this prayer request.');
        }
      }
      
      // Clear the pending URL
      setPendingInitialUrl(null);
    }
  }, [isCheckingAuth, pendingInitialUrl, currentUser]);
  
  // Handle pending deep link prayer after community prayers are loaded
  useEffect(() => {
    if (pendingDeepLinkPrayerId && communityPrayers.length > 0) {
      const prayer = communityPrayers.find(p => p.id === pendingDeepLinkPrayerId);
      const prayerId = pendingDeepLinkPrayerId;
      setPendingDeepLinkPrayerId(null);
      
      if (prayer) {
        console.log('📱 Found deep link prayer, opening request detail view:', prayer.title);
        // Make sure we're on the home screen first
        setCurrentScreen('home');
        
        // Small delay to ensure home screen is rendered, then open detail screen
        setTimeout(() => {
          openDetailModal(prayer);
        }, 100);
      } else {
        console.log('📱 Deep link prayer not found in feed, opening directly by ID:', prayerId);
        // Open directly by ID even if not in feed - the detail screen fetches by ID
        setCurrentScreen('home');
        setTimeout(() => {
          const prayerIds = communityPrayers.map(p => p.id);
          setDetailScreenProps({
            requestId: prayerId,
            prayerIds: prayerIds,
            currentIndex: 0
          });
          setShowDetailScreen(true);
        }, 100);
      }
    }
  }, [communityPrayers, pendingDeepLinkPrayerId]);

  // Load user prayers ONLY when entering profile screen
  useEffect(() => {
    const loadProfileData = async () => {
      if (currentUser?.id && currentScreen === 'profile') {
        console.log('📍 Profile screen opened. Current churchName:', currentUser.churchName, 'Current churchId:', currentUser.churchId);
        setIsLoadingProfile(true);
        try {
          // Load profile data first to get the latest church info
          await refreshUserProfile();
          // Then load user's prayers
          await loadUserPrayers();
        } finally {
          setIsLoadingProfile(false);
        }
      }
    };
    loadProfileData();
  }, [currentScreen, currentUser?.id]);

  // Load community prayers when entering home or community screen OR when filter changes
  useEffect(() => {
    if (currentUser && (currentScreen === 'home' || currentScreen === 'community')) {
      // Clear current prayers and show loading indicator when filter changes
      setCommunityPrayers([]);
      setRefreshingCommunity(true);
      loadCommunityPrayers(true);
    }
  }, [currentScreen, currentUser, showChurchOnly]);

  const loadCommunityPrayers = async (showRefreshIndicator = false) => {
    console.log('🔄 loadCommunityPrayers called - User ID:', currentUser?.id, 'Church Filter:', showChurchOnly);
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
        tz: timezone,
        filterByChurch: showChurchOnly
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
          'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify(requestPayload),
        timeout: 10000,
      });
      
      if (response.ok) {
        const data = await response.json();
        const prayerCount = Array.isArray(data) ? data.length : (data.result?.length || 0);
        console.log('📱 Community API Response: Loaded', prayerCount, 'prayers');
        
        // Handle direct array response from getCommunityWall
        const prayersArray = Array.isArray(data) ? data : [];
        
        if (prayersArray.length > 0) {
          const communityPrayers = prayersArray.map(request => {
            // Debug picture field - use request_picture for the prayer's image
            if (request.request_picture) {
              // Image found for prayer (logging suppressed)
            }
            
            return {
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
              picture: request.request_picture, // Use request_picture for the prayer's image
              user_id: request.user_id,
              fk_prayer_id: request.fk_prayer_id,
              allow_comments: request.allow_comments,
              use_alias: request.use_alias,
              prayer_count: request.prayer_count || 0,
              prayed_by_names: request.prayed_by_names || [],
              prayed_by_people: request.prayed_by_people || [],
              user_has_prayed: request.user_has_prayed || false,
              church_id: request.church_id
            };
          });
          
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
    setCurrentScreen('home'); // Explicitly navigate to home after login
    
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
  const handleLogout = () => {
    console.log('🚪 Logout button pressed - user:', currentUser?.firstName);
    
    try {
      // Clean up notification listeners (with error handling)
      try {
        NotificationService.cleanup();
      } catch (notifError) {
        console.log('Notification cleanup error (non-blocking):', notifError);
      }
      
      // Reset all state synchronously
      setAuthScreen('login');
      setCommunityPrayers([]);
      setPrayers([]);
      setCurrentScreen('home');
      setPrayerModal({ visible: false, prayer: null, generatedPrayer: '', loading: false });
      setEditPrayerModal({ visible: false, prayer: null, title: '', content: '', isLoading: false });
      
      // Clear storage (async but don't await - let it run in background)
      clearUserFromStorage().catch(err => console.log('Storage clear error:', err));
      
      // Set currentUser to null LAST to trigger re-render with login screen
      setCurrentUser(null);
      
      console.log('✅ Logout complete - should show Sign In screen now');
    } catch (error) {
      console.log('❌ Logout error:', error);
      // Force logout even if there's an error
      setCurrentUser(null);
    }
  };

  const refreshUserProfile = async () => {
    if (!currentUser?.id) {
      console.log('No user ID available for refreshing profile');
      return;
    }

    try {
      const endpoint = 'https://shouldcallpaul.replit.app/getUser';
      const requestPayload = {
        userId: currentUser.id.toString()
      };
      
      console.log('🔄 Refreshing user profile data');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify(requestPayload)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 User profile loaded successfully');
        
        // API returns direct array: [{user_id, church_id, church_name, ...}]
        const userArray = Array.isArray(data) ? data : (data.result || []);
        
        if (userArray.length > 0) {
          const user = userArray[0];
          
          // Update current user with fresh data from API
          const updatedUser = {
            ...currentUser,
            firstName: user.real_name,
            lastName: user.last_name,
            churchId: user.church_id,
            churchName: user.church_name,
            title: user.user_title,
            about: user.user_about,
            picture: user.picture || user.profile_picture_url
          };
          
          console.log('✅ User profile refreshed. First:', user.real_name, 'Last:', user.last_name, 'Church:', user.church_name);
          setCurrentUser(updatedUser);
          await saveUserToStorage(updatedUser);
        }
      }
    } catch (error) {
      console.log('Error refreshing user profile:', error.message);
    }
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
          'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify(requestPayload)
      });
      
      if (response.ok) {
        const data = await response.json();
        const prayerCount = Array.isArray(data) ? data.length : (data.result?.length || 0);
        console.log('📱 User Prayers API Response: Loaded', prayerCount, 'prayers');
        
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
            picture: request.request_picture, // Use request_picture for the prayer's image
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
          setPrayerImage(null); // Clear selected image
          setShowTitleInput(false);
          setPostSuccess(false);
        }, 1200);
        
      } catch (error) {
        // Check if it's a network error or a server validation error
        const isNetworkError = error.message.includes('Network request failed') || 
                              error.message.includes('Failed to fetch') ||
                              error.message.includes('timeout');
        
        if (isNetworkError) {
          // Network error - save locally for offline functionality
          setPrayers([prayer, ...prayers]);
          if (newPrayer.isPublic) {
            setCommunityPrayers([prayer, ...communityPrayers]);
          }
          setNewPrayer({ title: '', content: '', isPublic: true });
          setPrayerImage(null);
          setShowTitleInput(false);
          Alert.alert('Offline Mode', 'Prayer saved locally. It will sync when you have internet connection.');
        } else {
          // Server error or validation error - show the actual error message
          Alert.alert('Error', error.message || 'Unable to create prayer request. Please try again.');
          // Don't clear the form so user can retry
        }
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
      
      let requestBody;
      let headers = {
        'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
      };
      
      // If there's an image, use FormData, otherwise use JSON
      if (prayerImage) {
        const formData = new FormData();
        formData.append('requestText', prayer.content);
        formData.append('requestTitle', prayer.title);
        formData.append('tz', timezone);
        formData.append('userId', currentUser?.id.toString());
        formData.append('sendEmail', 'true');
        formData.append('idempotencyKey', idempotencyKey);
        // Add myChurchOnly flag when checkbox is checked (isPublic = false)
        if (!prayer.isPublic) {
          formData.append('myChurchOnly', 'true');
        }
        
        // Add image to FormData
        const uriParts = prayerImage.split('.');
        const fileExtension = uriParts[uriParts.length - 1];
        formData.append('image', {
          uri: prayerImage,
          type: `image/${fileExtension}`,
          name: `prayer.${fileExtension}`,
        });
        
        requestBody = formData;
        console.log('📱 MOBILE APP API CALL (with image):');
        console.log('POST ' + endpoint);
      } else {
        const requestPayload = {
          requestText: prayer.content,
          requestTitle: prayer.title,
          tz: timezone,
          userId: currentUser?.id,
          sendEmail: "true",
          idempotencyKey: idempotencyKey,
          // Add myChurchOnly flag when checkbox is checked (isPublic = false)
          ...((!prayer.isPublic) && { myChurchOnly: true })
        };
        
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(requestPayload);
        
        console.log('📱 MOBILE APP API CALL:');
        console.log('POST ' + endpoint);
        console.log(JSON.stringify(requestPayload, null, 2));
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...headers,
          'X-Idempotency-Key': idempotencyKey,
        },
        body: requestBody
      });
      
      const data = await response.json();
      console.log('📥 API Response:', JSON.stringify(data, null, 2));
      
      // Check for success: API returns { success: true, ... } on success
      // Check for error: API returns { error: 1, result: "error message" } on failure
      if (data.success === true) {
        console.log('Prayer request saved successfully:', data.message);
        // Show success message only once per idempotency key
        if (!hasShownSuccessForCurrentKey) {
          Alert.alert('Success', data.message || 'Your prayer has been shared!');
          setHasShownSuccessForCurrentKey(true);
        }
        // Clear the idempotency key on successful completion
        setCurrentIdempotencyKey(null);
        setHasShownSuccessForCurrentKey(false);
        loadCommunityPrayers(); // Refresh community prayers
      } else if (data.error) {
        // API returned an error response: { error: 1, result: "error message" }
        const errorMessage = data.result || 'Unable to save prayer request. Please try again.';
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
      } else {
        // Unknown response format
        console.error('Unknown API response:', data);
        throw new Error('Unexpected response from server. Please try again.');
      }
    } catch (error) {
      // Re-throw the error to be handled by addPrayer
      console.error('savePrayerToAPI error:', error.message);
      throw error;
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
      
      // Beautiful slide-up animation!
      Animated.parallel([
        Animated.spring(modalSlideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

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
            'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
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
    // Check if we should return to detail view
    const shouldReturnToDetail = returnToDetailRef.current;
    const prayerIdToReturn = shouldReturnToDetail?.prayerId;
    
    // Clear the ref (will be handled after animation)
    if (shouldReturnToDetail) {
      returnToDetailRef.current = null;
    }
    
    // Beautiful slide-down animation before closing!
    Animated.parallel([
      Animated.timing(modalSlideAnim, {
        toValue: 1000,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPrayerModal({ visible: false, prayer: null, generatedPrayer: '', loading: false });
      
      // Return to detail view if we came from there
      if (prayerIdToReturn) {
        setTimeout(() => {
          const prayer = communityPrayersRef.current.find(p => p.id === prayerIdToReturn);
          if (prayer) {
            openDetailModal(prayer);
          }
        }, 100);
      }
    });
  };

  // Get currently filtered prayers (based on hideAlreadyPrayed filter)
  const getFilteredPrayers = () => {
    let filtered = communityPrayers;
    if (hideAlreadyPrayed) {
      filtered = filtered.filter(prayer => !prayer.user_has_prayed);
    }
    return filtered;
  };

  // Track which prayer ID we're currently fetching for (to avoid race conditions)
  const fetchingPrayerIdRef = useRef(null);
  
  // Fetch generated prayer for detail view
  const fetchGeneratedPrayerForDetail = async (prayerRequest) => {
    const requestId = prayerRequest.id;
    fetchingPrayerIdRef.current = requestId;
    
    setDetailGeneratedPrayer({ text: '', loading: true, collapsed: true });
    
    try {
      const endpoint = 'https://shouldcallpaul.replit.app/getPrayerByRequestId';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify({ requestId: requestId }),
      });

      // Guard: only update state if this is still the prayer we're viewing
      if (fetchingPrayerIdRef.current !== requestId) {
        console.log('Skipping stale fetch result for prayer:', requestId);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.error === 0 && data.prayerText) {
          setDetailGeneratedPrayer({ text: data.prayerText, loading: false, collapsed: true });
          return;
        }
      }
    } catch (error) {
      console.log('Failed to fetch prayer for detail view:', error.message);
      // Guard: check again after error
      if (fetchingPrayerIdRef.current !== requestId) return;
    }

    // Guard: check before fallback
    if (fetchingPrayerIdRef.current !== requestId) return;

    // Fallback prayer if API fails
    const fallbackPrayer = `Heavenly Father, we lift up ${prayerRequest.author} to Your loving care and ask for Your blessing upon their prayer request. 

Grant ${prayerRequest.author} Your peace, guidance, and strength in this situation. May Your will be accomplished in their life according to Your perfect plan.

Through Christ our Lord. Amen.`;
    
    setDetailGeneratedPrayer({ text: fallbackPrayer, loading: false, collapsed: true });
  };

  // Open prayer detail view (now uses PrayerDetailScreen instead of modal)
  const openDetailModal = (prayer) => {
    // Find index in the FILTERED prayers list (what's currently displayed)
    const filtered = getFilteredPrayers();
    const index = filtered.findIndex(p => p.id === prayer.id);
    
    // Get array of prayer IDs for navigation
    const prayerIds = filtered.map(p => p.id);
    
    // Set props and show the detail screen
    setDetailScreenProps({
      requestId: prayer.id,
      prayerIds: prayerIds,
      currentIndex: index >= 0 ? index : 0
    });
    setShowDetailScreen(true);
  };

  // Refs to hold current state for PanResponder (avoids stale closure)
  const detailModalRef = useRef(detailModal);
  const filteredPrayersRef = useRef([]);
  
  // Keep refs in sync with state
  useEffect(() => {
    detailModalRef.current = detailModal;
  }, [detailModal]);
  
  // Keep communityPrayersRef in sync with state
  useEffect(() => {
    communityPrayersRef.current = communityPrayers;
  }, [communityPrayers]);
  
  // Update filtered prayers ref when filters or prayers change
  useEffect(() => {
    let filtered = communityPrayers;
    if (hideAlreadyPrayed) {
      filtered = filtered.filter(prayer => !prayer.user_has_prayed);
    }
    filteredPrayersRef.current = filtered;
  }, [communityPrayers, hideAlreadyPrayed]);

  // Touch tracking state for swipe gestures
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwipeGesture = useRef(false);
  
  // Handle swipe navigation
  // Left = skip to next, Right = pray (if not already) + advance to next
  const handleSwipeNavigation = (direction) => {
    const currentIndex = detailModalRef.current.prayerIndex;
    const currentPrayer = detailModalRef.current.prayer;
    const prayers = filteredPrayersRef.current;
    
    // Helper to advance to next prayer
    const advanceToNext = () => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < prayers.length) {
        const nextPrayer = prayers[nextIndex];
        // Update refs immediately
        detailModalRef.current = { visible: true, prayer: nextPrayer, prayerIndex: nextIndex };
        
        setDetailModal({
          visible: true,
          prayer: nextPrayer,
          prayerIndex: nextIndex
        });
        // Fetch generated prayer for the next one
        fetchGeneratedPrayerForDetail(nextPrayer);
        
        detailSwipeAnim.setValue(400);
        Animated.timing(detailSwipeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();
      } else {
        // No more prayers - close the modal and clear state
        fetchingPrayerIdRef.current = null;
        setDetailGeneratedPrayer({ text: '', loading: false, collapsed: true });
        setDetailModal({ visible: false, prayer: null, prayerIndex: -1 });
      }
    };
    
    if (direction === 'left') {
      // Swipe left = skip to next (no prayer action)
      const nextIndex = currentIndex + 1;
      if (nextIndex < prayers.length) {
        Animated.timing(detailSwipeAnim, {
          toValue: -400,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          advanceToNext();
        });
      } else {
        // Bounce back if no more prayers
        Animated.spring(detailSwipeAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
      }
    } else if (direction === 'right') {
      // Swipe right = pray + advance to next
      const nextIndex = currentIndex + 1;
      
      // Animate swipe out to the right
      Animated.timing(detailSwipeAnim, {
        toValue: 400,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        // If user hasn't prayed for this one yet, record the prayer
        if (currentPrayer && !currentPrayer.user_has_prayed) {
          // Show "Prayed!" confirmation
          setShowSwipePrayedConfirmation(true);
          swipePrayedAnim.setValue(0);
          Animated.sequence([
            Animated.spring(swipePrayedAnim, {
              toValue: 1,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
            Animated.delay(400),
            Animated.timing(swipePrayedAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setShowSwipePrayedConfirmation(false);
          });
          
          // Record the prayer in the backend
          recordSwipePrayer(currentPrayer);
          
          // Update local state immediately
          setCommunityPrayers(prevPrayers =>
            prevPrayers.map(p =>
              p.id === currentPrayer.id
                ? { 
                    ...p, 
                    prayedFor: true,
                    user_has_prayed: true,
                    prayer_count: (p.prayer_count || 0) + 1,
                    prayed_by_names: [...(p.prayed_by_names || []), currentUser?.firstName || currentUser?.email || 'You'],
                    prayed_by_people: [...(p.prayed_by_people || []), { name: currentUser?.firstName || currentUser?.email || 'You', picture: currentUser?.picture || null }]
                  }
                : p
            )
          );
          
          // Count prayer for interstitial ads
          const newPrayerCount = prayerCount + 1;
          setPrayerCount(newPrayerCount);
          if (newPrayerCount % 5 === 0 && isAdMobAvailable) {
            showInterstitialAd();
          }
        }
        
        // Advance to next prayer
        advanceToNext();
      });
    } else {
      // No valid swipe - bounce back
      Animated.spring(detailSwipeAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    }
  };
  
  // Record swipe prayer to backend (fire and forget)
  const recordSwipePrayer = async (prayer) => {
    try {
      const endpoint = 'https://shouldcallpaul.replit.app/prayFor';
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify({
          userId: currentUser?.id,
          requestId: prayer.id
        })
      });
      console.log('Prayer recorded via swipe for request:', prayer.id);
    } catch (error) {
      console.log('Failed to record swipe prayer:', error.message);
    }
  };
  
  // Touch event handlers for swipe detection
  const handleTouchStart = (e) => {
    touchStartX.current = e.nativeEvent.pageX;
    touchStartY.current = e.nativeEvent.pageY;
    isSwipeGesture.current = false;
  };
  
  const handleTouchMove = (e) => {
    const dx = e.nativeEvent.pageX - touchStartX.current;
    const dy = e.nativeEvent.pageY - touchStartY.current;
    
    // Check if this is a horizontal swipe (more horizontal than vertical)
    if (Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      isSwipeGesture.current = true;
      const clampedDx = Math.max(-150, Math.min(150, dx));
      detailSwipeAnim.setValue(clampedDx);
    }
  };
  
  const handleTouchEnd = (e) => {
    if (!isSwipeGesture.current) {
      detailSwipeAnim.setValue(0);
      return;
    }
    
    const dx = e.nativeEvent.pageX - touchStartX.current;
    
    if (dx < -80) {
      handleSwipeNavigation('left');
    } else if (dx > 80) {
      handleSwipeNavigation('right');
    } else {
      handleSwipeNavigation(null);
    }
    
    isSwipeGesture.current = false;
  };

  // Close prayer detail view
  const closeDetailModal = () => {
    // Close the new detail screen
    setShowDetailScreen(false);
    setDetailScreenProps({ requestId: null, prayerIds: [], currentIndex: 0 });
    
    // Clear fetch tracking and generated prayer state (for old modal, kept for compatibility)
    fetchingPrayerIdRef.current = null;
    setDetailGeneratedPrayer({ text: '', loading: false, collapsed: true });
    setDetailModal({ visible: false, prayer: null, prayerIndex: -1 });
  };
  
  // Handler for when user presses "Pray" on the detail screen
  const handlePrayFromDetailScreen = (prayer) => {
    if (!prayer) return;
    
    // Close detail screen and open prayer modal
    closeDetailModal();
    
    // Small delay to let detail screen close, then open prayer modal
    setTimeout(() => {
      generatePrayer(prayer);
    }, 100);
  };
  
  // Handler for navigation between prayers in detail screen
  const handleDetailNavigate = (prayerId, newIndex) => {
    setDetailScreenProps(prev => ({
      ...prev,
      requestId: prayerId,
      currentIndex: newIndex
    }));
  };

  // Handle praying from the detail view
  const handlePrayFromDetailView = async () => {
    if (!detailModal.prayer) return;
    
    // Capture prayer reference before closing modal (modal state will be cleared)
    const prayerToOpen = detailModal.prayer;
    
    // Store ref to return to detail view after Amen
    returnToDetailRef.current = { prayerId: prayerToOpen.id };
    
    // Close detail modal and open prayer modal
    closeDetailModal();
    
    // Small delay to let detail modal close, then open prayer modal
    setTimeout(() => {
      generatePrayer(prayerToOpen);
    }, 350);
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
          'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
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

  // Play modern notification sound
  const playHeavenlyChime = async () => {
    try {
      console.log('🔔 Playing magical success sound...');
      
      // Soft sparkle/success notification - light and pleasant ✨
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3' },
        { shouldPlay: true, volume: 0.5 }
      );
      
      setSound(newSound);
      
      // Clean up sound after playing
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          newSound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Could not play sound:', error);
    }
  };

  // Trigger BIG CELEBRATION animation with MAGICAL vibration pattern!
  const triggerPrayerAnimation = async () => {
    // Play heavenly chime sound! 🔔
    playHeavenlyChime();
    
    // MAGICAL HEAVENLY vibration pattern - like bells chiming!
    // Pattern: [wait, vibrate, wait, vibrate, ...] in milliseconds
    const magicalPattern = [
      0,   // Start immediately
      30,  // Short ding
      50,  // Pause
      30,  // Second ding
      50,  // Pause
      30,  // Third ding
      100, // Longer pause
      50,  // Deeper bell
      80,  // Pause
      50,  // Final chime
    ];
    
    Vibration.vibrate(magicalPattern);
    
    setShowPrayerAnimation(true);
    
    // Animate each confetti piece with random trajectories
    const animations = confettiAnims.map((anim, index) => {
      return Animated.sequence([
        Animated.delay(index * 20), // Stagger start times
        Animated.timing(anim, {
          toValue: 1,
          duration: 1500, // Longer duration for dramatic effect
          useNativeDriver: true,
        })
      ]);
    });
    
    Animated.parallel(animations).start(() => {
      setTimeout(() => {
        setShowPrayerAnimation(false);
        confettiAnims.forEach(anim => anim.setValue(0));
      }, 500); // Keep showing for a bit longer
    });
  };

  const markAsPrayed = async () => {
    const prayer = prayerModal.prayer;
    if (!prayer) return;

    // Trigger magical animation
    triggerPrayerAnimation();

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
          'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
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
              prayed_by_names: [...(p.prayed_by_names || []), currentUser?.firstName || currentUser?.email || 'You'],
              prayed_by_people: [...(p.prayed_by_people || []), { name: currentUser?.firstName || currentUser?.email || 'You', picture: currentUser?.picture || null }]
            }
          : p
      )
    );
    
    // Increment prayer count and show interstitial ad every 5th prayer
    const newPrayerCount = prayerCount + 1;
    setPrayerCount(newPrayerCount);
    
    // Close the modal after animation completes
    setTimeout(() => {
      closePrayerModal(); // This will also return to detail view if needed
      
      // Show interstitial ad after every 5th prayer
      if (newPrayerCount % 5 === 0 && isAdMobAvailable) {
        console.log(`Showing interstitial ad after ${newPrayerCount} prayers (every 5th)`);
        showInterstitialAd();
      }
    }, 2000); // 2 seconds to enjoy the celebration!
  };

  // Open Edit Prayer Modal
  const handleEditPrayer = (prayer) => {
    setEditPrayerModal({
      visible: true,
      prayer: prayer,
      title: prayer.title || '',
      content: prayer.content || '',
      isLoading: false
    });
  };

  // Save edited prayer - calls editRequest endpoint
  const saveEditedPrayer = async () => {
    if (!editPrayerModal.content.trim()) {
      Alert.alert('Error', 'Please enter your prayer request');
      return;
    }

    setEditPrayerModal(prev => ({ ...prev, isLoading: true }));

    try {
      const endpoint = 'https://shouldcallpaul.replit.app/editRequest';
      const requestPayload = {
        requestId: editPrayerModal.prayer.id,
        userId: currentUser?.id,
        requestText: editPrayerModal.content.trim()
      };

      console.log('📱 MOBILE APP API CALL:');
      console.log('POST ' + endpoint);
      console.log(JSON.stringify(requestPayload, null, 2));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify(requestPayload)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.error === 0) {
          // Update local state
          setCommunityPrayers(prevPrayers =>
            prevPrayers.map(p =>
              p.id === editPrayerModal.prayer.id
                ? { ...p, content: editPrayerModal.content.trim() }
                : p
            )
          );
          setPrayers(prevPrayers =>
            prevPrayers.map(p =>
              p.id === editPrayerModal.prayer.id
                ? { ...p, content: editPrayerModal.content.trim() }
                : p
            )
          );
          
          setEditPrayerModal({ visible: false, prayer: null, title: '', content: '', isLoading: false });
          Alert.alert('Success', 'Prayer request updated successfully');
        } else if (data.error === 1) {
          // Show the result message from the API
          Alert.alert('Error', data.result || 'Failed to update prayer');
        } else {
          Alert.alert('Error', data.result || data.message || 'Failed to update prayer');
        }
      } else {
        throw new Error('Server error');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update prayer request. Please try again.');
    } finally {
      setEditPrayerModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Delete prayer - calls deleteRequestById endpoint
  const handleDeletePrayer = async (prayer) => {
    try {
      const endpoint = 'https://shouldcallpaul.replit.app/deleteRequestById';
      const requestPayload = {
        request_id: prayer.id
      };

      console.log('📱 MOBILE APP API CALL:');
      console.log('POST ' + endpoint);
      console.log(JSON.stringify(requestPayload, null, 2));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify(requestPayload)
      });

      const data = await response.json();
      console.log('📥 Delete API Response:', JSON.stringify(data, null, 2));
      
      // Check for success: API returns { success: true } or { error: 0 }
      const isSuccess = data.success === true || data.error === 0;
      const message = data.message || data.result || 'Prayer request deleted';
      
      if (isSuccess) {
        // Remove from local state immediately
        setCommunityPrayers(prevPrayers => prevPrayers.filter(p => p.id !== prayer.id));
        setPrayers(prevPrayers => prevPrayers.filter(p => p.id !== prayer.id));
        
        Alert.alert('Success', message);
      } else if (data.error) {
        // API returned an error
        Alert.alert('Error', data.result || 'Failed to delete prayer request');
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to delete prayer request. Please try again.');
    }
  };

  // Fetch all churches for the dropdown
  const fetchChurches = async () => {
    try {
      const response = await fetch('https://shouldcallpaul.replit.app/getAllChurches', {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.error === 0 && data.churches) {
          setChurches(data.churches);
          console.log('Loaded', data.churches.length, 'churches');
        }
      }
    } catch (error) {
      console.log('Error fetching churches:', error);
      Alert.alert('Error', 'Failed to load churches');
    }
  };

  // Enter edit mode and populate form with current values
  const enterEditMode = async () => {
    // Fetch churches FIRST so dropdown is populated
    await fetchChurches();
    
    // THEN set the form with current values
    setProfileForm({
      firstName: currentUser.firstName || '',
      lastName: currentUser.lastName || '',
      title: currentUser.title || '',
      about: currentUser.about || '',
      churchId: currentUser.churchId || null,
      churchName: currentUser.churchName || ''
    });
    setIsEditingProfile(true);
  };

  // Cancel editing
  const cancelEditProfile = () => {
    setIsEditingProfile(false);
    setProfileForm({ firstName: '', lastName: '', title: '', about: '', churchId: null, churchName: '' });
  };

  // Save profile updates
  const saveProfile = async () => {
    setIsSavingProfile(true);
    
    try {
      // Call updateUser API with correct parameter names
      const response = await fetch('https://shouldcallpaul.replit.app/updateUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify({
          userId: currentUser.id,
          real_name: profileForm.firstName,
          last_name: profileForm.lastName,
          user_title: profileForm.title,
          user_about: profileForm.about,
          church_id: profileForm.churchId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.error === 0 && data.user) {
          // Update current user with values from API response
          const updatedUser = {
            ...currentUser,
            firstName: profileForm.firstName,
            lastName: profileForm.lastName,
            title: data.user.user_title,
            about: data.user.user_about,
            churchId: profileForm.churchId,
            churchName: profileForm.churchName
          };
          
          setCurrentUser(updatedUser);
          await saveUserToStorage(updatedUser);
          
          console.log('Profile updated successfully:', data.result);
          Alert.alert('Success', 'Profile updated successfully!');
          setIsEditingProfile(false);
        } else {
          Alert.alert('Error', data.result || 'Failed to update profile');
        }
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.log('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile changes');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Pick image for prayer request
  const pickPrayerImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to add an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPrayerImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking prayer image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Pick image from camera or library
  const pickProfilePicture = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload a profile picture.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await uploadProfilePicture(imageUri);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Upload profile picture to backend
  const uploadProfilePicture = async (imageUri) => {
    setIsUploadingPicture(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('userId', currentUser.id);
      
      // Get file extension from uri
      const uriParts = imageUri.split('.');
      const fileExtension = uriParts[uriParts.length - 1];
      
      formData.append('image', {
        uri: imageUri,
        type: `image/${fileExtension}`,
        name: `profile.${fileExtension}`,
      });

      console.log('📱 Uploading profile picture for user:', currentUser.id);

      const response = await fetch('https://shouldcallpaul.replit.app/uploadProfilePicture', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.error === 0 && data.profile_picture_url) {
          // Update current user with new profile picture
          const updatedUser = {
            ...currentUser,
            picture: data.profile_picture_url,
          };
          
          setCurrentUser(updatedUser);
          await saveUserToStorage(updatedUser);
          
          console.log('✅ Profile picture uploaded:', data.profile_picture_url);
          Alert.alert('Success', 'Profile picture updated!');
        } else {
          Alert.alert('Error', data.result || 'Failed to upload profile picture');
        }
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.result || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.log('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploadingPicture(false);
    }
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

  // Show Prayer Detail Screen (full-screen, replaces modal)
  if (showDetailScreen && detailScreenProps.requestId) {
    return (
      <PrayerDetailScreen
        requestId={detailScreenProps.requestId}
        prayerIds={detailScreenProps.prayerIds}
        currentIndex={detailScreenProps.currentIndex}
        userId={currentUser?.id}
        onClose={closeDetailModal}
        onPray={handlePrayFromDetailScreen}
        onNavigate={handleDetailNavigate}
      />
    );
  }

  // Show auth screens if no current user
  if (!currentUser) {
    console.log('📱 No user - showing login screen. Current authScreen:', authScreen);
    
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
            
            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Your message..."
              multiline
              numberOfLines={4}
              value={helpForm.message}
              onChangeText={(text) => setHelpForm({...helpForm, message: text})}
              data-testid="input-help-message"
            />
            
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              value={helpForm.name}
              onChangeText={(text) => setHelpForm({...helpForm, name: text})}
              data-testid="input-help-name"
            />
            
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={helpForm.email}
              onChangeText={(text) => setHelpForm({...helpForm, email: text})}
              data-testid="input-help-email"
            />
            
            <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
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
          <Text style={[styles.headerTitle, { flex: 1 }]}>My Profile</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {!isEditingProfile && (
              <TouchableOpacity 
                onPress={enterEditMode} 
                style={styles.editButton}
                data-testid="button-edit-profile"
              >
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => setCurrentScreen('settings')} 
              style={styles.settingsButton}
              data-testid="button-settings"
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {isLoadingProfile ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={{ marginTop: 16, color: '#64748b', fontSize: 16 }}>Loading profile...</Text>
          </View>
        ) : (
        <ScrollView 
          style={styles.screenContent}
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          {/* User Profile Info */}
          <View style={styles.profileCard}>
            <View style={styles.profileImageContainer}>
              <Image 
                source={{ 
                  uri: currentUser.picture || 'https://via.placeholder.com/150/6366f1/ffffff?text=📸'
                }}
                style={styles.profileImage}
              />
              
              {/* Camera button overlay */}
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={pickProfilePicture}
                disabled={isUploadingPicture}
                data-testid="button-upload-picture"
              >
                {isUploadingPicture ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.cameraIcon}>📷</Text>
                )}
              </TouchableOpacity>
            </View>
            
            <Text style={styles.profileEmail}>{currentUser.email}</Text>
            
            <View style={styles.profileInfoSection}>
              <Text style={styles.profileInfoLabel}>First Name</Text>
              {isEditingProfile ? (
                <TextInput
                  style={styles.editInput}
                  value={profileForm.firstName}
                  onChangeText={(text) => setProfileForm({...profileForm, firstName: text})}
                  placeholder="Enter your first name"
                  data-testid="input-edit-firstname"
                />
              ) : (
                <Text style={styles.profileInfoValue}>{currentUser.firstName || 'Not set'}</Text>
              )}
            </View>
            
            <View style={styles.profileInfoSection}>
              <Text style={styles.profileInfoLabel}>Last Name</Text>
              {isEditingProfile ? (
                <TextInput
                  style={styles.editInput}
                  value={profileForm.lastName}
                  onChangeText={(text) => setProfileForm({...profileForm, lastName: text})}
                  placeholder="Enter your last name"
                  data-testid="input-edit-lastname"
                />
              ) : (
                <Text style={styles.profileInfoValue}>{currentUser.lastName || 'Not set'}</Text>
              )}
            </View>
            
            <View style={styles.profileInfoSection}>
              <Text style={styles.profileInfoLabel}>Title</Text>
              {isEditingProfile ? (
                <TextInput
                  style={styles.editInput}
                  value={profileForm.title}
                  onChangeText={(text) => setProfileForm({...profileForm, title: text})}
                  placeholder="Enter your title"
                  data-testid="input-edit-title"
                />
              ) : (
                <Text style={styles.profileInfoValue}>{currentUser.title || 'Not set'}</Text>
              )}
            </View>
            
            <View style={styles.profileInfoSection}>
              <Text style={styles.profileInfoLabel}>About</Text>
              {isEditingProfile ? (
                <TextInput
                  style={[styles.editInput, styles.editTextArea]}
                  value={profileForm.about}
                  onChangeText={(text) => setProfileForm({...profileForm, about: text})}
                  placeholder="Tell us about yourself"
                  multiline
                  numberOfLines={3}
                  data-testid="input-edit-about"
                />
              ) : (
                <Text style={styles.profileInfoValue}>{currentUser.about || 'Not set'}</Text>
              )}
            </View>
            
            <View style={styles.profileInfoSection}>
              <Text style={styles.profileInfoLabel}>Church</Text>
              {isEditingProfile ? (
                <TouchableOpacity 
                  style={styles.churchSelector}
                  onPress={() => setShowChurchPicker(true)}
                  data-testid="button-select-church"
                >
                  <Text style={styles.churchSelectorText}>
                    {profileForm.churchName || 'Select a church...'}
                  </Text>
                  <Text style={styles.churchSelectorArrow}>▼</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.profileInfoValue}>{currentUser.churchName || 'Not set'}</Text>
              )}
            </View>
            
            {isEditingProfile && (
              <View style={styles.editActions}>
                <TouchableOpacity 
                  style={[styles.editActionButton, styles.cancelButton]}
                  onPress={cancelEditProfile}
                  disabled={isSavingProfile}
                  data-testid="button-cancel-edit"
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.editActionButton, styles.saveButton, isSavingProfile && styles.saveButtonDisabled]}
                  onPress={saveProfile}
                  disabled={isSavingProfile}
                  data-testid="button-save-profile"
                >
                  {isSavingProfile ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Church Picker Modal */}
          <Modal
            visible={showChurchPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowChurchPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.churchPickerModal}>
                <View style={styles.churchPickerHeader}>
                  <Text style={styles.churchPickerTitle}>Select Your Church</Text>
                  <TouchableOpacity onPress={() => setShowChurchPicker(false)}>
                    <Text style={styles.churchPickerClose}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.churchList}>
                  {churches.map((church) => (
                    <TouchableOpacity
                      key={church.church_id}
                      style={styles.churchOption}
                      onPress={() => {
                        setProfileForm({
                          ...profileForm,
                          churchId: church.church_id,
                          churchName: church.church_name
                        });
                        setShowChurchPicker(false);
                      }}
                      data-testid={`church-option-${church.church_id}`}
                    >
                      <Text style={styles.churchOptionText}>{church.church_name}{church.church_addr ? ` (${church.church_addr})` : ''}</Text>
                      {profileForm.churchId === church.church_id && (
                        <Text style={styles.churchSelectedCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

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
                  {/* Options Menu - User owns all prayers in profile */}
                  <PrayerOptionsMenu 
                    prayer={{ ...prayer, user_id: currentUser?.id }}
                    currentUserId={currentUser?.id}
                    onEdit={handleEditPrayer}
                    onDelete={handleDeletePrayer}
                    isProfileSection={true}
                  />
                  
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
        )}

        {/* Edit Prayer Modal for Profile Screen */}
        <Modal
          visible={editPrayerModal.visible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setEditPrayerModal({ visible: false, prayer: null, title: '', content: '', isLoading: false })}
        >
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={styles.editModalOverlay}>
              <View style={styles.editModalContent}>
                <View style={styles.editModalHeader}>
                  <Text style={styles.editModalTitle}>Edit Prayer Request</Text>
                  <TouchableOpacity 
                    onPress={() => setEditPrayerModal({ visible: false, prayer: null, title: '', content: '', isLoading: false })}
                    style={styles.editModalCloseButton}
                  >
                    <Text style={styles.editModalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.editModalBody} keyboardShouldPersistTaps="handled">
                  <Text style={styles.inputLabel}>Prayer Request</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { minHeight: 150 }]}
                    placeholder="Your prayer request..."
                    multiline
                    numberOfLines={8}
                    value={editPrayerModal.content}
                    onChangeText={(text) => setEditPrayerModal(prev => ({ ...prev, content: text }))}
                    textAlignVertical="top"
                    data-testid="input-edit-content-profile"
                  />
                </ScrollView>
                
                <View style={styles.editModalFooter}>
                  <TouchableOpacity 
                    style={styles.editModalCancelButton}
                    onPress={() => setEditPrayerModal({ visible: false, prayer: null, title: '', content: '', isLoading: false })}
                  >
                    <Text style={styles.editModalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.editModalSaveButton, editPrayerModal.isLoading && styles.buttonDisabled]}
                    onPress={saveEditedPrayer}
                    disabled={editPrayerModal.isLoading}
                    data-testid="button-save-edit-profile"
                  >
                    <Text style={styles.editModalSaveText}>
                      {editPrayerModal.isLoading ? 'Saving...' : 'Save Changes'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
                    'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
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
                    source={{ 
                      uri: p.picture || 'https://via.placeholder.com/50/6366f1/ffffff?text=👤'
                    }}
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
            source={{ 
              uri: currentUser.picture || 'https://via.placeholder.com/80/6366f1/ffffff?text=👤'
            }}
            style={styles.headerProfilePicture}
          />
          <Text style={styles.profileLinkText}>{currentUser.firstName}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleLogout} 
          style={styles.logoutButton} 
          activeOpacity={0.6}
          data-testid="button-logout"
        >
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
            <>
              <Text style={styles.inputLabel}>Prayer Title (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder={`${currentUser?.firstName}'s Prayer Request`}
                value={newPrayer.title}
                onChangeText={(text) => setNewPrayer({...newPrayer, title: text})}
                editable={!isPosting}
              />
            </>
          )}
          
          <Text style={styles.inputLabel}>Prayer Request</Text>
          <TextInput
            style={[styles.input, styles.compactTextArea]}
            placeholder="What would you like prayer for?"
            multiline
            numberOfLines={3}
            value={newPrayer.content}
            onChangeText={(text) => setNewPrayer({...newPrayer, content: text})}
            editable={!isPosting}
          />
          
          {/* Image Preview and Picker */}
          {prayerImage && (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: prayerImage }}
                style={styles.imagePreview}
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => setPrayerImage(null)}
                data-testid="button-remove-prayer-image"
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Facebook-style icon buttons */}
          <View style={styles.iconButtonRow}>
            <TouchableOpacity 
              style={[styles.iconButton, showTitleInput && styles.iconButtonActive]}
              onPress={() => setShowTitleInput(!showTitleInput)}
              disabled={isPosting}
              data-testid="button-toggle-title"
            >
              <Text style={[styles.iconButtonIcon, isPosting && { opacity: 0.5 }]}>📝</Text>
              <Text style={[styles.iconButtonLabel, showTitleInput && styles.iconButtonLabelActive, isPosting && { opacity: 0.5 }]}>Title</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.iconButton, prayerImage && styles.iconButtonActive]}
              onPress={pickPrayerImage}
              disabled={isPosting}
              data-testid="button-add-prayer-image"
            >
              <Text style={[styles.iconButtonIcon, isPosting && { opacity: 0.5 }]}>📷</Text>
              <Text style={[styles.iconButtonLabel, prayerImage && styles.iconButtonLabelActive, isPosting && { opacity: 0.5 }]}>Picture</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.iconButton, !newPrayer.isPublic && styles.iconButtonActive]}
              onPress={() => setNewPrayer({...newPrayer, isPublic: !newPrayer.isPublic})}
              disabled={isPosting}
              data-testid="button-toggle-church"
            >
              <Text style={[styles.iconButtonIcon, isPosting && { opacity: 0.5 }]}>⛪</Text>
              <Text style={[styles.iconButtonLabel, !newPrayer.isPublic && styles.iconButtonLabelActive, isPosting && { opacity: 0.5 }]}>My Church</Text>
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
              <Text style={styles.postButtonText}>Post Request</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Banner Ad - only show if AdMob is available (not in Expo Go) */}
        {isAdMobAvailable && BannerAd && BANNER_AD_UNIT_ID && (
          <View style={styles.bannerAdContainer}>
            <BannerAd
              unitId={BANNER_AD_UNIT_ID}
              size={BannerAdSize.BANNER}
              requestOptions={{
                requestNonPersonalizedAdsOnly: true,
              }}
              onAdLoaded={() => console.log('Banner ad loaded')}
              onAdFailedToLoad={(error) => console.log('Banner ad failed to load:', error)}
            />
          </View>
        )}

        {/* Community Wall Feed */}
        <View style={styles.feedHeaderSection}>
          <Text style={styles.feedTitle}>Community Prayers</Text>
          <View style={styles.filterButtonsContainer}>
            <TouchableOpacity 
              style={[styles.filterButton, hideAlreadyPrayed && styles.filterButtonActive]}
              onPress={() => setHideAlreadyPrayed(!hideAlreadyPrayed)}
              data-testid="button-filter-prayed"
            >
              <Text style={[styles.filterButtonText, hideAlreadyPrayed && styles.filterButtonTextActive]}>
                ✓ Prayed
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterButton, showChurchOnly && styles.filterButtonActive]}
              onPress={() => setShowChurchOnly(!showChurchOnly)}
              data-testid="button-filter-church"
            >
              <Text style={[styles.filterButtonText, showChurchOnly && styles.filterButtonTextActive]}>
                {showChurchOnly ? '⛪ Church' : '🌍 All'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {(() => {
          let filteredPrayers = communityPrayers;
          
          // Apply "Hide Prayed" filter (client-side only)
          if (hideAlreadyPrayed) {
            filteredPrayers = filteredPrayers.filter(prayer => !prayer.user_has_prayed);
          }
          
          // Church filter is now handled by backend via filterByChurch parameter
          
          // Show loading state during refresh instead of empty message
          if (refreshingCommunity && communityPrayers.length === 0) {
            return <Text style={styles.emptyText}>Loading prayers...</Text>;
          }
          
          if (communityPrayers.length === 0) {
            if (showChurchOnly) {
              return <Text style={styles.emptyText}>No prayers from your church yet. Tap the church button to see all prayers.</Text>;
            }
            return <Text style={styles.emptyText}>No prayers yet. Be the first to share!</Text>;
          }
          
          if (filteredPrayers.length === 0) {
            return <Text style={styles.emptyText}>All caught up! 🙏 Tap '✓ Prayed' to show all prayers.</Text>;
          }
          
          return filteredPrayers.map((prayer) => (
            <View key={prayer.id} style={styles.prayerCardContainer}>
              {/* Prayer Count Badge - Opens detail view */}
              {prayer.prayer_count > 0 && (
                <TouchableOpacity 
                  style={styles.prayerCountBadge}
                  onPress={() => openDetailModal(prayer)}
                  data-testid={`badge-prayer-count-${prayer.id}`}
                >
                  <Text style={styles.prayerCountText}>
                    🙏 {prayer.prayer_count} {prayer.prayer_count === 1 ? 'person' : 'people'} prayed
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={styles.communityPrayerCard}
                onPress={() => openDetailModal(prayer)}
                activeOpacity={0.9}
                data-testid={`card-prayer-${prayer.id}`}
              >
                {/* Options Menu - Three dots for share/edit/delete */}
                <PrayerOptionsMenu 
                  prayer={prayer}
                  currentUserId={currentUser?.id}
                  onEdit={handleEditPrayer}
                  onDelete={handleDeletePrayer}
                />
                
                <Text style={styles.prayerTitle}>{prayer.title}</Text>
                <Text style={styles.prayerContent} numberOfLines={4}>{prayer.content}</Text>
                
                {/* Prayer Image - Only show if image exists */}
                {(() => {
                  // Only show image if picture field exists and is not empty
                  if (prayer.picture && typeof prayer.picture === 'string' && prayer.picture.trim() !== '') {
                    const imageUrl = prayer.picture.startsWith('http') 
                      ? prayer.picture 
                      : `https://shouldcallpaul.replit.app/${prayer.picture}`;
                    
                    return (
                      <Image 
                        source={{ uri: imageUrl }}
                        style={styles.prayerCardImage}
                        resizeMode="cover"
                        onError={(error) => console.log(`❌ Image load error for prayer ${prayer.id}:`, error.nativeEvent.error)}
                        onLoad={() => {}}
                      />
                    );
                  }
                  return null;
                })()}
                
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
              </TouchableOpacity>
            </View>
          ));
        })()}
      </ScrollView>

      {/* FULL SCREEN Prayer Modal with Beautiful Animations */}
      <Modal
        visible={prayerModal.visible}
        transparent={false}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={closePrayerModal}
      >
        <Animated.View 
          style={[
            styles.fullScreenModalOverlay,
            {
              opacity: modalOpacityAnim,
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.fullScreenModalContent,
              {
                transform: [
                  { translateY: modalSlideAnim }
                ]
              }
            ]}
          >
            {/* Beautiful Header with Gradient-like effect */}
            <View style={styles.fullScreenModalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.fullScreenModalTitle}>🙏 Prayer</Text>
                <Text style={styles.fullScreenModalSubtitle}>for {prayerModal.prayer?.author}</Text>
              </View>
              <TouchableOpacity onPress={closePrayerModal} style={styles.fullScreenCloseButton}>
                <Text style={styles.fullScreenCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {prayerModal.loading ? (
              <View style={styles.fullScreenLoadingContainer}>
                <View style={styles.loadingPulse}>
                  <Text style={styles.loadingPrayerHands}>🙏</Text>
                </View>
                <Text style={styles.fullScreenLoadingText}>Preparing your prayer...</Text>
              </View>
            ) : (
              <>
                <ScrollView 
                  style={styles.fullScreenPrayerTextContainer}
                  contentContainerStyle={styles.fullScreenPrayerTextContent}
                  showsVerticalScrollIndicator={false}
                >
                  <HtmlText html={prayerModal.generatedPrayer} style={styles.fullScreenGeneratedPrayer} />
                </ScrollView>
                <View style={styles.fullScreenButtonContainer}>
                  <TouchableOpacity style={styles.fullScreenAmenButton} onPress={markAsPrayed}>
                    <Text style={styles.fullScreenAmenButtonText}>Amen 🙏</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            
            {/* CELEBRATION FIREWORKS & CONFETTI! */}
            {showPrayerAnimation && (
              <View style={styles.celebrationContainer} pointerEvents="none">
                {confettiAnims.map((anim, index) => {
                  // Random trajectories for each confetti piece!
                  const randomAngle = (Math.random() * Math.PI * 2);
                  const randomDistance = 100 + Math.random() * 150; // Between 100-250
                  const x = Math.cos(randomAngle) * randomDistance;
                  const y = Math.sin(randomAngle) * randomDistance - 50; // Bias upward
                  
                  // Random rotation
                  const randomRotation = Math.random() * 720 - 360; // -360 to 360 degrees
                  
                  // Pick random celebration emoji
                  const emoji = celebrationEmojis[index % celebrationEmojis.length];
                  
                  return (
                    <Animated.View
                      key={index}
                      style={[
                        styles.confettiPiece,
                        {
                          transform: [
                            {
                              translateX: anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, x],
                              }),
                            },
                            {
                              translateY: anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, y],
                              }),
                            },
                            {
                              rotate: anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', `${randomRotation}deg`],
                              }),
                            },
                            {
                              scale: anim.interpolate({
                                inputRange: [0, 0.3, 0.7, 1],
                                outputRange: [0, 1.8, 1.5, 0.5],
                              }),
                            },
                          ],
                          opacity: anim.interpolate({
                            inputRange: [0, 0.2, 0.8, 1],
                            outputRange: [0, 1, 1, 0],
                          }),
                        },
                      ]}
                    >
                      <Text style={styles.confettiEmoji}>{emoji}</Text>
                    </Animated.View>
                  );
                })}
                
                {/* Center BURST effect */}
                <Animated.View
                  style={[
                    styles.burstCenter,
                    {
                      opacity: confettiAnims[0].interpolate({
                        inputRange: [0, 0.3, 0.6, 1],
                        outputRange: [0, 1, 0.5, 0],
                      }),
                      transform: [
                        {
                          scale: confettiAnims[0].interpolate({
                            inputRange: [0, 0.3, 1],
                            outputRange: [0.5, 2, 3],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.burstEmoji}>🎉</Text>
                </Animated.View>
                
                {/* Success message */}
                <Animated.View
                  style={[
                    styles.successMessage,
                    {
                      opacity: confettiAnims[0].interpolate({
                        inputRange: [0, 0.3, 0.7, 1],
                        outputRange: [0, 1, 1, 0],
                      }),
                      transform: [
                        {
                          scale: confettiAnims[0].interpolate({
                            inputRange: [0, 0.3, 1],
                            outputRange: [0.5, 1.1, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.successText}>Prayer Sent! 🙏</Text>
                </Animated.View>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Edit Prayer Modal */}
      <Modal
        visible={editPrayerModal.visible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditPrayerModal({ visible: false, prayer: null, title: '', content: '', isLoading: false })}
      >
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.editModalOverlay}>
            <View style={styles.editModalContent}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>Edit Prayer Request</Text>
                <TouchableOpacity 
                  onPress={() => setEditPrayerModal({ visible: false, prayer: null, title: '', content: '', isLoading: false })}
                  style={styles.editModalCloseButton}
                >
                  <Text style={styles.editModalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.editModalBody} keyboardShouldPersistTaps="handled">
                <Text style={styles.inputLabel}>Prayer Request</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { minHeight: 150 }]}
                  placeholder="Your prayer request..."
                  multiline
                  numberOfLines={8}
                  value={editPrayerModal.content}
                  onChangeText={(text) => setEditPrayerModal(prev => ({ ...prev, content: text }))}
                  textAlignVertical="top"
                  data-testid="input-edit-content"
                />
              </ScrollView>
              
              <View style={styles.editModalFooter}>
                <TouchableOpacity 
                  style={styles.editModalCancelButton}
                  onPress={() => setEditPrayerModal({ visible: false, prayer: null, title: '', content: '', isLoading: false })}
                >
                  <Text style={styles.editModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.editModalSaveButton, editPrayerModal.isLoading && styles.buttonDisabled]}
                  onPress={saveEditedPrayer}
                  disabled={editPrayerModal.isLoading}
                  data-testid="button-save-edit"
                >
                  <Text style={styles.editModalSaveText}>
                    {editPrayerModal.isLoading ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* NOTE: Prayer Detail View now uses PrayerDetailScreen component instead of a modal */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  bannerAdContainer: {
    alignItems: 'center',
    marginVertical: 10,
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
    paddingTop: 20,
    paddingBottom: 100,
    paddingHorizontal: 20,
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
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    color: '#000',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  checkboxChecked: {
    backgroundColor: '#ede9fe',
    borderColor: '#8b5cf6',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  checkboxMark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxText: {
    fontSize: 17,
    color: '#475569',
    fontWeight: '500',
  },
  checkboxTextChecked: {
    color: '#7c3aed',
    fontWeight: '600',
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
  // FULL SCREEN MODAL STYLES - Beautiful & Immersive!
  fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  fullScreenModalContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  fullScreenModalHeader: {
    backgroundColor: '#6366f1',
    paddingTop: 70,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeaderContent: {
    alignItems: 'center',
    marginBottom: 0,
  },
  fullScreenModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  fullScreenModalSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  fullScreenCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenCloseButtonText: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '300',
  },
  fullScreenLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingPulse: {
    marginBottom: 30,
  },
  loadingPrayerHands: {
    fontSize: 80,
  },
  fullScreenLoadingText: {
    fontSize: 20,
    color: '#6366f1',
    fontWeight: '500',
  },
  fullScreenPrayerTextContainer: {
    flex: 1,
  },
  fullScreenPrayerTextContent: {
    padding: 30,
    paddingBottom: 250,
  },
  fullScreenGeneratedPrayer: {
    fontSize: 18,
    lineHeight: 32,
    color: '#1f2937',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  fullScreenButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  fullScreenAmenButton: {
    backgroundColor: '#6366f1',
    paddingTop: 24,
    paddingBottom: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  fullScreenAmenButtonText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  // CELEBRATION FIREWORKS & CONFETTI styles!
  celebrationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
  },
  confettiEmoji: {
    fontSize: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  burstCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  burstEmoji: {
    fontSize: 80,
    textShadowColor: 'rgba(255, 215, 0, 1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  successMessage: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    textAlign: 'center',
  },
  // Profile and Settings styles
  settingsButton: {
    padding: 10,
  },
  settingsIcon: {
    fontSize: 24,
  },
  editButton: {
    padding: 10,
  },
  editIcon: {
    fontSize: 22,
  },
  editInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    marginTop: 8,
  },
  editTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  churchSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  churchSelectorText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  churchSelectorArrow: {
    fontSize: 14,
    color: '#6b7280',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  editActionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#6366f1',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  churchPickerModal: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  churchPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  churchPickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  churchPickerClose: {
    fontSize: 28,
    color: '#6b7280',
    padding: 4,
  },
  churchList: {
    flex: 1,
  },
  churchOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  churchOptionText: {
    fontSize: 17,
    color: '#1f2937',
    flex: 1,
    paddingRight: 10,
  },
  churchSelectedCheck: {
    fontSize: 22,
    color: '#6366f1',
    fontWeight: 'bold',
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
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cameraIcon: {
    fontSize: 18,
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
    paddingBottom: 100,
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
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 80,
  },
  iconButtonActive: {
    backgroundColor: '#f0f4ff',
  },
  iconButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
    filter: 'grayscale(100%)',
  },
  iconButtonLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  iconButtonLabelActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  linkButton: {
    padding: 8,
  },
  linkButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  prayerCardImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
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
  feedHeaderSection: {
    marginHorizontal: 15,
    marginBottom: 10,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginHorizontal: 0,
    marginBottom: 8,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  filterButton: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  personalRequestsSection: {
    marginTop: 20,
  },
  // Edit Prayer Modal Styles
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalCloseText: {
    fontSize: 18,
    color: '#666',
  },
  editModalBody: {
    padding: 16,
  },
  editModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  editModalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  editModalCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  editModalSaveButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  editModalSaveText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  // Detail Modal Styles (Instagram-style full-screen prayer view)
  detailModalOverlay: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  detailSwipeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  detailModalContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  detailCloseButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCloseButtonText: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  detailSwipeIndicator: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  detailSwipeIndicatorText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.5)',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailScrollView: {
    flex: 1,
  },
  detailScrollContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  detailScrollContentCentered: {
    justifyContent: 'center',
    minHeight: '100%',
  },
  detailTapOutside: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  detailImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  detailContentContainer: {
    padding: 20,
  },
  detailPrayerCountBadge: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  detailPrayerCountText: {
    fontSize: 15,
    color: '#3b82f6',
    fontWeight: '600',
  },
  detailPrayerNamesList: {
    marginTop: 10,
    gap: 8,
  },
  detailPrayerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailPrayerNameAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailPrayerNameAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  detailPrayerNameAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  detailPrayerNameText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  detailAuthorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailAuthorInfo: {
    flex: 1,
  },
  detailAuthorName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  detailDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  detailCategoryBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  detailCategoryText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    lineHeight: 28,
  },
  // New layout styles
  detailTitleLarge: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 32,
  },
  detailAuthorTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  detailAuthorFirstName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366f1',
  },
  detailTimeDot: {
    fontSize: 15,
    color: '#9ca3af',
  },
  detailRelativeTime: {
    fontSize: 15,
    color: '#6b7280',
  },
  detailCategoryBadgeSmall: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  detailCategoryTextSmall: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailImageBanner: {
    width: '100%',
    height: 220,
    marginBottom: 16,
  },
  detailPrayerText: {
    fontSize: 17,
    color: '#374151',
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  detailActionContainer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  detailPrayButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailPrayButtonPrayed: {
    backgroundColor: '#10b981',
  },
  detailPrayButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  detailPrayButtonTextPrayed: {
    color: '#ffffff',
  },
  // Generated Prayer Collapsible Styles
  generatedPrayerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  generatedPrayerToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  generatedPrayerToggleArrow: {
    fontSize: 14,
    color: '#6366f1',
  },
  generatedPrayerContainer: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  generatedPrayerLoading: {
    alignItems: 'center',
    padding: 20,
  },
  generatedPrayerLoadingText: {
    fontSize: 14,
    color: '#92400e',
    marginTop: 10,
  },
  generatedPrayerText: {
    fontSize: 16,
    color: '#92400e',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  // Swipe Hint Styles
  swipeHintContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  swipeHintText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Swipe Prayed Confirmation Overlay
  swipePrayedOverlay: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    marginLeft: -60,
    width: 120,
    height: 120,
    backgroundColor: '#10b981',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  swipePrayedCheckmark: {
    fontSize: 48,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  swipePrayedText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    marginTop: 4,
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