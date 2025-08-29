import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  Avatar,
  Button,
  Card,
  List,
  Divider,
  Surface,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.lastName) {
      return user.lastName;
    }
    return 'User';
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your prayers and data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // Implement account deletion
            Alert.alert('Account deletion is not implemented yet.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Surface style={styles.header} elevation={2}>
        <Avatar.Text
          size={80}
          label={getInitials(user?.firstName, user?.lastName)}
          style={styles.avatar}
        />
        <Text variant="headlineSmall" style={styles.name}>
          {getDisplayName()}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {user?.email}
        </Text>
        <Button
          mode="outlined"
          icon="edit"
          style={styles.editButton}
        >
          Edit Profile
        </Button>
      </Surface>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text variant="displaySmall" style={styles.statNumber}>
              0
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Prayers
            </Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text variant="displaySmall" style={styles.statNumber}>
              0
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Answered
            </Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text variant="displaySmall" style={styles.statNumber}>
              0
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Groups
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Settings */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Settings
          </Text>
          
          <List.Item
            title="Notifications"
            description="Manage prayer reminders and updates"
            left={(props) => <List.Icon {...props} icon="notifications" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Notifications settings coming soon')}
          />
          
          <Divider />
          
          <List.Item
            title="Privacy"
            description="Control who can see your prayers"
            left={(props) => <List.Icon {...props} icon="privacy-tip" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Privacy settings coming soon')}
          />
          
          <Divider />
          
          <List.Item
            title="Prayer Reminders"
            description="Set daily prayer reminders"
            left={(props) => <List.Icon {...props} icon="schedule" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Prayer reminders coming soon')}
          />
          
          <Divider />
          
          <List.Item
            title="Export Data"
            description="Download your prayers and data"
            left={(props) => <List.Icon {...props} icon="download" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Data export coming soon')}
          />
        </Card.Content>
      </Card>

      {/* Support */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Support
          </Text>
          
          <List.Item
            title="Help & FAQ"
            description="Get answers to common questions"
            left={(props) => <List.Icon {...props} icon="help" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Help center coming soon')}
          />
          
          <Divider />
          
          <List.Item
            title="Contact Us"
            description="Send feedback or report issues"
            left={(props) => <List.Icon {...props} icon="email" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Contact form coming soon')}
          />
          
          <Divider />
          
          <List.Item
            title="Rate the App"
            description="Share your experience"
            left={(props) => <List.Icon {...props} icon="star" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('App rating coming soon')}
          />
        </Card.Content>
      </Card>

      {/* Account Actions */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          textColor="#ef4444"
          icon="logout"
        >
          Sign Out
        </Button>
        
        <Button
          mode="text"
          onPress={handleDeleteAccount}
          textColor="#ef4444"
          style={styles.deleteButton}
        >
          Delete Account
        </Button>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text variant="bodySmall" style={styles.appVersion}>
          PrayOverUs v1.0.0
        </Text>
        <Text variant="bodySmall" style={styles.appDescription}>
          Connecting hearts through prayer, one conversation with God at a time.
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
    padding: 32,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  avatar: {
    backgroundColor: '#6366f1',
    marginBottom: 16,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    color: '#64748b',
    marginBottom: 16,
  },
  editButton: {
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    color: '#64748b',
    textAlign: 'center',
  },
  settingsCard: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actions: {
    padding: 16,
    alignItems: 'center',
  },
  logoutButton: {
    marginBottom: 12,
    borderColor: '#ef4444',
  },
  deleteButton: {
    marginBottom: 24,
  },
  appInfo: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  appVersion: {
    color: '#64748b',
    marginBottom: 4,
  },
  appDescription: {
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});