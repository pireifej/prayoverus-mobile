import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

// This is not a paywall: a failed policy lookup must not become an upgrade
// prompt, or accidentally unlock cached restricted content.
export default function ContentAccessNotice({ loading, error, onRetry, onBack }) {
  return (
    <View testID="content-access-notice" style={{ flex: 1, padding: 32, justifyContent: 'center', backgroundColor: '#f8fafc' }}>
      {loading && <ActivityIndicator color="#2563eb" />}
      <Text accessibilityRole="alert" style={{ fontSize: 17, textAlign: 'center', color: '#1e293b', marginVertical: 16 }}>
        {loading ? 'Checking content access…' : error || 'Content access has not been checked yet. Please try again.'}
      </Text>
      <Pressable accessibilityRole="button" onPress={onRetry} disabled={loading} style={{ padding: 16 }}>
        <Text style={{ textAlign: 'center', color: '#1d4ed8' }}>Retry access check</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onBack} style={{ padding: 16 }}>
        <Text style={{ textAlign: 'center', color: '#475569' }}>Back</Text>
      </Pressable>
    </View>
  );
}
