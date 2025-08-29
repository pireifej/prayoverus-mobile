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
  Button,
  ActivityIndicator,
  Surface,
  Avatar,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { apiService, PrayerGroup } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function GroupsScreen() {
  const { user } = useAuth();

  const {
    data: userGroups = [],
    isLoading: isLoadingUserGroups,
    refetch: refetchUserGroups,
    isRefetching: isRefetchingUserGroups,
  } = useQuery({
    queryKey: ['user-groups'],
    queryFn: apiService.getUserGroups,
    enabled: !!user,
  });

  const {
    data: publicGroups = [],
    isLoading: isLoadingPublicGroups,
    refetch: refetchPublicGroups,
    isRefetching: isRefetchingPublicGroups,
  } = useQuery({
    queryKey: ['public-groups'],
    queryFn: apiService.getPublicGroups,
  });

  const isLoading = isLoadingUserGroups || isLoadingPublicGroups;
  const isRefetching = isRefetchingUserGroups || isRefetchingPublicGroups;

  const handleRefresh = () => {
    refetchUserGroups();
    refetchPublicGroups();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Loading prayer groups...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <Icon name="group" size={32} color="#6366f1" />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Prayer Groups
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          Join others in prayer and spiritual support
        </Text>
      </Surface>

      {/* My Prayer Groups */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          My Prayer Groups
        </Text>
        
        {userGroups.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon name="group" size={48} color="#e2e8f0" />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No prayer groups yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                Join or create a group to pray with others!
              </Text>
              <Button
                mode="contained"
                style={styles.createButton}
                icon="add"
              >
                Create Your First Group
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.groupsList}>
            {userGroups.map((group: PrayerGroup) => (
              <Card key={group.id} style={styles.groupCard}>
                <Card.Content>
                  <View style={styles.groupHeader}>
                    <Avatar.Text
                      size={48}
                      label={group.name.charAt(0).toUpperCase()}
                      style={styles.groupAvatar}
                    />
                    <View style={styles.groupInfo}>
                      <Text variant="titleMedium" style={styles.groupName}>
                        {group.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.memberCount}>
                        {group.memberCount} members
                      </Text>
                      {group.description && (
                        <Text 
                          variant="bodySmall" 
                          style={styles.groupDescription}
                          numberOfLines={2}
                        >
                          {group.description}
                        </Text>
                      )}
                    </View>
                    <View style={styles.statusIndicator} />
                  </View>
                  <View style={styles.groupActions}>
                    <Button mode="outlined" compact>
                      View
                    </Button>
                    <Button mode="text" compact textColor="#ef4444">
                      Leave
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* Discover Groups */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Discover Groups
        </Text>
        
        {publicGroups.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon name="search" size={48} color="#e2e8f0" />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No public groups available
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                Be the first to create a public prayer group!
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.groupsList}>
            {publicGroups.slice(0, 5).map((group: PrayerGroup) => (
              <Card key={group.id} style={styles.groupCard}>
                <Card.Content>
                  <View style={styles.groupHeader}>
                    <Avatar.Text
                      size={48}
                      label={group.name.charAt(0).toUpperCase()}
                      style={styles.groupAvatar}
                    />
                    <View style={styles.groupInfo}>
                      <Text variant="titleMedium" style={styles.groupName}>
                        {group.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.memberCount}>
                        {group.memberCount} members
                      </Text>
                      {group.description && (
                        <Text 
                          variant="bodySmall" 
                          style={styles.groupDescription}
                          numberOfLines={2}
                        >
                          {group.description}
                        </Text>
                      )}
                    </View>
                    <Icon name="public" size={20} color="#22c55e" />
                  </View>
                  <View style={styles.groupActions}>
                    <Button mode="contained" compact style={styles.joinButton}>
                      Join Group
                    </Button>
                    <Button mode="text" compact>
                      View Details
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))}
            
            {publicGroups.length > 5 && (
              <Button mode="outlined" style={styles.viewAllButton}>
                View All Groups ({publicGroups.length - 5} more)
              </Button>
            )}
          </View>
        )}
      </View>

      {/* Create Group Button */}
      <View style={styles.createSection}>
        <Button
          mode="contained"
          style={styles.createGroupButton}
          icon="add"
        >
          Create New Prayer Group
        </Button>
        <Text variant="bodySmall" style={styles.createHint}>
          Start a prayer group for your family, friends, or community
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
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyCard: {
    marginBottom: 16,
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
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#6366f1',
  },
  groupsList: {
    gap: 12,
  },
  groupCard: {
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupAvatar: {
    backgroundColor: '#6366f1',
  },
  groupInfo: {
    flex: 1,
    marginLeft: 12,
  },
  groupName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  memberCount: {
    color: '#64748b',
    marginBottom: 4,
  },
  groupDescription: {
    color: '#64748b',
    lineHeight: 18,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginLeft: 8,
  },
  groupActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#6366f1',
  },
  viewAllButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  createSection: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  createGroupButton: {
    backgroundColor: '#6366f1',
    marginBottom: 8,
  },
  createHint: {
    textAlign: 'center',
    color: '#64748b',
    fontStyle: 'italic',
  },
});