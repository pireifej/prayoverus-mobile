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
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const API_BASE_URL = 'https://shouldcallpaul.replit.app';

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
  
  const fetchPrayerById = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      
      const response = await fetch(`${API_BASE_URL}/getRequestById`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: id,
          tz: timezone,
          userId: userId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch prayer details');
      }
      
      const data = await response.json();
      setPrayer(data);
    } catch (err) {
      console.error('Error fetching prayer:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (requestId) {
      fetchPrayerById(requestId);
    } else if (prayerIds.length > 0 && prayerIds[index]) {
      fetchPrayerById(prayerIds[index]);
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
    }
  };
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };
  
  // Navigation is only available when index >= 0 (prayer is in the feed list)
  const isInFeedList = index >= 0 && prayerIds.length > 0;
  const canGoPrevious = isInFeedList && index > 0;
  const canGoNext = isInFeedList && index < prayerIds.length - 1;
  
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
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
        <View style={styles.header}>
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
      
      <View style={styles.header}>
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
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={false}
      >
        <View style={styles.contentContainer}>
          {prayer?.title && (
            <Text style={styles.titleLarge} selectable={true}>{prayer.title}</Text>
          )}
          
          <View style={styles.authorTimeRow}>
            <Text style={styles.authorFirstName}>
              {prayer?.author?.split(' ')[0] || prayer?.author}
            </Text>
            <Text style={styles.timeDot}> • </Text>
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
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    paddingBottom: 40,
    flexGrow: 1,
  },
  contentContainer: {
    padding: 20,
  },
  titleLarge: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 32,
  },
  authorTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
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
