import React, { useState, useEffect, useRef, useCallback } from 'react';

const FAITH_RANKS = [
  { level: 0,  title: 'Newcomer',            minPoints: 0,     icon: '🌱' },
  { level: 1,  title: 'New Believer',        minPoints: 1,     icon: '🕊️' },
  { level: 2,  title: 'Seed Planter',        minPoints: 20,    icon: '🌿' },
  { level: 3,  title: 'Growing in Faith',    minPoints: 50,    icon: '📖' },
  { level: 4,  title: 'Prayer Partner',      minPoints: 100,   icon: '🤝' },
  { level: 5,  title: 'Faithful Friend',     minPoints: 150,   icon: '💛' },
  { level: 6,  title: 'Prayer Leader',       minPoints: 250,   icon: '📿' },
  { level: 7,  title: 'Devoted Believer',    minPoints: 350,   icon: '✝️' },
  { level: 8,  title: 'Prayer Champion',     minPoints: 500,   icon: '🏆' },
  { level: 9,  title: 'Faithful Servant',    minPoints: 750,   icon: '⭐' },
  { level: 10, title: 'Prayer Warrior',      minPoints: 1000,  icon: '👑' },
];

const getFaithRank = (points, backendRank) => {
  if (backendRank && typeof backendRank === 'object' && backendRank.level !== undefined) {
    return {
      level: backendRank.level,
      title: backendRank.title,
      icon: backendRank.icon || '🛡️',
      minPoints: backendRank.min_points || 0,
    };
  }
  const p = points || 0;
  let rank = FAITH_RANKS[0];
  for (let i = FAITH_RANKS.length - 1; i >= 0; i--) {
    if (p >= FAITH_RANKS[i].minPoints) {
      rank = FAITH_RANKS[i];
      break;
    }
  }
  return rank;
};
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Animated,
  Alert,
  Dimensions,
  PanResponder,
  Platform,
  StatusBar as RNStatusBar,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';

// Calculate safe top padding based on platform
const getStatusBarHeight = () => {
  if (Platform.OS === 'ios') {
    // Use Constants.statusBarHeight for iOS (accounts for notch)
    return Constants.statusBarHeight || 44;
  }
  // Android status bar height
  return RNStatusBar.currentHeight || 24;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;

const API_BASE_URL = 'https://shouldcallpaul.replit.app';

// Base64 encode for Basic Auth
const base64Encode = (str) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let i = 0; i < str.length; i += 3) {
    const byte1 = str.charCodeAt(i);
    const byte2 = str.charCodeAt(i + 1);
    const byte3 = str.charCodeAt(i + 2);
    const enc1 = byte1 >> 2;
    const enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);
    const enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
    const enc4 = byte3 & 63;
    if (isNaN(byte2)) {
      output += chars.charAt(enc1) + chars.charAt(enc2) + '==';
    } else if (isNaN(byte3)) {
      output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + '=';
    } else {
      output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
    }
  }
  return output;
};

const API_AUTH = 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc');

