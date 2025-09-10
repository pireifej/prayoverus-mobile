import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';

export default function AddPrayerScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  // Verify the latest code is running
  console.log('🔥 ADD PRAYER SCREEN LOADED - LATEST VERSION WITH UUID LOGGING 🔥');

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
      userId: '353', // Use actual logged-in user ID
      sendEmail: false,
      idempotencyKey: idempotencyKey // Include in payload as backup
    };
    
    const endpoint = 'https://www.prayoverus.com:3000/createRequestAndPrayer';
    
    // Clean debug output - endpoint and payload ONLY  
    console.log('📱 MOBILE APP API CALL:');
    console.log('POST ' + endpoint);
    console.log(JSON.stringify(requestPayload, null, 2));
    
    try {
      // Make actual API call with idempotency key
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestPayload)
      });

      if (response.ok) {
        // Success - clear form and show message
        setTitle('');
        setContent('');
        setIsSubmitting(false);
        
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add New Prayer Request</Text>
            <Text style={styles.subtitle}>Share your prayer with our community</Text>
          </View>

          {/* Prayer Title Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Prayer Title *</Text>
            <TextInput
              placeholder="What would you like us to pray for?"
              value={title}
              onChangeText={setTitle}
              editable={!isSubmitting}
              style={styles.titleInput}
              maxLength={100}
            />
            <Text style={styles.hint}>Keep it brief but descriptive</Text>
          </View>

          {/* Prayer Content Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Prayer Details *</Text>
            <TextInput
              placeholder="Share more details about your prayer request..."
              multiline={true}
              numberOfLines={6}
              value={content}
              onChangeText={setContent}
              editable={!isSubmitting}
              style={styles.contentInput}
              maxLength={2000}
              textAlignVertical="top"
            />
            <Text style={styles.hint}>
              {contentLength < 10 ? 'Please write at least 10 characters' : `${contentLength}/2000 characters`}
            </Text>
          </View>

          {/* Submit Button */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Prayer Submitted! 🙏' : 'Add Prayer'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Inspirational Quote */}
          <View style={styles.inspirationCard}>
            <Text style={styles.inspirationText}>
              "Do not be anxious about anything, but in every situation, by prayer 
              and petition, with thanksgiving, present your requests to God."
            </Text>
            <Text style={styles.inspirationSource}>
              Philippians 4:6
            </Text>
          </View>

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
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1e293b',
  },
  subtitle: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
    fontSize: 16,
  },
  titleInput: {
    backgroundColor: '#ffffff',
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
  },
  contentInput: {
    backgroundColor: '#ffffff',
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
    minHeight: 120,
  },
  hint: {
    color: '#64748b',
    fontStyle: 'italic',
    fontSize: 14,
  },
  actions: {
    marginTop: 24,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  inspirationCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 20,
  },
  inspirationText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
    color: '#374151',
    lineHeight: 22,
  },
  inspirationSource: {
    textAlign: 'center',
    color: '#6366f1',
    fontWeight: 'bold',
    fontSize: 14,
  },
});