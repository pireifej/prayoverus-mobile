import React, { useState, useContext } from 'react';
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
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your prayer.');
      return;
    }

    if (!content.trim() || content.length < 10) {
      Alert.alert('Invalid Content', 'Prayer content must be at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    setLoadingMessage('Creating prayer request...');
    
    try {
      // For now, use a default user ID (in real app, get from context/auth)
      // This should be replaced with proper authentication context when AsyncStorage is fixed
      const currentUser = { id: 1216 }; // Using a test user ID from your system
      
      if (!currentUser?.id) {
        Alert.alert('Error', 'Please log in to create a prayer request.');
        setIsSubmitting(false);
        setLoadingMessage('');
        return;
      }

      console.log('Creating prayer request using production API...');
      setLoadingMessage('Saving to your account...');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      
      const response = await fetch('https://www.prayoverus.com:3000/createRequestAndPrayer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + btoa('admin:password123'),
        },
        body: JSON.stringify({
          requestText: content,
          requestTitle: title,
          tz: timezone,
          userId: currentUser.id,
          sendEmail: "true"
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Create request API response:', data);
        
        if (data.error === 0) {
          console.log('Prayer request saved successfully:', data.result);
          setLoadingMessage('Publishing to community...');
          // Small delay to show the publishing message
          setTimeout(() => {
            setIsSubmitting(false);
            setLoadingMessage('');
            Alert.alert(
            'Prayer Added! 🙏',
            isPublic ? 'Your prayer has been shared with the community and saved to your account!' : 'Your prayer has been saved to your account!',
            [
              {
                text: 'OK',
                onPress: () => {
                  setTitle('');
                  setContent('');
                  setIsPublic(false);
                  router.back();
                },
              },
            ]
          );
          }, 800);
        } else {
          console.log('API returned error:', data.error);
          setIsSubmitting(false);
          setLoadingMessage('');
          Alert.alert('Error', 'Failed to create prayer request. Please try again.');
        }
      } else {
        console.log('API request failed:', response.status);
        setIsSubmitting(false);
        setLoadingMessage('');
        Alert.alert('Error', 'Failed to create prayer request. Please check your connection and try again.');
      }
    } catch (error) {
      console.log('Failed to save prayer to production API:', error.message);
      setIsSubmitting(false);
      setLoadingMessage('');
      Alert.alert('Error', 'Failed to create prayer request. Please check your connection and try again.');
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
              disabled={isSubmitting}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || !title.trim() || !content.trim()}
              style={styles.submitButton}
              icon="send"
            >
              {isSubmitting ? (loadingMessage || 'Adding Prayer...') : 'Add Prayer'}
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