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
  FAB,
  Chip,
  Button,
  ActivityIndicator,
  Surface,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

// Mock prayer data for demo
const mockPrayers = [
  {
    id: '1',
    title: 'Healing for My Family',
    content: 'Please pray for my grandmother who is recovering from surgery. She means the world to our family and we are asking for God\'s healing touch upon her.',
    status: 'ongoing' as const,
    isPublic: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'Job Interview Success',
    content: 'I have an important job interview tomorrow. Praying for wisdom, confidence, and that God\'s will be done in this opportunity.',
    status: 'answered' as const,
    isPublic: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    answeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Peace in My Heart',
    content: 'Going through a difficult time and need God\'s peace that surpasses all understanding. Praying for strength to trust in His plan.',
    status: 'ongoing' as const,
    isPublic: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'answered'>('all');
  const [prayers, setPrayers] = useState(mockPrayers);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!user) {
    router.replace('/login');
    return null;
  }

  const filteredPrayers = prayers.filter((prayer) => {
    if (filter === 'all') return true;
    return prayer.status === filter;
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const handleStatusUpdate = (prayerId: string, newStatus: 'ongoing' | 'answered') => {
    setPrayers(prevPrayers =>
      prevPrayers.map(prayer =>
        prayer.id === prayerId
          ? { 
              ...prayer, 
              status: newStatus,
              answeredAt: newStatus === 'answered' ? new Date().toISOString() : undefined
            }
          : prayer
      )
    );
    Alert.alert('Success', `Prayer marked as ${newStatus}!`);
  };

  const handleDelete = (prayerId: string) => {
    Alert.alert(
      'Delete Prayer',
      'Are you sure you want to delete this prayer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPrayers(prevPrayers => prevPrayers.filter(p => p.id !== prayerId));
            Alert.alert('Deleted', 'Prayer has been deleted.');
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Welcome Card */}
        <Surface style={styles.welcomeCard} elevation={2}>
          <Text variant="headlineSmall" style={styles.greeting}>
            {getGreeting()}, {user?.firstName || 'Friend'} 🙏
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Take a moment to connect with your prayers today
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/add-prayer')}
            style={styles.addButton}
            icon="plus"
          >
            Add New Prayer
          </Button>
        </Surface>

        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            My Personal Prayers
          </Text>
          <View style={styles.chipContainer}>
            <Chip
              selected={filter === 'all'}
              onPress={() => setFilter('all')}
              style={styles.chip}
            >
              All ({prayers.length})
            </Chip>
            <Chip
              selected={filter === 'ongoing'}
              onPress={() => setFilter('ongoing')}
              style={styles.chip}
            >
              Ongoing ({prayers.filter(p => p.status === 'ongoing').length})
            </Chip>
            <Chip
              selected={filter === 'answered'}
              onPress={() => setFilter('answered')}
              style={styles.chip}
            >
              Answered ({prayers.filter(p => p.status === 'answered').length})
            </Chip>
          </View>
        </View>

        {/* Prayers List */}
        {filteredPrayers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons name="favorite" size={48} color="#e2e8f0" />
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                No prayers yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                {filter === 'all'
                  ? 'Start your prayer journey by adding your first prayer.'
                  : `No ${filter} prayers found.`}
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push('/add-prayer')}
                style={styles.emptyButton}
                icon="plus"
              >
                Add Your First Prayer
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.prayersList}>
            {filteredPrayers.map((prayer) => (
              <Card key={prayer.id} style={styles.prayerCard}>
                <Card.Content>
                  {/* Header */}
                  <View style={styles.prayerHeader}>
                    <View style={styles.statusChip}>
                      <Text style={[
                        styles.statusText,
                        { color: prayer.status === 'answered' ? '#22c55e' : '#f59e0b' }
                      ]}>
                        {prayer.status === 'answered' ? '✅ Answered' : '🙏 Ongoing'}
                      </Text>
                    </View>
                    <Text variant="bodySmall" style={styles.dateText}>
                      {formatDate(prayer.createdAt)}
                    </Text>
                  </View>

                  {/* Title */}
                  <Text variant="titleMedium" style={styles.prayerTitle}>
                    {prayer.title}
                  </Text>

                  {/* Content */}
                  <Text variant="bodyMedium" style={styles.prayerContent} numberOfLines={3}>
                    {prayer.content}
                  </Text>

                  {/* Answered Banner */}
                  {prayer.status === 'answered' && (
                    <Surface style={styles.answeredBanner} elevation={0}>
                      <MaterialIcons name="check-circle" size={16} color="#22c55e" />
                      <Text variant="bodySmall" style={styles.answeredText}>
                        Prayer Answered - Thank you, God! 
                        {prayer.answeredAt && ` (${formatDate(prayer.answeredAt)})`}
                      </Text>
                    </Surface>
                  )}

                  {/* Actions */}
                  <View style={styles.actions}>
                    {prayer.isPublic && (
                      <Text variant="bodySmall" style={styles.publicIndicator}>
                        <MaterialIcons name="public" size={12} /> Shared with community
                      </Text>
                    )}
                    
                    <View style={styles.actionButtons}>
                      {prayer.status === 'ongoing' ? (
                        <Button
                          mode="contained"
                          compact
                          onPress={() => handleStatusUpdate(prayer.id, 'answered')}
                          style={styles.answeredButton}
                        >
                          Mark as Answered
                        </Button>
                      ) : (
                        <Button
                          mode="outlined"
                          compact
                          onPress={() => handleStatusUpdate(prayer.id, 'ongoing')}
                          style={styles.ongoingButton}
                        >
                          Mark as Ongoing
                        </Button>
                      )}
                      
                      <Button
                        mode="text"
                        compact
                        onPress={() => handleDelete(prayer.id)}
                        textColor="#ef4444"
                      >
                        Delete
                      </Button>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/add-prayer')}
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
    padding: 16,
  },
  welcomeCard: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#6366f1',
  },
  greeting: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#e2e8f0',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#ffffff',
  },
  filterContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  emptyCard: {
    marginBottom: 20,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyButton: {
    marginTop: 8,
    backgroundColor: '#6366f1',
  },
  prayersList: {
    gap: 12,
    paddingBottom: 80,
  },
  prayerCard: {
    marginBottom: 12,
  },
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#64748b',
  },
  prayerTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  prayerContent: {
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  answeredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  answeredText: {
    color: '#22c55e',
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    marginTop: 8,
  },
  publicIndicator: {
    color: '#22c55e',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  answeredButton: {
    backgroundColor: '#22c55e',
  },
  ongoingButton: {
    borderColor: '#f59e0b',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6366f1',
  },
});