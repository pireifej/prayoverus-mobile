import React, { useState, useEffect, useRef } from 'react';
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
  StatusBar as RNStatusBar
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';

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
  const [showPrayedConfirmation, setShowPrayedConfirmation] = useState(false);
  
  // Safe top padding based on platform
  const safeTopPadding = getStatusBarHeight();
  
  // Cache for loaded prayers (persists across swipes)
  const prayerCacheRef = useRef({});
  
  // Swipe animation
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isSwipingRef = useRef(false);
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
  
  // PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Block swipes while loading to prevent race conditions
        if (isLoadingRef.current) {
          return false;
        }
        // Only respond to horizontal swipes (more horizontal than vertical)
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        const isSignificantMove = Math.abs(gestureState.dx) > 10;
        return isHorizontalSwipe && isSignificantMove;
      },
      onPanResponderGrant: () => {
        isSwipingRef.current = true;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Limit swipe distance and add resistance at edges
        let dx = gestureState.dx;
        
        // Add resistance if can't navigate in that direction
        if (dx > 0 && !canGoPreviousRef.current) {
          dx = dx * 0.3; // Resistance when swiping right but can't go previous
        }
        if (dx < 0 && !canGoNextRef.current) {
          dx = dx * 0.3; // Resistance when swiping left but can't go next
        }
        
        swipeAnim.setValue(dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        isSwipingRef.current = false;
        
        if (gestureState.dx > SWIPE_THRESHOLD && canGoPreviousRef.current) {
          // Swipe right - go to previous
          // Show loading overlay immediately
          setIsLoadingNewPrayer(true);
          isLoadingRef.current = true;
          
          Animated.timing(swipeAnim, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // Reset all animations to default
            swipeAnim.setValue(0);
            slideAnim.setValue(0);
            contentOpacity.setValue(1);
            // Navigate to previous - use refs to get current values
            const currentIdx = indexRef.current;
            const ids = prayerIdsRef.current;
            const newIndex = currentIdx - 1;
            setIndex(newIndex);
            if (onNavigate && ids[newIndex] !== undefined) {
              onNavigate(ids[newIndex], newIndex);
            }
          });
        } else if (gestureState.dx < -SWIPE_THRESHOLD && canGoNextRef.current) {
          // Swipe left - go to next
          // Show loading overlay immediately
          setIsLoadingNewPrayer(true);
          isLoadingRef.current = true;
          
          Animated.timing(swipeAnim, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // Reset all animations to default
            swipeAnim.setValue(0);
            slideAnim.setValue(0);
            contentOpacity.setValue(1);
            // Navigate to next - use refs to get current values
            const currentIdx = indexRef.current;
            const ids = prayerIdsRef.current;
            const newIndex = currentIdx + 1;
            setIndex(newIndex);
            if (onNavigate && ids[newIndex] !== undefined) {
              onNavigate(ids[newIndex], newIndex);
            }
          });
        } else {
          // Snap back
          Animated.spring(swipeAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        isSwipingRef.current = false;
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
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
        tz: timezone,
        userId: userId
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
          user_has_prayed: false,
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
      onPray(prayer);
      
      // Show "Prayed!" confirmation
      setShowPrayedConfirmation(true);
      
      // Determine what happens after confirmation
      const isFromDeepLink = !isInFeedList;
      const hasNextPrayer = isInFeedList && index < prayerIds.length - 1;
      
      setTimeout(() => {
        setShowPrayedConfirmation(false);
        
        if (isFromDeepLink) {
          // From deep link - close and go back to community wall
          if (onClose) {
            onClose();
          }
        } else if (hasNextPrayer) {
          // From community wall with more prayers - auto-advance to next
          const newIndex = index + 1;
          setIsLoadingNewPrayer(true);
          isLoadingRef.current = true;
          setIndex(newIndex);
          if (onNavigate) {
            onNavigate(prayerIds[newIndex], newIndex);
          }
        } else {
          // From community wall but no more prayers - close
          if (onClose) {
            onClose();
          }
        }
      }, 1200); // Show confirmation for 1.2 seconds
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

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={headerStyle}>
          <View style={styles.navButtonsContainer}>
            <View style={[styles.navButton, styles.navButtonDisabled]}>
              <Text style={styles.navButtonTextDisabled}>←</Text>
            </View>
            <Text style={styles.navCounter}>Loading...</Text>
            <View style={[styles.navButton, styles.navButtonDisabled]}>
              <Text style={styles.navButtonTextDisabled}>→</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading prayer...</Text>
        </View>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={headerStyle}>
          <View style={styles.navButtonsContainer} />
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
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
      <StatusBar style="dark" />
      
      <View style={headerStyle}>
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
        
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      {/* Loading overlay during transitions */}
      {isLoadingNewPrayer && (
        <View style={styles.transitionOverlay}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.transitionText}>Loading...</Text>
        </View>
      )}
      
      {/* Prayed! confirmation overlay */}
      {showPrayedConfirmation && (
        <View style={styles.prayedConfirmationOverlay}>
          <View style={styles.prayedConfirmationContent}>
            <Text style={styles.prayedConfirmationIcon}>🙏</Text>
            <Text style={styles.prayedConfirmationText}>Prayed!</Text>
          </View>
        </View>
      )}
      
      {/* Swipeable content area with slide and fade animation */}
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
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
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
            {prayer?.title && (
              <Text style={styles.titleLarge} selectable={true}>{prayer.title}</Text>
            )}
          </View>
          
          <View style={styles.authorTimeRow}>
            {prayer?.real_name && (
              <>
                <Text style={styles.realName}>{prayer.real_name}</Text>
                <Text style={styles.timeDot}> • </Text>
              </>
            )}
            <Text style={styles.relativeTime}>
              {getRelativeTime(prayer?.date)}
            </Text>
            {prayer?.category && (
              <>
                <Text style={styles.timeDot}> • </Text>
                <View style={styles.categoryBadgeSmall}>
                  <Text style={styles.categoryTextSmall}>{prayer.category}</Text>
                </View>
              </>
            )}
          </View>
        </View>
        
        {prayer?.picture && prayer.picture.trim() !== '' && (
          <Image 
            source={{ 
              uri: prayer.picture.startsWith('http') 
                ? prayer.picture 
                : `${API_BASE_URL}/${prayer.picture}` 
            }}
            style={styles.imageBanner}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.contentContainer}>
          {prayer?.prayer_count > 0 && (
            <View style={styles.prayerCountBadge}>
              <Text style={styles.prayerCountText}>
                🙏 {prayer.prayer_count} {prayer.prayer_count === 1 ? 'person' : 'people'} prayed
              </Text>
              {prayer.prayed_by_people && prayer.prayed_by_people.length > 0 && (
                <View style={styles.prayerNamesList}>
                  {prayer.prayed_by_people.map((person, idx) => (
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
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
          
          <Text style={styles.prayerText} selectable={true}>{prayer?.content}</Text>
          
          <View style={styles.actionContainer}>
            <AnimatedButton 
              style={[
                styles.prayButton,
                prayer?.user_has_prayed && styles.prayButtonPrayed
              ]} 
              onPress={handlePray}
              data-testid="button-pray-detail"
            >
              <Text style={[
                styles.prayButtonText,
                prayer?.user_has_prayed && styles.prayButtonTextPrayed
              ]}>
                {prayer?.user_has_prayed ? '✓ You Prayed' : '🙏 Pray for this'}
              </Text>
            </AnimatedButton>
          </View>
        </View>
      </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 18,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  transitionText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  prayedConfirmationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(99, 102, 241, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  prayedConfirmationContent: {
    alignItems: 'center',
  },
  prayedConfirmationIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  prayedConfirmationText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  navButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonActive: {
    backgroundColor: '#6366f1',
  },
  navButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  navButtonTextDisabled: {
    color: '#9ca3af',
    fontSize: 18,
  },
  navCounter: {
    fontSize: 14,
    color: '#6b7280',
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#374151',
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
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
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
  contentContainer: {
    padding: 24,
    paddingTop: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    lineHeight: 30,
    flex: 1,
    flexWrap: 'wrap',
  },
  authorTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    marginLeft: 60,
  },
  authorAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  authorAvatarPlaceholderLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorAvatarTextLarge: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  authorAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  authorAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  realName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  authorFirstName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366f1',
  },
  timeDot: {
    fontSize: 15,
    color: '#9ca3af',
  },
  relativeTime: {
    fontSize: 15,
    color: '#6b7280',
  },
  categoryBadgeSmall: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryTextSmall: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  imageBanner: {
    width: '100%',
    height: 220,
    marginBottom: 16,
  },
  prayerCountBadge: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  prayerCountText: {
    fontSize: 15,
    color: '#3b82f6',
    fontWeight: '600',
  },
  prayerNamesList: {
    marginTop: 10,
    gap: 8,
  },
  prayerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prayerNameAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
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
  prayerText: {
    fontSize: 17,
    color: '#374151',
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  actionContainer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  prayButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  prayButtonPrayed: {
    backgroundColor: '#10b981',
  },
  prayButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  prayButtonTextPrayed: {
    color: '#ffffff',
  },
});
