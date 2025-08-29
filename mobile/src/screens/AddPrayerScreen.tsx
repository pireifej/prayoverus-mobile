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
  TextInput,
  Button,
  Switch,
  Card,
  Surface,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { apiService } from '../services/api';

interface PrayerFormData {
  title: string;
  content: string;
  isPublic: boolean;
}

export default function AddPrayerScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PrayerFormData>({
    defaultValues: {
      title: '',
      content: '',
      isPublic: false,
    },
  });

  const createPrayerMutation = useMutation({
    mutationFn: apiService.createPrayer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-prayers'] });
      queryClient.invalidateQueries({ queryKey: ['public-prayers'] });
      
      Toast.show({
        type: 'success',
        text1: 'Prayer Added',
        text2: 'Your prayer has been added successfully.',
      });
      
      reset();
      navigation.goBack();
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add prayer. Please try again.',
      });
    },
  });

  const onSubmit = (data: PrayerFormData) => {
    if (!data.title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Title',
        text2: 'Please enter a title for your prayer.',
      });
      return;
    }

    if (!data.content.trim() || data.content.length < 10) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Content',
        text2: 'Prayer content must be at least 10 characters.',
      });
      return;
    }

    createPrayerMutation.mutate(data);
  };

  const watchedContent = watch('content');
  const contentLength = watchedContent?.length || 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Surface style={styles.header} elevation={2}>
          <Icon name="favorite" size={32} color="#6366f1" />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Add New Prayer
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Share your prayer request with God and optionally with the community
          </Text>
        </Surface>

        {/* Form */}
        <View style={styles.form}>
          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text variant="titleMedium" style={styles.label}>
              Prayer Title *
            </Text>
            <Controller
              control={control}
              name="title"
              rules={{
                required: 'Prayer title is required',
                maxLength: {
                  value: 100,
                  message: 'Title must be less than 100 characters',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  mode="outlined"
                  placeholder="What are you praying for?"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={!!errors.title}
                  disabled={createPrayerMutation.isPending}
                  style={styles.input}
                />
              )}
            />
            {errors.title && (
              <Text style={styles.errorText}>{errors.title.message}</Text>
            )}
          </View>

          {/* Content Input */}
          <View style={styles.inputGroup}>
            <Text variant="titleMedium" style={styles.label}>
              Prayer Content *
            </Text>
            <Controller
              control={control}
              name="content"
              rules={{
                required: 'Prayer content is required',
                minLength: {
                  value: 10,
                  message: 'Prayer content must be at least 10 characters',
                },
                maxLength: {
                  value: 1000,
                  message: 'Content must be less than 1000 characters',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  mode="outlined"
                  placeholder="Share the details of your prayer request..."
                  multiline
                  numberOfLines={6}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={!!errors.content}
                  disabled={createPrayerMutation.isPending}
                  style={styles.textArea}
                />
              )}
            />
            <View style={styles.contentFooter}>
              {errors.content && (
                <Text style={styles.errorText}>{errors.content.message}</Text>
              )}
              <Text style={styles.characterCount}>
                {contentLength}/1000 characters
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.helpText}>
              Share your heart with God. Be as specific or general as you'd like.
            </Text>
          </View>

          {/* Public Toggle */}
          <Card style={styles.toggleCard}>
            <Card.Content>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text variant="titleMedium" style={styles.toggleTitle}>
                    Share with Community
                  </Text>
                  <Text variant="bodySmall" style={styles.toggleDescription}>
                    Allow others to see and pray for this request
                  </Text>
                </View>
                <Controller
                  control={control}
                  name="isPublic"
                  render={({ field: { onChange, value } }) => (
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      disabled={createPrayerMutation.isPending}
                    />
                  )}
                />
              </View>
            </Card.Content>
          </Card>

          {/* Privacy Notice */}
          {watch('isPublic') && (
            <Surface style={styles.privacyNotice} elevation={1}>
              <Icon name="info" size={20} color="#6366f1" />
              <Text variant="bodySmall" style={styles.privacyText}>
                When you share with the community, others can see your prayer request, 
                offer support, and pray for you. Your full name will not be displayed.
              </Text>
            </Surface>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              disabled={createPrayerMutation.isPending}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={createPrayerMutation.isPending}
              disabled={createPrayerMutation.isPending}
              style={styles.submitButton}
              icon="send"
            >
              {createPrayerMutation.isPending ? 'Adding Prayer...' : 'Add Prayer'}
            </Button>
          </View>

          {/* Inspirational Quote */}
          <Surface style={styles.inspirationCard} elevation={1}>
            <Text variant="bodyMedium" style={styles.inspirationText}>
              "Do not be anxious about anything, but in every situation, by prayer 
              and petition, with thanksgiving, present your requests to God."
            </Text>
            <Text variant="bodySmall" style={styles.inspirationSource}>
              Philippians 4:6
            </Text>
          </Surface>
        </View>
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
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
  },
  textArea: {
    backgroundColor: '#ffffff',
    minHeight: 120,
  },
  contentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  characterCount: {
    color: '#64748b',
    fontSize: 12,
  },
  helpText: {
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  toggleCard: {
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  toggleDescription: {
    color: '#64748b',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  privacyText: {
    flex: 1,
    marginLeft: 8,
    color: '#1e40af',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#6366f1',
  },
  inspirationCard: {
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
});