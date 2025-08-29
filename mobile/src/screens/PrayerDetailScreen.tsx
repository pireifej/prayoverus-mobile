import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Avatar,
  ActivityIndicator,
  Divider,
  Surface,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';

import { apiService, PrayerComment } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PrayerDetailScreenProps {
  route: {
    params: {
      prayerId: string;
      prayer: any;
    };
  };
}

export default function PrayerDetailScreen({ route }: PrayerDetailScreenProps) {
  const { prayerId, prayer } = route.params;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  // Fetch comments
  const {
    data: comments = [],
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['prayer-comments', prayerId],
    queryFn: () => apiService.getPrayerComments(prayerId),
  });

  // Support mutation
  const supportMutation = useMutation({
    mutationFn: ({ type }: { type: 'prayer' | 'heart' }) =>
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

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: (content: string) => apiService.addPrayerComment(prayerId, content),
    onSuccess: () => {
      refetchComments();
      setComment('');
      Toast.show({
        type: 'success',
        text1: 'Comment Added',
        text2: 'Your encouragement has been shared.',
      });
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add comment.',
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

  const handleSupport = (type: 'prayer' | 'heart') => {
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Sign in required',
        text2: 'Please sign in to support prayers.',
      });
      return;
    }
    supportMutation.mutate({ type });
  };

  const handleAddComment = () => {
    if (!comment.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Empty Comment',
        text2: 'Please enter a message of encouragement.',
      });
      return;
    }

    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Sign in required',
        text2: 'Please sign in to add comments.',
      });
      return;
    }

    commentMutation.mutate(comment.trim());
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        {/* Prayer Card */}
        <Card style={styles.prayerCard}>
          <Card.Content>
            {/* User Info */}
            <View style={styles.userInfo}>
              <Avatar.Text
                size={40}
                label={getInitials(prayer.user?.firstName, prayer.user?.lastName)}
                style={styles.avatar}
              />
              <View style={styles.userDetails}>
                <Text variant="titleMedium" style={styles.userName}>
                  {getUserDisplayName(prayer.user || {})}
                </Text>
                <Text variant="bodySmall" style={styles.timeText}>
                  {formatDate(prayer.createdAt)}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <Text variant="bodySmall" style={styles.statusText}>
                  {prayer.status === 'answered' ? '✅ Answered' : '🙏 Ongoing'}
                </Text>
              </View>
            </View>

            {/* Prayer Content */}
            <Text variant="headlineSmall" style={styles.prayerTitle}>
              {prayer.title}
            </Text>
            <Text variant="bodyLarge" style={styles.prayerContent}>
              {prayer.content}
            </Text>

            {/* Support Actions */}
            <View style={styles.supportActions}>
              <Button
                mode="contained"
                onPress={() => handleSupport('prayer')}
                loading={supportMutation.isPending}
                disabled={!user || supportMutation.isPending}
                icon="favorite"
                style={styles.prayButton}
              >
                🙏 Pray for this
              </Button>
              <Button
                mode="outlined"
                onPress={() => handleSupport('heart')}
                disabled={!user || supportMutation.isPending}
                icon="favorite-border"
                style={styles.heartButton}
              >
                ❤️ Support
              </Button>
            </View>

            {/* Stats */}
            <View style={styles.stats}>
              <Text variant="bodySmall" style={styles.statText}>
                {prayer.supportCount || 0} people praying • {comments.length} messages
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Add Comment */}
        <Card style={styles.commentInputCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.commentTitle}>
              Send Encouragement
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Share words of encouragement or support..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
              disabled={commentMutation.isPending || !user}
              style={styles.commentInput}
            />
            <Button
              mode="contained"
              onPress={handleAddComment}
              loading={commentMutation.isPending}
              disabled={commentMutation.isPending || !comment.trim() || !user}
              icon="send"
              style={styles.sendButton}
            >
              {commentMutation.isPending ? 'Sending...' : 'Send Message'}
            </Button>
            {!user && (
              <Text variant="bodySmall" style={styles.signInHint}>
                Sign in to send messages of encouragement
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Comments Section */}
        <Card style={styles.commentsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.commentsTitle}>
              Messages of Encouragement ({comments.length})
            </Text>
            
            {isLoadingComments ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" />
                <Text style={styles.loadingText}>Loading messages...</Text>
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Icon name="message" size={48} color="#e2e8f0" />
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No messages yet
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtitle}>
                  Be the first to send encouragement
                </Text>
              </View>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((comment: PrayerComment, index: number) => (
                  <View key={comment.id}>
                    <View style={styles.commentItem}>
                      <Avatar.Text
                        size={32}
                        label={getInitials(comment.user?.firstName, comment.user?.lastName)}
                        style={styles.commentAvatar}
                      />
                      <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                          <Text variant="titleSmall" style={styles.commentUser}>
                            {getUserDisplayName(comment.user)}
                          </Text>
                          <Text variant="bodySmall" style={styles.commentTime}>
                            {formatDate(comment.createdAt)}
                          </Text>
                        </View>
                        <Text variant="bodyMedium" style={styles.commentText}>
                          {comment.content}
                        </Text>
                      </View>
                    </View>
                    {index < comments.length - 1 && <Divider style={styles.commentDivider} />}
                  </View>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Prayer Reminder */}
        <Surface style={styles.reminderCard} elevation={1}>
          <Icon name="schedule" size={24} color="#6366f1" />
          <View style={styles.reminderContent}>
            <Text variant="titleSmall" style={styles.reminderTitle}>
              Set Prayer Reminder
            </Text>
            <Text variant="bodySmall" style={styles.reminderText}>
              Get daily reminders to pray for this request
            </Text>
          </View>
          <Button mode="text" compact>
            Set Reminder
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  prayerCard: {
    margin: 16,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: '#6366f1',
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontWeight: 'bold',
  },
  timeText: {
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  statusText: {
    color: '#64748b',
    fontSize: 12,
  },
  prayerTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  prayerContent: {
    lineHeight: 24,
    marginBottom: 20,
    color: '#374151',
  },
  supportActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  prayButton: {
    flex: 1,
    backgroundColor: '#6366f1',
  },
  heartButton: {
    flex: 1,
  },
  stats: {
    alignItems: 'center',
  },
  statText: {
    color: '#64748b',
  },
  commentInputCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  commentTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    marginBottom: 8,
  },
  signInHint: {
    textAlign: 'center',
    color: '#64748b',
    fontStyle: 'italic',
  },
  commentsCard: {
    margin: 16,
    marginTop: 8,
  },
  commentsTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 12,
    color: '#64748b',
  },
  emptyComments: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#64748b',
    textAlign: 'center',
  },
  commentsList: {
    gap: 16,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    backgroundColor: '#6366f1',
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: {
    fontWeight: 'bold',
  },
  commentTime: {
    color: '#64748b',
  },
  commentText: {
    lineHeight: 20,
  },
  commentDivider: {
    marginVertical: 8,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  reminderContent: {
    flex: 1,
    marginLeft: 12,
  },
  reminderTitle: {
    fontWeight: 'bold',
    color: '#1e40af',
  },
  reminderText: {
    color: '#1e40af',
  },
});