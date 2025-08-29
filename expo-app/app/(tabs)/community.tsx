import React, { useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Avatar,
  Button,
  Surface,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

// Mock community prayer data
const mockCommunityPrayers = [
  {
    id: '1',
    title: 'Strength During Chemotherapy',
    content: 'My mother is going through chemotherapy and we need prayers for strength, healing, and peace during this difficult journey. She has always been the pillar of our family.',
    status: 'ongoing' as const,
    user: {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Johnson',
    },
    supportCount: 23,
    commentCount: 7,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'Safe Travels for Mission Trip',
    content: 'Our youth group is traveling to Guatemala for a mission trip next week. Please pray for safe travels, open hearts, and that we can be a blessing to the community we serve.',
    status: 'ongoing' as const,
    user: {
      id: '3',
      firstName: 'Michael',
      lastName: 'Chen',
    },
    supportCount: 45,
    commentCount: 12,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Grateful for New Job!',
    content: 'Thank you everyone who prayed for my job search! God is faithful - I just got offered a position that is perfect for my family\'s needs. Praise the Lord!',
    status: 'answered' as const,
    user: {
      id: '4',
      firstName: 'David',
      lastName: 'Rodriguez',
    },
    supportCount: 67,
    commentCount: 18,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'Peace for Anxious Heart',
    content: 'Struggling with anxiety about the future and would appreciate prayers for God\'s peace and wisdom. Sometimes it\'s hard to trust, but I know He has a plan.',
    status: 'ongoing' as const,
    user: {
      id: '5',
      firstName: 'Emily',
      lastName: 'Thompson',
    },
    supportCount: 31,
    commentCount: 9,
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
];

export default function CommunityScreen() {
  const [prayers, setPrayers] = useState(mockCommunityPrayers);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [supportedPrayers, setSupportedPrayers] = useState<string[]>([]);

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const getUserDisplayName = (user: { firstName?: string; lastName?: string }) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName.charAt(0)}.`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    if (user.lastName) {
      return `${user.lastName.charAt(0)}.`;
    }
    return 'Anonymous';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const handleSupport = (prayerId: string) => {
    if (supportedPrayers.includes(prayerId)) {
      Alert.alert('Already Supporting', 'You are already praying for this request.');
      return;
    }

    setSupportedPrayers(prev => [...prev, prayerId]);
    setPrayers(prevPrayers =>
      prevPrayers.map(prayer =>
        prayer.id === prayerId
          ? { ...prayer, supportCount: prayer.supportCount + 1 }
          : prayer
      )
    );
    Alert.alert('Thank You! 🙏', 'You are now praying for this request.');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <MaterialIcons name="people" size={32} color="#6366f1" />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Community Prayer Wall
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          Pray for others and feel the power of unified prayer
        </Text>
      </Surface>

      {/* Prayers List */}
      <View style={styles.prayersList}>
        {prayers.map((prayer) => (
          <Card key={prayer.id} style={styles.prayerCard}>
            <Card.Content>
              {/* User Info */}
              <View style={styles.userInfo}>
                <Avatar.Text
                  size={32}
                  label={getInitials(prayer.user.firstName, prayer.user.lastName)}
                  style={styles.avatar}
                />
                <View style={styles.userDetails}>
                  <Text variant="titleSmall" style={styles.userName}>
                    {getUserDisplayName(prayer.user)}
                  </Text>
                  <Text variant="bodySmall" style={styles.timeText}>
                    {formatDate(prayer.createdAt)}
                  </Text>
                </View>
                
                {prayer.status === 'answered' && (
                  <View style={styles.answeredBadge}>
                    <Text variant="bodySmall" style={styles.answeredBadgeText}>
                      ✅ Answered
                    </Text>
                  </View>
                )}
              </View>

              {/* Prayer Content */}
              <Text variant="titleMedium" style={styles.prayerTitle}>
                {prayer.title}
              </Text>
              <Text 
                variant="bodyMedium" 
                style={styles.prayerContent}
                numberOfLines={4}
              >
                {prayer.content}
              </Text>

              {/* Support Stats */}
              <View style={styles.supportStats}>
                <Text variant="bodySmall" style={styles.statText}>
                  {prayer.supportCount} people praying
                </Text>
                <Text variant="bodySmall" style={styles.statText}>
                  {prayer.commentCount} messages of encouragement
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <Button
                  mode="contained"
                  compact
                  onPress={() => handleSupport(prayer.id)}
                  disabled={supportedPrayers.includes(prayer.id)}
                  style={[
                    styles.prayButton,
                    supportedPrayers.includes(prayer.id) && styles.prayButtonSupported
                  ]}
                  icon="favorite"
                >
                  {supportedPrayers.includes(prayer.id) ? '🙏 Praying' : '🙏 Pray'}
                </Button>
                
                <Button
                  mode="outlined"
                  compact
                  icon="message"
                  onPress={() => Alert.alert('Coming Soon', 'Comments feature coming soon!')}
                >
                  Encourage
                </Button>

                <Button
                  mode="text"
                  compact
                  icon="share"
                  onPress={() => Alert.alert('Coming Soon', 'Share feature coming soon!')}
                >
                  Share
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>

      {/* Footer Message */}
      <View style={styles.footer}>
        <Text variant="bodyMedium" style={styles.footerText}>
          "Bear one another's burdens, and so fulfill the law of Christ." - Galatians 6:2
        </Text>
        <Text variant="bodySmall" style={styles.footerSubtext}>
          Share your own prayer requests to receive community support
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    textAlign: 'center',
    color: '#64748b',
  },
  prayersList: {
    padding: 16,
  },
  prayerCard: {
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    backgroundColor: '#6366f1',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
  },
  timeText: {
    color: '#64748b',
  },
  answeredBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  answeredBadgeText: {
    color: '#22c55e',
    fontSize: 12,
  },
  prayerTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  prayerContent: {
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  supportStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  statText: {
    color: '#64748b',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayButton: {
    backgroundColor: '#6366f1',
  },
  prayButtonSupported: {
    backgroundColor: '#22c55e',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
    color: '#64748b',
  },
  footerSubtext: {
    textAlign: 'center',
    color: '#64748b',
  },
});