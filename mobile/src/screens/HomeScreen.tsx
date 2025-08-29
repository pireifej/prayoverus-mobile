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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { apiService, Prayer } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PrayerCard from '../components/PrayerCard';

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'answered'>('all');

  const {
    data: prayers = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['user-prayers'],
    queryFn: apiService.getUserPrayers,
    enabled: !!user,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ongoing' | 'answered' }) =>
      apiService.updatePrayerStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-prayers'] });
      Toast.show({
        type: 'success',
        text1: 'Prayer Updated',
        text2: 'Prayer status has been updated successfully.',
      });
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update prayer status.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiService.deletePrayer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-prayers'] });
      Toast.show({
        type: 'success',
        text1: 'Prayer Deleted',
        text2: 'Prayer has been deleted successfully.',
      });
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete prayer.',
      });
    },
  });

  const filteredPrayers = prayers.filter((prayer: Prayer) => {
    if (filter === 'all') return true;
    return prayer.status === filter;
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleStatusUpdate = (prayerId: string, newStatus: 'ongoing' | 'answered') => {
    updateStatusMutation.mutate({ id: prayerId, status: newStatus });
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
          onPress: () => deleteMutation.mutate(prayerId),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Loading your prayers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
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
            onPress={() => navigation.navigate('AddPrayer')}
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
              All
            </Chip>
            <Chip
              selected={filter === 'ongoing'}
              onPress={() => setFilter('ongoing')}
              style={styles.chip}
            >
              Ongoing
            </Chip>
            <Chip
              selected={filter === 'answered'}
              onPress={() => setFilter('answered')}
              style={styles.chip}
            >
              Answered
            </Chip>
          </View>
        </View>

        {/* Prayers List */}
        {filteredPrayers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
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
                onPress={() => navigation.navigate('AddPrayer')}
                style={styles.emptyButton}
                icon="plus"
              >
                Add Your First Prayer
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.prayersList}>
            {filteredPrayers.map((prayer: Prayer) => (
              <PrayerCard
                key={prayer.id}
                prayer={prayer}
                onStatusUpdate={handleStatusUpdate}
                onDelete={handleDelete}
                isUpdating={updateStatusMutation.isPending}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddPrayer')}
      />
    </View>
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
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyButton: {
    marginTop: 8,
  },
  prayersList: {
    gap: 12,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6366f1',
  },
});