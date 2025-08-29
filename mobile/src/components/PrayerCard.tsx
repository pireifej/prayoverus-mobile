import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  Menu,
  Divider,
  Chip,
  Surface,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { formatDistanceToNow } from 'date-fns';

import { Prayer } from '../services/api';

interface PrayerCardProps {
  prayer: Prayer;
  onStatusUpdate?: (prayerId: string, status: 'ongoing' | 'answered') => void;
  onDelete?: (prayerId: string) => void;
  onSupport?: (prayerId: string, type: 'prayer' | 'heart') => void;
  isUpdating?: boolean;
  showSupport?: boolean;
  supportCount?: number;
  commentCount?: number;
}

export default function PrayerCard({
  prayer,
  onStatusUpdate,
  onDelete,
  onSupport,
  isUpdating = false,
  showSupport = false,
  supportCount = 0,
  commentCount = 0,
}: PrayerCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered':
        return '#22c55e';
      case 'ongoing':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'answered':
        return 'Answered';
      case 'ongoing':
        return 'Ongoing';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const shouldTruncate = prayer.content.length > 150;
  const displayContent = shouldTruncate && !expanded 
    ? prayer.content.substring(0, 150) + '...'
    : prayer.content;

  const handleStatusUpdate = (newStatus: 'ongoing' | 'answered') => {
    if (onStatusUpdate) {
      onStatusUpdate(prayer.id, newStatus);
    }
    setMenuVisible(false);
  };

  const handleDelete = () => {
    setMenuVisible(false);
    Alert.alert(
      'Delete Prayer',
      'Are you sure you want to delete this prayer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(prayer.id),
        },
      ]
    );
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(prayer.status) }]}
              textStyle={{ color: 'white', fontSize: 12 }}
            >
              {getStatusLabel(prayer.status)}
            </Chip>
            <Text variant="bodySmall" style={styles.dateText}>
              {formatDate(prayer.createdAt)}
            </Text>
            {prayer.status === 'answered' && prayer.answeredAt && (
              <Text variant="bodySmall" style={styles.answeredText}>
                • Answered {formatDate(prayer.answeredAt)}
              </Text>
            )}
          </View>
          
          {onStatusUpdate && (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button
                  mode="text"
                  compact
                  onPress={() => setMenuVisible(true)}
                  icon="more-horiz"
                />
              }
            >
              {prayer.status === 'ongoing' && (
                <Menu.Item
                  onPress={() => handleStatusUpdate('answered')}
                  title="Mark as Answered"
                  leadingIcon="check"
                />
              )}
              {prayer.status === 'answered' && (
                <Menu.Item
                  onPress={() => handleStatusUpdate('ongoing')}
                  title="Mark as Ongoing"
                  leadingIcon="refresh"
                />
              )}
              <Divider />
              <Menu.Item
                onPress={handleDelete}
                title="Delete"
                leadingIcon="delete"
              />
            </Menu>
          )}
        </View>

        {/* Title */}
        <Text variant="titleMedium" style={styles.title}>
          {prayer.title}
        </Text>

        {/* Content */}
        <Text variant="bodyMedium" style={styles.content}>
          {displayContent}
        </Text>
        
        {shouldTruncate && (
          <Button
            mode="text"
            compact
            onPress={() => setExpanded(!expanded)}
            style={styles.expandButton}
          >
            {expanded ? 'Show less' : 'Read more'}
          </Button>
        )}

        {/* Answered indicator */}
        {prayer.status === 'answered' && (
          <Surface style={styles.answeredBanner} elevation={0}>
            <Icon name="check-circle" size={16} color="#22c55e" />
            <Text variant="bodySmall" style={styles.answeredText}>
              Prayer Answered - Thank you, God!
            </Text>
          </Surface>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {showSupport && (
            <View style={styles.supportActions}>
              <Button
                mode="text"
                compact
                onPress={() => onSupport?.(prayer.id, 'prayer')}
                icon="favorite-border"
              >
                {supportCount} prayers
              </Button>
              <Button
                mode="text"
                compact
                icon="message"
              >
                {commentCount}
              </Button>
            </View>
          )}
          
          {onStatusUpdate && prayer.status === 'ongoing' && (
            <Button
              mode="outlined"
              compact
              onPress={() => handleStatusUpdate('answered')}
              loading={isUpdating}
              disabled={isUpdating}
              style={styles.actionButton}
            >
              {isUpdating ? 'Updating...' : 'Mark as Answered'}
            </Button>
          )}
          
          {prayer.status === 'answered' && (
            <Button
              mode="outlined"
              compact
              style={styles.actionButton}
            >
              Share Testimony
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusChip: {
    height: 24,
    marginRight: 8,
  },
  dateText: {
    color: '#64748b',
    marginRight: 8,
  },
  answeredText: {
    color: '#22c55e',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  content: {
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 8,
  },
  expandButton: {
    alignSelf: 'flex-start',
    marginLeft: -8,
  },
  answeredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  supportActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 8,
  },
});