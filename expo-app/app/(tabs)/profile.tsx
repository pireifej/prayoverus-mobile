import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Avatar,
  Button,
  List,
  Divider,
  Surface,
  Switch,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);

  if (!user) {
    router.replace('/login');
    return null;
  }

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing feature coming soon!');
  };

  const handleSupport = () => {
    Alert.alert('Support', 'Support & Help feature coming soon!');
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy', 'Privacy settings feature coming soon!');
  };

  const handleAbout = () => {
    Alert.alert(
      'About PrayOverUs',
      'PrayOverUs is a community prayer platform that connects people through the power of prayer.\n\nVersion 1.0.0\n\n© 2025 PrayOverUs. All rights reserved.'
    );
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return 'Prayer Warrior';
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    }
    return 'PW';
  };

  // Mock user stats
  const userStats = {
    totalPrayers: 15,
    answeredPrayers: 8,
    prayersGiven: 42,
    groupsJoined: 3,
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Surface style={styles.profileHeader} elevation={2}>
        <Avatar.Text
          size={80}
          label={getUserInitials()}
          style={styles.avatar}
        />
        <Text variant="headlineSmall" style={styles.displayName}>
          {getUserDisplayName()}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {user?.email}
        </Text>
        <Button
          mode="outlined"
          onPress={handleEditProfile}
          style={styles.editButton}
          icon="edit"
        >
          Edit Profile
        </Button>
      </Surface>

      {/* Prayer Stats */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.statsTitle}>
            Prayer Journey
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {userStats.totalPrayers}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Total Prayers
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={[styles.statNumber, styles.answeredStat]}>
                {userStats.answeredPrayers}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Answered
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={[styles.statNumber, styles.givenStat]}>
                {userStats.prayersGiven}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Prayers Given
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={[styles.statNumber, styles.groupsStat]}>
                {userStats.groupsJoined}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Groups Joined
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Settings */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Settings
          </Text>
          
          <List.Item
            title="Notifications"
            description="Get notified about prayer updates"
            left={(props) => <List.Icon {...props} icon="notifications" />}
            right={() => (
              <Switch
                value={notifications}
                onValueChange={setNotifications}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Public Profile"
            description="Allow others to see your prayer activity"
            left={(props) => <List.Icon {...props} icon="public" />}
            right={() => (
              <Switch
                value={publicProfile}
                onValueChange={setPublicProfile}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Privacy Settings"
            description="Manage your privacy preferences"
            left={(props) => <List.Icon {...props} icon="privacy-tip" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handlePrivacy}
          />
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          
          <List.Item
            title="My Prayer History"
            description="View all your prayers and their status"
            left={(props) => <List.Icon {...props} icon="history" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Coming Soon', 'Prayer history feature coming soon!')}
          />
          
          <Divider />
          
          <List.Item
            title="Community Activity"
            description="See your community prayer interactions"
            left={(props) => <List.Icon {...props} icon="people" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Coming Soon', 'Activity history feature coming soon!')}
          />
          
          <Divider />
          
          <List.Item
            title="Prayer Reminders"
            description="Set up reminders for prayer times"
            left={(props) => <List.Icon {...props} icon="schedule" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Coming Soon', 'Prayer reminders feature coming soon!')}
          />
        </Card.Content>
      </Card>

      {/* Support & Info */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Support & Information
          </Text>
          
          <List.Item
            title="Help & Support"
            description="Get help with using the app"
            left={(props) => <List.Icon {...props} icon="help" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleSupport}
          />
          
          <Divider />
          
          <List.Item
            title="Send Feedback"
            description="Help us improve PrayOverUs"
            left={(props) => <List.Icon {...props} icon="feedback" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Feedback', 'Feedback feature coming soon!')}
          />
          
          <Divider />
          
          <List.Item
            title="About"
            description="Learn more about PrayOverUs"
            left={(props) => <List.Icon {...props} icon="info" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleAbout}
          />
        </Card.Content>
      </Card>

      {/* Inspirational Quote */}
      <Surface style={styles.inspirationCard} elevation={1}>
        <Text variant="bodyMedium" style={styles.inspirationText}>
          "Rejoice always, pray continually, give thanks in all circumstances; 
          for this is God's will for you in Christ Jesus."
        </Text>
        <Text variant="bodySmall" style={styles.inspirationSource}>
          1 Thessalonians 5:16-18
        </Text>
      </Surface>

      {/* Sign Out Button */}
      <View style={styles.signOutSection}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.signOutButton}
          textColor="#ef4444"
          icon="logout"
        >
          Sign Out
        </Button>
      </View>

      {/* App Version */}
      <View style={styles.versionSection}>
        <Text variant="bodySmall" style={styles.versionText}>
          PrayOverUs v1.0.0
        </Text>
        <Text variant="bodySmall" style={styles.versionText}>
          Made with ❤️ for the prayer community
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
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  avatar: {
    backgroundColor: '#6366f1',
    marginBottom: 16,
  },
  displayName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    color: '#64748b',
    marginBottom: 16,
  },
  editButton: {
    borderColor: '#6366f1',
  },
  statsCard: {
    margin: 16,
    marginTop: 0,
  },
  statsTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  answeredStat: {
    color: '#22c55e',
  },
  givenStat: {
    color: '#6366f1',
  },
  groupsStat: {
    color: '#f59e0b',
  },
  statLabel: {
    color: '#64748b',
    textAlign: 'center',
  },
  settingsCard: {
    margin: 16,
    marginTop: 0,
  },
  actionsCard: {
    margin: 16,
    marginTop: 0,
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  inspirationCard: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fefce8',
  },
  inspirationText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
    color: '#92400e',
  },
  inspirationSource: {
    textAlign: 'center',
    color: '#92400e',
    fontWeight: 'bold',
  },
  signOutSection: {
    padding: 16,
    alignItems: 'center',
  },
  signOutButton: {
    borderColor: '#ef4444',
    paddingHorizontal: 32,
  },
  versionSection: {
    padding: 16,
    alignItems: 'center',
  },
  versionText: {
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 4,
  },
});