const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${diffYears}y ago`;
};

const AnimatedButton = ({ children, style, onPress, disabled, ...props }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
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
};

export default function PrayerDetailScreen({ 
  requestId, 
  prayerIds = [],
  currentIndex = 0,
  userId,
  onClose,
  onPray,
  onNavigate
}) {
  const [prayer, setPrayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(currentIndex);
  const [isLoadingNewPrayer, setIsLoadingNewPrayer] = useState(false);
  const [rankTooltip, setRankTooltip] = useState(null);
  
  // Safe top padding based on platform
  const safeTopPadding = getStatusBarHeight();
  
  // Cache for loaded prayers (persists across swipes)
  const prayerCacheRef = useRef({});
  
  // Swipe animation
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isLoadingRef = useRef(false);
  const loadingTimeoutRef = useRef(null);
  
  // Refs to track current values for PanResponder (avoids stale closure)
  const indexRef = useRef(index);
  const prayerIdsRef = useRef(prayerIds);
  
  // Navigation is only available when index >= 0 (prayer is in the feed list)
  const isInFeedList = index >= 0 && prayerIds.length > 0;
  const canGoPreviousRef = useRef(false);
  const canGoNextRef = useRef(false);
  
  // Update refs when state changes (critical for PanResponder)
  useEffect(() => {
    indexRef.current = index;
    prayerIdsRef.current = prayerIds;
    canGoPreviousRef.current = isInFeedList && index > 0;
    canGoNextRef.current = isInFeedList && index < prayerIds.length - 1;
  }, [isInFeedList, index, prayerIds]);
  
  // PanResponder for swipe gestures — Rosary-style: detect threshold on release only,
  // no per-frame move tracking, so the JS thread stays free and swipes feel native-smooth.
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => {
        if (isLoadingRef.current) return false;
        return Math.abs(gs.dx) > 15 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.8;
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -SWIPE_THRESHOLD && canGoNextRef.current) {
          setIsLoadingNewPrayer(true);
          isLoadingRef.current = true;
          Animated.timing(swipeAnim, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            swipeAnim.setValue(0);
            slideAnim.setValue(0);
            contentOpacity.setValue(1);
            const newIndex = indexRef.current + 1;
            const ids = prayerIdsRef.current;
            setIndex(newIndex);
            if (onNavigate && ids[newIndex] !== undefined) {
              onNavigate(ids[newIndex], newIndex);
            }
          });
        } else if (gs.dx > SWIPE_THRESHOLD && canGoPreviousRef.current) {
          setIsLoadingNewPrayer(true);
          isLoadingRef.current = true;
          Animated.timing(swipeAnim, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            swipeAnim.setValue(0);
            slideAnim.setValue(0);
            contentOpacity.setValue(1);
            const newIndex = indexRef.current - 1;
            const ids = prayerIdsRef.current;
            setIndex(newIndex);
            if (onNavigate && ids[newIndex] !== undefined) {
              onNavigate(ids[newIndex], newIndex);
            }
          });
        }
      },
      onPanResponderTerminate: () => {},
    })
  ).current;
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle close with error message
  const handleErrorClose = (message) => {
    console.log('📍 Error closing prayer detail:', message);
    Alert.alert(
      'Unable to load prayer',
      message || 'Please try again later.',
      [{ text: 'OK', onPress: onClose }]
    );
  };
  
  const fetchPrayerById = async (id, useTransition = false) => {
    console.log('📍 fetchPrayerById called with id:', id, 'useTransition:', useTransition);
    
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Check cache first
    if (prayerCacheRef.current[id]) {
      console.log('📍 Using cached prayer for ID:', id);
      // Reset all state and animations
      isLoadingRef.current = false;
      setIsLoadingNewPrayer(false);
      setPrayer(prayerCacheRef.current[id]);
      setLoading(false);
      // Ensure animations are reset
      contentOpacity.setValue(1);
      slideAnim.setValue(0);
      swipeAnim.setValue(0);
      return;
    }
    
    // Mark as loading to block swipes (overlay already shown from swipe handler)
    isLoadingRef.current = true;
    if (!isLoadingNewPrayer) {
      setIsLoadingNewPrayer(true);
    }
    setLoading(true);
    setError(null);
    
    // Set timeout - if loading takes too long, close and go back
    loadingTimeoutRef.current = setTimeout(() => {
      console.log('📍 Loading timeout reached for prayer ID:', id);
      isLoadingRef.current = false;
      setIsLoadingNewPrayer(false);
      setLoading(false);
      contentOpacity.setValue(1);
      slideAnim.setValue(0);
      swipeAnim.setValue(0);
      handleErrorClose('The prayer took too long to load.');
    }, 5000);
    
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      
      const payload = {
        requestId: id,
        userId: userId,
        tz: timezone
      };
      
      console.log('📍 Fetching prayer by ID:', id);
      
      const response = await fetch(`${API_BASE_URL}/getRequestById`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': API_AUTH,
        },
        body: JSON.stringify(payload),
      });
      
      // Clear timeout on successful response
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Failed to fetch prayer: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📍 Got response for prayer ID:', id);
      
      // API returns { error: 0, request: {...} } format
      if (data.error === 0 && data.request) {
        // Map API response fields to our prayer format
        const prayerData = {
          id: data.request.request_id,
          title: data.request.request_title,
          content: data.request.request_text,
          author: data.request.real_name || data.request.user_name,
          real_name: data.request.real_name,
          picture: data.request.request_picture,
          date: data.request.timestamp,
          category: null,
          prayer_count: data.request.prayer_count || 0,
          user_has_prayed: data.request.user_has_prayed || false,
          prayed_by_people: data.request.prayed_by_people || 
            (data.request.prayed_by_names || []).map(name => ({
              name: name,
              picture: null
            })),
          user_picture: data.request.user_picture,
          church_id: data.request.church_id,
          my_church_only: data.request.my_church_only
        };
        
        // Cache the prayer
        prayerCacheRef.current[id] = prayerData;
        console.log('📍 Cached prayer for ID:', id);
        
        // Update state - reset everything cleanly
        isLoadingRef.current = false;
        setIsLoadingNewPrayer(false);
        setPrayer(prayerData);
        setLoading(false);
        // Ensure all animations are reset
        contentOpacity.setValue(1);
        slideAnim.setValue(0);
        swipeAnim.setValue(0);
      } else {
        throw new Error('Prayer not found');
      }
    } catch (err) {
      console.error('Error fetching prayer:', err);
      
      // Clear timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      // Reset all state and animations
      isLoadingRef.current = false;
      setIsLoadingNewPrayer(false);
      setLoading(false);
      contentOpacity.setValue(1);
      slideAnim.setValue(0);
      swipeAnim.setValue(0);
      
      // Show error and close
      handleErrorClose(err.message);
    }
  };
  
  // Track if this is the initial load and the initial requestId
  const isInitialLoadRef = useRef(true);
  const initialRequestIdRef = useRef(requestId);
  
  useEffect(() => {
    let idToFetch;
    
    // On initial load, use the requestId prop if provided
    if (isInitialLoadRef.current && requestId) {
      idToFetch = requestId;
    } else if (prayerIds.length > 0 && index >= 0 && prayerIds[index] !== undefined) {
      // For subsequent navigations, use the prayer ID at current index
      idToFetch = prayerIds[index];
    } else if (requestId) {
      // Fallback to requestId if no prayerIds
      idToFetch = requestId;
    }
    
    if (idToFetch) {
      // Use transition animation for subsequent loads (not initial)
      const useTransition = !isInitialLoadRef.current;
      fetchPrayerById(idToFetch, useTransition);
      isInitialLoadRef.current = false;
    }
  }, [requestId, index]);

  // Pre-fetch adjacent prayers silently so swipe navigation is instant from cache
  useEffect(() => {
    if (!prayerIds.length || index < 0) return;
    const prefetch = async (id) => {
      if (!id || prayerCacheRef.current[id]) return;
      try {
        const res = await fetch(`${API_BASE_URL}/getRequestById`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': API_AUTH },
          body: JSON.stringify({ requestId: id, userId, tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York' }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.error === 0 && data.request) {
          const r = data.request;
          prayerCacheRef.current[id] = {
            id: r.request_id, title: r.request_title, content: r.request_text,
            author: r.real_name || r.user_name, real_name: r.real_name,
            picture: r.request_picture, date: r.timestamp, category: null,
            prayer_count: r.prayer_count || 0, user_has_prayed: r.user_has_prayed || false,
            prayed_by_people: r.prayed_by_people || (r.prayed_by_names || []).map(n => ({ name: n, picture: null })),
            user_picture: r.user_picture, church_id: r.church_id, my_church_only: r.my_church_only,
          };
        }
      } catch (_) {}
    };
    if (index + 1 < prayerIds.length) prefetch(prayerIds[index + 1]);
    if (index + 2 < prayerIds.length) prefetch(prayerIds[index + 2]);
  }, [index]);

  const handlePrevious = () => {
    if (index > 0) {
      const newIndex = index - 1;
      setIndex(newIndex);
      if (onNavigate) {
        onNavigate(prayerIds[newIndex], newIndex);
      }
    }
  };
  
  const handleNext = () => {
    if (index < prayerIds.length - 1) {
      const newIndex = index + 1;
      setIndex(newIndex);
      if (onNavigate) {
        onNavigate(prayerIds[newIndex], newIndex);
      }
    }
  };
  
  const handlePray = () => {
    if (prayer && onPray) {
      onPray(prayer, { index, prayerIds, isInFeedList });
    }
  };
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };
  
  const canGoPrevious = isInFeedList && index > 0;
  const canGoNext = isInFeedList && index < prayerIds.length - 1;
  
  // Dynamic header style with safe area padding
  const headerStyle = {
    ...styles.header,
    paddingTop: safeTopPadding + 16, // Safe area + extra padding
  };

  const renderGradientHeader = (centerContent, showClose = true) => (
    <LinearGradient
      colors={['#0f172a', '#1e3a5f', '#2563eb']}
      style={[styles.header, { paddingTop: safeTopPadding + 12 }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {centerContent}
      {showClose && (
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        {renderGradientHeader(
          <View style={styles.navButtonsContainer}>
            <View style={[styles.navButton, styles.navButtonDisabled]}>
              <Text style={styles.navButtonTextDisabled}>←</Text>
            </View>
            <Text style={styles.navCounter}>Loading...</Text>
            <View style={[styles.navButton, styles.navButtonDisabled]}>
              <Text style={styles.navButtonTextDisabled}>→</Text>
            </View>
          </View>
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading prayer...</Text>
        </View>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        {renderGradientHeader(<View style={styles.navButtonsContainer} />)}
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Could not load prayer</Text>
          <TouchableOpacity 
            onPress={() => fetchPrayerById(requestId || prayerIds[index])}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {renderGradientHeader(
        <View style={styles.navButtonsContainer}>
          <TouchableOpacity
            onPress={handlePrevious}
            disabled={!canGoPrevious}
            style={[
              styles.navButton,
              canGoPrevious ? styles.navButtonActive : styles.navButtonDisabled
            ]}
          >
            <Text style={canGoPrevious ? styles.navButtonText : styles.navButtonTextDisabled}>←</Text>
          </TouchableOpacity>
          
          {isInFeedList ? (
            <Text style={styles.navCounter}>
              {index + 1} / {prayerIds.length}
            </Text>
          ) : (
            <Text style={styles.navCounter}>Prayer Details</Text>
          )}
          
          <TouchableOpacity
            onPress={handleNext}
            disabled={!canGoNext}
            style={[
              styles.navButton,
              canGoNext ? styles.navButtonActive : styles.navButtonDisabled
            ]}
          >
            <Text style={canGoNext ? styles.navButtonText : styles.navButtonTextDisabled}>→</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {isLoadingNewPrayer && (
        <View style={styles.transitionOverlay}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.transitionText}>Loading...</Text>
        </View>
      )}
      
      <Animated.View 
        style={[
          styles.swipeContainer, 
          { 
            transform: [
              { translateX: Animated.add(swipeAnim, slideAnim) }
            ],
            opacity: contentOpacity
          }
        ]}
        {...panResponder.panHandlers}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={false}
        >
        <View style={styles.authorCard}>
          <View style={styles.authorCardLeft}>
            {prayer?.user_picture && prayer.user_picture.startsWith('http') ? (
              <Image 
                source={{ uri: prayer.user_picture }} 
                style={styles.authorAvatarLarge}
              />
            ) : (
              <View style={styles.authorAvatarPlaceholderLarge}>
                <Text style={styles.authorAvatarTextLarge}>
                  {prayer?.author ? prayer.author.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <View style={styles.authorCardInfo}>
              {prayer?.real_name && (
                <Text style={styles.realName}>{prayer.real_name}</Text>
              )}
              <Text style={styles.relativeTime}>
                {getRelativeTime(prayer?.date)}
                {prayer?.category ? ` • ${prayer.category}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {prayer?.title && (
          <View style={styles.titleContainer}>
            <Text style={styles.titleLarge} selectable={true}>{prayer.title}</Text>
          </View>
        )}
        
        {prayer?.picture && prayer.picture.trim() !== '' && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ 
                uri: prayer.picture.startsWith('http') 
                  ? prayer.picture 
                  : `${API_BASE_URL}/${prayer.picture}` 
              }}
              style={styles.imageBanner}
              resizeMode="cover"
            />
          </View>
        )}
        
        <View style={styles.contentContainer}>
          <Text style={styles.prayerText} selectable={true}>{prayer?.content}</Text>
        </View>

        {prayer?.prayer_count > 0 && (
          <View style={styles.prayerCountSection}>
            <View style={styles.prayerCountBadge}>
              <Text style={styles.prayerCountText}>
                🙏 {prayer.prayer_count} {prayer.prayer_count === 1 ? 'person' : 'people'} prayed
              </Text>
              {prayer.prayed_by_people && prayer.prayed_by_people.length > 0 && (
                <View style={styles.prayerNamesList}>
                  {prayer.prayed_by_people.map((person, idx) => {
                    const personRank = getFaithRank(person.faith_points, person.faith_rank);
                    return (
                      <View key={idx} style={styles.prayerNameRow}>
                        {person.picture && person.picture.startsWith('http') ? (
                          <Image 
                            source={{ uri: person.picture }} 
                            style={styles.prayerNameAvatarImage}
                          />
                        ) : (
                          <View style={styles.prayerNameAvatar}>
                            <Text style={styles.prayerNameAvatarText}>
                              {person.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.prayerNameText}>{person.name}</Text>
                        <TouchableOpacity
                          style={styles.faithBadge}
                          onPress={() => setRankTooltip({ name: person.name, rank: personRank })}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.faithBadgeShield}>🛡️</Text>
                          <Text style={styles.faithBadgeLevel}>{personRank.level}</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}
          
        <View style={styles.actionContainer}>
          <AnimatedButton 
            style={[
              styles.prayButton,
              prayer?.user_has_prayed && styles.prayButtonPrayed
            ]} 
            onPress={handlePray}
            data-testid="button-pray-detail"
          >
            {prayer?.user_has_prayed ? (
              <View style={styles.prayButtonInner}>
                <Text style={styles.prayButtonText}>✓ You Prayed</Text>
              </View>
            ) : (
              <LinearGradient
                colors={['#2563eb', '#1e40af']}
                style={styles.prayButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.prayButtonText}>🙏 Pray for this</Text>
              </LinearGradient>
            )}
          </AnimatedButton>
        </View>
      </ScrollView>
      </Animated.View>

      {rankTooltip && (
        <Modal transparent visible={true} animationType="fade" onRequestClose={() => setRankTooltip(null)}>
          <TouchableWithoutFeedback onPress={() => setRankTooltip(null)}>
            <View style={styles.rankTooltipOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.rankTooltipCard}>
                  <View style={styles.rankTooltipShield}>
                    <Text style={styles.rankTooltipShieldIcon}>🛡️</Text>
                    <Text style={styles.rankTooltipShieldLevel}>{rankTooltip.rank.level}</Text>
                  </View>
                  <Text style={styles.rankTooltipName}>{rankTooltip.name}</Text>
                  <Text style={styles.rankTooltipTitle}>{rankTooltip.rank.icon} {rankTooltip.rank.title}</Text>
                  <Text style={styles.rankTooltipPoints}>Level {rankTooltip.rank.level} of 13</Text>
                  <TouchableOpacity style={styles.rankTooltipClose} onPress={() => setRankTooltip(null)}>
                    <Text style={styles.rankTooltipCloseText}>Got it</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  swipeContainer: {
    flex: 1,
  },
  transitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(241, 245, 249, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  transitionText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  navButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 20,
  },
  navCounter: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
    flexGrow: 1,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  authorCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorCardInfo: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
  },
  titleLarge: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    lineHeight: 28,
  },
  authorAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#dbeafe',
  },
  authorAvatarPlaceholderLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorAvatarTextLarge: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  realName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  relativeTime: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  imageContainer: {
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  imageBanner: {
    width: '100%',
    height: 240,
  },
  prayerCountSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
  },
  prayerCountBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  prayerCountText: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '600',
  },
  prayerNamesList: {
    marginTop: 10,
    gap: 8,
  },
  prayerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  prayerNameAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prayerNameAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  prayerNameAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  prayerNameText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  faithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    justifyContent: 'center',
  },
  faithBadgeShield: {
    fontSize: 11,
    marginRight: 2,
  },
  faithBadgeLevel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e40af',
  },
  rankTooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankTooltipCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  rankTooltipShield: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankTooltipShieldIcon: {
    fontSize: 28,
    position: 'absolute',
    top: 6,
  },
  rankTooltipShieldLevel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 16,
  },
  rankTooltipName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  rankTooltipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 4,
  },
  rankTooltipPoints: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 16,
  },
  rankTooltipClose: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    minHeight: 48,
    justifyContent: 'center',
  },
  rankTooltipCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  prayerText: {
    fontSize: 17,
    color: '#334155',
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 16,
  },
  prayButton: {
    borderRadius: 14,
    overflow: 'hidden',
    minHeight: 52,
  },
  prayButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
  },
  prayButtonInner: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  prayButtonPrayed: {
    backgroundColor: '#10b981',
    borderRadius: 14,
  },
  prayButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
});
