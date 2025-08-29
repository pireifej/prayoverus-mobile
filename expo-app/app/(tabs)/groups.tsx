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
  Button,
  Surface,
  Avatar,
  FAB,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

// Mock prayer groups data
const mockUserGroups = [
  {
    id: '1',
    name: 'Family Prayer Circle',
    description: 'A private group for our extended family to pray for each other',
    memberCount: 12,
    isPublic: false,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'College Ministry',
    description: 'Prayer support for college students navigating faith and academics',
    memberCount: 28,
    isPublic: true,
    createdAt: '2024-02-01',
  },
];

const mockPublicGroups = [
  {
    id: '3',
    name: 'Healing and Recovery',
    description: 'Supporting those facing health challenges and their families',
    memberCount: 156,
    isPublic: true,
    createdAt: '2023-11-20',
  },
  {
    id: '4',
    name: 'Job Seekers United',
    description: 'Prayers and encouragement for those searching for employment',
    memberCount: 89,
    isPublic: true,
    createdAt: '2024-01-08',
  },
  {
    id: '5',
    name: 'New Parents',
    description: 'Prayer support for new and expecting parents',
    memberCount: 73,
    isPublic: true,
    createdAt: '2023-12-12',
  },
  {
    id: '6',
    name: 'Mission Workers',
    description: 'Praying for missionaries and mission work around the world',
    memberCount: 234,
    isPublic: true,
    createdAt: '2023-10-15',
  },
];

export default function GroupsScreen() {
  const [userGroups, setUserGroups] = useState(mockUserGroups);
  const [publicGroups, setPublicGroups] = useState(mockPublicGroups);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [joinedGroups, setJoinedGroups] = useState<string[]>(['1', '2']);

  const handleJoinGroup = (groupId: string) => {
    if (joinedGroups.includes(groupId)) {
      Alert.alert('Already Joined', 'You are already a member of this group.');
      return;
    }

    const group = publicGroups.find(g => g.id === groupId);
    if (group) {
      setJoinedGroups(prev => [...prev, groupId]);
      setPublicGroups(prevGroups =>
        prevGroups.map(g =>
          g.id === groupId
            ? { ...g, memberCount: g.memberCount + 1 }
            : g
        )
      );
      Alert.alert('Welcome! 🙏', `You have joined "${group.name}". You can now participate in group prayers and discussions.`);
    }
  };

  const handleLeaveGroup = (groupId: string) => {
    const group = userGroups.find(g => g.id === groupId) || publicGroups.find(g => g.id === groupId);
    if (group) {
      Alert.alert(
        'Leave Group',
        `Are you sure you want to leave "${group.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              setJoinedGroups(prev => prev.filter(id => id !== groupId));
              setUserGroups(prev => prev.filter(g => g.id !== groupId));
              Alert.alert('Left Group', `You have left "${group.name}".`);
            },
          },
        ]
      );
    }
  };

  const handleCreateGroup = () => {
    Alert.alert('Create Group', 'Group creation feature coming soon!');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const formatMemberCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <Surface style={styles.header} elevation={2}>
          <MaterialIcons name="group" size={32} color="#6366f1" />
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
                <MaterialIcons name="group" size={48} color="#e2e8f0" />
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
                  onPress={handleCreateGroup}
                >
                  Create Your First Group
                </Button>
              </Card.Content>
            </Card>
          ) : (
            <View style={styles.groupsList}>
              {userGroups.map((group) => (
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
                        <View style={styles.groupMeta}>
                          <Text variant="bodySmall" style={styles.memberCount}>
                            {formatMemberCount(group.memberCount)} members
                          </Text>
                          <MaterialIcons 
                            name={group.isPublic ? "public" : "lock"} 
                            size={14} 
                            color={group.isPublic ? "#22c55e" : "#64748b"} 
                          />
                        </View>
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
                    </View>
                    <View style={styles.groupActions}>
                      <Button 
                        mode="contained" 
                        compact
                        style={styles.viewButton}
                        onPress={() => Alert.alert('Coming Soon', 'Group details coming soon!')}
                      >
                        View Group
                      </Button>
                      <Button 
                        mode="text" 
                        compact 
                        textColor="#ef4444"
                        onPress={() => handleLeaveGroup(group.id)}
                      >
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
          
          <View style={styles.groupsList}>
            {publicGroups.slice(0, 4).map((group) => (
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
                      <View style={styles.groupMeta}>
                        <Text variant="bodySmall" style={styles.memberCount}>
                          {formatMemberCount(group.memberCount)} members
                        </Text>
                        <MaterialIcons name="public" size={14} color="#22c55e" />
                      </View>
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
                  </View>
                  <View style={styles.groupActions}>
                    {joinedGroups.includes(group.id) ? (
                      <Button 
                        mode="outlined" 
                        compact
                        disabled
                        style={styles.joinedButton}
                      >
                        ✓ Joined
                      </Button>
                    ) : (
                      <Button 
                        mode="contained" 
                        compact
                        style={styles.joinButton}
                        onPress={() => handleJoinGroup(group.id)}
                      >
                        Join Group
                      </Button>
                    )}
                    <Button 
                      mode="text" 
                      compact
                      onPress={() => Alert.alert('Coming Soon', 'Group details coming soon!')}
                    >
                      View Details
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))}
            
            {publicGroups.length > 4 && (
              <Button 
                mode="outlined" 
                style={styles.viewAllButton}
                onPress={() => Alert.alert('Coming Soon', 'View all groups feature coming soon!')}
              >
                View All Groups ({publicGroups.length - 4} more)
              </Button>
            )}
          </View>
        </View>

        {/* Group Categories */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Popular Categories
          </Text>
          
          <View style={styles.categoriesGrid}>
            {[
              { name: 'Health & Healing', icon: 'healing', count: 45 },
              { name: 'Family & Children', icon: 'family-restroom', count: 32 },
              { name: 'Career & Work', icon: 'work', count: 28 },
              { name: 'Spiritual Growth', icon: 'auto-awesome', count: 23 },
              { name: 'Relationships', icon: 'favorite', count: 19 },
              { name: 'Missions', icon: 'public', count: 15 },
            ].map((category, index) => (
              <Card key={index} style={styles.categoryCard}>
                <Card.Content style={styles.categoryContent}>
                  <MaterialIcons name={category.icon as any} size={24} color="#6366f1" />
                  <Text variant="titleSmall" style={styles.categoryName}>
                    {category.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.categoryCount}>
                    {category.count} groups
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>

        {/* Footer Message */}
        <View style={styles.footer}>
          <Text variant="bodyMedium" style={styles.footerText}>
            "Where two or three gather in my name, there am I with them." - Matthew 18:20
          </Text>
        </View>
      </ScrollView>

      <FAB
        icon="add"
        style={styles.fab}
        onPress={handleCreateGroup}
      />
    </View>
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
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  memberCount: {
    color: '#64748b',
  },
  groupDescription: {
    color: '#64748b',
    lineHeight: 18,
  },
  groupActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: '#6366f1',
  },
  joinButton: {
    backgroundColor: '#6366f1',
  },
  joinedButton: {
    borderColor: '#22c55e',
  },
  viewAllButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
  },
  categoryContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  categoryName: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  categoryCount: {
    color: '#64748b',
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#64748b',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6366f1',
  },
});