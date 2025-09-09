import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Switch,
  Card,
  Surface,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function AddPrayerScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const handleSubmit = async () => {
    const now = Date.now();
    
    // Time-based blocking as backup
    if (now - lastSubmitTime < 3000) {
      console.log('Blocked: Too soon since last submission');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your prayer.');
      return;
    }

    if (!content.trim() || content.length < 10) {
      Alert.alert('Invalid Content', 'Prayer content must be at least 10 characters.');
      return;
    }

    // Generate unique one-time key (UUID)
    const idempotencyKey = 'request-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // IMMEDIATELY set timestamp and hide button
    setLastSubmitTime(now);
    setIsSubmitting(true);
    
    const requestHeaders = {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey,
      'User-Agent': 'PrayOverUs-Mobile-App'
    };
    
    const requestPayload = {
      requestText: content.trim(),
      requestTitle: title.trim(),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userId: 'anonymous-user', // Replace with actual user ID when available
      sendEmail: false,
      idempotencyKey: idempotencyKey // Include in payload as backup
    };
    
    const endpoint = 'https://api.prayoverus.com/api/createRequestAndPrayer';
    
    // Clean debug output - endpoint and payload only
    console.log('📱 MOBILE APP API CALL:');
    console.log('POST', endpoint);
    console.log(JSON.stringify(requestPayload, null, 2));
    
    try {
      // Make actual API call with idempotency key
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestPayload)
      });

      if (response.ok) {
        // Success - navigate away immediately 
        router.back();
        
        // Show success after navigation
        setTimeout(() => {
          Alert.alert(
            'Prayer Submitted! 🙏',
            'Your prayer has been sent.'
          );
        }, 500);
      } else {
        // Handle error
        setIsSubmitting(false);
        Alert.alert('Error', 'Failed to submit prayer. Please try again.');
      }
    } catch (error) {
      // Handle network error
      setIsSubmitting(false);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    }
  };

  const contentLength = content?.length || 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Surface style={styles.header} elevation={2}>
          <MaterialIcons name="favorite" size={32} color="#6366f1" />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Add New Prayer
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Share your heart with God and optionally with the community
          </Text>
        </Surface>

        {/* Form */}
        <View style={styles.form}>
          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text variant="titleMedium" style={styles.label}>
              Prayer Title *
            </Text>
            <TextInput
              mode="outlined"
              placeholder="What are you praying for?"
              value={title}
              onChangeText={setTitle}
              disabled={isSubmitting}
              style={styles.input}
              maxLength={100}
            />
            <Text variant="bodySmall" style={styles.helpText}>
              Give your prayer a meaningful title (max 100 characters)
            </Text>
          </View>

          {/* Content Input */}
          <View style={styles.inputGroup}>
            <Text variant="titleMedium" style={styles.label}>
              Prayer Content *
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Share the details of your prayer request..."
              multiline
              numberOfLines={6}
              value={content}
              onChangeText={setContent}
              disabled={isSubmitting}
              style={styles.textArea}
              maxLength={1000}
            />
            <View style={styles.contentFooter}>
              <Text variant="bodySmall" style={styles.helpText}>
                Share your heart with God. Be as specific or general as you'd like.
              </Text>
              <Text variant="bodySmall" style={styles.characterCount}>
                {contentLength}/1000 characters
              </Text>
            </View>
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
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  disabled={isSubmitting}
                />
              </View>
            </Card.Content>
          </Card>

          {/* Privacy Notice */}
          {isPublic && (
            <Surface style={styles.privacyNotice} elevation={1}>
              <MaterialIcons name="info" size={20} color="#6366f1" />
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
              onPress={() => router.back()}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            {!isSubmitting ? (
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                icon="send"
              >
                Add Prayer
              </Button>
            ) : (
              <Surface style={[styles.submitButton, { backgroundColor: '#6366f1', padding: 12, borderRadius: 8 }]}>
                <Text style={{ color: 'white', textAlign: 'center' }}>Prayer Submitted! 🙏</Text>
              </Surface>
            )}
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

          {/* Prayer Categories (Future Feature) */}
          <Card style={styles.featuresCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.featuresTitle}>
                Coming Soon
              </Text>
              <View style={styles.featuresList}>
                <View style={styles.feature}>
                  <MaterialIcons name="category" size={20} color="#6366f1" />
                  <Text variant="bodySmall" style={styles.featureText}>
                    Prayer categories and tags
                  </Text>
                </View>
                <View style={styles.feature}>
                  <MaterialIcons name="schedule" size={20} color="#6366f1" />
                  <Text variant="bodySmall" style={styles.featureText}>
                    Prayer reminders and scheduling
                  </Text>
                </View>
                <View style={styles.feature}>
                  <MaterialIcons name="photo-camera" size={20} color="#6366f1" />
                  <Text variant="bodySmall" style={styles.featureText}>
                    Attach photos to prayers
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
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
    marginBottom: 4,
  },
  textArea: {
    backgroundColor: '#ffffff',
    minHeight: 120,
    marginBottom: 4,
  },
  contentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  helpText: {
    color: '#64748b',
    fontStyle: 'italic',
  },
  characterCount: {
    color: '#64748b',
    fontSize: 12,
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
    marginBottom: 20,
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
  featuresCard: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#6366f1',
  },
  featuresList: {
    gap: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    marginLeft: 12,
    color: '#64748b',
  },
});