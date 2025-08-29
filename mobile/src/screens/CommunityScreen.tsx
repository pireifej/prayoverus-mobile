import React from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import {
  Text,
  Card,
  Avatar,
  Button,
  ActivityIndicator,
  Surface,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';

import { apiService, PrayerWithUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CommunityScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: communityPrayers = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['public-prayers'],
    queryFn: apiService.getPublicPrayers,
  });

  const supportMutation = useMutation({
    mutationFn: ({ prayerId, type }: { prayerId: string; type: 'prayer' | 'heart' }) =>
      apiService.addPrayerSupport(prayerId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-prayers'] });
      Toast.show({
        type: 'success',
        text1: 'Prayer Supported',
        text2: 'You are now praying for this request.',
      });
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add support to prayer.',
      });
    },
  });

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

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const handleSupport = (prayerId: string, type: 'prayer' | 'heart') => {
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Sign in required',
        text2: 'Please sign in to support prayers.',
      });
      return;
    }
    supportMutation.mutate({ prayerId, type });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Loading community prayers...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <Icon name="people" size={32} color="#6366f1" />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Community Prayer Wall
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          Pray for others and feel the power of unified prayer
        </Text>
      </Surface>

      {/* Prayers List */}
      {communityPrayers.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Icon name="people" size={48} color="#e2e8f0" />
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              No community prayers yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              Be the first to share a prayer with the community!
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <View style={styles.prayersList}>
          {communityPrayers.map((prayer: PrayerWithUser) => (
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
                </View>

                {/* Prayer Content */}
                <Text variant="titleMedium" style={styles.prayerTitle}>
                  {prayer.title}
                </Text>
                <Text 
                  variant="bodyMedium" 
                  style={styles.prayerContent}
                  numberOfLines={3}
                >
                  {prayer.content}
                </Text>

                {/* Actions */}
                <View style={styles.actions}>
                  <Button
                    mode="text"
                    compact
                    onPress={() => handleSupport(prayer.id, 'prayer')}
                    loading={supportMutation.isPending}
                    disabled={!user || supportMutation.isPending}
                    icon="favorite-border"
                    textColor="#6366f1"
                  >
                    {prayer.supportCount} praying
                  </Button>
                  <Button
                    mode="text"
                    compact
                    icon="message"
                    textColor="#6366f1"
                  >
                    {prayer.commentCount}
                  </Button>
                  <Button
                    mode="contained"
                    compact
                    onPress={() => handleSupport(prayer.id, 'prayer')}
                    disabled={!user || supportMutation.isPending}
                    style={styles.prayButton}
                  >
                    🙏 Pray
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text variant="bodyMedium" style={styles.footerText}>
          Share a prayer with the community to help others pray for you
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyCard: {
    margin: 16,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
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
  prayerTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  prayerContent: {
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prayButton: {
    backgroundColor: '#6366f1',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    color: '#64748b',
    fontStyle: 'italic',
  },
});